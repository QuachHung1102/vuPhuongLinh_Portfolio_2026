# Image preload, first-load screen, morph slideshow, page fade

Date: 2026-10-09 · Status: approved in chat, pending written-spec review

## Goal

`public/images` is 444 MB / 94 files (home alone 28 MB, 48 files > 2 MB). Make the
site feel instant on first visit: show the landing route first, keep loading every
other image in the background, cover the wait with a branded loading screen, and
replace the Swiper cross-fade with a WebGL morph. The old cross-fade moves to page
navigation.

## Decisions (from the user)

- Every image is loaded on first visit. Landing route's images get priority.
- Loading screen shows **only on the first load of a browser session** (sessionStorage flag).
- Loading screen text: `vu phuong linh` running around a circle (React Bits Circular Text look).
- Slideshow inside section pages uses React Bits **Morph Slider**: transition `melt`,
  `intensity=0`, `aberration=0`, `radius=0` (square corners).
- The current cross-fade (~1 s) becomes the page-to-page transition.

## Non-goals

- Compressing source images (15 MB originals make the first optimizer hit slow; do it separately).
- Mobile layout, captions/controls/indicators on the slider, service worker, `motion` dependency.

## Design

### 1. Image URL helper — `lib/image-url.ts`

One function that returns the optimized URL (`/_next/image?url=…&w=…&q=75`) for a
source path, built with `getImageProps` from `next/image`. Used by the preloader, the
slider textures and (via matching `sizes`) the `<Image>` components, so a preloaded
request is a browser-cache hit for the real consumer. `images.deviceSizes` in `next.config.ts` is capped at 1920 (drops 2048/3840) so every `<Image>`, preload and WebGL texture resolves to the same ≤1920 URL. The helper takes `{ src, sizes }` and returns `{ srcSet, sizes }`; consumers set both on an `Image()`/`<img>` and the browser picks the candidate.

**Amendment 2026-10-09:** `images.unoptimized` is now `true` (the exact original files are served and preloaded, ~465 MB total), so the `deviceSizes` cap and srcset candidates no longer apply; the helper returns `{ src, srcSet?, sizes }`.

### 2. Preloader — `components/Preloader.tsx` (client) + manifest

- Root layout (server) builds a manifest
  `{ routes: { [route]: { critical: ImageRef[]; all: ImageRef[] } }; order: string[] }`
  (`ImageRef = { src, sizes }`) from `lib/content.ts` (`listImages`), the home columns
  and `about`. The client `planFor(manifest, pathname)` picks the landing route's
  `critical` (the 5 home images on `/`; the about hero on `/about`; the first image of
  each item on a section) and builds `rest` = the landing route's remaining images
  first, then the other routes in navigation order, deduplicated by `src|sizes`.
- Tier 1 (`critical`): `new Image()` with high fetch priority, `decode()`; resolves a
  "ready" promise when all settle (errors count as settled — never block the site).
  Tier 1 waits at most 15 s, then the screen leaves anyway.
- Tier 2 (`rest`): starts after tier 1 settles, `requestIdleCallback` (fallback
  `setTimeout`), concurrency 3, same helper URLs.
  Order: the landing route's remaining images first, then the other routes in navigation order. `public/images/home/about-me.png` is unused and excluded.
- Runs on every full load (cheap on warm HTTP cache); only the **screen** is first-load-only.

### 3. Loading screen — `components/LoadingScreen.tsx` + CSS

- Full-screen overlay, `bg-ink`, in server HTML so there is no content flash.
- Circular text in pure CSS: each letter of `vu phuong linh • ` rotated around a
  circle, whole ring `animation: spin` linear infinite (no `motion` package).
- Visibility: an inline script in `<head>` sets `data-seen` on `<html>` when
  `sessionStorage` has the flag, and CSS hides the overlay immediately (no flash on
  repeat loads). `<html>` already has `suppressHydrationWarning`. Otherwise the
  overlay stays until tier 1 is ready, then fades out, sets the flag and unmounts.
- `prefers-reduced-motion`: ring does not spin, fade is instant.

### 4. Page transition

Wrap the returned root element of each page (`app/page.tsx`, `app/about/page.tsx`, `components/SectionView.tsx`) in React `<ViewTransition>` — layouts persist, so enter/exit never fire there (React 19.3, works in
the App Router without config — `node_modules/next/dist/docs/01-app/02-guides/view-transitions.md`).
CSS: `::view-transition-old(root)` / `::view-transition-new(root)` cross-fade, 1000 ms
(same as the old slideshow `FADE_MS`; tune in one CSS variable). Browsers without
support navigate normally.

### 5. Morph slideshow — `components/MorphSlider.tsx`

- Port of React Bits `MorphSlider` (ogl + gsap), trimmed: no buttons, captions or
  indicators; fixed `melt`, `intensity 0`, `aberration 0`, drift 0.
- Keep `DELAY_MS = 4000` autoplay and `FADE_MS = 1000` transition from the current
  `Slideshow`.
- Add shader uniforms `uFocusCurrent` / `uFocusNext` (vec2, from `focus` like
  `"18.5% 50%"`) applied in `coverUV`, so the first image keeps its Figma crop.
  `inset` (Competition 2) needs nothing extra: `SectionView` already gives the slider a
  smaller container on a white background.
- Textures load from the helper URL (cache hit after preload). Pause rAF when the tab
  is hidden. Dispose textures/renderer on unmount. Honour `prefers-reduced-motion`
  (existing engine behaviour).
- `components/Slideshow.tsx` keeps its props `{ images, alt, focus }`. The first image
  still renders as `<Image preload>` under the canvas (SSR/LCP, no-WebGL fallback,
  hidden once the first texture is ready). `SectionView` is unchanged.
- Add `ogl`; remove `swiper` and its CSS imports. No `gsap`: one tween, done with `requestAnimationFrame`. The canvas renders on demand (during a transition and on resize), not every frame. The React Bits vignette is dropped (photos must not darken); the melt threshold is remapped so progress 0 and 1 are exactly the current and next image.

## Error handling

- Image fails to load: preloader treats it as settled; slider keeps the fallback texture.
- WebGL unavailable / context lost: leave the static first `<Image>` visible.
- `sessionStorage` blocked: treat as "not seen" (screen shows each load), wrap in try/catch.

## Testing

- Unit-style checks (no framework): manifest ordering and tier split for `/` and for a
  section route; helper returns a URL whose width ∈ `deviceSizes`.
- Manual in browser (DevTools network, throttled): home paints after tier 1 only; tier 2
  requests start after; visiting `/performing` afterwards shows no image requests;
  reload within session shows no loading screen; new tab shows it.
- Visual: morph transition between two images, first image focus matches old crop,
  Competition 2 stays inset, route change cross-fades.
- `npm run build` + `npm run lint` pass; no hydration warnings.

## Open risks

- Tier-2 volume: 89 images × optimized size on a slow link. Mitigated by concurrency 3
  and starting only after the landing route is ready.
- Server-side optimization of 15 MB sources is slow on first request per image (dev and
  cold production cache).
