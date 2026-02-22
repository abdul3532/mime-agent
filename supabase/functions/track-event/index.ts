import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

const VALID_EVENTS = new Set([
  "feed_view",
  "product_view",
  "product_recommendation",
  "add_to_cart",
  "purchase",
]);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Support both GET (pixel) and POST (JSON)
    let eventType: string;
    let storeId: string;
    let productId: string | null = null;
    let agentName: string | null = null;
    let metadata: Record<string, unknown> = {};

    if (req.method === "GET") {
      const url = new URL(req.url);
      eventType = url.searchParams.get("event") || "";
      storeId = url.searchParams.get("store_id") || "";
      productId = url.searchParams.get("product_id") || null;
      agentName = url.searchParams.get("agent") || null;
      const metaStr = url.searchParams.get("meta");
      if (metaStr) {
        try { metadata = JSON.parse(metaStr); } catch { /* ignore */ }
      }
    } else {
      const body = await req.json();
      eventType = body.event_type || body.event || "";
      storeId = body.store_id || "";
      productId = body.product_id || null;
      agentName = body.agent_name || body.agent || null;
      metadata = body.metadata || {};
    }

    // Validate
    if (!VALID_EVENTS.has(eventType)) {
      return new Response(
        JSON.stringify({ error: `Invalid event_type. Must be one of: ${[...VALID_EVENTS].join(", ")}` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!storeId) {
      return new Response(
        JSON.stringify({ error: "store_id is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Resolve store_id → user_id
    const { data: profile } = await supabase
      .from("profiles")
      .select("user_id")
      .eq("id", storeId)
      .maybeSingle();

    if (!profile) {
      return new Response(
        JSON.stringify({ error: "Store not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Insert event
    const { error: insertError } = await supabase.from("agent_events").insert({
      user_id: profile.user_id,
      event_type: eventType,
      product_id: productId,
      agent_name: agentName,
      metadata: { ...metadata, store_id: storeId },
    });

    if (insertError) {
      return new Response(
        JSON.stringify({ error: "Failed to record event" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // For GET requests, return a 1x1 transparent GIF (tracking pixel)
    if (req.method === "GET") {
      const pixel = new Uint8Array([
        0x47, 0x49, 0x46, 0x38, 0x39, 0x61, 0x01, 0x00,
        0x01, 0x00, 0x80, 0x00, 0x00, 0xff, 0xff, 0xff,
        0x00, 0x00, 0x00, 0x21, 0xf9, 0x04, 0x01, 0x00,
        0x00, 0x00, 0x00, 0x2c, 0x00, 0x00, 0x00, 0x00,
        0x01, 0x00, 0x01, 0x00, 0x00, 0x02, 0x02, 0x44,
        0x01, 0x00, 0x3b,
      ]);
      return new Response(pixel, {
        headers: {
          ...corsHeaders,
          "Content-Type": "image/gif",
          "Cache-Control": "no-store, no-cache, must-revalidate",
        },
      });
    }

    return new Response(
      JSON.stringify({ ok: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
