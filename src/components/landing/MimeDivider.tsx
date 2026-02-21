import { motion } from "framer-motion";
import mimePeeking from "@/assets/mime-peeking.png";

export function MimeDivider() {
  return (
    <div className="relative py-12 md:py-16 overflow-hidden">
      <div className="container mx-auto px-4 flex items-center gap-0">
        {/* Left wall line */}
        <motion.div
          initial={{ scaleX: 0 }}
          whileInView={{ scaleX: 1 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.8, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="flex-1 h-px bg-border origin-right"
        />

        {/* Mime pushing walls */}
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.8 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6, type: "spring", stiffness: 100, damping: 14 }}
          whileHover={{
            rotate: [0, -3, 3, -2, 2, 0],
            scale: 1.05,
            transition: { duration: 0.5, repeat: Infinity, repeatType: "mirror" },
          }}
          className="mx-4 md:mx-8 flex-shrink-0 cursor-pointer"
        >
          <img
            src={mimePeeking}
            alt="Mime pushing invisible walls"
            className="w-16 md:w-20 drop-shadow-md -scale-x-100"
          />
        </motion.div>

        {/* Right wall line */}
        <motion.div
          initial={{ scaleX: 0 }}
          whileInView={{ scaleX: 1 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.8, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="flex-1 h-px bg-border origin-left"
        />
      </div>
    </div>
  );
}
