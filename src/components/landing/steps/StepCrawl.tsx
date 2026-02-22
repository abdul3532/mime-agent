import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Search, CheckCircle2, FileText, Tag, AlertTriangle, XCircle, LogIn, RefreshCw } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { scrapeProducts, pollScrapeProgress, ScrapeResult, ScrapeProgress } from "@/lib/api/scrapeProducts";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";

interface Props {
  storeUrl: string;
  onComplete: () => void;
}

const stages = [
  "Discover product pages",
  "Scrape product content",
  "Extract with AI",
  "Save to dashboard",
];

export function StepCrawl({ storeUrl, onComplete }: Props) {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [stage, setStage] = useState(0);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [needsAuth, setNeedsAuth] = useState(false);
  const [alreadyScanned, setAlreadyScanned] = useState(false);
  const [existingCount, setExistingCount] = useState(0);
  const [result, setResult] = useState<ScrapeResult | null>(null);
  const [progress, setProgress] = useState<ScrapeProgress | null>(null);
  const runIdRef = useRef<string>(crypto.randomUUID());

  useEffect(() => {
    if (authLoading) return;

    let cancelled = false;
    let pollTimer: ReturnType<typeof setInterval> | null = null;

    async function run() {
      setStage(0);
      setError(null);
      setNeedsAuth(false);
      setAlreadyScanned(false);
      setProgress(null);

      // Check if user already has products from this specific store URL
      if (user && storeUrl) {
        // Normalize the URL for matching (strip protocol and trailing slash)
        const normalizedUrl = storeUrl.replace(/^https?:\/\//, "").replace(/\/$/, "");
        const { count } = await supabase
          .from("products")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id)
          .ilike("url", `%${normalizedUrl}%`);
        
        if (count && count > 0) {
          setAlreadyScanned(true);
          setExistingCount(count);
          return;
        }
      }

      const runId = runIdRef.current;

      // Start polling for progress
      pollTimer = setInterval(async () => {
        if (cancelled) return;
        const p = await pollScrapeProgress(runId);
        if (!p || cancelled) return;
        setProgress(p);

        // Map status to stage
        if (p.status === "mapping") setStage(0);
        else if (p.status === "scraping") setStage(1);
        else if (p.status === "extracting") setStage(2);
        else if (p.status === "saving") setStage(3);
        else if (p.status === "error") {
          setError(p.error_message || "Scraping failed");
          if (pollTimer) clearInterval(pollTimer);
        }
      }, 2000);

      try {
        const res = await scrapeProducts(storeUrl, runId);
        if (pollTimer) clearInterval(pollTimer);
        if (cancelled) return;

        if (!res.success) {
          if (res.error?.includes("Session expired") || res.error?.includes("sign in") || res.error?.includes("Unauthorized")) {
            setNeedsAuth(true);
          } else {
            setError(res.error || "Scraping failed");
          }
          return;
        }

        setStage(3);
        setResult(res);

        // Final progress fetch
        const finalProgress = await pollScrapeProgress(runId);
        if (finalProgress) setProgress(finalProgress);

        setTimeout(() => {
          if (!cancelled) setDone(true);
        }, 800);
      } catch (e) {
        if (pollTimer) clearInterval(pollTimer);
        if (cancelled) return;
        
        // Edge function may have timed out — check if products were saved incrementally
        const finalProgress = await pollScrapeProgress(runId);
        if (finalProgress && finalProgress.extracted_products > 0) {
          // Partial success: products were saved before timeout
          setStage(3);
          setProgress({ ...finalProgress, status: "done" });
          setResult({
            success: true,
            products_found: finalProgress.extracted_products,
            categories: [],
            pages_scanned: finalProgress.scraped_pages,
            runId,
          });
          setTimeout(() => {
            if (!cancelled) setDone(true);
          }, 800);
        } else {
          setError(e instanceof Error ? e.message : "Unknown error");
        }
      }
    }

    run();
    return () => {
      cancelled = true;
      if (pollTimer) clearInterval(pollTimer);
    };
  }, [storeUrl, authLoading]);

  const progressLabel = (() => {
    if (!progress) return "Starting scan...";
    const { status, total_urls, scraped_pages, extracted_products } = progress;
    if (status === "mapping") return "Discovering product pages...";
    if (status === "scraping") return `Scraped ${scraped_pages}/${total_urls} pages...`;
    if (status === "extracting") return `Extracting products with AI... (${extracted_products} found so far)`;
    if (status === "saving") return `Saving ${extracted_products} products...`;
    if (status === "done") return `Done! ${extracted_products} products saved.`;
    return "Processing...";
  })();

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
      {!done && !error && !needsAuth && !alreadyScanned && (
        <div className="space-y-2">
          <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
            <div className="progress-fill h-full rounded-full transition-all duration-700 ease-out" style={{
              width: progress?.total_urls
                ? `${Math.max(((stage + 1) / stages.length) * 100, (progress.scraped_pages / progress.total_urls) * 100)}%`
                : `${((stage + 1) / stages.length) * 100}%`,
            }} />
          </div>
          <p className="text-xs text-muted-foreground font-medium">{progressLabel}</p>
        </div>
      )}

      {/* Stage stepper */}
      {!alreadyScanned && (
        <div className="space-y-2">
          {stages.map((s, i) => (
            <div key={s} className="flex items-center gap-3 text-sm">
              <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                i < stage || done ? "bg-accent text-accent-foreground" :
                i === stage && !done && !error && !needsAuth ? "bg-primary text-primary-foreground animate-pulse" :
                "bg-muted text-muted-foreground"
              }`}>
                {i < stage || done ? "✓" : i + 1}
              </div>
              <span className={i <= stage || done ? "text-foreground" : "text-muted-foreground"}>
                {s}
                {i === 1 && stage === 1 && progress?.total_urls ? ` (${progress.scraped_pages}/${progress.total_urls})` : ""}
                {i === 2 && stage === 2 && progress?.extracted_products ? ` (${progress.extracted_products} products)` : ""}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Already scanned state */}
      {alreadyScanned && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          <div className="flex items-center gap-2 text-accent-foreground font-semibold">
            <CheckCircle2 className="h-5 w-5 text-accent" />
            Products already imported
          </div>
          <p className="text-sm text-muted-foreground">
            You already have {existingCount} products in your dashboard. You can rescan from the dashboard if you want to update them.
          </p>
          <div className="flex gap-3">
            <Button onClick={() => navigate("/dashboard")} className="flex-1 gap-2">
              <RefreshCw className="h-4 w-4" /> Go to dashboard
            </Button>
            <Button variant="outline" onClick={onComplete}>
              Continue setup
            </Button>
          </div>
        </motion.div>
      )}


      {needsAuth && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          <div className="flex items-center gap-2 text-primary font-semibold">
            <LogIn className="h-5 w-5" />
            Sign in required
          </div>
          <p className="text-sm text-muted-foreground">You need to sign in before we can scan your store and save your products.</p>
          <Button onClick={() => navigate("/auth")} className="gap-2">
            <LogIn className="h-4 w-4" /> Sign in to continue
          </Button>
        </motion.div>
      )}

      {/* Error state */}
      {error && !needsAuth && (
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
      {!done && !error && !needsAuth && !alreadyScanned && !progress && (
        <p className="text-xs text-muted-foreground animate-pulse">Connecting to scraping service...</p>
      )}
    </motion.div>
  );
}
