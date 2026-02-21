import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Search, CheckCircle2, FileText, Tag, AlertTriangle, XCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { scrapeProducts, ScrapeResult } from "@/lib/api/scrapeProducts";

interface Props {
  storeUrl: string;
  onComplete: () => void;
}

const stages = [
  "Discover product pages",
  "Extract product facts",
  "Normalize categories/tags",
  "Compile agent storefront",
];

export function StepCrawl({ storeUrl, onComplete }: Props) {
  const navigate = useNavigate();
  const [stage, setStage] = useState(0);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ScrapeResult | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      setStage(0);
      setError(null);

      // Simulate stage progression while the API call runs
      const stageTimer = setInterval(() => {
        setStage((prev) => (prev < 2 ? prev + 1 : prev));
      }, 5000);

      try {
        const res = await scrapeProducts(storeUrl);
        clearInterval(stageTimer);
        if (cancelled) return;

        if (!res.success) {
          setError(res.error || "Scraping failed");
          return;
        }

        setStage(3);
        setResult(res);

        // Brief pause to show final stage
        setTimeout(() => {
          if (!cancelled) setDone(true);
        }, 800);
      } catch (e) {
        clearInterval(stageTimer);
        if (!cancelled) setError(e instanceof Error ? e.message : "Unknown error");
      }
    }

    run();
    return () => { cancelled = true; };
  }, [storeUrl]);

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <Search className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h3 className="font-heading text-lg font-bold">Scanning your site</h3>
          <p className="text-sm text-muted-foreground">{storeUrl}</p>
        </div>
      </div>

      {/* Progress bar */}
      {!done && !error && (
        <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
          <div className="progress-fill h-full rounded-full animate-pulse" style={{ width: `${((stage + 1) / stages.length) * 100}%`, transition: "width 1s ease" }} />
        </div>
      )}

      {/* Stage stepper */}
      <div className="space-y-2">
        {stages.map((s, i) => (
          <div key={s} className="flex items-center gap-3 text-sm">
            <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
              i < stage || done ? "bg-accent text-accent-foreground" :
              i === stage && !done && !error ? "bg-primary text-primary-foreground animate-pulse" :
              "bg-muted text-muted-foreground"
            }`}>
              {i < stage || done ? "✓" : i + 1}
            </div>
            <span className={i <= stage || done ? "text-foreground" : "text-muted-foreground"}>{s}</span>
          </div>
        ))}
      </div>

      {/* Error state */}
      {error && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          <div className="flex items-center gap-2 text-destructive font-semibold">
            <XCircle className="h-5 w-5" />
            Scan failed
          </div>
          <p className="text-sm text-muted-foreground">{error}</p>
          <Button variant="outline" onClick={() => window.location.reload()}>
            Try again
          </Button>
        </motion.div>
      )}

      {/* Success state */}
      {done && result && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          <div className="flex items-center gap-2 text-accent-foreground font-semibold">
            <CheckCircle2 className="h-5 w-5 text-accent" />
            Scan complete
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-muted/30 border rounded-lg p-3 text-center">
              <FileText className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
              <div className="text-xl font-bold font-heading">{result.pages_scanned}</div>
              <div className="text-xs text-muted-foreground">Pages scanned</div>
            </div>
            <div className="bg-muted/30 border rounded-lg p-3 text-center">
              <Tag className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
              <div className="text-xl font-bold font-heading">{result.products_found}</div>
              <div className="text-xs text-muted-foreground">Products found</div>
            </div>
            <div className="bg-muted/30 border rounded-lg p-3 text-center">
              <Search className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
              <div className="text-xl font-bold font-heading">{result.categories.length}</div>
              <div className="text-xs text-muted-foreground">Categories</div>
            </div>
            <div className="bg-muted/30 border rounded-lg p-3 text-center">
              <AlertTriangle className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
              <div className="text-xl font-bold font-heading">0</div>
              <div className="text-xs text-muted-foreground">Warnings</div>
            </div>
          </div>

          <div className="flex gap-3">
            <Button onClick={onComplete} className="flex-1">
              Continue to installation
            </Button>
            <Button variant="outline" onClick={() => navigate("/dashboard")}>
              Open dashboard
            </Button>
          </div>
        </motion.div>
      )}

      {/* Loading indicator */}
      {!done && !error && (
        <p className="text-xs text-muted-foreground animate-pulse">This may take 30–60 seconds depending on the site size...</p>
      )}
    </motion.div>
  );
}
