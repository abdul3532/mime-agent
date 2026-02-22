import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { url, store_id } = await req.json();

    if (!url || !store_id) {
      return new Response(
        JSON.stringify({ error: "url and store_id are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build the expected endpoint URL
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const expectedEndpoint = `${supabaseUrl}/functions/v1/serve-agent-json?store_id=${store_id}`;
    const expectedLlmsEndpoint = `${supabaseUrl}/functions/v1/serve-llms-txt?store_id=${store_id}`;

    // 1. Check if MIME endpoint is reachable
    let endpointReachable = false;
    try {
      const res = await fetch(expectedEndpoint, { method: "GET" });
      endpointReachable = res.ok;
    } catch {
      endpointReachable = false;
    }

    // 2. Fetch the user's page and look for the link tag
    let snippetDetected = false;
    let llmsSnippetDetected = false;
    let fetchError: string | null = null;

    try {
      const pageRes = await fetch(url, {
        headers: {
          "User-Agent": "MIME-Verifier/1.0",
          Accept: "text/html",
        },
        redirect: "follow",
      });

      if (!pageRes.ok) {
        fetchError = `Could not fetch page (HTTP ${pageRes.status})`;
      } else {
        const html = await pageRes.text();
        // Check for the agent JSON link tag - look for the serve-agent-json endpoint with the store_id
        // Be flexible: check for store_id presence in a link tag pointing to serve-agent-json
        const jsonPattern = new RegExp(
          `<link[^>]*href=["'][^"']*serve-agent-json[^"']*store_id=${store_id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[^"']*["'][^>]*/?>`,
          "i"
        );
        // Also check the reverse attribute order (href might come after type)
        const jsonPattern2 = new RegExp(
          `serve-agent-json[^"']*store_id=${store_id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`,
          "i"
        );
        snippetDetected = jsonPattern.test(html) || jsonPattern2.test(html);

        // Check for llms.txt link
        const llmsPattern = new RegExp(
          `serve-llms-txt[^"']*store_id=${store_id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`,
          "i"
        );
        llmsSnippetDetected = llmsPattern.test(html);
      }
    } catch (e) {
      fetchError = `Could not reach ${url}: ${e instanceof Error ? e.message : String(e)}`;
    }

    return new Response(
      JSON.stringify({
        endpoint_reachable: endpointReachable,
        snippet_detected: snippetDetected,
        llms_snippet_detected: llmsSnippetDetected,
        fetch_error: fetchError,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
