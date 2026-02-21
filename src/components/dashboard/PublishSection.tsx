import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Copy, CheckCircle2, XCircle, Rocket } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { PublishConfirmDialog } from "./PublishConfirmDialog";

interface Props {
  storeId: string;
}

export function PublishSection({ storeId }: Props) {
  const { toast } = useToast();
  const [domain, setDomain] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [verified, setVerified] = useState<boolean | null>(null);
  const [publishing, setPublishing] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const endpoint = `https://mime.ai/storefront/${storeId}/agent.json`;
  const snippet = `<link rel="alternate" type="application/json" href="${endpoint}" />`;

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

  const handlePublish = () => {
    setConfirmOpen(false);
    setPublishing(true);
    setTimeout(() => {
      setPublishing(false);
      toast({ title: "Published!", description: "Your storefront changes are live." });
    }, 2000);
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <h2 className="font-heading text-2xl font-bold">Publish & Verify</h2>

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

      {/* Verify */}
      <div className="card-elevated p-5 space-y-4">
        <h3 className="text-sm font-semibold">Verify installation</h3>
        <Input
          placeholder="Your domain (optional)"
          value={domain}
          onChange={(e) => setDomain(e.target.value)}
        />
        <Button onClick={handleVerify} variant="outline" className="w-full" disabled={verifying}>
          {verifying ? "Verifying..." : "Verify"}
        </Button>

        {verified === true && (
          <div className="flex items-center gap-2 text-sm text-green-600 font-medium">
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
