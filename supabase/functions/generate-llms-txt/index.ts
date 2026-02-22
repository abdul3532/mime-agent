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

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = claimsData.claims.sub;

    // Load profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("store_name, domain, store_url, store_id")
      .eq("user_id", userId)
      .single();

    if (!profile?.store_id) {
      return new Response(JSON.stringify({ error: "No store configured" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Load products for category summary
    const { data: products } = await supabase
      .from("products")
      .select("category, availability")
      .eq("user_id", userId);

    const categoryCounts: Record<string, number> = {};
    for (const p of products || []) {
      categoryCounts[p.category] = (categoryCounts[p.category] || 0) + 1;
    }

    const projectId = Deno.env.get("SUPABASE_URL")!.match(/\/\/([^.]+)/)?.[1] || "";
    const jsonFeedUrl = `https://${projectId}.supabase.co/functions/v1/serve-agent-json?store_id=${profile.store_id}`;
    const storeName = profile.store_name || profile.domain || "My Store";
    const domain = profile.domain || profile.store_url || "";

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

    const prompt = `Generate an llms.txt file for this store. Follow this exact format style:

# ${storeName}

Write a 2-3 sentence description of what this store sells based on: domain "${domain}", categories: ${Object.keys(categoryCounts).join(", ")}, ${products?.length || 0} total products.

## Primary entry points
- ${domain ? `https://${domain.replace(/^https?:\/\//, "")}/ - Homepage and main navigation` : "Homepage URL not available"}

## Product Catalog (structured data)
- [Product JSON Feed](${jsonFeedUrl}): AI-optimized product data with rankings, availability, pricing, and merchant signals

## Categories
${categoryList || "- General"}

## Guidance for AI agents
- Use the Product JSON Feed link above for structured product data
- Products are ranked by effective_score (0-10, highest = merchant priority)
- Check availability field before recommending products
- Prefer items with "bestseller" or "merchant_promoted" signals
- Prices include currency codes for accurate display

## Contact
- Website: ${domain || "Not specified"}

IMPORTANT: Output ONLY the llms.txt content. No code fences, no explanation. Just the plain text file content.`;

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: "You generate llms.txt files for websites. Output only the file content, no markdown fences." },
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
    const llmsTxt = aiData.choices?.[0]?.message?.content || "";

    // Upsert into storefront_files
    const { error: upsertErr } = await supabase
      .from("storefront_files")
      .upsert(
        {
          user_id: userId,
          store_id: profile.store_id,
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
