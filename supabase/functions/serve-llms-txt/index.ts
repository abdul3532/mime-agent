import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "GET") {
    return new Response("Method not allowed", {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "text/plain" },
    });
  }

  try {
    const url = new URL(req.url);
    const storeId = url.searchParams.get("store_id");

    if (!storeId) {
      return new Response("Missing store_id parameter", {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "text/plain" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Resolve store_id via storefronts table
    const { data: storefront, error: sfError } = await supabase
      .from("storefronts")
      .select("id")
      .eq("store_id", storeId)
      .maybeSingle();

    if (sfError) {
      console.error("Storefront lookup failed:", sfError.message);
      return new Response("Internal server error", {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "text/plain" },
      });
    }

    if (!storefront) {
      return new Response("Store not found", {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "text/plain" },
      });
    }

    const { data: sf, error: storefrontError } = await supabase
      .from("storefront_files")
      .select("llms_txt")
      .eq("storefront_id", storefront.id)
      .maybeSingle();

    if (storefrontError) {
      console.error("Storefront files lookup failed:", storefrontError.message);
      return new Response("Internal server error", {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "text/plain" },
      });
    }

    if (!sf?.llms_txt) {
      return new Response("llms.txt not generated yet", {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "text/plain" },
      });
    }

    return new Response(sf.llms_txt, {
      headers: { ...corsHeaders, "Content-Type": "text/plain; charset=utf-8" },
    });
  } catch (e) {
    console.error("serve-llms-txt error:", e);
    return new Response("Internal server error", {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "text/plain" },
    });
  }
});
