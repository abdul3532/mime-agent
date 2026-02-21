import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Search, CheckCircle2, FileText, Tag, AlertTriangle } from "lucide-react";
import { useNavigate } from "react-router-dom";

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
  const [progress, setProgress] = useState(0);
  const [stage, setStage] = useState(0);
  const [done, setDone] = useState(false);
  const [counters, setCounters] = useState({ pages: 0, products: 0, collections: 0, warnings: 0 });

  useEffect(() => {
    const totalDuration = 7000;
    const interval = 50;
    let elapsed = 0;

    const timer = setInterval(() => {
      elapsed += interval;
      const pct = Math.min((elapsed / totalDuration) * 100, 100);
      setProgress(pct);

      // Update stage
      if (pct < 25) setStage(0);
      else if (pct < 50) setStage(1);
      else if (pct < 75) setStage(2);
      else setStage(3);

      // Update counters
      setCounters({
        pages: Math.min(Math.floor(pct * 1.2), 120),
        products: Math.min(Math.floor(pct * 0.58), 58),
        collections: Math.min(Math.floor(pct * 0.06), 6),
        warnings: pct > 60 ? 2 : pct > 30 ? 1 : 0,
      });

      if (pct >= 100) {
        clearInterval(timer);
        setDone(true);
      }
    }, interval);

    return () => clearInterval(timer);
  }, []);

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
      <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
        <div className="progress-fill h-full rounded-full" style={{ width: `${progress}%` }} />
      </div>

      {/* Counters */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { icon: FileText, label: "Pages scanned", value: counters.pages },
          { icon: Tag, label: "Products found", value: counters.products },
          { icon: Search, label: "Collections inferred", value: counters.collections },
          { icon: AlertTriangle, label: "Warnings", value: counters.warnings },
        ].map((c) => (
          <div key={c.label} className="bg-muted/30 border rounded-lg p-3 text-center">
            <c.icon className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
            <div className="text-xl font-bold font-heading">{c.value}</div>
            <div className="text-xs text-muted-foreground">{c.label}</div>
          </div>
        ))}
      </div>

      {/* Stage stepper */}
      <div className="space-y-2">
        {stages.map((s, i) => (
          <div key={s} className="flex items-center gap-3 text-sm">
            <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
              i < stage ? "bg-accent text-accent-foreground" :
              i === stage && !done ? "bg-primary text-primary-foreground animate-pulse" :
              done ? "bg-accent text-accent-foreground" : "bg-muted text-muted-foreground"
            }`}>
              {i < stage || done ? "✓" : i + 1}
            </div>
            <span className={i <= stage || done ? "text-foreground" : "text-muted-foreground"}>{s}</span>
          </div>
        ))}
      </div>

      {done && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          <div className="flex items-center gap-2 text-accent-foreground font-semibold">
            <CheckCircle2 className="h-5 w-5 text-accent" />
            Scan complete
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="card-elevated p-4 text-center">
              <div className="text-2xl font-bold font-heading">58</div>
              <div className="text-xs text-muted-foreground">Products found</div>
            </div>
            <div className="card-elevated p-4 text-center">
              <div className="text-2xl font-bold font-heading">6</div>
              <div className="text-xs text-muted-foreground">Top categories</div>
            </div>
            <div className="card-elevated p-4 text-center">
              <div className="text-2xl font-bold font-heading">9</div>
              <div className="text-xs text-muted-foreground">Rules applied</div>
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
    </motion.div>
  );
}
