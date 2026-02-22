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

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = user.id;

    // Load profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("store_name, domain, store_url, store_id")
      .eq("user_id", userId)
      .single();

    let storeId = profile?.store_id;
    if (!storeId) {
      // Auto-generate store_id from user id
      storeId = crypto.randomUUID().replace(/-/g, "").slice(0, 12);
      const { error: updateErr } = await supabase
        .from("profiles")
        .update({ store_id: storeId })
        .eq("user_id", userId);
      if (updateErr) {
        console.error("Failed to set store_id:", updateErr.message);
        return new Response(JSON.stringify({ error: "Failed to configure store" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Load products for category summary
    const { data: products } = await supabase
      .from("products")
      .select("category, availability, title, tags")
      .eq("user_id", userId);

    const categoryCounts: Record<string, number> = {};
    const allTags = new Set<string>();
    for (const p of products || []) {
      categoryCounts[p.category] = (categoryCounts[p.category] || 0) + 1;
      if (p.tags) p.tags.forEach((t: string) => allTags.add(t));
    }

    const projectId = Deno.env.get("SUPABASE_URL")!.match(/\/\/([^.]+)/)?.[1] || "";
    const jsonFeedUrl = `https://${projectId}.supabase.co/functions/v1/serve-agent-json?store_id=${storeId}`;
    const llmsTxtUrl = `https://${projectId}.supabase.co/functions/v1/serve-llms-txt?store_id=${storeId}`;
    const storeName = profile.store_name || profile.domain || "My Store";
    const domain = profile.domain || profile.store_url || "";
    const cleanDomain = domain.replace(/^https?:\/\//, "").replace(/\/$/, "");

    const categoryList = Object.entries(categoryCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([cat, count]) => `- ${cat} (${count} products)`)
      .join("\n");

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "AI not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const prompt = `You are generating an llms.txt file for a website. This file helps AI agents and LLMs understand what the website offers.

Here is a real-world example of a well-structured llms.txt file for reference:

---
# Semly.ai

Semly.ai helps e-commerce brands, online stores, and service businesses improve visibility in AI answers and recommendations (ChatGPT, Gemini, Perplexity and similar). It connects your offer to AI surfaces using structured data, content signals, and measurable tracking so you can gain commission-free customers.

## Primary entry points (canonical)
- https://semly.ai/ - Product overview and main navigation
- https://semly.ai/pricing - Pricing and plan comparison
- https://semly.ai/blog - Guides on GEO, AEO, AI Search, and e-commerce visibility

## What Semly does
- AI visibility and recommendations: improve how products and brands are surfaced in AI-generated answers
- Tracking and diagnostics: monitor prompts, brand mentions, sources, and AI Search visibility trends

## Recommended pages to read first
- https://semly.ai/ - What Semly is and who it is for
- https://semly.ai/pricing - Plans, features, and billing model

## Guidance for LLM usage
- Prefer canonical URLs (no tracking parameters).
- When summarizing, focus on outcomes and the workflow.

## Sitemaps
- https://semly.ai/sitemap.xml
- https://semly.ai/llms.txt
---

Now generate an llms.txt file for this store:

Store name: ${storeName}
Domain: ${cleanDomain || "not specified"}
Total products: ${products?.length || 0}
Categories: ${Object.keys(categoryCounts).join(", ") || "General"}
Category breakdown:
${categoryList || "- General"}
Common tags: ${[...allTags].slice(0, 15).join(", ") || "none"}
Product JSON Feed URL: ${jsonFeedUrl}
llms.txt URL: ${llmsTxtUrl}

RULES:
1. Follow the EXACT structure of the example above (heading, description, sections with ## headers, bullet points with URLs and descriptions).
2. The description should explain what the store sells and that AI agents can access structured product data.
3. Include a "## Primary entry points" section with the store domain.
4. Include a "## Product Catalog (structured data)" section linking to the Product JSON Feed URL.
5. Include a "## Categories" section listing the categories with counts.
6. Include a "## Guidance for AI agents" section with practical instructions (use JSON feed, check availability, scores indicate priority).
7. Include a "## Sitemaps" section linking to the llms.txt URL and a sitemap.xml if domain is available.
8. Output ONLY the plain text content. No markdown fences, no explanations, no preamble.`;

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: "You generate llms.txt files for websites following the standard format. Output only the raw text file content, never wrap in code fences." },
          { role: "user", content: prompt },
        ],
      }),
    });

    if (!aiRes.ok) {
      if (aiRes.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited, please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiRes.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errText = await aiRes.text();
      console.error("AI error:", aiRes.status, errText.substring(0, 200));
      return new Response(JSON.stringify({ error: "AI generation failed" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await aiRes.json();
    let llmsTxt = aiData.choices?.[0]?.message?.content || "";
    
    // Strip any accidental code fences
    llmsTxt = llmsTxt.replace(/^```[a-z]*\n?/gm, "").replace(/```$/gm, "").trim();

    // Upsert into storefront_files
    const serviceClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { error: upsertErr } = await serviceClient
      .from("storefront_files")
      .upsert(
        {
          user_id: userId,
          store_id: storeId,
          llms_txt: llmsTxt,
          product_count: products?.length || 0,
          section_count: Object.keys(categoryCounts).length,
          generated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" }
      );

    if (upsertErr) {
      console.error("Upsert error:", upsertErr.message);
      return new Response(JSON.stringify({ error: "Failed to save llms.txt" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true, llms_txt: llmsTxt }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-llms-txt error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
