import { useScroll, useTransform, motion, useMotionValueEvent } from "framer-motion";
import { useState, RefObject } from "react";

import frame000 from "@/assets/mime-frames/frame_000.jpg";
import frame001 from "@/assets/mime-frames/frame_001.jpg";
import frame002 from "@/assets/mime-frames/frame_002.jpg";
import frame003 from "@/assets/mime-frames/frame_003.jpg";
import frame004 from "@/assets/mime-frames/frame_004.jpg";
import frame005 from "@/assets/mime-frames/frame_005.jpg";
import frame006 from "@/assets/mime-frames/frame_006.jpg";
import frame007 from "@/assets/mime-frames/frame_007.jpg";
import frame008 from "@/assets/mime-frames/frame_008.jpg";
import frame009 from "@/assets/mime-frames/frame_009.jpg";
import frame010 from "@/assets/mime-frames/frame_010.jpg";
import frame011 from "@/assets/mime-frames/frame_011.jpg";
import frame012 from "@/assets/mime-frames/frame_012.jpg";
import frame013 from "@/assets/mime-frames/frame_013.jpg";
import frame014 from "@/assets/mime-frames/frame_014.jpg";
import frame015 from "@/assets/mime-frames/frame_015.jpg";
import frame016 from "@/assets/mime-frames/frame_016.jpg";
import frame017 from "@/assets/mime-frames/frame_017.jpg";
import frame018 from "@/assets/mime-frames/frame_018.jpg";
import frame019 from "@/assets/mime-frames/frame_019.jpg";

const frames = [
  frame000, frame001, frame002, frame003, frame004,
  frame005, frame006, frame007, frame008, frame009,
  frame010, frame011, frame012, frame013, frame014,
  frame015, frame016, frame017, frame018, frame019,
];

interface ScrollMimeAnimationProps {
  trackRef: RefObject<HTMLElement>;
}

export function ScrollMimeAnimation({ trackRef }: ScrollMimeAnimationProps) {
  const [frameIndex, setFrameIndex] = useState(0);
  const { scrollYProgress } = useScroll({ target: trackRef, offset: ["start end", "end start"] });
  const frameValue = useTransform(scrollYProgress, [0, 1], [0, frames.length - 1]);

  useMotionValueEvent(frameValue, "change", (v) => {
    setFrameIndex(Math.round(v));
  });

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className="hidden md:flex items-center justify-center shrink-0"
    >
      <img
        src={frames[frameIndex]}
        alt="Mime animation"
        className="w-20 h-20 md:w-24 md:h-24 rounded-xl object-cover"
        draggable={false}
      />
    </motion.div>
  );
}
