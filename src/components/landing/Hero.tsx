import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Zap, ShieldCheck, SlidersHorizontal, Globe, CheckCircle2 } from "lucide-react";

const benefits = [
  { icon: Zap, title: "Faster discovery", desc: "Less crawling, instant structured data" },
  { icon: ShieldCheck, title: "More reliable results", desc: "Structured facts, not scraped guesses" },
  { icon: SlidersHorizontal, title: "Merchant-controlled", desc: "You decide what gets pushed" },
  { icon: Globe, title: "Discoverable by design", desc: "Alternate link + well-known endpoints" },
  { icon: CheckCircle2, title: "Verifiable", desc: "Installation check + live status" },
];

export function Hero() {
  const scrollTo = (id: string) =>
    document.querySelector(id)?.scrollIntoView({ behavior: "smooth" });

  return (
    <section id="hero" className="relative overflow-hidden pt-28 pb-20 md:pt-36 md:pb-28">
      {/* Subtle background accent */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full bg-accent/10 blur-[120px] -translate-y-1/2 translate-x-1/3 pointer-events-none" />

      <div className="container mx-auto px-4 relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-3xl mx-auto text-center"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/15 text-accent-foreground text-sm font-medium mb-6">
            <span className="w-2 h-2 rounded-full bg-accent" />
            Building the commerce layer for the agentic economy
          </div>

          <h1 className="font-heading text-4xl md:text-6xl font-extrabold leading-tight mb-6">
            MIME makes your store{" "}
            <span className="text-primary">readable for AI agents.</span>
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            One installation. One structured storefront. Reliable discovery for agentic commerce.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-16">
            <Button size="lg" onClick={() => scrollTo("#wizard")}>
              Start demo
            </Button>
            <Button size="lg" variant="outline" onClick={() => scrollTo("#wizard")}>
              View dashboard
            </Button>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 max-w-5xl mx-auto"
        >
          {benefits.map((b, i) => (
            <motion.div
              key={b.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.3 + i * 0.08 }}
              className="card-elevated p-5 text-center"
            >
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-3">
                <b.icon className="h-5 w-5 text-primary" />
              </div>
              <h3 className="text-sm font-semibold mb-1">{b.title}</h3>
              <p className="text-xs text-muted-foreground">{b.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
