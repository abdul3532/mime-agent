import { motion } from "framer-motion";
import { XCircle, CheckCircle2, AlertTriangle, Clock, Zap, ShieldCheck, SlidersHorizontal, Bot } from "lucide-react";

const beforeItems = [
  { icon: Bot, label: "Agent crawls entire site", detail: "500+ pages, 12+ seconds", status: "bad" as const },
  { icon: XCircle, label: "Scraped data is unreliable", detail: "Missing fields, wrong prices", status: "bad" as const },
  { icon: AlertTriangle, label: "No merchant control", detail: "Agent decides what matters", status: "bad" as const },
  { icon: Clock, label: "Stale results", detail: "Cached hours/days behind", status: "bad" as const },
];

const afterItems = [
  { icon: Zap, label: "Instant structured endpoint", detail: "1 request, <200ms", status: "good" as const },
  { icon: ShieldCheck, label: "Verified product facts", detail: "Always current, always correct", status: "good" as const },
  { icon: SlidersHorizontal, label: "Merchant sets priorities", detail: "You control what agents see first", status: "good" as const },
  { icon: CheckCircle2, label: "Real-time updates", detail: "Changes publish instantly", status: "good" as const },
];

export function Comparison() {
  return (
    <section className="py-20 md:py-28 relative overflow-hidden">
      <div className="absolute inset-0 grid-pattern opacity-20" />

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
            className="rounded-2xl border-2 border-destructive/20 bg-destructive/[0.02] p-6 space-y-5"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-destructive/10 flex items-center justify-center">
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
                  className="flex items-start gap-3 p-3 rounded-xl bg-card border transition-all duration-200 hover:shadow-sm"
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
            <div className="rounded-lg bg-foreground/[0.03] border p-4 font-mono text-xs space-y-1">
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
            className="rounded-2xl border-2 border-accent/30 bg-accent/[0.03] p-6 space-y-5 relative"
          >
            {/* Glow */}
            <div className="absolute -top-20 -right-20 w-40 h-40 rounded-full bg-accent/10 blur-[60px] pointer-events-none" />

            <div className="flex items-center gap-3 relative">
              <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center">
                <CheckCircle2 className="h-5 w-5 text-accent-foreground" />
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
                  className="flex items-start gap-3 p-3 rounded-xl bg-card border transition-all duration-200 hover:shadow-sm hover:border-accent/30"
                >
                  <div className="w-8 h-8 rounded-lg bg-accent/15 flex items-center justify-center shrink-0 mt-0.5">
                    <item.icon className="h-4 w-4 text-accent-foreground" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold">{item.label}</div>
                    <div className="text-xs text-muted-foreground">{item.detail}</div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Mock terminal */}
            <div className="rounded-lg bg-foreground/[0.03] border p-4 font-mono text-xs space-y-1 relative">
              <div className="text-muted-foreground">$ agent.discover("store.com")</div>
              <div className="text-accent-foreground">✓ MIME endpoint found via &lt;link rel="alternate"&gt;</div>
              <div className="text-accent-foreground">✓ 58 products loaded in 142ms</div>
              <div className="text-accent-foreground">✓ Merchant priorities applied (9 rules)</div>
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
            { value: "100%", label: "Data accuracy" },
            { value: "0", label: "Scraping errors" },
          ].map((s) => (
            <div key={s.label} className="text-center p-4 rounded-xl card-elevated">
              <div className="text-2xl md:text-3xl font-heading font-extrabold text-primary">{s.value}</div>
              <div className="text-xs text-muted-foreground mt-1">{s.label}</div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
