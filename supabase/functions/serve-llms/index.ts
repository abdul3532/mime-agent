import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const url = new URL(req.url);
  const storeId = url.searchParams.get("store_id");
  const fileType = url.searchParams.get("file") || "llms";

  if (!storeId) {
    return new Response("store_id required", { status: 400, headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  // Resolve store_id to user_id via profiles
  const { data: profile } = await supabase
    .from("profiles")
    .select("user_id, store_name")
    .eq("store_id", storeId)
    .single();

  if (!profile) {
    return new Response("Store not found", { status: 404, headers: { ...corsHeaders, "Content-Type": "text/plain" } });
  }

  // Get latest generated file
  const { data: fileRow } = await supabase
    .from("storefront_files")
    .select("llms_txt, llms_full_txt, generated_at")
    .eq("user_id", profile.user_id)
    .order("generated_at", { ascending: false })
    .limit(1)
    .single();

  if (!fileRow) {
    return new Response(
      "# No storefront file generated yet.\n\nVisit mime-agent.lovable.app and use the Generate tab to create your llms.txt.",
      { status: 404, headers: { ...corsHeaders, "Content-Type": "text/markdown; charset=utf-8" } }
    );
  }

  const content = fileType === "llms-full" ? fileRow.llms_full_txt : fileRow.llms_txt;

  // Log agent visit non-blocking
  const agentName = req.headers.get("user-agent") || "unknown";
  supabase.from("agent_events").insert({
    user_id: profile.user_id,
    event_type: "feed_view",
    agent_name: agentName,
    metadata: { store_id: storeId, file_type: fileType }
  }).then(() => {}).catch(() => {});

  return new Response(content || "", {
    headers: {
      ...corsHeaders,
      "Content-Type": "text/markdown; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
      "X-Generated-At": fileRow.generated_at,
    }
  });
});
