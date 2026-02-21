import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Copy, Download, ChevronDown, ChevronUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { mockProducts } from "@/data/mockProducts";

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

export function PreviewSection({ storeId }: Props) {
  const { toast } = useToast();
  const [showExplain, setShowExplain] = useState(false);

  const json = JSON.stringify({
    storefront: {
      id: storeId,
      version: "1.0",
      generated_at: new Date().toISOString(),
      products: mockProducts
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
      rules_applied: 9,
      total_products: mockProducts.filter((p) => p.included).length,
    },
  }, null, 2);

  const handleCopy = () => {
    navigator.clipboard.writeText(json);
    toast({ title: "Copied", description: "JSON copied to clipboard." });
  };

  return (
    <div className="space-y-4">
      <h2 className="font-heading text-2xl font-bold">Preview</h2>

      <div className="flex gap-2">
        <Button size="sm" variant="outline" onClick={handleCopy}>
          <Copy className="h-3.5 w-3.5 mr-1.5" /> Copy JSON
        </Button>
        <Button size="sm" variant="outline" onClick={() => toast({ title: "Download", description: "Download started (simulated)." })}>
          <Download className="h-3.5 w-3.5 mr-1.5" /> Download
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
    </div>
  );
}
