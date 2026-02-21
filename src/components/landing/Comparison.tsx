import { motion, useInView } from "framer-motion";
import { useRef, useState, useEffect } from "react";
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

const stats = [
  { target: 60, suffix: "×", label: "Faster discovery" },
  { target: 100, suffix: "%", label: "Verifiable" },
  { target: 0, suffix: "", label: "Scraping errors" },
];

function CountUpStat({ target, suffix, label, delay }: { target: number; suffix: string; label: string; delay: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!isInView) return;
    if (target === 0) { setCount(0); return; }
    const duration = 1500;
    const start = performance.now();
    const step = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(eased * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    const timer = setTimeout(() => requestAnimationFrame(step), delay);
    return () => clearTimeout(timer);
  }, [isInView, target, delay]);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 25, scale: 0.9 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true }}
      transition={{ delay: delay / 1000, duration: 0.5, type: "spring", stiffness: 100 }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className="text-center p-5 rounded-xl card-elevated group"
    >
      <div className="text-2xl md:text-4xl font-heading font-extrabold bg-gradient-to-r from-primary via-[hsl(270,60%,65%)] to-accent bg-clip-text text-transparent transition-all duration-300 group-hover:drop-shadow-[0_0_12px_hsl(var(--glow-purple)/0.4)]">
        {count}{suffix}
      </div>
      <div className="text-xs text-muted-foreground mt-1.5">{label}</div>
    </motion.div>
  );
}

export function Comparison() {
  return (
    <section className="py-20 md:py-28 relative overflow-hidden">
      <div className="absolute inset-0 grid-pattern opacity-10" />
      {/* Purple ambient glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] rounded-full pointer-events-none" style={{ background: "radial-gradient(ellipse, hsl(270 60% 55% / 0.06) 0%, transparent 70%)" }} />

      <div className="container mx-auto px-4 relative">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="text-center mb-14"
        >
          <motion.span
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-xs font-semibold tracking-widest uppercase text-primary mb-3 block"
          >
            The difference
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="font-heading text-3xl md:text-5xl font-bold mb-4"
          >
            Before vs. after MIME
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="text-muted-foreground max-w-lg mx-auto"
          >
            See how MIME transforms agent discovery from unreliable scraping to structured, merchant-controlled commerce.
          </motion.p>
        </motion.div>

        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Before */}
          <motion.div
            initial={{ opacity: 0, x: -40, rotateY: 5 }}
            whileInView={{ opacity: 1, x: 0, rotateY: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, type: "spring", stiffness: 80 }}
            className="rounded-2xl border border-destructive/20 bg-destructive/[0.03] p-6 space-y-5"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="flex items-center gap-3"
            >
              <div className="w-10 h-10 rounded-xl bg-destructive/15 flex items-center justify-center">
                <XCircle className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <h3 className="font-heading text-lg font-bold">Without MIME</h3>
                <p className="text-xs text-muted-foreground">Traditional agent crawling</p>
              </div>
            </motion.div>

            <div className="space-y-3">
              {beforeItems.map((item, i) => (
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.15 + i * 0.1, duration: 0.4 }}
                  whileHover={{ x: 4, transition: { duration: 0.15 } }}
                  className="flex items-start gap-3 p-3 rounded-xl bg-card border border-border/60 transition-all duration-200 hover:border-destructive/30 hover:shadow-[0_0_20px_-5px_hsl(0_72%_55%/0.15)]"
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

            {/* Mock terminal with purple glow on hover */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.5 }}
              className="rounded-lg bg-background border border-border/60 p-4 font-mono text-xs space-y-1 transition-all duration-300 hover:border-[hsl(270,60%,55%,0.3)] hover:shadow-[0_0_30px_-8px_hsl(270_60%_55%/0.2)]"
            >
              <div className="text-muted-foreground">$ agent.discover("store.com")</div>
              <div className="text-destructive">⚠ Timeout: 12.4s — 523 pages crawled</div>
              <div className="text-destructive">⚠ Missing price on 14 products</div>
              <div className="text-destructive">✗ 3 products had stale data</div>
              <div className="text-muted-foreground">→ Results: unreliable, slow</div>
            </motion.div>
          </motion.div>

          {/* After */}
          <motion.div
            initial={{ opacity: 0, x: 40, rotateY: -5 }}
            whileInView={{ opacity: 1, x: 0, rotateY: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, type: "spring", stiffness: 80 }}
            className="rounded-2xl border border-primary/20 bg-primary/[0.03] p-6 space-y-5 relative"
          >
            {/* Purple + blue glow */}
            <div className="absolute -top-20 -right-20 w-40 h-40 rounded-full blur-[80px] pointer-events-none" style={{ background: "hsl(270 60% 55% / 0.12)" }} />
            <div className="absolute -bottom-16 -left-16 w-32 h-32 rounded-full bg-primary/8 blur-[60px] pointer-events-none" />

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="flex items-center gap-3 relative"
            >
              <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center">
                <CheckCircle2 className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-heading text-lg font-bold">With MIME</h3>
                <p className="text-xs text-muted-foreground">Structured agent storefront</p>
              </div>
            </motion.div>

            <div className="space-y-3 relative">
              {afterItems.map((item, i) => (
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.2 + i * 0.1, duration: 0.4 }}
                  whileHover={{ x: -4, transition: { duration: 0.15 } }}
                  className="flex items-start gap-3 p-3 rounded-xl bg-card border border-border/60 transition-all duration-200 hover:border-primary/30 hover:shadow-[0_0_20px_-5px_hsl(270_60%_55%/0.2)]"
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

            {/* Mock terminal with purple glow on hover */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.6 }}
              className="rounded-lg bg-background border border-border/60 p-4 font-mono text-xs space-y-1 relative transition-all duration-300 hover:border-[hsl(270,60%,55%,0.3)] hover:shadow-[0_0_30px_-8px_hsl(270_60%_55%/0.25)]"
            >
              <div className="text-muted-foreground">$ agent.discover("store.com")</div>
              <div className="text-primary">✓ MIME endpoint found via &lt;link rel="alternate"&gt;</div>
              <div className="text-primary">✓ 58 products loaded in 142ms</div>
              <div className="text-primary">✓ Merchant priorities applied (9 rules)</div>
              <div className="text-muted-foreground">→ Results: structured, fast, reliable</div>
            </motion.div>
          </motion.div>
        </div>

        {/* Stats row with count-up */}
        <div className="max-w-3xl mx-auto mt-12 grid grid-cols-3 gap-4">
          {stats.map((s, i) => (
            <CountUpStat key={s.label} target={s.target} suffix={s.suffix} label={s.label} delay={i * 200} />
          ))}
        </div>
      </div>
    </section>
  );
}
