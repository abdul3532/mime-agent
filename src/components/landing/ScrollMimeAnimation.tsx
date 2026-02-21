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
import frame020 from "@/assets/mime-frames/frame_020.jpg";
import frame021 from "@/assets/mime-frames/frame_021.jpg";
import frame022 from "@/assets/mime-frames/frame_022.jpg";
import frame023 from "@/assets/mime-frames/frame_023.jpg";
import frame024 from "@/assets/mime-frames/frame_024.jpg";
import frame025 from "@/assets/mime-frames/frame_025.jpg";
import frame026 from "@/assets/mime-frames/frame_026.jpg";
import frame027 from "@/assets/mime-frames/frame_027.jpg";
import frame028 from "@/assets/mime-frames/frame_028.jpg";
import frame029 from "@/assets/mime-frames/frame_029.jpg";
import frame030 from "@/assets/mime-frames/frame_030.jpg";
import frame031 from "@/assets/mime-frames/frame_031.jpg";
import frame032 from "@/assets/mime-frames/frame_032.jpg";
import frame033 from "@/assets/mime-frames/frame_033.jpg";
import frame034 from "@/assets/mime-frames/frame_034.jpg";
import frame035 from "@/assets/mime-frames/frame_035.jpg";
import frame036 from "@/assets/mime-frames/frame_036.jpg";
import frame037 from "@/assets/mime-frames/frame_037.jpg";
import frame038 from "@/assets/mime-frames/frame_038.jpg";
import frame039 from "@/assets/mime-frames/frame_039.jpg";
import frame040 from "@/assets/mime-frames/frame_040.jpg";
import frame041 from "@/assets/mime-frames/frame_041.jpg";
import frame042 from "@/assets/mime-frames/frame_042.jpg";
import frame043 from "@/assets/mime-frames/frame_043.jpg";
import frame044 from "@/assets/mime-frames/frame_044.jpg";
import frame045 from "@/assets/mime-frames/frame_045.jpg";
import frame046 from "@/assets/mime-frames/frame_046.jpg";
import frame047 from "@/assets/mime-frames/frame_047.jpg";
import frame048 from "@/assets/mime-frames/frame_048.jpg";
import frame049 from "@/assets/mime-frames/frame_049.jpg";

const frames = [
  frame000, frame001, frame002, frame003, frame004,
  frame005, frame006, frame007, frame008, frame009,
  frame010, frame011, frame012, frame013, frame014,
  frame015, frame016, frame017, frame018, frame019,
  frame020, frame021, frame022, frame023, frame024,
  frame025, frame026, frame027, frame028, frame029,
  frame030, frame031, frame032, frame033, frame034,
  frame035, frame036, frame037, frame038, frame039,
  frame040, frame041, frame042, frame043, frame044,
  frame045, frame046, frame047, frame048, frame049,
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
