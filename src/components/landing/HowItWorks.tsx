import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { Link2, MessageSquare, Search, Plug } from "lucide-react";

const steps = [
  { icon: Link2, title: "Add URL", desc: "Paste your store URL" },
  { icon: MessageSquare, title: "Set priorities", desc: "Tell MIME what to push using AI chat" },
  { icon: Search, title: "Crawl & compile", desc: "MIME scans and structures your catalog" },
  { icon: Plug, title: "Install & verify", desc: "One line of code, verified instantly" },
];

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.15, delayChildren: 0.2 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 40, scale: 0.9 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.5, type: "spring" as const, stiffness: 100 } },
};

export function HowItWorks() {
  const sectionRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ["start end", "end start"] });
  const gridY = useTransform(scrollYProgress, [0, 1], [-30, 30]);

  return (
    <section ref={sectionRef} id="how-it-works" className="py-20 md:py-28 relative overflow-hidden">
      <motion.div style={{ y: gridY }} className="absolute inset-0 grid-pattern opacity-15" />
      {/* Section glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] rounded-full pointer-events-none" style={{ background: "radial-gradient(ellipse, hsl(0 0% 100% / 0.03) 0%, transparent 70%)" }} />

      <div className="container mx-auto px-4 relative">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="text-center mb-16"
        >
          <motion.span
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1, type: "spring" }}
            className="text-xs font-semibold tracking-widest uppercase text-foreground/60 mb-3 block"
          >
            How it works
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="font-heading text-3xl md:text-5xl font-bold mb-4"
          >
            Four steps to agent-ready
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="text-muted-foreground max-w-lg mx-auto"
          >
            Make your store discoverable by AI agents in minutes.
          </motion.p>
        </motion.div>

        <div className="max-w-4xl mx-auto">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            className="grid grid-cols-1 md:grid-cols-4 gap-8 relative"
          >
            {/* Connecting line */}
            <motion.div
              initial={{ scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 1.2, delay: 0.4, ease: "easeOut" }}
              className="hidden md:block absolute top-10 left-[12.5%] right-[12.5%] h-px origin-left bg-gradient-to-r from-foreground/10 via-foreground/20 to-foreground/10"
            />

            {steps.map((s, i) => (
              <motion.div
                key={s.title}
                variants={itemVariants}
                className="flex flex-col items-center text-center relative group"
              >
                <motion.div
                  whileHover={{ scale: 1.15, rotate: 5 }}
                  transition={{ type: "spring", stiffness: 400, damping: 15 }}
                  className="w-14 h-14 rounded-2xl bg-foreground flex items-center justify-center mb-5 relative z-10 transition-shadow duration-300 group-hover:shadow-[0_0_30px_-5px_hsl(0_0%_100%/0.2)]"
                  style={{ boxShadow: "0 8px 30px -8px hsl(0 0% 100% / 0.15)" }}
                >
                  <s.icon className="h-6 w-6 text-background" />
                </motion.div>
                <motion.span
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.3 + i * 0.15 }}
                  className="text-xs font-bold text-foreground/60 mb-2 tracking-wide uppercase"
                >
                  Step {i + 1}
                </motion.span>
                <h3 className="text-sm font-bold mb-1">{s.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{s.desc}</p>
              </motion.div>
            ))}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.8, duration: 0.5 }}
            className="text-center mt-16"
          >
            <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-border bg-card text-sm text-muted-foreground">
              <span className="w-1.5 h-1.5 rounded-full bg-foreground/50" />
              MIME is building the commerce layer for the agentic economy
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
