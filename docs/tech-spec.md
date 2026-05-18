# Tech Spec — The Elevare Market

## Dependencies

| Package | Version | Purpose |
|--------|---------|---------|
| react | ^19.0.0 | UI framework |
| react-dom | ^19.0.0 | DOM renderer |
| three | ^0.170.0 | WebGL engine (hero lens, curved carousel) |
| @react-three/fiber | ^9.0.0 | React renderer for Three.js |
| @react-three/drei | ^9.0.0 | R3F helpers (Image, Html, useTexture, useFBO) |
| gsap | ^3.12.0 | Animation engine (ScrollTrigger, timelines) |
| lenis | ^1.2.0 | Smooth inertial scrolling |
| lucide-react | ^0.460.0 | Icons (heart, user, search, shopping-cart) |
| @fontsource/playfair-display | ^5.0.0 | Serif heading font |
| @fontsource/manrope | ^5.0.0 | Sans-serif body/UI font |
| @fontsource/caudex | ^5.0.0 | 3D text display font |

## Component Inventory

### Layout

| Component | Source | Reuse |
|-----------|--------|-------|
| Header | Custom | Once (fixed nav, transparent→solid transition) |
| TopBarMarquee | Custom | Once (scrolling announcement ribbon) |
| Footer | Custom | Once |
| NewsletterPopup | Custom | Once (modal overlay) |

### Sections

| Component | Source | Notes |
|-----------|--------|-------|
| HeroSection | Custom | Contains OrganicLensHero canvas |
| ValuePropositionSection | Custom | 4-col feature grid, static |
| ExclusivesSection | Custom | Contains CurvedCarousel canvas + sticky text |
| CircularTextSection | Custom | 200vh scroll runway, GSAP-driven 3D text |
| FeaturedProductsSection | Custom | 4-col CSS grid, static cards |
| BundlesCarouselSection | Custom | Horizontal scroll carousel |
| HappyHouseBanner | Custom | Full-width editorial image banner |
| PartnersSection | Custom | Grayscale logo row |
| JournalSection | Custom | 4-col article card grid |

### Reusable Components

| Component | Source | Used By |
|-----------|--------|---------|
| ProductCard | Custom | ExclusivesSection (overlay), FeaturedProductsSection |
| SectionHeading | Custom | Multiple sections (Playfair Display italic pattern) |
| PillButton | Custom | Throughout (2 variants: filled dark, outlined) |

### WebGL Components

| Component | Source | Notes |
|-----------|--------|-------|
| OrganicLensHero | Custom | Full R3F scene: background Image + lens mesh + post-processing |
| LensMesh | Custom | Subdivided plane with vertex deformation shader |
| LensPostProcess | Custom | EffectComposer with custom lens refraction shader pass |
| CurvedCarousel | Custom | R3F scene with 6 curved planes + scroll sync |
| CurvedPlane | Custom | Single plane with bezier vertex deformation |

## Animation Implementation

| Animation | Library | Implementation Approach | Complexity |
|-----------|---------|------------------------|------------|
| Top bar marquee | CSS | `translateX` keyframes, infinite loop, duplicated content | Low |
| Header scroll transition | CSS + JS | `IntersectionObserver` toggles class for bg/blur change | Low |
| Nav hover underline | CSS | `::after` pseudo-element, `scaleX(0→1)` transition | Low |
| Hero lens mouse follow | Three.js + R3F | Uniform `uLensPosition` lerped toward mapped mouse coords in `useFrame` | High |
| Hero lens vertex deformation | Three.js (vertex shader) | Sine-wave + noise displacement on subdivided plane | High |
| Hero lens refraction | Three.js (fragment shader) | Chromatic aberration sampling of FBO texture through normal map | High |
| Curved carousel bezier deformation | Three.js (vertex shader) | Cubic bezier curve displacement based on world Y position | High |
| Curved carousel scroll sync | Three.js + Lenis | `useLenis` passes velocity to `uScrollSpeed`; planes repositioned by scroll progress | High |
| Carousel active card sync | GSAP + R3F | ScrollTrigger updates active index; R3F `<Html>` component re-renders ProductCard | Medium |
| Circular text 3D rotation | GSAP ScrollTrigger | `scrub: true` timeline, `rotationX: -90→0`, `z: -200→0`, staggered lines | Medium |
| Section fade-in entrances | GSAP ScrollTrigger | `from({opacity:0, y:30})` with trigger at `top 80%` | Low |
| Card hover lift | CSS | `translateY(-4px)` + box-shadow transition | Low |
| Button hover darken | CSS | Background-color transition | Low |
| Popup entrance | GSAP | Fade + scale from center on page load after delay | Low |

## State & Logic

### Lenis ↔ Three.js Bridge
Lenis must be initialized at the app root. Its velocity and scroll position need to reach two separate R3F canvases (Hero and Exclusives) without causing re-renders. Pass scroll data via a shared ref (e.g., `useLenis` writes to a `React.MutableRefObject`, canvases read from it in `useFrame`).

### Hero FBO Pipeline
The hero section renders in two passes: (1) background image scene to a `WebGLRenderTarget`, (2) lens mesh + post-processing pass that samples the FBO. Use `@react-three/drei's` `useFBO` hook. The post-processing shader pass must be implemented as a custom `Pass` class for `three`'s `EffectComposer`.

### Carousel Scroll Math
The curved carousel uses a virtual scroll container. Map `lenis.scroll` progress (clamped to the section's bounding rect) to the Y-position of each plane in the R3F scene. The active product index is derived from which plane is nearest the viewport center, used to update the DOM overlay card.

## Other Key Decisions

- **Two separate `<Canvas>` instances**: Hero and Exclusives sections each have their own R3F canvas, mounted only when in/near viewport. They do not share a renderer.
- **Texture preloading**: Product images for the carousel must be preloaded as Three.js textures before the canvas mounts to avoid pop-in. Use `useTexture` from drei with a suspense boundary.
- **Normal map asset**: The `normal5.jpg` water ripple normal map for the lens should be loaded from an external CDN (e.g., raw Pexels texture URL or self-hosted) — do not bundle a large texture in the build.
