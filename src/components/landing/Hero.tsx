import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Zap, ShieldCheck, SlidersHorizontal, Globe, CheckCircle2, ArrowRight } from "lucide-react";

const benefits = [
  { icon: Zap, title: "Faster discovery", desc: "Less crawling, instant structured data" },
  { icon: ShieldCheck, title: "More reliable results", desc: "Structured facts, not scraped guesses" },
  { icon: SlidersHorizontal, title: "Merchant-controlled", desc: "You decide what gets pushed" },
  { icon: Globe, title: "Discoverable by design", desc: "Alternate link + well-known endpoints" },
  { icon: CheckCircle2, title: "Verifiable", desc: "Installation check + live status" },
];

export function Hero() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], [0, 150]);
  const opacity = useTransform(scrollYProgress, [0, 0.6], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.5], [1, 0.95]);

  const scrollTo = (id: string) =>
    document.querySelector(id)?.scrollIntoView({ behavior: "smooth" });

  return (
    <section ref={ref} id="hero" className="relative overflow-hidden pt-28 pb-20 md:pt-40 md:pb-32">
      {/* Animated background */}
      <div className="absolute inset-0 grid-pattern opacity-50" />
      <div className="orb w-[600px] h-[600px] bg-accent/8 top-[-200px] right-[-100px]" />
      <div className="orb w-[400px] h-[400px] bg-primary/6 bottom-[-100px] left-[-100px]" style={{ animationDelay: "-7s" }} />

      <motion.div style={{ y, opacity, scale }} className="container mx-auto px-4 relative">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="max-w-3xl mx-auto text-center"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent/15 text-accent-foreground text-sm font-medium mb-8 border border-accent/20"
          >
            <span className="w-2 h-2 rounded-full bg-accent pulse-dot" />
            Building the commerce layer for the agentic economy
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="font-heading text-4xl md:text-6xl lg:text-7xl font-extrabold leading-[1.1] mb-6"
          >
            MIME makes your store{" "}
            <span className="relative inline-block">
              <span className="text-primary">readable for AI agents</span>
              <motion.span
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 0.8, delay: 1 }}
                className="absolute -bottom-1 left-0 right-0 h-1 bg-accent/40 rounded-full origin-left"
              />
            </span>
            .
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10"
          >
            One installation. One structured storefront. Reliable discovery for agentic commerce.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="flex flex-col sm:flex-row gap-3 justify-center mb-20"
          >
            <Button size="lg" onClick={() => scrollTo("#wizard")} className="btn-glow group">
              Start demo
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Button>
            <Button size="lg" variant="outline" onClick={() => scrollTo("#wizard")} className="group">
              View dashboard
            </Button>
          </motion.div>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 max-w-5xl mx-auto">
          {benefits.map((b, i) => (
            <motion.div
              key={b.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              whileHover={{ y: -6, transition: { duration: 0.2 } }}
              className="card-elevated p-5 text-center group"
            >
              <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-3 transition-all duration-300 group-hover:bg-primary group-hover:shadow-lg group-hover:scale-110">
                <b.icon className="h-5 w-5 text-primary transition-colors duration-300 group-hover:text-primary-foreground" />
              </div>
              <h3 className="text-sm font-semibold mb-1">{b.title}</h3>
              <p className="text-xs text-muted-foreground">{b.desc}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </section>
  );
}
