import { useDashboard } from "@/context/DashboardContext";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileText, Sparkles, ArrowRight } from "lucide-react";

export function ComparisonSection() {
  const { rawSamples, products, computeEffectiveScore } = useDashboard();

  const optimizedPreview = products
    .filter((p) => p.included)
    .sort((a, b) => computeEffectiveScore(b).effectiveScore - computeEffectiveScore(a).effectiveScore)
    .slice(0, 3)
    .map((p) => ({
      title: p.title,
      price: p.price,
      currency: p.currency,
      category: p.category,
      availability: p.availability,
      effective_score: computeEffectiveScore(p).effectiveScore,
      tags: p.tags,
    }));

  const hasData = rawSamples && rawSamples.length > 0;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-heading text-2xl font-bold">Comparison</h2>
        <p className="text-sm text-muted-foreground mt-1">See the raw scraped content vs what MIME produces for AI agents.</p>
      </div>

      {!hasData && products.length === 0 && (
        <div className="card-elevated p-12 text-center">
          <ArrowRight className="h-10 w-10 text-muted-foreground/30 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No data yet</h3>
          <p className="text-sm text-muted-foreground">Scan a store first to see raw vs optimized comparison.</p>
        </div>
      )}

      {(hasData || products.length > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Raw side */}
          <div className="card-elevated overflow-hidden">
            <div className="px-4 py-3 border-b border-border/50 flex items-center gap-2 bg-destructive/5">
              <FileText className="h-4 w-4 text-destructive" />
              <span className="text-sm font-semibold text-destructive">Without MIME — Raw Scraped Content</span>
            </div>
            <ScrollArea className="h-[500px]">
              <div className="p-4">
                {hasData ? (
                  rawSamples!.map((sample: any, i: number) => (
                    <div key={i} className="mb-6 last:mb-0">
                      <div className="text-[10px] uppercase tracking-wider text-muted-foreground/50 mb-2">
                        Page {i + 1}: {sample.url}
                      </div>
                      <pre className="text-xs text-muted-foreground whitespace-pre-wrap font-mono bg-muted/30 rounded-lg p-3 overflow-x-auto">
                        {sample.markdown}
                      </pre>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground italic">
                    Raw samples not available for this scan. Re-scan to capture raw data.
                  </p>
                )}
              </div>
            </ScrollArea>
          </div>

          {/* Optimized side */}
          <div className="card-elevated overflow-hidden">
            <div className="px-4 py-3 border-b border-border/50 flex items-center gap-2 bg-primary/5">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold text-primary">With MIME — Structured Output</span>
            </div>
            <ScrollArea className="h-[500px]">
              <div className="p-4">
                {products.length > 0 ? (
                  <pre className="text-xs text-foreground whitespace-pre-wrap font-mono bg-muted/30 rounded-lg p-3">
                    {JSON.stringify({ storefront: { products: optimizedPreview } }, null, 2)}
                  </pre>
                ) : (
                  <p className="text-sm text-muted-foreground italic">No products extracted yet.</p>
                )}
              </div>
            </ScrollArea>
          </div>
        </div>
      )}
    </div>
  );
}
