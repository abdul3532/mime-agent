import { motion } from "framer-motion";
import mimeLogo from "@/assets/mime-logo.png";

export function Footer() {
  return (
    <motion.footer
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
      className="py-12 border-t border-border/50"
    >
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="flex items-center gap-4"
          >
            <img src={mimeLogo} alt="MIME" className="h-16 -my-4 brightness-0 invert" />
            <p className="text-sm text-muted-foreground">
              Building the commerce layer for the agentic economy.
            </p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="flex gap-6 text-sm text-muted-foreground"
          >
            <a href="#" className="hover:text-foreground transition-colors relative group">
              Docs
              <span className="absolute -bottom-0.5 left-0 w-0 h-px bg-primary transition-all duration-300 group-hover:w-full" />
            </a>
            <a href="#" className="hover:text-foreground transition-colors relative group">
              Security
              <span className="absolute -bottom-0.5 left-0 w-0 h-px bg-primary transition-all duration-300 group-hover:w-full" />
            </a>
            <a href="#" className="hover:text-foreground transition-colors relative group">
              Contact
              <span className="absolute -bottom-0.5 left-0 w-0 h-px bg-primary transition-all duration-300 group-hover:w-full" />
            </a>
          </motion.div>
        </div>
      </div>
    </motion.footer>
  );
}
