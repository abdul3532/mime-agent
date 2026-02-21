import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import mimeCelebrating from "@/assets/mime-celebrating.png";

const celebrationPhrases = [
  "You did it! 🎉",
  "Bravo! Standing ovation!",
  "The crowd goes silent… in awe 🤐",
  "Your store is now AI-ready!",
  "Encore, encore!",
];

export function CelebratingMime() {
  const [hovered, setHovered] = useState(false);
  const [phrase] = useState(() => celebrationPhrases[Math.floor(Math.random() * celebrationPhrases.length)]);

  return (
    <motion.div
      initial={{ x: 200, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 60, damping: 15, delay: 0.5 }}
      className="fixed right-0 bottom-[20%] z-40 pointer-events-auto cursor-pointer hidden lg:block"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <motion.img
        src={mimeCelebrating}
        alt="Celebrating mime character"
        className="w-28 xl:w-36 drop-shadow-lg"
        whileHover={{ scale: 1.1 }}
        animate={hovered ? { rotate: [0, 5, -5, 3, 0], y: [0, -8, 0] } : {}}
        transition={{ duration: 0.6 }}
      />
      <AnimatePresence>
        {hovered && (
          <motion.div
            initial={{ opacity: 0, x: 10, scale: 0.8 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 10, scale: 0.8 }}
            transition={{ duration: 0.2 }}
            className="absolute top-2 right-[90%] whitespace-nowrap bg-card border border-border rounded-xl px-4 py-2 text-sm font-medium text-foreground shadow-lg"
          >
            <div className="absolute top-4 -right-1.5 w-3 h-3 bg-card border-r border-t border-border rotate-45" />
            {phrase}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
