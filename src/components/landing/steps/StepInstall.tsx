import { useState } from "react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Plug, Copy, CheckCircle2, XCircle, ExternalLink, Globe } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

interface Props {
  storeId: string;
  storeUrl?: string;
}

export function StepInstall({ storeId, storeUrl }: Props) {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [verifying, setVerifying] = useState(false);
  const [verifyResult, setVerifyResult] = useState<{
    endpoint_reachable: boolean;
    snippet_detected: boolean;
    fetch_error: string | null;
  } | null>(null);

  const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID || "paijyobnnrcidapjqcln";
  const endpoint = `https://${projectId}.supabase.co/functions/v1/serve-agent-json?store_id=${storeId}`;
  const productsEndpoint = endpoint;
  const snippet = `<link rel="alternate" type="application/json" href="${endpoint}" />`;

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied", description: `${label} copied to clipboard.` });
  };

  const handleVerify = async () => {
    if (!storeUrl) {
      toast({ title: "No URL", description: "Store URL is not available.", variant: "destructive" });
      return;
    }
    setVerifying(true);
    setVerifyResult(null);
    try {
      const { data, error } = await supabase.functions.invoke("verify-installation", {
        body: { url: storeUrl, store_id: storeId },
      });
      if (error) throw error;
      setVerifyResult(data);
    } catch (e) {
      toast({ title: "Error", description: e instanceof Error ? e.message : "Verification failed", variant: "destructive" });
    } finally {
      setVerifying(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <Plug className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h3 className="font-heading text-lg font-bold">Publish and connect</h3>
          <p className="text-sm text-muted-foreground">
            MIME hosts your agent storefront. Add one line to your {'<head>'}.
          </p>
        </div>
      </div>

      {/* Endpoints */}
      <div className="space-y-3">
        <div>
          <label className="text-xs font-semibold text-muted-foreground mb-1 block">Agent storefront</label>
          <div className="code-block flex items-center justify-between gap-2">
            <code className="text-xs break-all">{endpoint}</code>
            <button onClick={() => copyToClipboard(endpoint, "Endpoint")} className="shrink-0 text-muted-foreground hover:text-foreground transition-colors">
              <Copy className="h-4 w-4" />
            </button>
          </div>
        </div>
        <div>
          <label className="text-xs font-semibold text-muted-foreground mb-1 block">Products endpoint</label>
          <div className="code-block flex items-center justify-between gap-2">
            <code className="text-xs break-all">{productsEndpoint}</code>
            <button onClick={() => copyToClipboard(productsEndpoint, "Products endpoint")} className="shrink-0 text-muted-foreground hover:text-foreground transition-colors">
              <Copy className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Installation snippet */}
      <div>
        <label className="text-xs font-semibold text-muted-foreground mb-1 block">
          Installation snippet — add to your {'<head>'}
        </label>
        <div className="code-block flex items-start justify-between gap-2">
          <code className="text-xs break-all">{snippet}</code>
          <button onClick={() => copyToClipboard(snippet, "Snippet")} className="shrink-0 text-muted-foreground hover:text-foreground transition-colors mt-0.5">
            <Copy className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Verification */}
      <div className="border rounded-lg p-4 space-y-3">
        <h4 className="text-sm font-semibold">Verify installation</h4>
        <Button onClick={handleVerify} variant="outline" className="w-full" disabled={verifying}>
          {verifying ? "Checking..." : "Verify installation"}
        </Button>

        {verifyResult && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2 text-sm">
            <div className={`flex items-center gap-2 ${verifyResult.endpoint_reachable ? "text-accent-foreground" : "text-destructive"}`}>
              {verifyResult.endpoint_reachable ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
              {verifyResult.endpoint_reachable ? "MIME endpoint reachable" : "MIME endpoint not reachable"}
            </div>
            <div className={`flex items-center gap-2 ${verifyResult.snippet_detected ? "text-accent-foreground" : "text-destructive"}`}>
              {verifyResult.snippet_detected ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
              {verifyResult.snippet_detected ? "Link snippet detected — agents can discover your storefront." : "Link snippet not detected — add the tag and try again."}
            </div>
            {verifyResult.fetch_error && (
              <p className="text-xs text-muted-foreground">{verifyResult.fetch_error}</p>
            )}
          </motion.div>
        )}
      </div>

      <div className="flex gap-3">
        <Button onClick={() => navigate("/dashboard")} className="flex-1">
          <ExternalLink className="h-4 w-4 mr-2" />
          Go to Dashboard
        </Button>
        <Button variant="outline" onClick={() => window.location.reload()}>
          Restart demo
        </Button>
      </div>
    </motion.div>
  );
}
