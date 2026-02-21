import { motion, useScroll, useTransform, useSpring, AnimatePresence } from "framer-motion";
import { useRef, useState } from "react";
import mimePeeking from "@/assets/mime-peeking.png";

const phrases = [
  "Psst… wanna see some structured data?",
  "I mime, you buy. Deal?",
  "No scraping needed 🤫",
  "Your agents will love this",
  "60× faster. I timed it.",
];

export function PeekingMime({ trackRef }: { trackRef: React.RefObject<HTMLDivElement> }) {
  const [hovered, setHovered] = useState(false);
  const [phrase] = useState(() => phrases[Math.floor(Math.random() * phrases.length)]);

  const { scrollYProgress } = useScroll({
    target: trackRef,
    offset: ["start end", "end start"],
  });

  const x = useTransform(scrollYProgress, [0.05, 0.2, 0.8, 0.95], [-160, 0, 0, -160]);
  const opacity = useTransform(scrollYProgress, [0.05, 0.2, 0.8, 0.95], [0, 1, 1, 0]);
  const rotate = useTransform(scrollYProgress, [0.05, 0.25], [-10, 5]);

  const springX = useSpring(x, { stiffness: 80, damping: 20 });
  const springRotate = useSpring(rotate, { stiffness: 80, damping: 20 });

  return (
    <motion.div
      style={{ x: springX, opacity, rotate: springRotate }}
      className="fixed left-0 top-[35%] z-40 pointer-events-auto cursor-pointer hidden lg:block"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      whileHover={{ scale: 1.08 }}
    >
      <motion.img
        src={mimePeeking}
        alt="Peeking mime character"
        className="w-28 xl:w-36 drop-shadow-lg"
        animate={hovered ? { rotate: [0, -5, 5, -3, 0] } : {}}
        transition={{ duration: 0.5 }}
      />
      <AnimatePresence>
        {hovered && (
          <motion.div
            initial={{ opacity: 0, x: -10, scale: 0.8 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -10, scale: 0.8 }}
            transition={{ duration: 0.2 }}
            className="absolute top-2 left-[90%] whitespace-nowrap bg-card border border-border rounded-xl px-4 py-2 text-sm font-medium text-foreground shadow-lg"
          >
            <div className="absolute top-4 -left-1.5 w-3 h-3 bg-card border-l border-b border-border rotate-45" />
            {phrase}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
