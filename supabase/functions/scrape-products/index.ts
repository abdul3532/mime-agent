import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Admin client for progress updates (bypasses RLS)
  const adminClient = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  let runId: string | null = null;
  let userId: string | null = null;

  async function updateProgress(updates: Record<string, unknown>) {
    if (!runId || !userId) return;
    await adminClient
      .from("scrape_progress")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("run_id", runId)
      .eq("user_id", userId);
  }

  try {
    // Auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) {
      console.error("Auth failed:", userError?.message || "No user");
      return new Response(JSON.stringify({ error: "Unauthorized", detail: userError?.message }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    userId = user.id;

    const body = await req.json();
    const { url } = body;
    runId = body.runId || crypto.randomUUID();

    if (!url) {
      return new Response(JSON.stringify({ error: "URL is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const FIRECRAWL_API_KEY = Deno.env.get("FIRECRAWL_API_KEY");
    if (!FIRECRAWL_API_KEY) {
      return new Response(JSON.stringify({ error: "Firecrawl not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "AI not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let formattedUrl = url.trim();
    if (!formattedUrl.startsWith("http://") && !formattedUrl.startsWith("https://")) {
      formattedUrl = `https://${formattedUrl}`;
    }

    // Create progress row
    await adminClient.from("scrape_progress").insert({
      user_id: userId,
      run_id: runId,
      status: "mapping",
      total_urls: 0,
      scraped_pages: 0,
      extracted_products: 0,
    });

    console.log("Step 1: Mapping product URLs for", formattedUrl);

    // Step 1: Map - discover product URLs
    const mapRes = await fetch("https://api.firecrawl.dev/v1/map", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${FIRECRAWL_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url: formattedUrl,
        search: "product",
        limit: 200,
        includeSubdomains: false,
      }),
    });

    if (!mapRes.ok) {
      const errText = await mapRes.text();
      console.error("Map failed:", errText.substring(0, 200));
      await updateProgress({ status: "error", error_message: "Failed to discover product pages" });
      return new Response(
        JSON.stringify({ error: "Failed to discover product pages" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const mapData = await mapRes.json();
    if (!mapData.success) {
      console.error("Map failed:", mapData);
      await updateProgress({ status: "error", error_message: mapData.error || "Map failed" });
      return new Response(
        JSON.stringify({ error: "Failed to discover product pages", details: mapData.error }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const allLinks: string[] = mapData.links || [];
    const productUrls = allLinks.slice(0, 50);
    console.log(`Found ${allLinks.length} URLs, scraping ${productUrls.length} pages`);

    await updateProgress({ status: "scraping", total_urls: productUrls.length });

    if (productUrls.length === 0) {
      await updateProgress({ status: "done", total_urls: 0 });
      return new Response(
        JSON.stringify({ success: true, products_found: 0, categories: [], pages_scanned: 0, runId }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Step 2: Scrape product pages in batches
    console.log("Step 2: Scraping product pages in batches...");

    const scrapedPages: { url: string; markdown: string }[] = [];
    const concurrency = 10;

    for (let i = 0; i < productUrls.length; i += concurrency) {
      const batch = productUrls.slice(i, i + concurrency);
      const batchResults = await Promise.allSettled(
        batch.map(async (pUrl: string) => {
          try {
            const scrapeRes = await fetch("https://api.firecrawl.dev/v1/scrape", {
              method: "POST",
              headers: {
                Authorization: `Bearer ${FIRECRAWL_API_KEY}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                url: pUrl,
                formats: ["markdown"],
                onlyMainContent: true,
              }),
            });

            if (!scrapeRes.ok) {
              const errText = await scrapeRes.text();
              console.error(`Scrape ${pUrl} failed (${scrapeRes.status}): ${errText.substring(0, 100)}`);
              return null;
            }

            const scrapeData = await scrapeRes.json();
            const markdown = scrapeData?.data?.markdown || scrapeData?.markdown;
            if (markdown) {
              return { url: pUrl, markdown: markdown.substring(0, 5000) };
            }
          } catch (e) {
            console.error(`Failed to scrape ${pUrl}:`, e);
          }
          return null;
        })
      );

      for (const r of batchResults) {
        if (r.status === "fulfilled" && r.value) {
          scrapedPages.push(r.value);
        }
      }

      // Update progress after each batch
      await updateProgress({ scraped_pages: scrapedPages.length });
      console.log(`Batch ${Math.floor(i / concurrency) + 1}: scraped ${scrapedPages.length} pages so far`);
    }

    console.log(`Scraped ${scrapedPages.length} pages successfully`);

    if (scrapedPages.length === 0) {
      await updateProgress({ status: "done", scraped_pages: 0 });
      return new Response(
        JSON.stringify({ success: true, products_found: 0, categories: [], pages_scanned: productUrls.length, runId }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Step 3: Extract structured product data using AI
    await updateProgress({ status: "extracting" });
    console.log("Step 3: Extracting product data with AI...");
    const allProducts: any[] = [];

    const aiBatchSize = 10;
    const aiConcurrency = 3;
    const aiBatches: { url: string; markdown: string }[][] = [];
    for (let i = 0; i < scrapedPages.length; i += aiBatchSize) {
      aiBatches.push(scrapedPages.slice(i, i + aiBatchSize));
    }

    for (let i = 0; i < aiBatches.length; i += aiConcurrency) {
      const concurrentBatches = aiBatches.slice(i, i + aiConcurrency);
      const batchResults = await Promise.allSettled(
        concurrentBatches.map(async (batch) => {
      const pagesText = batch
        .map((p, idx) => `--- PAGE ${idx + 1} (${p.url}) ---\n${p.markdown}`)
        .join("\n\n");

      try {
        const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-3-flash-preview",
            messages: [
              {
                role: "system",
                content: `You are a product data extractor. Given markdown content from product pages, extract structured product data.

PRICE RULES (CRITICAL):
- Parse prices carefully. Prices may use comma as decimal separator (e.g. "14,95" = 14.95) or dot (e.g. "14.95" = 14.95).
- If both comma and dot appear, the LAST separator is the decimal (e.g. "1.234,56" = 1234.56, "1,234.56" = 1234.56).
- Return price as a decimal number (e.g. 14.95, not 1495).
- Look for the actual selling price, not crossed-out/original prices.
- currency: detect from symbols (€=EUR, $=USD, £=GBP) or text. Default "EUR".

Each product object must have:
- title (string, the product name)
- price (number, the selling price as a decimal e.g. 14.95)
- currency (string, e.g. "EUR", "USD")
- category (string, infer from breadcrumbs or content)
- availability (string: "in_stock", "out_of_stock", or "preorder")
- image (string, absolute URL of the main product image, or null)
- tags (string array, relevant keywords)
- inventory (number, estimate 100 if not specified)
- url (string, the page URL)

Extract ALL products found on each page. If a page lists multiple products (e.g. collection page), extract each one individually.
Skip non-product pages (about, contact, FAQ, etc). Return [] if no products found.`,
              },
              {
                role: "user",
                content: `Extract products from these pages:\n\n${pagesText}`,
              },
            ],
            tools: [
              {
                type: "function",
                function: {
                  name: "extract_products",
                  description: "Extract structured product data from scraped pages",
                  parameters: {
                    type: "object",
                    properties: {
                      products: {
                        type: "array",
                        items: {
                          type: "object",
                          properties: {
                            title: { type: "string" },
                            price: { type: "number" },
                            currency: { type: "string" },
                            category: { type: "string" },
                            availability: { type: "string", enum: ["in_stock", "out_of_stock", "preorder"] },
                            image: { type: "string" },
                            tags: { type: "array", items: { type: "string" } },
                            inventory: { type: "number" },
                            url: { type: "string" },
                          },
                          required: ["title", "price", "currency", "category", "availability", "url"],
                        },
                      },
                    },
                    required: ["products"],
                    additionalProperties: false,
                  },
                },
              },
            ],
            tool_choice: { type: "function", function: { name: "extract_products" } },
          }),
        });

        if (!aiRes.ok) {
          const errText = await aiRes.text();
          console.error(`AI extraction failed (${aiRes.status}):`, errText.substring(0, 200));
          return [];
        }

        const aiData = await aiRes.json();
        const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
        if (toolCall?.function?.arguments) {
          const parsed = JSON.parse(toolCall.function.arguments);
          if (Array.isArray(parsed.products)) {
            return parsed.products;
          }
        }
        return [];
      } catch (e) {
        console.error("AI extraction error:", e);
        return [];
      }
        })
      );

      for (const r of batchResults) {
        if (r.status === "fulfilled" && Array.isArray(r.value)) {
          allProducts.push(...r.value);
        }
      }
      await updateProgress({ extracted_products: allProducts.length });
    }

    console.log(`Extracted ${allProducts.length} products`);

    // Step 4: Persist to database
    await updateProgress({ status: "saving" });
    console.log("Step 4: Persisting products...");

    // Delete existing products for this user
    await adminClient.from("products").delete().eq("user_id", userId);

    if (allProducts.length > 0) {
      const rows = allProducts.map((p) => ({
        user_id: userId,
        title: p.title || "Untitled Product",
        price: p.price || 0,
        currency: p.currency || "EUR",
        category: p.category || "General",
        availability: p.availability || "in_stock",
        image: p.image || null,
        tags: p.tags || [],
        inventory: p.inventory || 100,
        url: p.url || null,
        boost_score: 5,
        included: true,
      }));

      const { error: insertError } = await adminClient.from("products").insert(rows);
      if (insertError) {
        console.error("Insert error:", insertError);
        await updateProgress({ status: "error", error_message: insertError.message });
        return new Response(
          JSON.stringify({ error: "Failed to save products", details: insertError.message }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    const categories = [...new Set(allProducts.map((p) => p.category).filter(Boolean))];

    await updateProgress({ status: "done", extracted_products: allProducts.length });
    console.log("Done! Products:", allProducts.length, "Categories:", categories.length);

    return new Response(
      JSON.stringify({
        success: true,
        products_found: allProducts.length,
        categories,
        pages_scanned: scrapedPages.length,
        runId,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("scrape-products error:", e);
    if (runId && userId) {
      await updateProgress({ status: "error", error_message: e instanceof Error ? e.message : "Unknown error" });
    }
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
