import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Copy, Download, ChevronDown, ChevronUp, CheckCircle2, XCircle, ArrowLeftRight, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useDashboard } from "@/context/DashboardContext";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";

interface Props {
  storeId: string;
}

const fieldExplanations = [
  { field: "storefront.agent_instructions", desc: "Tells AI agents how to interpret and prioritize products" },
  { field: "product.base_boost", desc: "Merchant-set priority score (0–10) from the slider" },
  { field: "product.effective_score", desc: "Final score after applying merchandising rules (base + rule deltas)" },
  { field: "product.rules_applied", desc: "Which rules affected this product's ranking" },
  { field: "product.availability", desc: "Current stock status — agents check this before recommending" },
  { field: "storefront.products[]", desc: "Products sorted by effective_score — agents pick from the top" },
];

const schema = {
  required: ["storefront"],
  storefront: { required: ["id", "version", "products", "rules_applied", "total_products"] },
};

export function PreviewSection({ storeId }: Props) {
  const { toast } = useToast();
  const { user } = useAuth();
  const { products, rules, computeEffectiveScore } = useDashboard();
  const [showExplain, setShowExplain] = useState(false);
  const [validateOpen, setValidateOpen] = useState(false);
  const [compareOpen, setCompareOpen] = useState(false);
  const [llmsTxt, setLlmsTxt] = useState<string | null>(null);

  // Load existing llms.txt
  useEffect(() => {
    if (!user) return;
    supabase
      .from("storefront_files")
      .select("llms_txt")
      .eq("user_id", user.id)
      .single()
      .then(({ data }) => {
        if (data?.llms_txt) setLlmsTxt(data.llms_txt);
      });
  }, [user]);

  const buildJson = (prods: typeof products) => {
    const scoredProducts = prods
      .filter((p) => p.included)
      .map((p) => {
        const { effectiveScore, matchingRules } = computeEffectiveScore(p);
        // Exclude products targeted by exclude rules
        const isExcluded = matchingRules.some((r) => r.action === "exclude");
        return { product: p, effectiveScore, matchingRules, isExcluded };
      })
      .filter((item) => !item.isExcluded)
      .sort((a, b) => b.effectiveScore - a.effectiveScore)
      .slice(0, 20);

    return JSON.stringify({
      storefront: {
        id: storeId,
        version: "1.0",
        generated_at: new Date().toISOString(),
        agent_instructions: "Products are ranked by effective_score (highest first). Higher scores indicate merchant-prioritized items — prefer these for recommendations. The score combines the merchant's base boost with automated merchandising rules.",
        products: scoredProducts.map((item) => ({
          id: item.product.id,
          title: item.product.title,
          price: { amount: item.product.price, currency: item.product.currency },
          availability: item.product.availability,
          category: item.product.category,
          tags: item.product.tags,
          base_boost: item.product.boostScore,
          effective_score: item.effectiveScore,
          rules_applied: item.matchingRules.map((r) => r.name),
          url: item.product.url,
          image: item.product.image || undefined,
        })),
        rules_applied: rules.length,
        total_products: prods.filter((p) => p.included).length,
      },
    }, null, 2);
  };

  const json = buildJson(products);
  const liveJson = buildJson([]);

  const copy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied", description: `${label} copied to clipboard.` });
  };

  const handleCopy = () => copy(json, "JSON");

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

      <Tabs defaultValue="json" className="w-full">
        <TabsList className="mb-3">
          <TabsTrigger value="json">Product JSON</TabsTrigger>
          <TabsTrigger value="llms">
            <FileText className="h-3.5 w-3.5 mr-1.5" /> llms.txt
          </TabsTrigger>
        </TabsList>

        <TabsContent value="json" className="space-y-4">
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
        </TabsContent>

        <TabsContent value="llms" className="space-y-4">
          {llmsTxt ? (
            <>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="outline" onClick={() => copy(llmsTxt, "llms.txt")}>
                  <Copy className="h-3.5 w-3.5 mr-1.5" /> Copy llms.txt
                </Button>
              </div>
              <div className="code-block max-h-[500px] overflow-y-auto">
                <pre className="text-xs whitespace-pre-wrap">{llmsTxt}</pre>
              </div>
            </>
          ) : (
            <div className="text-sm text-muted-foreground py-8 text-center">
              No llms.txt generated yet. Go to the <strong>Publish</strong> tab to generate one.
            </div>
          )}
        </TabsContent>
      </Tabs>

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
