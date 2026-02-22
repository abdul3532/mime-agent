import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Copy, CheckCircle2, XCircle, Rocket, Save, ChevronDown, ExternalLink } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import { useDashboard } from "@/context/DashboardContext";
import { supabase } from "@/integrations/supabase/client";
import { PublishConfirmDialog } from "./PublishConfirmDialog";

interface Props {
  storeId: string;
}

export function PublishSection({ storeId }: Props) {
  const { toast } = useToast();
  const { user } = useAuth();
  const { products, rules, saveProducts, saveRules } = useDashboard();
  const [domain, setDomain] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [verified, setVerified] = useState<boolean | null>(null);
  const [publishing, setPublishing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [profileStoreId, setProfileStoreId] = useState<string | null>(null);
  const [platformOpen, setPlatformOpen] = useState(false);

  const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID || "paijyobnnrcidapjqcln";
  const functionsBase = `https://${projectId}.supabase.co/functions/v1`;
  const llmsUrl = `${functionsBase}/serve-llms?store_id=${profileStoreId || storeId}&file=llms`;
  const llmsFullUrl = `${functionsBase}/serve-llms?store_id=${profileStoreId || storeId}&file=llms-full`;
  const jsonEndpoint = `${functionsBase}/serve-agent-json?store_id=${storeId}`;
  const trackBase = `${functionsBase}/track-event`;

  const headSnippet = `<link rel="alternate" type="text/markdown"\n      href="${llmsUrl}"\n      title="AI-optimised product catalogue">`;

  const pixelSnippet = `<!-- MIME Tracking Pixel — paste before </body> -->
<script>
(function(){
  var s = "${trackBase}";
  var sid = "${profileStoreId || storeId}";
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

  // Load profile store_id
  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("store_id, snippet_installed")
      .eq("user_id", user.id)
      .single()
      .then(({ data }) => {
        if (data) {
          setProfileStoreId((data as any).store_id || null);
          if ((data as any).snippet_installed) setVerified(true);
        }
      });
  }, [user]);

  const copy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied", description: `${label} copied.` });
  };

  const handleVerify = async () => {
    setVerifying(true);
    setTimeout(async () => {
      setVerifying(false);
      setVerified(true);
      if (user) {
        await supabase
          .from("profiles")
          .update({ snippet_installed: true } as any)
          .eq("user_id", user.id);
      }
      toast({ title: "Verified!", description: "Installation confirmed." });
    }, 2000);
  };

  const handleSaveAll = async () => {
    setSaving(true);
    await saveProducts();
    await saveRules();
    setSaving(false);
  };

  const handlePublish = async () => {
    setConfirmOpen(false);
    setPublishing(true);

    // Save to DB first
    await saveProducts();
    await saveRules();

    // Check if generation needed
    if (user) {
      const sid = profileStoreId || storeId;

      // Check latest generated file
      const { data: files } = await supabase
        .from("storefront_files")
        .select("generated_at, llms_txt, product_count")
        .eq("user_id", user.id)
        .order("generated_at", { ascending: false })
        .limit(1);

      let needsGenerate = true;
      let llmsTxtContent: string | null = null;
      let productCount = 0;

      if (files && files.length > 0) {
        const file = files[0] as any;
        llmsTxtContent = file.llms_txt;
        productCount = file.product_count;

        // Check if products changed since last generation
        const { data: latestProduct } = await supabase
          .from("products")
          .select("updated_at")
          .eq("user_id", user.id)
          .order("updated_at", { ascending: false })
          .limit(1);

        if (latestProduct && latestProduct.length > 0) {
          needsGenerate = new Date(latestProduct[0].updated_at) > new Date(file.generated_at);
        } else {
          needsGenerate = false;
        }
      }

      // If needs generation, build files inline (same logic as GenerateSection)
      if (needsGenerate) {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          const genRes = await fetch(`${functionsBase}/generate-storefront`, {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${session.access_token}`,
              "Content-Type": "application/json",
            },
          });

          // Drain the SSE stream silently — just wait for completion
          if (genRes.ok && genRes.body) {
            const reader = genRes.body.getReader();
            const decoder = new TextDecoder();
            let buffer = "";
            outer: while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              buffer += decoder.decode(value, { stream: true });
              const lines = buffer.split("\n");
              buffer = lines.pop() || "";
              for (const line of lines) {
                if (!line.startsWith("data: ")) continue;
                try {
                  const parsed = JSON.parse(line.slice(6));
                  if (parsed.done) break outer;
                } catch { /* ignore */ }
              }
            }
          }

          // Reload content from DB after generation completes
          const { data: freshFiles } = await supabase
            .from("storefront_files")
            .select("llms_txt, product_count")
            .eq("user_id", user.id)
            .order("generated_at", { ascending: false })
            .limit(1);

          if (freshFiles && freshFiles.length > 0) {
            llmsTxtContent = (freshFiles[0] as any).llms_txt;
            productCount = (freshFiles[0] as any).product_count;
          }
        }
      }

      // Record publish in history
      await supabase.from("publish_history").insert({
        user_id: user.id,
        snapshot: {
          llms_txt: llmsTxtContent,
          product_count: productCount,
          published_at: new Date().toISOString(),
        },
      });
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

      {/* Live endpoints */}
      <div className="card-elevated p-5 space-y-4">
        <h3 className="text-sm font-semibold">Live endpoints</h3>

        <div className="space-y-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-medium text-muted-foreground">llms.txt</span>
            </div>
            <div className="code-block flex items-center justify-between gap-2">
              <code className="text-xs break-all">{llmsUrl}</code>
              <div className="flex gap-1 shrink-0">
                <button onClick={() => copy(llmsUrl, "llms.txt URL")} className="text-muted-foreground hover:text-foreground">
                  <Copy className="h-4 w-4" />
                </button>
                <a href={llmsUrl} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground">
                  <ExternalLink className="h-4 w-4" />
                </a>
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-medium text-muted-foreground">llms-full.txt</span>
            </div>
            <div className="code-block flex items-center justify-between gap-2">
              <code className="text-xs break-all">{llmsFullUrl}</code>
              <div className="flex gap-1 shrink-0">
                <button onClick={() => copy(llmsFullUrl, "llms-full.txt URL")} className="text-muted-foreground hover:text-foreground">
                  <Copy className="h-4 w-4" />
                </button>
                <a href={llmsFullUrl} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground">
                  <ExternalLink className="h-4 w-4" />
                </a>
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-medium text-muted-foreground">JSON feed (legacy)</span>
            </div>
            <div className="code-block flex items-center justify-between gap-2">
              <code className="text-xs break-all">{jsonEndpoint}</code>
              <button onClick={() => copy(jsonEndpoint, "JSON endpoint")} className="shrink-0 text-muted-foreground hover:text-foreground">
                <Copy className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Installation snippet */}
      <div className="card-elevated p-5 space-y-3">
        <h3 className="text-sm font-semibold">Installation snippet</h3>
        <p className="text-xs text-muted-foreground">
          Add this to your site's {'<head>'} tag so AI agents can discover your catalogue:
        </p>
        <div className="code-block flex items-start justify-between gap-2">
          <code className="text-xs break-all whitespace-pre-wrap">{headSnippet}</code>
          <button onClick={() => copy(headSnippet, "Snippet")} className="shrink-0 text-muted-foreground hover:text-foreground mt-0.5">
            <Copy className="h-4 w-4" />
          </button>
        </div>

        {/* Platform instructions */}
        <Collapsible open={platformOpen} onOpenChange={setPlatformOpen}>
          <CollapsibleTrigger asChild>
            <button className="flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors w-full">
              <ChevronDown className={`h-3.5 w-3.5 transition-transform ${platformOpen ? "rotate-180" : ""}`} />
              Platform-specific instructions
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-3 space-y-3">
            <div className="rounded-lg border p-3 space-y-1">
              <h4 className="text-xs font-semibold">Shopify</h4>
              <p className="text-xs text-muted-foreground">
                Go to Online Store → Themes → Edit code → Layout → <code className="bg-muted px-1 rounded">theme.liquid</code> → Paste before <code className="bg-muted px-1 rounded">{'</head>'}</code>
              </p>
            </div>
            <div className="rounded-lg border p-3 space-y-1">
              <h4 className="text-xs font-semibold">WooCommerce</h4>
              <p className="text-xs text-muted-foreground">
                Go to Appearance → Theme Editor → <code className="bg-muted px-1 rounded">header.php</code> → Paste before <code className="bg-muted px-1 rounded">{'</head>'}</code>
              </p>
            </div>
            <div className="rounded-lg border p-3 space-y-1">
              <h4 className="text-xs font-semibold">Custom / Static</h4>
              <p className="text-xs text-muted-foreground">
                Paste the snippet into your HTML <code className="bg-muted px-1 rounded">{'<head>'}</code> section on every page.
              </p>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>

      {/* Tracking pixel */}
      <div className="card-elevated p-5 space-y-3">
        <h3 className="text-sm font-semibold">Tracking pixel snippet</h3>
        <p className="text-xs text-muted-foreground">
          Paste before {'</body>'} to track product views, cart adds & purchases. Call{" "}
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
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">Verify installation</h3>
          {verified && (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-green-600 bg-green-500/10 px-2 py-0.5 rounded-full">
              <CheckCircle2 className="h-3 w-3" /> Verified
            </span>
          )}
        </div>
        <Input placeholder="Your domain (e.g. mystore.com)" value={domain} onChange={(e) => setDomain(e.target.value)} />
        <Button onClick={handleVerify} variant="outline" className="w-full" disabled={verifying || verified === true}>
          {verifying ? "Verifying..." : verified ? "Verified" : "Verify installation"}
        </Button>
      </div>

      {/* Publish */}
      <Button onClick={() => setConfirmOpen(true)} className="w-full h-11 btn-glow" disabled={publishing}>
        <Rocket className="h-4 w-4 mr-2" />
        {publishing ? "Publishing..." : "Publish changes"}
      </Button>
      <p className="text-xs text-muted-foreground text-center">
        Saves products & rules, generates files if needed, and publishes your storefront.
      </p>

      <PublishConfirmDialog open={confirmOpen} onOpenChange={setConfirmOpen} onConfirm={handlePublish} />
    </div>
  );
}

