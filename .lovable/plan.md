

# Mime Enhancements: Cursor-Following Eyes + Section Divider Wall

## 1. Cursor-Following Mime Eyes

A small mime face pinned to the bottom-right corner of the page. Its eyes smoothly track the user's mouse position, creating a playful "someone's watching" effect. On hover, a random witty speech bubble appears.

**How it works:**
- Uses `onMouseMove` on the window to get cursor coordinates
- Calculates eye pupil offset (clamped to a small range) based on cursor position relative to the mime's position
- Two small circular "pupils" inside drawn eye shapes shift with spring physics
- Uses the existing `mime-peeking.png` as the base, with CSS-drawn eyes overlaid on top
- Alternatively, we can build a simple SVG mime face (circle head, beret, two eyes) so the pupils are precisely controllable -- this would look cleaner

**Placement:** Fixed bottom-right corner, subtle and small (~80px), visible on desktop only (hidden on mobile). Appears after scrolling past the Hero section.

## 2. Section Divider Mime ("Invisible Wall")

A horizontal divider component placed between the Comparison and Wizard sections. The mime character stands in the center, arms pressed out to the sides as if pushing against invisible walls -- acting as a visual "barrier" between sections.

**How it works:**
- A decorative `<div>` with a horizontal line and a centered mime illustration
- The mime image slides up into view with a spring animation when scrolled into the viewport (`whileInView`)
- The horizontal lines on either side extend outward from the center (scale-x animation) as if the mime is "pushing" them apart
- On hover, the mime wiggles as if straining against the walls

**Placement:** Between Comparison and WizardContainer in the Index page layout.

## Technical Details

### New files:
- `src/components/landing/MimeEyes.tsx` -- cursor-following eyes component
- `src/components/landing/MimeDivider.tsx` -- section divider component

### Modified files:
- `src/pages/Index.tsx` -- add both new components to the page layout

### Dependencies:
- Framer Motion (already installed) for animations and spring physics
- No new assets required for the eyes (SVG-drawn face)
- Will reuse existing `mime-peeking.png` for the divider, or draw a simple SVG mime silhouette

### MimeEyes component approach:
- Track `window.mousemove` via `useEffect`
- Store mouse `{ x, y }` in state (throttled)
- Calculate pupil offset: `dx = clamp((mouseX - eyeCenterX) / distance, -maxOffset, maxOffset)`
- Render an SVG: circle face, beret shape, two eye whites with animated pupil circles
- Wrap in `motion.div` with fixed positioning and scroll-based opacity

### MimeDivider component approach:
- `whileInView` trigger for entrance animation
- Two `motion.div` horizontal lines with `scaleX: [0, 1]` animation
- Center mime image with `y: [20, 0]` and `opacity: [0, 1]` entrance
- `whileHover` wiggle animation on the mime
