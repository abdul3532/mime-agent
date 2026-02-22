import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!LOVABLE_API_KEY) {
    return new Response(JSON.stringify({ error: "LOVABLE_API_KEY not set" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } }
  );
  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const token = authHeader.replace("Bearer ", "");
  const { data: { user }, error: userError } = await supabase.auth.getUser(token);
  if (userError || !user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }

  const stream = new TransformStream();
  const writer = stream.writable.getWriter();
  const encoder = new TextEncoder();
  const send = async (data: object) => {
    await writer.write(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
  };

  (async () => {
    try {
      await send({ step: 1, message: "→ Loading your catalogue and rules..." });

      const [{ data: products }, { data: rules }, { data: profile }] = await Promise.all([
        admin.from("products").select("*").eq("user_id", user.id).eq("included", true).order("boost_score", { ascending: false }),
        admin.from("rules").select("*").eq("user_id", user.id),
        admin.from("profiles").select("store_name, store_url, merchandising_intent, store_id").eq("user_id", user.id).single()
      ]);

      const included = products || [];
      const activeRules = rules || [];

      await send({ step: 1, message: `→ Loaded ${included.length} products, ${activeRules.length} active rules.` });

      if (included.length === 0) {
        await send({ message: "No included products found. Add products first.", error: true });
        await writer.close();
        return;
      }

      // Build category summary
      const categoryCount: Record<string, number> = {};
      const pricesByCategory: Record<string, number[]> = {};
      for (const p of included) {
        categoryCount[p.category] = (categoryCount[p.category] || 0) + 1;
        if (!pricesByCategory[p.category]) pricesByCategory[p.category] = [];
        pricesByCategory[p.category].push(Number(p.price));
      }
      const catalogueSummary = Object.entries(categoryCount).map(([cat, count]) => {
        const prices = pricesByCategory[cat];
        const minP = Math.min(...prices);
        const maxP = Math.max(...prices);
        return `${cat}: ${count} products, price range ${minP}–${maxP} ${included[0]?.currency || "EUR"}`;
      }).join("\n");

      // STEP 2: Catalogue analysis — agent decides section structure
      await send({ step: 2, message: "→ Analysing catalogue structure..." });

      const analysisRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.0-flash-001",
          messages: [
            {
              role: "system",
              content: `You are an Answer Engine Optimisation specialist. Structure an e-commerce catalogue for AI shopping agents. Categories with 3+ products get their own section. Smaller ones are grouped. Section headers must be natural language query patterns buyers would type (e.g. "## Best Swedish cookies for gifting"). Be specific to the store's actual products. You MUST respond using the decide_structure tool.`
            },
            {
              role: "user",
              content: `Store: ${profile?.store_name || "Unknown"}\nURL: ${profile?.store_url || ""}\nIntent: ${JSON.stringify(profile?.merchandising_intent || {})}\n\nCatalogue:\n${catalogueSummary}`
            }
          ],
          tools: [{
            type: "function",
            function: {
              name: "decide_structure",
              description: "Decide section structure for the storefront",
              parameters: {
                type: "object",
                properties: {
                  sections: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        type: { type: "string", enum: ["own_section", "grouped"] },
                        categories: { type: "array", items: { type: "string" } },
                        section_header: { type: "string" },
                        reason: { type: "string" }
                      },
                      required: ["type", "categories", "section_header"]
                    }
                  },
                  store_intro: { type: "string" },
                  query_hooks: { type: "array", items: { type: "string" } }
                },
                required: ["sections", "store_intro", "query_hooks"]
              }
            }
          }],
          tool_choice: { type: "function", function: { name: "decide_structure" } },
        })
      });

      const analysisData = await analysisRes.json();
      const analysisToolCall = analysisData.choices?.[0]?.message?.tool_calls?.[0];
      const structure = analysisToolCall?.function?.arguments
        ? JSON.parse(analysisToolCall.function.arguments)
        : { sections: [], store_intro: "", query_hooks: [] };

      for (const s of structure.sections) {
        const msg = s.type === "own_section"
          ? `→ Decision: "${s.categories[0]}" gets its own section`
          : `→ Decision: ${s.categories.join(", ")} grouped under "${s.section_header}"`;
        await send({ step: 2, message: msg });
      }

      // STEP 3: Enrich products in batches of 20
      const BATCH_SIZE = 20;
      const enrichedProducts: any[] = [];
      const totalBatches = Math.ceil(included.length / BATCH_SIZE);

      for (let i = 0; i < included.length; i += BATCH_SIZE) {
        const batch = included.slice(i, i + BATCH_SIZE);
        const batchNum = Math.floor(i / BATCH_SIZE) + 1;
        await send({ step: 3, message: `→ Enriching batch ${batchNum}/${totalBatches} with Gemini...` });

        const enrichRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-2.0-flash-001",
            messages: [
              {
                role: "system",
                content: `You are a product copywriter for AI agent optimisation. Enrich product descriptions so AI shopping agents cite them for relevant queries. Only use data provided. Do not invent attributes. Use specific buyer vocabulary. If agent_notes exist, incorporate them. 2-3 sentences per product. You MUST respond using the enrich_products tool.`
              },
              {
                role: "user",
                content: `Store: ${profile?.store_name || ""}. Enrich:\n${JSON.stringify(batch.map(p => ({ title: p.title, price: p.price, currency: p.currency, category: p.category, availability: p.availability, tags: p.tags, url: p.url, agent_notes: p.agent_notes })), null, 2)}`
              }
            ],
            tools: [{
              type: "function",
              function: {
                name: "enrich_products",
                description: "Enrich product data for AI agent consumption",
                parameters: {
                  type: "object",
                  properties: {
                    enriched: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          url: { type: "string" },
                          enriched_description: { type: "string" },
                          semantic_tags: { type: "array", items: { type: "string" } },
                          use_cases: { type: "array", items: { type: "string" } }
                        },
                        required: ["url", "enriched_description", "semantic_tags"]
                      }
                    }
                  },
                  required: ["enriched"]
                }
              }
            }],
            tool_choice: { type: "function", function: { name: "enrich_products" } },
          })
        });

        const enrichData = await enrichRes.json();
        const enrichToolCall = enrichData.choices?.[0]?.message?.tool_calls?.[0];
        const enriched = enrichToolCall?.function?.arguments
          ? JSON.parse(enrichToolCall.function.arguments).enriched || []
          : [];

        for (const p of batch) {
          const e = enriched.find((x: any) => x.url === p.url) || {};
          enrichedProducts.push({ ...p, ...e });
        }
      }

      // STEP 4: Assemble Markdown files
      await send({ step: 4, message: "→ Writing llms.txt..." });

      const storeName = profile?.store_name || "Store";
      const now = new Date().toISOString().split("T")[0];

      // Map products to sections
      const sectionMap: Record<string, any[]> = {};
      for (const s of structure.sections) {
        sectionMap[s.section_header] = enrichedProducts.filter(p => s.categories.includes(p.category));
      }
      const assignedUrls = new Set(Object.values(sectionMap).flat().map((p: any) => p.url));
      const unassigned = enrichedProducts.filter(p => !assignedUrls.has(p.url));
      if (unassigned.length > 0) sectionMap["## More products"] = unassigned;

      const renderProduct = (p: any, full: boolean) => {
        const lines = [
          `### ${p.title} — ${p.price} ${p.currency}`,
          `**Category:** ${p.category}  **Availability:** ${p.availability === "in_stock" ? "In stock" : p.availability}`,
        ];
        if (p.semantic_tags?.length) lines.push(`**Semantic tags:** ${p.semantic_tags.join(", ")}`);
        lines.push("");
        lines.push(p.enriched_description || `${p.title} — ${p.category}.`);
        if (full && p.use_cases?.length) lines.push(`\n**Use cases:** ${p.use_cases.join(" · ")}`);
        if (p.variants?.length) lines.push(`**Available in:** ${p.variants.map((v: any) => v.label).join(" / ")}`);
        lines.push(`**URL:** ${p.url}`);
        return lines.join("\n");
      };

      const top20 = [...enrichedProducts].sort((a, b) => b.boost_score - a.boost_score).slice(0, 20);
      const top20Urls = new Set(top20.map(p => p.url));

      let llmsTxt = `# ${storeName} — AI-Optimised Product Catalogue\n`;
      llmsTxt += `> Generated by MIME · mime-agent.lovable.app · Last updated: ${now}\n`;
      llmsTxt += `> Products: ${enrichedProducts.length} · Categories: ${Object.keys(categoryCount).length}\n\n`;
      llmsTxt += `> ${structure.store_intro || `${storeName} is an e-commerce store.`}\n\n`;
      if (structure.query_hooks?.length) llmsTxt += `> **Best for:** ${structure.query_hooks.join(" · ")}\n\n`;
      llmsTxt += `---\n\n`;

      for (const [header, prods] of Object.entries(sectionMap)) {
        const section = prods.filter(p => top20Urls.has(p.url));
        if (!section.length) continue;
        llmsTxt += `${header}\n\n`;
        llmsTxt += section.map(p => renderProduct(p, false)).join("\n\n---\n\n");
        llmsTxt += "\n\n";
      }

      await send({ step: 4, message: `→ Writing llms-full.txt (all ${enrichedProducts.length} products)...` });

      let llmsFullTxt = `# ${storeName} — Full Product Catalogue\n`;
      llmsFullTxt += `> Generated by MIME · Last updated: ${now}\n\n---\n\n`;
      for (const [header, prods] of Object.entries(sectionMap)) {
        if (!prods.length) continue;
        llmsFullTxt += `${header}\n\n`;
        llmsFullTxt += prods.map(p => renderProduct(p, true)).join("\n\n---\n\n");
        llmsFullTxt += "\n\n";
      }

      await send({ step: 5, message: "→ Saving to storefront endpoint..." });

      const storeId = profile?.store_id;
      await admin.from("storefront_files").insert({
        user_id: user.id,
        store_id: storeId,
        llms_txt: llmsTxt,
        llms_full_txt: llmsFullTxt,
        generated_at: new Date().toISOString(),
        product_count: enrichedProducts.length,
        section_count: Object.keys(sectionMap).length
      });

      await send({ step: 5, message: "✓ Done. Your storefront is live.", done: true, store_id: storeId });

    } catch (e) {
      await send({ message: `Error: ${e instanceof Error ? e.message : "Unknown error"}`, error: true });
    } finally {
      await writer.close();
    }
  })();

  return new Response(stream.readable, {
    headers: { ...corsHeaders, "Content-Type": "text/event-stream", "Cache-Control": "no-cache" }
  });
});
