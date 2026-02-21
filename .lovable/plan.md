

## Scroll-Driven Mime Animation

### What we're building
A frame-by-frame mime animation positioned to the left of the "60x faster" stat box in the Comparison section. As the user scrolls, the mime cycles through the uploaded frames, creating a flipbook-style animation effect. More frames will be added later (the user will provide them in batches of 10).

### Placement
The animation will sit to the left of the stats row (the row containing "60x", "100%", "0 Scraping errors"), aligned beside the "60x faster" box specifically.

### Implementation Steps

1. **Save all 10 frame images** to `src/assets/mime-frames/` directory (frame_000.jpg through frame_009.jpg)

2. **Create a new component** `src/components/landing/ScrollMimeAnimation.tsx`:
   - Import all frame images as ES6 modules
   - Accept a `trackRef` prop (a ref to the section to track scroll progress against)
   - Use `useScroll` + `useTransform` from framer-motion to map scroll progress to a frame index (0-9 for now, expandable as more frames arrive)
   - Render an `<img>` tag that swaps its `src` based on the computed frame index
   - Size it to roughly match the stat box height (~80-100px)
   - Hidden on small screens (`hidden md:block`)

3. **Update `Comparison.tsx`**:
   - Import `ScrollMimeAnimation`
   - Modify the stats row (line 240) layout: wrap it in a flex container with the mime animation on the left and the existing 3-column grid on the right
   - Pass `sectionRef` as the scroll tracking reference

### Technical Details

```text
Layout change for stats row:

Before:
[  60x  ] [ 100% ] [  0   ]

After:
[mime anim] [  60x  ] [ 100% ] [  0   ]
```

- Scroll-to-frame mapping: `useTransform(scrollYProgress, [0, 1], [0, totalFrames - 1])` rounded to nearest integer
- The component will be designed to easily accept more frames later -- frames stored in an array that just needs appending
- Each frame is ~42ms apart in the original animation, but here scroll speed controls playback

