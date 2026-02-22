import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Store, Sparkles, Code, Globe, Zap, AlertTriangle, CheckCircle2, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";

const DEMO_STORE_ID = import.meta.env.VITE_DEMO_STORE_ID || "kakdjur-demo";

const RAW_CRAWL = `<!DOCTYPE html>
<html lang="sv">
<head><title>CookiesHack Europe</title></head>
<body>
  <div class="header">CookiesHack Europe — Handmade Sw...</div>
  <div class="nav">Home | Products | About | ???</div>

  <div class="product-grid">
    <div class="item">
      <img src="/img/cookie-box-1.jpg" alt="">
      <span>Choklad Drömmar</span>
      <span class="price">100kr</span>
      <div class="stock">???</div>
    </div>
    <div class="item">
      <span>Vanilj Delight Pack</span>
      <span>   85 SEK  </span>
      <!-- availability unknown -->
    </div>
    <div class="item">
      <span>Jul Special Box</span>
      <span class="price">SEK149.00</span>
      <span>Only 3 left!</span>
    </div>
    <div class="item">
      Havre & Russin Cookies
      pris: contact us
      category: n/a
    </div>
    <div class="item">
      <span>Summer Berry Mix</span>
      <span>OUT OF STOCK</span>
    </div>
  </div>

  <footer>
    <script>analytics.track('page_view')</script>
    <div class="cookie-banner">We use cookies...</div>
    <!-- 847 more DOM nodes... -->
  </footer>
</body>
</html>

[Extracted by generic crawler]
Products found: maybe 5? maybe 12?
Prices: inconsistent (kr, SEK, contact us)
Categories: none detected
Availability: unknown for 3/5 items
Images: relative paths, broken
Agent-readable: ✗ NO`;

const STEPS = [
  {
    icon: Store,
    title: "Merchant connects store",
    desc: "MIME crawls and extracts every product with AI-powered scraping.",
  },
  {
    icon: Sparkles,
    title: "Semantic Agent enriches",
    desc: "Internal AI structures, categorises, and writes optimised llms.txt files.",
  },
  {
    icon: Code,
    title: "Snippet installed",
    desc: "One HTML tag in <head> — AI shopping bots find and read it instantly.",
  },
];

export default function Demo() {
  const navigate = useNavigate();
  const [llmsTxt, setLlmsTxt] = useState<string | null>(null);
  const [fetchTime, setFetchTime] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const startRef = useRef(0);

  const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID || "paijyobnnrcidapjqcln";

  useEffect(() => {
    const fetchLlms = async () => {
      setLoading(true);
      startRef.current = performance.now();
      try {
        const res = await fetch(
          `https://${projectId}.supabase.co/functions/v1/serve-llms?store_id=${DEMO_STORE_ID}&file=llms`
        );
        const elapsed = performance.now() - startRef.current;
        setFetchTime(Math.round(elapsed));
        if (res.ok) {
          const text = await res.text();
          setLlmsTxt(text);
        } else {
          setLlmsTxt("# Demo Store\n\n> No llms.txt generated yet for this store.\n> Visit the Generate tab to create one.");
        }
      } catch {
        setLlmsTxt("# Demo Store\n\n> Could not fetch llms.txt. The serve-llms Edge Function may not be deployed yet.");
        setFetchTime(null);
      } finally {
        setLoading(false);
      }
    };
    fetchLlms();
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Top bar */}
      <header className="h-14 border-b border-border/50 bg-card/80 backdrop-blur-sm flex items-center justify-between px-4 md:px-8 sticky top-0 z-10">
        <button
          onClick={() => navigate("/dashboard")}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back to dashboard
        </button>
        <span className="text-sm font-semibold tracking-tight">MIME Demo</span>
        <div className="w-24" />
      </header>

      {/* Hero */}
      <div className="text-center py-10 px-4">
        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="font-heading text-3xl md:text-4xl font-bold mb-3"
        >
          What AI agents actually see
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-muted-foreground max-w-lg mx-auto"
        >
          Same store. Same products. Completely different experience for AI shopping agents.
        </motion.p>
      </div>

      {/* Panels */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* LEFT: Without MIME */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded-xl border border-destructive/30 bg-card overflow-hidden"
          >
            <div className="px-5 py-3 border-b border-border/50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-destructive/15 text-destructive">
                  <AlertTriangle className="h-3 w-3" /> Raw HTML Crawl
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" /> 14.2 seconds
              </div>
            </div>

            <div className="p-4 max-h-[520px] overflow-y-auto">
              <pre className="font-mono text-[11px] leading-relaxed text-muted-foreground whitespace-pre-wrap break-all">
                {RAW_CRAWL}
              </pre>
            </div>

            <div className="px-5 py-3 border-t border-border/50 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-destructive shrink-0" />
              <span className="text-xs font-medium text-destructive">
                AI agent sees: incomplete, unstructured, unpredictable
              </span>
            </div>
          </motion.div>

          {/* RIGHT: With MIME */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="rounded-xl border border-green-500/30 bg-card overflow-hidden"
          >
            <div className="px-5 py-3 border-b border-border/50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-green-500/15 text-green-500">
                  <CheckCircle2 className="h-3 w-3" /> MIME llms.txt
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Zap className="h-3 w-3 text-green-500" />
                {fetchTime !== null ? `${fetchTime}ms` : "—"}
              </div>
            </div>

            <div className="p-4 max-h-[520px] overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center py-20">
                  <div className="animate-spin h-6 w-6 border-2 border-green-500 border-t-transparent rounded-full" />
                </div>
              ) : (
                <pre className="font-mono text-[11px] leading-relaxed text-foreground whitespace-pre-wrap">
                  {llmsTxt}
                </pre>
              )}
            </div>

            <div className="px-5 py-3 border-t border-border/50 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
              <span className="text-xs font-medium text-green-500">
                AI agent sees: structured, enriched, instant
              </span>
            </div>
          </motion.div>
        </div>

        {/* How it works */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-16"
        >
          <h2 className="font-heading text-xl font-bold text-center mb-8">How it works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {STEPS.map((step, i) => (
              <div key={i} className="card-elevated p-6 text-center space-y-3">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto">
                  <step.icon className="h-6 w-6 text-primary" />
                </div>
                <div className="flex items-center justify-center gap-2">
                  <span className="text-xs font-bold text-muted-foreground bg-muted w-6 h-6 rounded-full flex items-center justify-center">
                    {i + 1}
                  </span>
                  <h3 className="text-sm font-semibold">{step.title}</h3>
                </div>
                <p className="text-xs text-muted-foreground">{step.desc}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* CTA */}
        <div className="text-center mt-12">
          <Button onClick={() => navigate("/dashboard")} size="lg" className="btn-glow">
            <Globe className="h-4 w-4 mr-2" /> Back to Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
}
