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
    const productUrls = allLinks.slice(0, 200);
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

    // Step 3: Extract structured product data using AI + incremental save
    await updateProgress({ status: "extracting" });
    console.log("Step 3: Extracting product data with AI...");

    // Delete existing products from this specific domain so incremental inserts work
    // Extract domain from the URL to scope deletion
    const urlObj = new URL(formattedUrl);
    const domain = urlObj.hostname;
    await adminClient
      .from("products")
      .delete()
      .eq("user_id", userId)
      .ilike("url", `%${domain}%`);

    let totalExtracted = 0;
    const allCategories: Set<string> = new Set();
    const aiBatchSize = 10;

    for (let i = 0; i < scrapedPages.length; i += aiBatchSize) {
      const batch = scrapedPages.slice(i, i + aiBatchSize);
      const pagesText = batch
        .map((p, idx) => `--- PAGE ${idx + 1} (${p.url}) ---\n${p.markdown}`)
        .join("\n\n");

      try {
      const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
      if (!ANTHROPIC_API_KEY) {
        console.error("ANTHROPIC_API_KEY not set");
        continue;
      }

      let aiRes: Response | null = null;
      const maxRetries = 3;
      for (let attempt = 0; attempt < maxRetries; attempt++) {
        aiRes = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: {
            "x-api-key": ANTHROPIC_API_KEY,
            "anthropic-version": "2023-06-01",
            "content-type": "application/json",
          },
          body: JSON.stringify({
            model: "claude-haiku-4-5-20251001",
            max_tokens: 4096,
            tools: [{
              name: "extract_products",
              description: "Extract structured product data from scraped markdown pages",
              input_schema: {
                type: "object",
                properties: {
                  products: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        title: { type: "string" },
                        price: { type: "number", description: "Numeric price. 100kr=100, 14,95=14.95" },
                        currency: { type: "string", description: "ISO 4217: kr/SEK, €/EUR, £/GBP, $/USD" },
                        category: { type: "string" },
                        availability: { type: "string", enum: ["in_stock", "out_of_stock", "preorder"] },
                        image: { type: "string" },
                        tags: { type: "array", items: { type: "string" } },
                        inventory: { type: "number" },
                        url: { type: "string" },
                        variants: {
                          type: "array",
                          items: {
                            type: "object",
                            properties: {
                              label: { type: "string" },
                              price: { type: "number" },
                              availability: { type: "string" }
                            }
                          }
                        }
                      },
                      required: ["title", "url"]
                    }
                  }
                },
                required: ["products"]
              }
            }],
            tool_choice: { type: "tool", name: "extract_products" },
            system: `You are a product data extractor. Extract structured product data from e-commerce page markdown.
Only extract fields you are confident about — uncertain fields should be omitted entirely, never guessed.
Parse prices carefully: 100kr = 100 SEK, 14,95 = 14.95. Return as number.
If a product has variants (sizes, colours), return ONE parent product with a variants array.
Skip navigation, footer, about pages. Return empty array if no products found.`,
            messages: [{ role: "user", content: `Extract all products from these pages:\n\n${pagesText}` }]
          })
        });

        if (aiRes.status === 429) {
          const waitSec = Math.pow(2, attempt + 1) * 15; // 30s, 60s, 120s
          console.log(`Rate limited, waiting ${waitSec}s before retry ${attempt + 1}/${maxRetries}`);
          await new Promise(r => setTimeout(r, waitSec * 1000));
          continue;
        }
        break;
      }

      if (!aiRes || !aiRes.ok) {
        const errText = aiRes ? await aiRes.text() : "No response";
        console.error("Anthropic extraction failed:", errText.substring(0, 200));
        continue;
      }

      const aiData = await aiRes.json();
      const toolUseBlock = aiData.content?.find((b: any) => b.type === "tool_use");
      const rawProducts = toolUseBlock?.input?.products || [];

      // Validation gate — deterministic, no LLM
      const parsed = { products: rawProducts.filter((p: any) => {
        if (!p.title || typeof p.title !== "string") return false;
        if (!p.url || typeof p.url !== "string") return false;
        if (p.price !== undefined && (isNaN(p.price) || p.price < 0)) p.price = null;
        if (!["in_stock","out_of_stock","preorder"].includes(p.availability)) p.availability = "in_stock";
        return true;
      })};

      if (Array.isArray(parsed.products) && parsed.products.length > 0) {
            const rows = parsed.products.map((p: any) => ({
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
              variants: p.variants || null,
              boost_score: 5,
              included: true,
            }));

            const { error: insertErr } = await adminClient.from("products").insert(rows);
            if (insertErr) {
              console.error("Incremental insert error:", insertErr.message);
            } else {
              totalExtracted += parsed.products.length;
              for (const p of parsed.products) {
                if (p.category) allCategories.add(p.category);
              }
            }
            await updateProgress({ extracted_products: totalExtracted });
          }
      } catch (e) {
        console.error("AI extraction error:", e);
      }

      console.log(`AI batch ${Math.floor(i / aiBatchSize) + 1}: ${totalExtracted} products saved so far`);
    }

    console.log(`Extracted ${totalExtracted} products`);

    const categories = [...allCategories];

    await updateProgress({ status: "done", extracted_products: totalExtracted });
    console.log("Done! Products:", totalExtracted, "Categories:", categories.length);

    return new Response(
      JSON.stringify({
        success: true,
        products_found: totalExtracted,
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
