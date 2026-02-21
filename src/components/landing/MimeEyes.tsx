import { motion, useSpring, useScroll, useTransform, AnimatePresence } from "framer-motion";
import { useEffect, useState, useRef, useCallback } from "react";

const phrases = [
  "I see you 👀",
  "Psst… structured data?",
  "Stop staring, start shipping",
  "60× faster. Believe it.",
  "No scraping on my watch",
  "I'm watching your crawlers",
];

export function MimeEyes() {
  const [mouse, setMouse] = useState({ x: 0, y: 0 });
  const [hovered, setHovered] = useState(false);
  const [phrase] = useState(() => phrases[Math.floor(Math.random() * phrases.length)]);
  const containerRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll();
  const opacity = useTransform(scrollYProgress, [0, 0.08, 0.12], [0, 0, 1]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    setMouse({ x: e.clientX, y: e.clientY });
  }, []);

  useEffect(() => {
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [handleMouseMove]);

  // Calculate pupil offsets
  const eyeCenterX = typeof window !== "undefined" ? window.innerWidth - 56 : 0;
  const eyeCenterY = typeof window !== "undefined" ? window.innerHeight - 56 : 0;
  const maxOffset = 4;

  const dx = mouse.x && mouse.y
    ? Math.max(-maxOffset, Math.min(maxOffset, (mouse.x - eyeCenterX) / 80))
    : 0;
  const dy = mouse.x && mouse.y
    ? Math.max(-maxOffset, Math.min(maxOffset, (mouse.y - eyeCenterY) / 80))
    : 0;

  const pupilX = useSpring(dx, { stiffness: 150, damping: 20 });
  const pupilY = useSpring(dy, { stiffness: 150, damping: 20 });

  useEffect(() => {
    pupilX.set(dx);
    pupilY.set(dy);
  }, [dx, dy, pupilX, pupilY]);

  return (
    <motion.div
      ref={containerRef}
      style={{ opacity }}
      className="fixed bottom-6 right-6 z-50 hidden lg:block cursor-pointer"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      whileHover={{ scale: 1.1 }}
    >
      {/* SVG Mime Face */}
      <svg width="80" height="80" viewBox="0 0 80 80" fill="none" className="drop-shadow-lg">
        {/* Face */}
        <circle cx="40" cy="44" r="28" fill="hsl(var(--card))" stroke="hsl(var(--border))" strokeWidth="1.5" />

        {/* Beret */}
        <ellipse cx="40" cy="20" rx="22" ry="10" fill="hsl(var(--foreground))" opacity="0.85" />
        <circle cx="40" cy="12" r="4" fill="hsl(var(--foreground))" opacity="0.85" />
        {/* Beret brim */}
        <path d="M18 22 Q40 30 62 22" stroke="hsl(var(--foreground))" strokeWidth="2" fill="none" opacity="0.85" />

        {/* Left eye white */}
        <ellipse cx="32" cy="42" rx="7" ry="8" fill="white" stroke="hsl(var(--border))" strokeWidth="0.8" />
        {/* Right eye white */}
        <ellipse cx="48" cy="42" rx="7" ry="8" fill="white" stroke="hsl(var(--border))" strokeWidth="0.8" />

        {/* Left pupil */}
        <motion.circle
          r="3"
          fill="hsl(var(--foreground))"
          animate={{ cx: 32 + dx, cy: 42 + dy }}
          transition={{ type: "spring", stiffness: 150, damping: 20 }}
        />
        {/* Right pupil */}
        <motion.circle
          r="3"
          fill="hsl(var(--foreground))"
          animate={{ cx: 48 + dx, cy: 42 + dy }}
          transition={{ type: "spring", stiffness: 150, damping: 20 }}
        />

        {/* Mouth - slight smile */}
        <path d="M34 54 Q40 58 46 54" stroke="hsl(var(--foreground))" strokeWidth="1.5" fill="none" opacity="0.5" strokeLinecap="round" />
      </svg>

      {/* Speech bubble */}
      <AnimatePresence>
        {hovered && (
          <motion.div
            initial={{ opacity: 0, y: 5, scale: 0.85 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 5, scale: 0.85 }}
            transition={{ duration: 0.2 }}
            className="absolute bottom-full right-0 mb-2 whitespace-nowrap bg-card border border-border rounded-xl px-4 py-2 text-sm font-medium text-foreground shadow-lg"
          >
            <div className="absolute bottom-[-6px] right-8 w-3 h-3 bg-card border-r border-b border-border rotate-45" />
            {phrase}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
