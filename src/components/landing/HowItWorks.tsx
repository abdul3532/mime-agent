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
    <section id="how-it-works" className="py-20 md:py-28 bg-surface-raised">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-14"
        >
          <h2 className="font-heading text-3xl md:text-4xl font-bold mb-4">How it works</h2>
          <p className="text-muted-foreground max-w-lg mx-auto">
            Four simple steps to make your store discoverable by AI agents.
          </p>
        </motion.div>

        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative">
            {/* Connecting line */}
            <div className="hidden md:block absolute top-12 left-[12.5%] right-[12.5%] h-px bg-border" />

            {steps.map((s, i) => (
              <motion.div
                key={s.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="flex flex-col items-center text-center relative"
              >
                <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center mb-4 relative z-10">
                  <s.icon className="h-5 w-5 text-primary-foreground" />
                </div>
                <span className="text-xs font-semibold text-accent mb-1">Step {i + 1}</span>
                <h3 className="text-sm font-bold mb-1">{s.title}</h3>
                <p className="text-xs text-muted-foreground">{s.desc}</p>
              </motion.div>
            ))}
          </div>

          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center text-muted-foreground mt-14 max-w-lg mx-auto"
          >
            MIME is building the commerce layer for the agentic economy — structured, reliable, and merchant-controlled.
          </motion.p>
        </div>
      </div>
    </section>
  );
}
