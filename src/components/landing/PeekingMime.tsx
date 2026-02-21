import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import mimePeeking from "@/assets/mime-peeking.png";

export function PeekingMime() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "center center"],
  });

  const x = useTransform(scrollYProgress, [0, 0.6, 1], [-200, -200, 0]);
  const opacity = useTransform(scrollYProgress, [0.4, 0.7], [0, 1]);
  const rotate = useTransform(scrollYProgress, [0.5, 1], [-15, 5]);

  return (
    <div ref={ref} className="fixed left-0 top-1/3 z-50 pointer-events-none hidden lg:block">
      <motion.img
        src={mimePeeking}
        alt="Peeking mime character"
        style={{ x, opacity, rotate }}
        className="w-32 xl:w-40 drop-shadow-lg"
      />
    </div>
  );
}
