import { motion } from "framer-motion";
import { Link2, MessageSquare, Search, Plug } from "lucide-react";

const steps = [
  { icon: Link2, title: "Add URL", desc: "Paste your store URL" },
  { icon: MessageSquare, title: "Set priorities", desc: "Tell MIME what to push using AI chat" },
  { icon: Search, title: "Crawl & compile", desc: "MIME scans and structures your catalog" },
  { icon: Plug, title: "Install & verify", desc: "One line of code, verified instantly" },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-20 md:py-28 relative overflow-hidden">
      <div className="absolute inset-0 grid-pattern opacity-15" />
      {/* Section glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] rounded-full pointer-events-none" style={{ background: "radial-gradient(ellipse, hsl(230 70% 58% / 0.05) 0%, transparent 70%)" }} />

      <div className="container mx-auto px-4 relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <motion.span
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-xs font-semibold tracking-widest uppercase text-primary mb-3 block"
          >
            How it works
          </motion.span>
          <h2 className="font-heading text-3xl md:text-5xl font-bold mb-4">
            Four steps to agent-ready
          </h2>
          <p className="text-muted-foreground max-w-lg mx-auto">
            Make your store discoverable by AI agents in minutes.
          </p>
        </motion.div>

        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative">
            {/* Animated connecting line */}
            <motion.div
              initial={{ scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 1, delay: 0.3 }}
              className="hidden md:block absolute top-10 left-[12.5%] right-[12.5%] h-px bg-gradient-to-r from-primary/20 via-primary/40 to-primary/20 origin-left"
            />

            {steps.map((s, i) => (
              <motion.div
                key={s.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.15 * i + 0.2, duration: 0.5 }}
                className="flex flex-col items-center text-center relative group"
              >
                <motion.div
                  whileHover={{ scale: 1.15, rotate: 5 }}
                  transition={{ type: "spring", stiffness: 400, damping: 15 }}
                  className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center mb-5 relative z-10 transition-shadow duration-300 group-hover:shadow-xl"
                  style={{ boxShadow: "0 8px 30px -8px hsl(230 70% 58% / 0.5)" }}
                >
                  <s.icon className="h-6 w-6 text-primary-foreground" />
                </motion.div>
                <span className="text-xs font-bold text-primary mb-2 tracking-wide uppercase">Step {i + 1}</span>
                <h3 className="text-sm font-bold mb-1">{s.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{s.desc}</p>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.6 }}
            className="text-center mt-16"
          >
            <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-border/60 bg-card text-sm text-muted-foreground">
              <span className="w-1.5 h-1.5 rounded-full bg-accent" />
              MIME is building the commerce layer for the agentic economy
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
