import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Copy, Download, ChevronDown, ChevronUp, CheckCircle2, XCircle, ArrowLeftRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useDashboard } from "@/context/DashboardContext";
import { mockProducts } from "@/data/mockProducts";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";

interface Props {
  storeId: string;
}

const fieldExplanations = [
  { field: "storefront.id", desc: "Unique identifier for this storefront" },
  { field: "storefront.products[]", desc: "Array of product objects with structured facts" },
  { field: "product.boost_score", desc: "Merchant-defined priority score (0–10)" },
  { field: "product.availability", desc: "Current stock status" },
  { field: "storefront.rules", desc: "Applied merchandising rules summary" },
];

const schema = {
  required: ["storefront"],
  storefront: { required: ["id", "version", "products", "rules_applied", "total_products"] },
};

export function PreviewSection({ storeId }: Props) {
  const { toast } = useToast();
  const { products, rules } = useDashboard();
  const [showExplain, setShowExplain] = useState(false);
  const [validateOpen, setValidateOpen] = useState(false);
  const [compareOpen, setCompareOpen] = useState(false);

  const buildJson = (prods: typeof products) => JSON.stringify({
    storefront: {
      id: storeId,
      version: "1.0",
      generated_at: new Date().toISOString(),
      products: prods
        .filter((p) => p.included)
        .sort((a, b) => b.boostScore - a.boostScore)
        .slice(0, 20)
        .map((p) => ({
          id: p.id,
          title: p.title,
          price: { amount: p.price, currency: p.currency },
          availability: p.availability,
          category: p.category,
          tags: p.tags,
          boost_score: p.boostScore,
          url: p.url,
        })),
      rules_applied: rules.length,
      total_products: prods.filter((p) => p.included).length,
    },
  }, null, 2);

  const json = buildJson(products);
  const liveJson = buildJson(mockProducts);

  const handleCopy = () => {
    navigator.clipboard.writeText(json);
    toast({ title: "Copied", description: "JSON copied to clipboard." });
  };

  // Simple validation
  const validationResults = (() => {
    try {
      const parsed = JSON.parse(json);
      const issues: string[] = [];
      if (!parsed.storefront) issues.push("Missing 'storefront' root key");
      else {
        for (const key of schema.storefront.required) {
          if (!(key in parsed.storefront)) issues.push(`Missing 'storefront.${key}'`);
        }
        if (parsed.storefront.products?.length === 0) issues.push("No products in output");
      }
      return { valid: issues.length === 0, issues };
    } catch {
      return { valid: false, issues: ["Invalid JSON"] };
    }
  })();

  return (
    <div className="space-y-4">
      <h2 className="font-heading text-2xl font-bold">Preview</h2>

      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="outline" onClick={handleCopy}>
          <Copy className="h-3.5 w-3.5 mr-1.5" /> Copy JSON
        </Button>
        <Button size="sm" variant="outline" onClick={() => toast({ title: "Download", description: "Download started (simulated)." })}>
          <Download className="h-3.5 w-3.5 mr-1.5" /> Download
        </Button>
        <Button size="sm" variant="outline" onClick={() => setValidateOpen(true)}>
          <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" /> Validate JSON
        </Button>
        <Button size="sm" variant="outline" onClick={() => setCompareOpen(true)}>
          <ArrowLeftRight className="h-3.5 w-3.5 mr-1.5" /> Compare with live
        </Button>
      </div>

      <div className="code-block max-h-[500px] overflow-y-auto">
        <pre className="text-xs">{json}</pre>
      </div>

      <button
        onClick={() => setShowExplain(!showExplain)}
        className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
      >
        {showExplain ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        Explain fields
      </button>

      {showExplain && (
        <div className="card-elevated p-4 space-y-2">
          {fieldExplanations.map((f) => (
            <div key={f.field} className="flex gap-3 text-sm">
              <code className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono shrink-0">{f.field}</code>
              <span className="text-muted-foreground">{f.desc}</span>
            </div>
          ))}
        </div>
      )}

      {/* Validate Dialog */}
      <Dialog open={validateOpen} onOpenChange={setValidateOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>JSON Validation</DialogTitle>
            <DialogDescription>Checking output against storefront schema.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            {validationResults.valid ? (
              <div className="flex items-center gap-2 text-green-600 font-medium text-sm">
                <CheckCircle2 className="h-5 w-5" /> All checks passed
              </div>
            ) : (
              validationResults.issues.map((issue, i) => (
                <div key={i} className="flex items-center gap-2 text-destructive text-sm">
                  <XCircle className="h-4 w-4 shrink-0" /> {issue}
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Compare Dialog */}
      <Dialog open={compareOpen} onOpenChange={setCompareOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Compare with Live</DialogTitle>
            <DialogDescription>Side-by-side comparison of draft vs published configuration.</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="text-xs font-semibold text-muted-foreground mb-2">DRAFT</h4>
              <div className="code-block max-h-[400px] overflow-y-auto">
                <pre className="text-[10px]">{json}</pre>
              </div>
            </div>
            <div>
              <h4 className="text-xs font-semibold text-muted-foreground mb-2">LIVE (published)</h4>
              <div className="code-block max-h-[400px] overflow-y-auto">
                <pre className="text-[10px]">{liveJson}</pre>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
