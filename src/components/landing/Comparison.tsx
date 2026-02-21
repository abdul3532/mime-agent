import { motion } from "framer-motion";
import { XCircle, CheckCircle2, AlertTriangle, Clock, Zap, ShieldCheck, SlidersHorizontal, Bot } from "lucide-react";

const beforeItems = [
  { icon: Bot, label: "Agent crawls entire site", detail: "500+ pages, 12+ seconds", status: "bad" as const },
  { icon: XCircle, label: "Scraped data is unreliable", detail: "Missing fields, wrong prices", status: "bad" as const },
  { icon: AlertTriangle, label: "No merchant control", detail: "Agent decides what matters", status: "bad" as const },
  { icon: Clock, label: "Stale results", detail: "Cached hours/days behind", status: "bad" as const },
];

const afterItems = [
  { icon: Zap, label: "Faster discovery", detail: "Less crawling, instant structured data", status: "good" as const },
  { icon: ShieldCheck, label: "More reliable results", detail: "Structured facts, not scraped guesses", status: "good" as const },
  { icon: SlidersHorizontal, label: "Merchant-controlled", detail: "You decide what gets pushed", status: "good" as const },
  { icon: CheckCircle2, label: "Discoverable by design", detail: "Alternate link + well-known endpoints", status: "good" as const },
];

export function Comparison() {
  return (
    <section className="py-20 md:py-28 relative overflow-hidden">
      <div className="absolute inset-0 grid-pattern opacity-10" />

      <div className="container mx-auto px-4 relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-14"
        >
          <span className="text-xs font-semibold tracking-widest uppercase text-primary mb-3 block">
            The difference
          </span>
          <h2 className="font-heading text-3xl md:text-5xl font-bold mb-4">
            Before vs. after MIME
          </h2>
          <p className="text-muted-foreground max-w-lg mx-auto">
            See how MIME transforms agent discovery from unreliable scraping to structured, merchant-controlled commerce.
          </p>
        </motion.div>

        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Before */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="rounded-2xl border border-destructive/20 bg-destructive/[0.03] p-6 space-y-5"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-destructive/15 flex items-center justify-center">
                <XCircle className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <h3 className="font-heading text-lg font-bold">Without MIME</h3>
                <p className="text-xs text-muted-foreground">Traditional agent crawling</p>
              </div>
            </div>

            <div className="space-y-3">
              {beforeItems.map((item, i) => (
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.1 + i * 0.08 }}
                  className="flex items-start gap-3 p-3 rounded-xl bg-card border border-border/60 transition-all duration-200 hover:border-destructive/20"
                >
                  <div className="w-8 h-8 rounded-lg bg-destructive/10 flex items-center justify-center shrink-0 mt-0.5">
                    <item.icon className="h-4 w-4 text-destructive" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold">{item.label}</div>
                    <div className="text-xs text-muted-foreground">{item.detail}</div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Mock terminal */}
            <div className="rounded-lg bg-background border border-border/60 p-4 font-mono text-xs space-y-1">
              <div className="text-muted-foreground">$ agent.discover("store.com")</div>
              <div className="text-destructive">⚠ Timeout: 12.4s — 523 pages crawled</div>
              <div className="text-destructive">⚠ Missing price on 14 products</div>
              <div className="text-destructive">✗ 3 products had stale data</div>
              <div className="text-muted-foreground">→ Results: unreliable, slow</div>
            </div>
          </motion.div>

          {/* After */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="rounded-2xl border border-primary/20 bg-primary/[0.03] p-6 space-y-5 relative"
          >
            {/* Glow */}
            <div className="absolute -top-20 -right-20 w-40 h-40 rounded-full bg-primary/10 blur-[80px] pointer-events-none" />

            <div className="flex items-center gap-3 relative">
              <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center">
                <CheckCircle2 className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-heading text-lg font-bold">With MIME</h3>
                <p className="text-xs text-muted-foreground">Structured agent storefront</p>
              </div>
            </div>

            <div className="space-y-3 relative">
              {afterItems.map((item, i) => (
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0, x: 10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.15 + i * 0.08 }}
                  className="flex items-start gap-3 p-3 rounded-xl bg-card border border-border/60 transition-all duration-200 hover:border-primary/30"
                >
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                    <item.icon className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold">{item.label}</div>
                    <div className="text-xs text-muted-foreground">{item.detail}</div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Mock terminal */}
            <div className="rounded-lg bg-background border border-border/60 p-4 font-mono text-xs space-y-1 relative">
              <div className="text-muted-foreground">$ agent.discover("store.com")</div>
              <div className="text-primary">✓ MIME endpoint found via &lt;link rel="alternate"&gt;</div>
              <div className="text-primary">✓ 58 products loaded in 142ms</div>
              <div className="text-primary">✓ Merchant priorities applied (9 rules)</div>
              <div className="text-muted-foreground">→ Results: structured, fast, reliable</div>
            </div>
          </motion.div>
        </div>

        {/* Stats row */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
          className="max-w-3xl mx-auto mt-12 grid grid-cols-3 gap-4"
        >
          {[
            { value: "60×", label: "Faster discovery" },
            { value: "100%", label: "Verifiable" },
            { value: "0", label: "Scraping errors" },
          ].map((s) => (
            <div key={s.label} className="text-center p-4 rounded-xl card-elevated">
              <div className="text-2xl md:text-3xl font-heading font-extrabold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">{s.value}</div>
              <div className="text-xs text-muted-foreground mt-1">{s.label}</div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
