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
    const userId = user.id;

    const { url } = await req.json();
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

    const mapData = await mapRes.json();
    if (!mapRes.ok || !mapData.success) {
      console.error("Map failed:", mapData);
      return new Response(
        JSON.stringify({ error: "Failed to discover product pages", details: mapData.error }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Filter to likely product pages and take up to 30
    const allLinks: string[] = mapData.links || [];
    const productUrls = allLinks
      .filter((u: string) => /\/(product|item|shop|collecti|p\/)/i.test(u) || allLinks.length <= 30)
      .slice(0, 30);
    console.log(`Found ${allLinks.length} URLs, selected ${productUrls.length} product URLs`);

    if (productUrls.length === 0) {
      return new Response(
        JSON.stringify({ success: true, products_found: 0, categories: [], pages_scanned: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Step 2: Scrape product pages in parallel
    console.log("Step 2: Scraping product pages in parallel...");
    
    const scrapePromises = productUrls.map(async (pUrl: string) => {
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

        const scrapeData = await scrapeRes.json();
        const markdown = scrapeData?.data?.markdown || scrapeData?.markdown;
        if (scrapeRes.ok && markdown) {
          return { url: pUrl, markdown: markdown.substring(0, 5000) };
        }
      } catch (e) {
        console.error(`Failed to scrape ${pUrl}:`, e);
      }
      return null;
    });

    const results = await Promise.allSettled(scrapePromises);
    const scrapedPages = results
      .filter((r): r is PromiseFulfilledResult<{ url: string; markdown: string } | null> => r.status === "fulfilled")
      .map(r => r.value)
      .filter((v): v is { url: string; markdown: string } => v !== null);

    console.log(`Scraped ${scrapedPages.length} pages successfully`);

    if (scrapedPages.length === 0) {
      return new Response(
        JSON.stringify({ success: true, products_found: 0, categories: [], pages_scanned: productUrls.length }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Step 3: Extract structured product data using AI
    console.log("Step 3: Extracting product data with AI...");
    const allProducts: any[] = [];

    // Process in batches of 5 pages per AI call
    const batchSize = 5;
    for (let i = 0; i < scrapedPages.length; i += batchSize) {
      const batch = scrapedPages.slice(i, i + batchSize);
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
          console.error(`AI extraction failed (${aiRes.status}):`, errText);
          continue;
        }

        const aiData = await aiRes.json();
        const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
        if (toolCall?.function?.arguments) {
          const parsed = JSON.parse(toolCall.function.arguments);
          if (Array.isArray(parsed.products)) {
            allProducts.push(...parsed.products);
          }
        }
      } catch (e) {
        console.error("AI extraction error:", e);
      }
    }

    console.log(`Extracted ${allProducts.length} products`);

    // Step 4: Persist to database
    console.log("Step 4: Persisting products...");

    // Use service role for DB operations
    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Delete existing products for this user
    await adminClient.from("products").delete().eq("user_id", userId);

    // Bulk insert
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
        return new Response(
          JSON.stringify({ error: "Failed to save products", details: insertError.message }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    const categories = [...new Set(allProducts.map((p) => p.category).filter(Boolean))];

    console.log("Done! Products:", allProducts.length, "Categories:", categories.length);

    return new Response(
      JSON.stringify({
        success: true,
        products_found: allProducts.length,
        categories,
        pages_scanned: scrapedPages.length,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("scrape-products error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
