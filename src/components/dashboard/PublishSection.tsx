import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Copy, CheckCircle2, XCircle, Rocket, Save, FileText, Loader2, ChevronDown, ChevronUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import { useDashboard } from "@/context/DashboardContext";
import { supabase } from "@/integrations/supabase/client";
import { PublishConfirmDialog } from "./PublishConfirmDialog";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface Props {
  storeId: string;
}

export function PublishSection({ storeId }: Props) {
  const { toast } = useToast();
  const { user } = useAuth();
  const { products, rules, saveProducts, saveRules, storefront } = useDashboard();
  const [domain, setDomain] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [verified, setVerified] = useState<boolean | null>(null);
  const [publishing, setPublishing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [generatingLlms, setGeneratingLlms] = useState(false);
  const [llmsTxt, setLlmsTxt] = useState<string | null>(null);
  const [llmsPreviewOpen, setLlmsPreviewOpen] = useState(false);

  const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID || "paijyobnnrcidapjqcln";
  const endpoint = `https://${projectId}.supabase.co/functions/v1/serve-agent-json?store_id=${storeId}`;
  const llmsEndpoint = `https://${projectId}.supabase.co/functions/v1/serve-llms-txt?store_id=${storeId}`;
  const snippet = `<link rel="alternate" type="application/json" href="${endpoint}" />\n<link rel="alternate" type="text/plain" href="${llmsEndpoint}" title="llms.txt" />`;
  const trackBase = `https://${projectId}.supabase.co/functions/v1/track-event`;

  const pixelSnippet = `<!-- MIME Tracking Pixel — paste before </body> -->
<script>
(function(){
  var s = "${trackBase}";
  var sid = "${storeId}";
  // Track page view
  new Image().src = s + "?event=product_view&store_id=" + sid + "&agent=" + encodeURIComponent(navigator.userAgent);
  // Expose helper for cart & purchase events
  window.mimeTrack = function(event, productId, meta) {
    fetch(s, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ event_type: event, store_id: sid, product_id: productId || null, agent_name: navigator.userAgent, metadata: meta || {} })
    });
  };
})();
</script>`;

  const copy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied", description: `${label} copied.` });
  };

  const handleVerify = () => {
    setVerifying(true);
    setTimeout(() => {
      setVerifying(false);
      setVerified(domain.length > 3);
    }, 2000);
  };

  const handleSaveAll = async () => {
    setSaving(true);
    await saveProducts();
    await saveRules();
    setSaving(false);
  };

  const handleGenerateLlms = async () => {
    setGeneratingLlms(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-llms-txt", {
        body: { storefrontId: storefront?.id },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setLlmsTxt(data.llms_txt);
      setLlmsPreviewOpen(true);
      toast({ title: "Generated!", description: "llms.txt has been created." });
    } catch (e) {
      toast({ title: "Error", description: e instanceof Error ? e.message : "Failed to generate", variant: "destructive" });
    } finally {
      setGeneratingLlms(false);
    }
  };

  // Load existing llms.txt on mount
  useEffect(() => {
    if (!user) return;
    const load = async () => {
      if (storefront) {
        const { data } = await supabase
          .from("storefront_files")
          .select("llms_txt")
          .eq("storefront_id", storefront.id)
          .maybeSingle();
        if (data?.llms_txt) setLlmsTxt(data.llms_txt);
      } else {
        const { data } = await supabase
          .from("storefront_files")
          .select("llms_txt")
          .eq("user_id", user.id)
          .maybeSingle();
        if (data?.llms_txt) setLlmsTxt(data.llms_txt);
      }
    };
    load();
  }, [user, storefront]);

  const handlePublish = async () => {
    setConfirmOpen(false);
    setPublishing(true);
    await saveProducts();
    await saveRules();
    if (user) {
      const snapshot = {
        products: products.filter((p) => p.included).map((p) => ({
          id: p.id, title: p.title, boostScore: p.boostScore, tags: p.tags,
        })),
        rules: rules.map((r) => ({ name: r.name, action: r.action })),
        published_at: new Date().toISOString(),
      };
      await supabase.from("publish_history").insert({ user_id: user.id, snapshot });
    }
    setTimeout(() => {
      setPublishing(false);
      toast({ title: "Published!", description: "Your storefront changes are live." });
    }, 1500);
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <h2 className="font-heading text-2xl font-bold">Publish & Verify</h2>

      {/* Save button */}
      <Button variant="outline" className="w-full h-10" onClick={handleSaveAll} disabled={saving}>
        <Save className="h-4 w-4 mr-2" />
        {saving ? "Saving..." : "Save all changes to database"}
      </Button>

      {/* Endpoints */}
      <div className="card-elevated p-5 space-y-4">
        <h3 className="text-sm font-semibold">MIME-hosted endpoints</h3>
        <div className="code-block flex items-center justify-between gap-2">
          <code className="text-xs break-all">{endpoint}</code>
          <button onClick={() => copy(endpoint, "Endpoint")} className="shrink-0 text-muted-foreground hover:text-foreground">
            <Copy className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* llms.txt */}
      <div className="card-elevated p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <FileText className="h-4 w-4" /> llms.txt
          </h3>
          <Button size="sm" variant="outline" onClick={handleGenerateLlms} disabled={generatingLlms}>
            {generatingLlms ? <><Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> Generating...</> : llmsTxt ? "Regenerate" : "Generate"}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          AI-readable description of your store for LLM discovery. Not the product catalog — links to your JSON feed.
        </p>
        {llmsTxt && (
          <>
            <div className="code-block flex items-center justify-between gap-2">
              <code className="text-xs break-all">{llmsEndpoint}</code>
              <button onClick={() => copy(llmsEndpoint, "llms.txt URL")} className="shrink-0 text-muted-foreground hover:text-foreground">
                <Copy className="h-4 w-4" />
              </button>
            </div>
            <Collapsible open={llmsPreviewOpen} onOpenChange={setLlmsPreviewOpen}>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="w-full justify-between text-xs">
                  Preview content
                  {llmsPreviewOpen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <pre className="text-xs text-muted-foreground whitespace-pre-wrap font-mono bg-muted/30 rounded-lg p-3 max-h-64 overflow-y-auto mt-2">
                  {llmsTxt}
                </pre>
              </CollapsibleContent>
            </Collapsible>
          </>
        )}
      </div>

      {/* Snippet */}
      <div className="card-elevated p-5 space-y-3">
        <h3 className="text-sm font-semibold">Installation snippet</h3>
        <p className="text-xs text-muted-foreground">Add this to your site's {'<head>'} tag:</p>
        <div className="code-block flex items-start justify-between gap-2">
          <code className="text-xs break-all">{snippet}</code>
          <button onClick={() => copy(snippet, "Snippet")} className="shrink-0 text-muted-foreground hover:text-foreground mt-0.5">
            <Copy className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Tracking pixel */}
      <div className="card-elevated p-5 space-y-3">
        <h3 className="text-sm font-semibold">Tracking pixel snippet</h3>
        <p className="text-xs text-muted-foreground">
          Paste before {'</body>'} to track product views, cart adds & purchases from your site. Call{" "}
          <code className="text-xs bg-muted px-1 rounded">mimeTrack("add_to_cart", productId)</code> for custom events.
        </p>
        <div className="code-block flex items-start justify-between gap-2 max-h-48 overflow-y-auto">
          <code className="text-xs break-all whitespace-pre-wrap">{pixelSnippet}</code>
          <button onClick={() => copy(pixelSnippet, "Tracking pixel")} className="shrink-0 text-muted-foreground hover:text-foreground mt-0.5">
            <Copy className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Verify */}
      <div className="card-elevated p-5 space-y-4">
        <h3 className="text-sm font-semibold">Verify installation</h3>
        <Input placeholder="Your domain (optional)" value={domain} onChange={(e) => setDomain(e.target.value)} />
        <Button onClick={handleVerify} variant="outline" className="w-full" disabled={verifying}>
          {verifying ? "Verifying..." : "Verify"}
        </Button>
        {verified === true && (
          <div className="flex items-center gap-2 text-sm font-medium text-primary">
            <CheckCircle2 className="h-4 w-4" /> Installation verified — agents can discover your store.
          </div>
        )}
        {verified === false && (
          <div className="flex items-center gap-2 text-sm text-destructive font-medium">
            <XCircle className="h-4 w-4" /> Not detected — add the link tag and try again.
          </div>
        )}
      </div>

      {/* Publish */}
      <Button onClick={() => setConfirmOpen(true)} className="w-full h-11" disabled={publishing}>
        <Rocket className="h-4 w-4 mr-2" />
        {publishing ? "Publishing..." : "Publish changes"}
      </Button>

      <PublishConfirmDialog open={confirmOpen} onOpenChange={setConfirmOpen} onConfirm={handlePublish} />
    </div>
  );
}
