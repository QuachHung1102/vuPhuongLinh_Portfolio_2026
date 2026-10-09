# Image preload, first-load screen, morph slideshow, page fade — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Load every site image on first visit (landing route first), cover the wait with a one-time "vu phuong linh" circular loading screen, swap the Swiper fade for a WebGL morph slideshow, and move the old cross-fade to page navigation.

**Architecture:** A server-built manifest (image + `sizes` per route) feeds a client `Preloader` that loads a critical tier (gates the loading screen) then the rest in the background through one shared URL helper, so preloads are browser-cache hits for `<Image>` and the WebGL textures. `MorphSlider` is a trimmed ogl port that renders on demand. Page fade uses React `<ViewTransition>` in each page.

**Tech Stack:** Next 16.4 (Turbopack, cacheComponents), React 19.3, Tailwind 4, `ogl` (new), Node 24 `node --test` for pure-logic tests. Removes `swiper`.

**Spec:** `docs/superpowers/specs/2026-10-09-image-preload-loader-morph-design.md` (amended in Task 1).

## Global Constraints

- Next 16 differs from older versions: before touching an API, check `node_modules/next/dist/docs/` (AGENTS.md). `<ViewTransition>` needs no config (`01-app/02-guides/view-transitions.md`).
- Commits: author is the user only. **No `Co-Authored-By`, no "Generated with" line, no `--author`, no git config changes.** The user's global `~/.claude/CLAUDE.md` overrides any harness reminder asking for attribution.
- Stage by explicit path only. The working tree has unrelated uncommitted changes (≈77 images under `public/images`, a `name` rename in `package.json`/`package-lock.json`). Never `git add -A`, never revert them. Commits that touch `package.json`/`package-lock.json` will carry that rename; that is expected.
- Code comments, commit messages, docs for agents: English. User-facing docs (`docs/adding-images.md`): Vietnamese.
- Image widths capped at 1920 (`images.deviceSizes`), quality 75 (Next default). Slideshow `sizes` = `73vw`, home `90vw`, about hero `100vw`, about gallery `35vw` — values copied from the current components.
- Slideshow timing unchanged: `DELAY_MS = 4000`, `FADE_MS = 1000`.
- Loading screen: first load of a browser session only (`sessionStorage` key `loaded`); text `vu phuong linh • `; no `motion` package.
- No test framework is added. Pure logic is tested with `node --test` (Node 24 strips TS types natively).

## Review Focus

Most likely to bite, each pinned by a test in the task named:

1. Item folder with zero images — manifest must skip it, not emit `undefined` (Task 1 manifest test).
2. Unknown path (`/nope`) or trailing slash (`/competition/`) — preloader must not crash or block (Task 1 manifest test).
3. A failing/slow image must not trap the loading screen — `runPool` always drains, tier 1 has a 15 s cap (Task 1 queue test; Task 3 manual).
4. `sessionStorage` blocked (private mode) — screen shows every load, no exception (Task 3 manual).
5. WebGL unavailable, context lost, or tab hidden/reduced-motion during autoplay — static first image stays; no catch-up flood of transitions (Task 5 manual).

---

### Task 1: Pure logic + test runner + spec amendments

**Files:**
- Create: `lib/focus.ts`, `lib/manifest.ts`, `lib/preload-queue.ts`
- Create: `lib/focus.test.ts`, `lib/manifest.test.ts`, `lib/preload-queue.test.ts`
- Modify: `package.json` (add `test` script), `tsconfig.json` (`allowImportingTsExtensions`)
- Modify: `docs/superpowers/specs/2026-10-09-image-preload-loader-morph-design.md`

**Interfaces:**
- Produces:
  - `parseFocus(focus?: string): [number, number]` — CSS object-position → `[x, y]` in 0..1, top-left origin; unparsable → `[0.5, 0.5]`.
  - `type ImageRef = { src: string; sizes: string }`
  - `type RouteImages = { critical: ImageRef[]; all: ImageRef[] }`
  - `type Manifest = { routes: Record<string, RouteImages>; order: string[] }`
  - `type ManifestInput = { home: ImageRef[]; aboutHero: ImageRef; aboutGallery: ImageRef[]; sections: { slug: string; items: { images: string[] }[] }[]; slideSizes: string }`
  - `buildManifest(input: ManifestInput): Manifest`
  - `planFor(m: Manifest, pathname: string): { critical: ImageRef[]; rest: ImageRef[] }`
  - `runPool<T>(items: T[], limit: number, worker: (item: T) => Promise<void>, isCancelled?: () => boolean): Promise<void>`

- [ ] **Step 1: Enable `.ts` imports and the test script**

In `tsconfig.json` add `"allowImportingTsExtensions": true,` after `"noEmit": true,`. In `package.json` scripts add:

```json
"test": "node --test \"lib/**/*.test.ts\""
```

- [ ] **Step 2: Write the failing tests**

`lib/focus.test.ts`:

```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { parseFocus } from "./focus.ts";

const near = (a: number[], b: number[]) =>
  a.forEach((v, i) => assert.ok(Math.abs(v - b[i]) < 1e-9, `${a} vs ${b}`));

test("parses percent pairs used in lib/content.ts", () => {
  near(parseFocus("18.5% 50%"), [0.185, 0.5]);
  near(parseFocus("50% 31.4%"), [0.5, 0.314]);
  near(parseFocus("0% 0%"), [0, 0]);
  near(parseFocus("100% 50%"), [1, 0.5]);
});

test("undefined and garbage fall back to centre", () => {
  near(parseFocus(undefined), [0.5, 0.5]);
  near(parseFocus("garbage"), [0.5, 0.5]);
  near(parseFocus("center top"), [0.5, 0.5]);
});

test("out-of-range values are clamped", () => {
  near(parseFocus("150% -10%"), [1, 0]);
});
```

`lib/preload-queue.test.ts`:

```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { runPool } from "./preload-queue.ts";

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

test("processes every item once and never exceeds the limit", async () => {
  let active = 0;
  let peak = 0;
  const seen: number[] = [];
  await runPool([1, 2, 3, 4, 5, 6, 7], 3, async (n) => {
    active++;
    peak = Math.max(peak, active);
    await sleep(5);
    seen.push(n);
    active--;
  });
  assert.deepEqual(seen.sort(), [1, 2, 3, 4, 5, 6, 7]);
  assert.equal(peak, 3);
});

test("stops taking new items once cancelled", async () => {
  const seen: number[] = [];
  let cancelled = false;
  await runPool([1, 2, 3, 4, 5, 6], 1, async (n) => {
    seen.push(n);
    if (n === 2) cancelled = true;
  }, () => cancelled);
  assert.deepEqual(seen, [1, 2]);
});

test("empty list resolves", async () => {
  await runPool([], 3, async () => {});
});
```

`lib/manifest.test.ts`:

```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { buildManifest, planFor, type ImageRef } from "./manifest.ts";

const ref = (src: string, sizes = "73vw"): ImageRef => ({ src, sizes });
const srcs = (r: ImageRef[]) => r.map((x) => x.src);

const m = buildManifest({
  home: [ref("h1", "90vw"), ref("h2", "90vw")],
  aboutHero: ref("hero", "100vw"),
  aboutGallery: [ref("g1", "35vw"), ref("g2", "35vw")],
  sections: [
    { slug: "competition", items: [{ images: ["c1a", "c1b"] }, { images: ["c2"] }, { images: [] }] },
    { slug: "performing", items: [{ images: ["p1"] }] },
  ],
  slideSizes: "73vw",
});

test("route order follows site navigation", () => {
  assert.deepEqual(m.order, ["/", "/about", "/competition", "/performing"]);
});

test("section critical = first image of each item; empty item skipped", () => {
  assert.deepEqual(srcs(m.routes["/competition"].critical), ["c1a", "c2"]);
  assert.deepEqual(srcs(m.routes["/competition"].all), ["c1a", "c1b", "c2"]);
});

test("landing on / : critical is home, rest walks the other routes in order", () => {
  const p = planFor(m, "/");
  assert.deepEqual(srcs(p.critical), ["h1", "h2"]);
  assert.deepEqual(srcs(p.rest), ["hero", "g1", "g2", "c1a", "c1b", "c2", "p1"]);
});

test("landing on a section : its own leftovers come first", () => {
  const p = planFor(m, "/competition");
  assert.deepEqual(srcs(p.critical), ["c1a", "c2"]);
  assert.deepEqual(srcs(p.rest), ["c1b", "h1", "h2", "hero", "g1", "g2", "p1"]);
});

test("critical + rest has no duplicates and covers everything", () => {
  const p = planFor(m, "/about");
  const keys = [...p.critical, ...p.rest].map((r) => `${r.src}|${r.sizes}`);
  assert.equal(new Set(keys).size, keys.length);
  assert.equal(keys.length, 9);
});

test("trailing slash is normalised", () => {
  assert.deepEqual(planFor(m, "/competition/"), planFor(m, "/competition"));
});

test("unknown path : nothing critical, everything in rest", () => {
  const p = planFor(m, "/nope");
  assert.deepEqual(p.critical, []);
  assert.equal(p.rest.length, 9);
});
```

- [ ] **Step 3: Run tests, confirm they fail**

Run: `npm test`
Expected: FAIL — `ERR_MODULE_NOT_FOUND` for `./focus.ts`, `./manifest.ts`, `./preload-queue.ts`.

- [ ] **Step 4: Implement**

`lib/focus.ts`:

```ts
/** CSS object-position ("18.5% 50%") -> [x, y] in 0..1, top-left origin. Anything unparsable is centre. */
export function parseFocus(focus?: string): [number, number] {
  const m = focus?.match(/^\s*(-?\d+(?:\.\d+)?)%\s+(-?\d+(?:\.\d+)?)%\s*$/);
  if (!m) return [0.5, 0.5];
  const c = (s: string) => Math.min(100, Math.max(0, Number(s))) / 100;
  return [c(m[1]), c(m[2])];
}
```

`lib/preload-queue.ts`:

```ts
/** Runs `worker` over `items` with at most `limit` in flight. Workers must not reject. */
export async function runPool<T>(
  items: T[],
  limit: number,
  worker: (item: T) => Promise<void>,
  isCancelled: () => boolean = () => false,
): Promise<void> {
  let next = 0;
  const lane = async () => {
    while (next < items.length && !isCancelled()) await worker(items[next++]);
  };
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, lane));
}
```

`lib/manifest.ts`:

```ts
export type ImageRef = { src: string; sizes: string };
export type RouteImages = { critical: ImageRef[]; all: ImageRef[] };
export type Manifest = { routes: Record<string, RouteImages>; order: string[] };

export type ManifestInput = {
  home: ImageRef[];
  aboutHero: ImageRef;
  aboutGallery: ImageRef[];
  sections: { slug: string; items: { images: string[] }[] }[];
  slideSizes: string;
};

/** Routes in site navigation order: home, about, then the sections as given. */
export function buildManifest(input: ManifestInput): Manifest {
  const routes: Manifest["routes"] = {
    "/": { critical: input.home, all: input.home },
    "/about": {
      critical: [input.aboutHero],
      all: [input.aboutHero, ...input.aboutGallery],
    },
  };
  for (const s of input.sections) {
    const perItem = s.items.map((it) =>
      it.images.map((src) => ({ src, sizes: input.slideSizes })),
    );
    routes[`/${s.slug}`] = {
      critical: perItem.flatMap((imgs) => imgs.slice(0, 1)),
      all: perItem.flat(),
    };
  }
  return { routes, order: Object.keys(routes) };
}

const key = (r: ImageRef) => `${r.src}|${r.sizes}`;

/** critical = what the landing route needs to paint; rest = everything else, landing route's leftovers first. */
export function planFor(m: Manifest, pathname: string) {
  const route = pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname;
  const critical = m.routes[route]?.critical ?? [];
  const seen = new Set(critical.map(key));
  const rest: ImageRef[] = [];
  for (const r of [route, ...m.order]) {
    for (const ref of m.routes[r]?.all ?? []) {
      if (!seen.has(key(ref))) {
        seen.add(key(ref));
        rest.push(ref);
      }
    }
  }
  return { critical, rest };
}
```

- [ ] **Step 5: Run tests, confirm they pass**

Run: `npm test`
Expected: PASS — 3 files, all tests green (13 tests).

- [ ] **Step 6: Amend the spec**

In the spec file make these edits so spec and plan agree:

1. §1: replace "Width is capped at 1920 (`images.deviceSizes` entry) so WebGL textures stay GPU-safe." with "`images.deviceSizes` in `next.config.ts` is capped at 1920 (drops 2048/3840) so every `<Image>`, preload and WebGL texture resolves to the same ≤1920 URL. The helper takes `{ src, sizes }` and returns `{ srcSet, sizes }`; consumers set both on an `Image()`/`<img>` and the browser picks the candidate."
2. §2 Tier 1: append "Tier 1 waits at most 15 s, then the screen leaves anyway."
3. §2 Tier 2: append "Order: the landing route's remaining images first, then the other routes in navigation order. `public/images/home/about-me.png` is unused and excluded."
4. §4: replace "Wrap `children` in `app/layout.tsx` with React `<ViewTransition>`" with "Wrap the returned root element of each page (`app/page.tsx`, `app/about/page.tsx`, `components/SectionView.tsx`) in React `<ViewTransition>` — layouts persist, so enter/exit never fire there".
5. §5: replace the dependency line with "Add `ogl`; remove `swiper` and its CSS imports. No `gsap`: one tween, done with `requestAnimationFrame`. The canvas renders on demand (during a transition and on resize), not every frame. The React Bits vignette is dropped (photos must not darken); the melt threshold is remapped so progress 0 and 1 are exactly the current and next image."

- [ ] **Step 7: Commit**

```bash
git add lib/focus.ts lib/manifest.ts lib/preload-queue.ts lib/focus.test.ts lib/manifest.test.ts lib/preload-queue.test.ts package.json tsconfig.json docs/superpowers/specs/2026-10-09-image-preload-loader-morph-design.md
git commit -m "Add pure preload/manifest/focus logic with node:test coverage; amend spec"
```

---

### Task 2: Shared image URL helper, manifest wiring, config

**Files:**
- Create: `lib/image-sizes.ts`, `lib/home-columns.ts`, `lib/image-set.ts`, `lib/site-manifest.ts`
- Modify: `lib/content.ts` (export `listImages`, add `sectionSlugs`)
- Modify: `app/page.tsx`, `app/about/page.tsx`, `components/Slideshow.tsx` (use size constants; Slideshow is rewritten fully in Task 5, here only the constant)
- Modify: `next.config.ts`

**Interfaces:**
- Consumes: `buildManifest`, `ImageRef` from Task 1.
- Produces:
  - `HOME_SIZES = "90vw"`, `ABOUT_HERO_SIZES = "100vw"`, `ABOUT_GALLERY_SIZES = "35vw"`, `SLIDE_SIZES = "73vw"` (`lib/image-sizes.ts`)
  - `homeColumns: { href: string; label: string; src: string; x: number }[]` (`lib/home-columns.ts`)
  - `imageSet(ref: ImageRef): { srcSet: string; sizes: string }` (`lib/image-set.ts`, client-safe)
  - `getManifest(): Manifest` (`lib/site-manifest.ts`, server-only because it reads `public/` via `lib/content.ts`)
  - `listImages(dir: string): string[]` and `sectionSlugs: string[]` exported from `lib/content.ts`

- [ ] **Step 1: Size constants**

`lib/image-sizes.ts`:

```ts
// `sizes` per usage. The preloader, the slider and the <Image> components must all use the
// same value so they resolve to the same /_next/image URL (browser-cache hit).
export const HOME_SIZES = "90vw";
export const ABOUT_HERO_SIZES = "100vw";
export const ABOUT_GALLERY_SIZES = "35vw";
export const SLIDE_SIZES = "73vw";
```

- [ ] **Step 2: Move home columns out of the page**

`lib/home-columns.ts`: cut the `columns` array and its comment from `app/page.tsx` and export it:

```ts
// x = object-position-x của khung 384px nhìn vào mỗi ảnh (theo crop trong Figma).
export const homeColumns = [
  { href: "/about", label: "about me", src: "/images/about/hero.jpg", x: 50 },
  { href: "/competition", label: "competitions", src: "/images/home/competition.jpg", x: 59.9 },
  { href: "/performing", label: "performing", src: "/images/home/performing.jpg", x: 27.8 },
  { href: "/culture-writing", label: "culture and writing", src: "/images/home/culture-writing.jpg", x: 53.8 },
  { href: "/community-services", label: "community services", src: "/images/home/community.jpg", x: 47.4 },
];
```

In `app/page.tsx`: delete the local `columns` const and comment, add `import { homeColumns } from "@/lib/home-columns";` and `import { HOME_SIZES } from "@/lib/image-sizes";`, change `columns.map(` to `homeColumns.map(`, and change `sizes="90vw" // ảnh vẽ rộng ~1650px rồi crop vào cột 384px` to `sizes={HOME_SIZES} // ảnh vẽ rộng ~1650px rồi crop vào cột 384px`.

- [ ] **Step 3: About page uses the constants**

In `app/about/page.tsx` add `import { ABOUT_GALLERY_SIZES, ABOUT_HERO_SIZES } from "@/lib/image-sizes";` and replace `sizes="100vw"` with `sizes={ABOUT_HERO_SIZES}` and `sizes="35vw"` with `sizes={ABOUT_GALLERY_SIZES}`.

- [ ] **Step 4: Export what the manifest needs from `lib/content.ts`**

Change `function listImages(` to `export function listImages(` and add after the `sections` array (before `IMAGE_FILE`):

```ts
/** Slugs in site navigation order (competition → community-services). */
export const sectionSlugs = sections.map((s) => s.slug);
```

- [ ] **Step 5: URL helper**

`lib/image-set.ts`:

```ts
import { getImageProps } from "next/image";
import type { ImageRef } from "./manifest";

/** The srcSet next/image would emit for a `fill` image, so manual loads hit the same cache entries. */
export function imageSet({ src, sizes }: ImageRef): { srcSet: string; sizes: string } {
  const { props } = getImageProps({ src, alt: "", fill: true, sizes });
  return { srcSet: props.srcSet ?? "", sizes };
}
```

- [ ] **Step 6: Site manifest**

`lib/site-manifest.ts`:

```ts
import { getSection, listImages, sectionSlugs } from "./content";
import { homeColumns } from "./home-columns";
import { ABOUT_GALLERY_SIZES, ABOUT_HERO_SIZES, HOME_SIZES, SLIDE_SIZES } from "./image-sizes";
import { buildManifest } from "./manifest";

/** Reads public/images at render time, like lib/content.ts. Server only. */
export function getManifest() {
  const about = listImages("about");
  const hero = about.find((s) => s.endsWith("/hero.jpg"));
  if (!hero) throw new Error("public/images/about/hero.jpg is missing");
  return buildManifest({
    home: homeColumns.map(({ src }) => ({ src, sizes: HOME_SIZES })),
    aboutHero: { src: hero, sizes: ABOUT_HERO_SIZES },
    aboutGallery: about
      .filter((s) => s !== hero)
      .map((src) => ({ src, sizes: ABOUT_GALLERY_SIZES })),
    sections: sectionSlugs.map(getSection),
    slideSizes: SLIDE_SIZES,
  });
}
```

- [ ] **Step 7: Cap device widths**

`next.config.ts`: add inside `nextConfig`:

```ts
  images: {
    // 1920 max: keeps WebGL textures GPU-safe and makes every consumer resolve to one URL.
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
  },
```

- [ ] **Step 8: Typecheck, lint, test**

Run: `npx tsc --noEmit && npm run lint && npm test`
Expected: no output from tsc, lint clean, tests PASS. (`Slideshow.tsx` still uses its own `"73vw"`; Task 5 replaces it.)

- [ ] **Step 9: Smoke the helper in the browser**

Run `npm run dev`, open `/`, DevTools → Network → Img. Confirm requests look like `/_next/image?url=%2Fimages%2Fhome%2Fcompetition.jpg&w=1920&q=75` and no request has `w=2048` or `w=3840`.

- [ ] **Step 10: Commit**

```bash
git add lib/image-sizes.ts lib/home-columns.ts lib/image-set.ts lib/site-manifest.ts lib/content.ts app/page.tsx app/about/page.tsx next.config.ts
git commit -m "Add shared image-set helper and site manifest; cap image widths at 1920"
```

---

### Task 3: Preloader + first-load screen

**Files:**
- Create: `lib/first-load.ts`, `components/LoadingScreen.tsx`, `components/Preloader.tsx`
- Modify: `app/layout.tsx`, `app/globals.css`

**Interfaces:**
- Consumes: `planFor`, `Manifest`, `ImageRef` (Task 1); `runPool` (Task 1); `imageSet` (Task 2); `getManifest` (Task 2).
- Produces: `<Preloader manifest={Manifest} />` mounted once in the root layout; `SEEN_KEY`, `SEEN_SCRIPT` from `lib/first-load.ts`.

- [ ] **Step 1: Seen flag + head script**

`lib/first-load.ts`:

```ts
export const SEEN_KEY = "loaded";

/** Inline in <head>, runs before first paint: hides the loading screen once this session has loaded. */
export const SEEN_SCRIPT = `try{sessionStorage.getItem("${SEEN_KEY}")&&document.documentElement.setAttribute("data-seen","")}catch(e){}`;
```

- [ ] **Step 2: Loading screen component**

`components/LoadingScreen.tsx`:

```tsx
import type { CSSProperties } from "react";

const TEXT = "vu phuong linh • ";

export function LoadingScreen({ leaving }: { leaving: boolean }) {
  const letters = Array.from(TEXT);
  return (
    <div
      id="loading-screen"
      role="status"
      aria-label="Loading"
      data-leaving={leaving || undefined}
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink text-white"
    >
      <div className="loader-ring" aria-hidden style={{ "--n": letters.length } as CSSProperties}>
        {letters.map((ch, i) => (
          <span key={i} style={{ "--i": i } as CSSProperties}>
            {ch}
          </span>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Loading screen CSS**

Append to `app/globals.css`:

```css
/* First-load screen: "vu phuong linh" spinning around a circle. */
#loading-screen {
  transition: opacity 600ms ease;
}
#loading-screen[data-leaving] {
  opacity: 0;
  pointer-events: none;
}
html[data-seen] #loading-screen {
  display: none;
}
.loader-ring {
  --r: clamp(70px, 13vmin, 150px);
  position: relative;
  width: calc(var(--r) * 2);
  height: calc(var(--r) * 2);
  font-size: calc(var(--r) * 0.3);
  animation: loader-spin 12s linear infinite;
}
.loader-ring span {
  position: absolute;
  top: 50%;
  left: 50%;
  white-space: pre;
  transform: translate(-50%, -50%) rotate(calc(360deg / var(--n) * var(--i)))
    translateY(calc(var(--r) * -1));
}
@keyframes loader-spin {
  to {
    transform: rotate(360deg);
  }
}
@media (prefers-reduced-motion: reduce) {
  .loader-ring {
    animation: none;
  }
  #loading-screen {
    transition: none;
  }
}
```

- [ ] **Step 4: Preloader**

`components/Preloader.tsx`:

```tsx
"use client";

import { useEffect, useState } from "react";
import { SEEN_KEY } from "@/lib/first-load";
import { imageSet } from "@/lib/image-set";
import { planFor, type ImageRef, type Manifest } from "@/lib/manifest";
import { runPool } from "@/lib/preload-queue";
import { LoadingScreen } from "./LoadingScreen";

const CONCURRENCY = 3;
const MAX_WAIT_MS = 15_000; // never trap the visitor behind the loading screen
const LEAVE_MS = 600; // keep in sync with the opacity transition in globals.css

/** Resolves when the image loaded or failed; never rejects. */
function load(ref: ImageRef, priority: "high" | "low"): Promise<void> {
  return new Promise((resolve) => {
    const { srcSet, sizes } = imageSet(ref);
    const img = new Image();
    img.fetchPriority = priority;
    img.onload = img.onerror = () => resolve();
    img.sizes = sizes; // before srcset so the right candidate is picked
    img.srcset = srcSet;
  });
}

const idle = () =>
  new Promise<void>((resolve) => {
    if ("requestIdleCallback" in window) window.requestIdleCallback(() => resolve());
    else setTimeout(resolve, 200);
  });

export function Preloader({ manifest }: { manifest: Manifest }) {
  const [phase, setPhase] = useState<"loading" | "leaving" | "gone">("loading");

  useEffect(() => {
    let cancelled = false;
    const { critical, rest } = planFor(manifest, window.location.pathname);

    (async () => {
      await Promise.race([
        Promise.all(critical.map((r) => load(r, "high"))),
        new Promise((r) => setTimeout(r, MAX_WAIT_MS)),
      ]);
      if (cancelled) return;
      try {
        sessionStorage.setItem(SEEN_KEY, "1");
      } catch {}
      setPhase("leaving");
      setTimeout(() => {
        if (!cancelled) setPhase("gone");
      }, LEAVE_MS);

      await idle();
      await runPool(rest, CONCURRENCY, (r) => load(r, "low"), () => cancelled);
    })();

    return () => {
      cancelled = true;
    };
  }, [manifest]);

  return phase === "gone" ? null : <LoadingScreen leaving={phase === "leaving"} />;
}
```

- [ ] **Step 5: Mount in the layout**

Rewrite the imports and `RootLayout` in `app/layout.tsx` (the `suppressHydrationWarning` attributes and their comment, already in the working tree, stay):

```tsx
import type { Metadata } from "next";
import localFont from "next/font/local";
import { Preloader } from "@/components/Preloader";
import { SEEN_SCRIPT } from "@/lib/first-load";
import { getManifest } from "@/lib/site-manifest";
import "./globals.css";
```

```tsx
export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // Extensions (Immersive Translate, ColorZilla) inject attrs on <html>/<body> before hydration.
    <html lang="en" className={goudy.variable} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: SEEN_SCRIPT }} />
      </head>
      <body suppressHydrationWarning>
        {children}
        <Preloader manifest={getManifest()} />
      </body>
    </html>
  );
}
```

- [ ] **Step 6: Typecheck and lint**

Run: `npx tsc --noEmit && npm run lint`
Expected: clean. If `react-hooks` flags `setPhase` in the effect, it is inside the async continuation (after `await`), not synchronous; keep it there.

- [ ] **Step 7: Manual check (dev server)**

Run `npm run dev`. In a fresh private window: open `/`.
Expected: dark screen with "vu phuong linh •" spinning on a ring, then fades out about when the 5 home images appear; Network shows the remaining images loading afterwards (Img filter, `low` priority). Then, in the same tab, reload: no loading screen at all, no flash. Open a new private window: screen shows again.

Also check: (a) open `/performing` directly in a new private window — screen waits for the 4 first images of that page only; (b) DevTools → Application → block storage (or Chrome "Block third-party cookies" + site data blocked) → no console error, screen shows each load; (c) DevTools → Network → throttle "Slow 3G" → screen leaves by ~15 s at the latest; (d) no hydration warning in the console.

- [ ] **Step 8: Commit**

```bash
git add lib/first-load.ts components/LoadingScreen.tsx components/Preloader.tsx app/layout.tsx app/globals.css
git commit -m "Add image preloader and first-load circular text screen"
```

---

### Task 4: Page transition

**Files:**
- Modify: `app/page.tsx`, `app/about/page.tsx`, `components/SectionView.tsx`, `app/globals.css`

**Interfaces:**
- Consumes: nothing from earlier tasks.
- Produces: every route's root element wrapped in `<ViewTransition>`; CSS variable `--page-fade`.

- [ ] **Step 1: Wrap each page**

In each of the three files add `import { ViewTransition } from "react";` and wrap the single root element returned:

- `app/page.tsx`: `return ( <main …> … </main> )` → `return ( <ViewTransition> <main …> … </main> </ViewTransition> )`. Re-indent the inner JSX.
- `app/about/page.tsx`: same, around its root `<main className="relative h-3777 …">`.
- `components/SectionView.tsx`: same, around its root `<main className="relative h-dvh overflow-hidden bg-ink">`. (`SectionView` is already a client component. Plain `setState` on item change does not trigger a view transition, so the sidebar collapse is unaffected.)

Wrapper goes in the page, not the layout: layouts persist across navigation, so enter/exit never fire there (`view-transitions.md`, Step 3).

- [ ] **Step 2: Fade CSS**

Append to `app/globals.css`:

```css
/* Page-to-page cross-fade (React <ViewTransition> in each page). */
:root {
  --page-fade: 1000ms;
}
::view-transition-group(*) {
  animation-duration: var(--page-fade);
}
/* Let clicks through while a transition runs. */
::view-transition {
  pointer-events: none;
}
@media (prefers-reduced-motion: reduce) {
  ::view-transition-old(*),
  ::view-transition-new(*),
  ::view-transition-group(*) {
    animation-duration: 0s !important;
    animation-delay: 0s !important;
  }
}
```

- [ ] **Step 3: Typecheck and lint**

Run: `npx tsc --noEmit && npm run lint`
Expected: clean (`ViewTransition` is typed in `@types/react` 19.3).

- [ ] **Step 4: Manual check**

`npm run dev`, Chrome. From `/`, click "competitions": old page fades out while the new one fades in over about 1 s; no jump. Click the arrows to `/performing` and back: same fade. Browser Back button: also fades (default animation). Switching a list item inside a section: no page fade. If the fade does not play, confirm the browser is Chromium 125+ and re-check that the wrapper is in the page file, not the layout.

- [ ] **Step 5: Commit**

```bash
git add app/page.tsx app/about/page.tsx components/SectionView.tsx app/globals.css
git commit -m "Cross-fade between pages with ViewTransition"
```

---

### Task 5: Morph slideshow

**Files:**
- Create: `components/MorphSlider.tsx`
- Modify: `components/Slideshow.tsx` (full rewrite), `package.json`, `package-lock.json`

**Interfaces:**
- Consumes: `imageSet` (Task 2), `parseFocus` (Task 1), `SLIDE_SIZES` (Task 2).
- Produces: `<MorphSlider images: string[] sizes: string focus?: string delayMs?: number durationMs?: number />` (fills its positioned parent). `Slideshow` keeps props `{ images: string[]; alt: string; focus?: string }`, so `SectionView` does not change.

- [ ] **Step 1: Dependencies**

Run: `npm uninstall swiper && npm install ogl`
Then confirm nothing else imports swiper: `grep -rn "swiper" app components lib` → expect no output after Step 3.

- [ ] **Step 2: MorphSlider**

`components/MorphSlider.tsx`:

```tsx
"use client";

import { useEffect, useRef } from "react";
import { Mesh, Program, Renderer, Texture, Triangle } from "ogl";
import { parseFocus } from "@/lib/focus";
import { imageSet } from "@/lib/image-set";

// Trimmed port of React Bits "Morph Slider" (melt, intensity 0, aberration 0, scale 1).
// Differences: renders on demand (no continuous loop), no vignette, per-image focus,
// progress remapped so 0 and 1 are exactly the current and next image.

const VERTEX = `
attribute vec2 position;
attribute vec2 uv;
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

const FRAGMENT = `
precision highp float;
uniform sampler2D tCurrent;
uniform sampler2D tNext;
uniform vec2 uResolution;
uniform vec2 uCurrentSize;
uniform vec2 uNextSize;
uniform vec2 uCurrentFocus;
uniform vec2 uNextFocus;
uniform float uProgress;
uniform float uScale;
uniform float uSeed;
varying vec2 vUv;

float hash21(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}
float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash21(i), hash21(i + vec2(1.0, 0.0)), u.x),
             mix(hash21(i + vec2(0.0, 1.0)), hash21(i + vec2(1.0, 1.0)), u.x), u.y);
}
float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  for (int i = 0; i < 5; i++) {
    v += a * noise(p);
    p *= 2.0;
    a *= 0.5;
  }
  return v;
}

// object-fit: cover with object-position = focus (v axis points up).
vec2 coverUV(vec2 uv, vec2 res, vec2 img, vec2 focus) {
  float ratio = (res.x / res.y) / (img.x / img.y);
  vec2 s = ratio > 1.0 ? vec2(1.0, 1.0 / ratio) : vec2(ratio, 1.0);
  return uv * s + (1.0 - s) * focus;
}

void main() {
  float nn = fbm(vUv * uScale + uSeed);
  float t = uProgress * 1.3 - 0.15;
  float m = smoothstep(nn - 0.15, nn + 0.15, t);
  vec3 a = texture2D(tCurrent, coverUV(vUv, uResolution, uCurrentSize, uCurrentFocus)).rgb;
  vec3 b = texture2D(tNext, coverUV(vUv, uResolution, uNextSize, uNextFocus)).rgb;
  gl_FragColor = vec4(mix(a, b, m), 1.0);
}
`;

const easeInOutCubic = (k: number) => (k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2);

type Props = {
  images: string[];
  sizes: string;
  /** object-position of the first image only, e.g. "18.5% 50%". */
  focus?: string;
  delayMs?: number;
  durationMs?: number;
};

export function MorphSlider({ images, sizes, focus, delayMs = 4000, durationMs = 1000 }: Props) {
  const host = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = host.current;
    if (!el) return;

    let renderer: Renderer;
    try {
      renderer = new Renderer({ alpha: false, antialias: false, dpr: Math.min(window.devicePixelRatio || 1, 2) });
    } catch {
      return; // no WebGL: the static first image under us stays
    }
    const gl = renderer.gl;
    if (!gl) return;
    const canvas = gl.canvas as HTMLCanvasElement;
    canvas.style.cssText = "position:absolute;inset:0;width:100%;height:100%;opacity:0;transition:opacity 300ms";
    el.appendChild(canvas);

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const blank = new Texture(gl, {
      image: new Uint8Array([39, 39, 39, 255]),
      width: 1,
      height: 1,
      generateMipmaps: false,
    });
    const program = new Program(gl, {
      vertex: VERTEX,
      fragment: FRAGMENT,
      uniforms: {
        tCurrent: { value: blank },
        tNext: { value: blank },
        uResolution: { value: [1, 1] },
        uCurrentSize: { value: [1, 1] },
        uNextSize: { value: [1, 1] },
        uCurrentFocus: { value: [0.5, 0.5] },
        uNextFocus: { value: [0.5, 0.5] },
        uProgress: { value: 0 },
        uScale: { value: 1 },
        uSeed: { value: 0 },
      },
    });
    const mesh = new Mesh(gl, { geometry: new Triangle(gl), program });
    const u = program.uniforms;
    const render = () => renderer.render({ scene: mesh });

    const fit = () => {
      const { width, height } = el.getBoundingClientRect();
      renderer.setSize(Math.max(width, 1), Math.max(height, 1));
      u.uResolution.value = [gl.canvas.width, gl.canvas.height];
      render();
    };
    const ro = new ResizeObserver(fit);
    ro.observe(el);

    // Focus is CSS top-left based; the shader's v axis points up.
    const foci = images.map((_, i) => {
      const [x, y] = parseFocus(i === 0 ? focus : undefined);
      return [x, 1 - y];
    });
    const textures: (Texture | undefined)[] = [];
    const dims: [number, number][] = [];
    let current = 0;
    let disposed = false;
    let timer = 0;
    let raf = 0;

    const showCurrent = () => {
      u.tCurrent.value = textures[current];
      u.uCurrentSize.value = dims[current];
      u.uCurrentFocus.value = foci[current];
      u.uProgress.value = 0;
      render();
      canvas.style.opacity = "1";
    };

    images.forEach((src, i) => {
      const img = new Image();
      const set = imageSet({ src, sizes });
      img.onload = () => {
        if (disposed) return;
        textures[i] = new Texture(gl, { image: img, generateMipmaps: false });
        dims[i] = [img.naturalWidth, img.naturalHeight];
        if (i === current) showCurrent();
      };
      img.sizes = set.sizes;
      img.srcset = set.srcSet;
    });

    const schedule = () => {
      timer = window.setTimeout(advance, delayMs);
    };
    const advance = () => {
      const next = (current + 1) % images.length;
      // Hidden tab or texture not ready yet: skip this beat instead of queueing transitions.
      if (document.hidden || !textures[current] || !textures[next]) return schedule();
      u.tNext.value = textures[next];
      u.uNextSize.value = dims[next];
      u.uNextFocus.value = foci[next];
      u.uSeed.value = Math.random() * 100;
      const ms = reduce ? 0 : durationMs;
      const start = performance.now();
      const tick = (now: number) => {
        const k = ms ? Math.min((now - start) / ms, 1) : 1;
        u.uProgress.value = easeInOutCubic(k);
        render();
        if (k < 1) {
          raf = requestAnimationFrame(tick);
          return;
        }
        current = next;
        showCurrent();
        schedule();
      };
      raf = requestAnimationFrame(tick);
    };
    if (images.length > 1) schedule();

    return () => {
      disposed = true;
      clearTimeout(timer);
      cancelAnimationFrame(raf);
      ro.disconnect();
      canvas.remove();
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    };
  }, [images, sizes, focus, delayMs, durationMs]);

  return <div ref={host} className="absolute inset-0" />;
}
```

- [ ] **Step 3: Rewrite Slideshow**

Replace the whole of `components/Slideshow.tsx`:

```tsx
import Image from "next/image";
import { SLIDE_SIZES } from "@/lib/image-sizes";
import { MorphSlider } from "./MorphSlider";

const DELAY_MS = 4000; // mỗi ảnh hiện 4s, theo yêu cầu của bạn
const FADE_MS = 1000; // chưa có yêu cầu nên mình tự chọn

type Props = { images: string[]; alt: string; focus?: string };

// Ảnh đầu luôn là <Image> thật (có trong HTML, là LCP, và là fallback khi không có WebGL);
// canvas morph phủ lên trên khi có từ 2 ảnh trở lên.
export function Slideshow({ images, alt, focus }: Props) {
  return (
    <div className="relative size-full">
      <Image
        src={images[0]}
        alt={alt}
        fill
        sizes={SLIDE_SIZES}
        preload
        className="object-cover"
        style={focus ? { objectPosition: focus } : undefined}
      />
      {images.length > 1 && (
        <MorphSlider images={images} sizes={SLIDE_SIZES} focus={focus} delayMs={DELAY_MS} durationMs={FADE_MS} />
      )}
    </div>
  );
}
```

- [ ] **Step 4: Typecheck, lint, tests**

Run: `npx tsc --noEmit && npm run lint && npm test && grep -rn "swiper" app components lib`
Expected: tsc/lint clean, tests PASS, grep prints nothing.

- [ ] **Step 5: Manual check (dev server)**

`npm run dev`, open `/competition`:
- The first image shows immediately; after ~4 s it melts into the second with a noisy dissolve over ~1 s, no distortion, no colour fringing, no dark corners; loops forever.
- First image of "Gold Award – WICO" keeps the crop it had before (focus `18.5% 50%`): compare against `git stash`-free reference by eye with the previous screenshot or with the Figma frame; subject placement must not shift when the canvas takes over.
- "iCAN" (one image, `inset` on white): no canvas, static image inset as before. "Nha Em Bakery" (one image): static.
- Switch list items: new slideshow starts at image 1, old canvas gone (DevTools Elements: exactly one `<canvas>` in the page).
- Hide the tab for 20 s, come back: at most one transition fires, no burst.
- Console: no WebGL or React errors. With the OS "reduce motion" setting on: images swap with no dissolve.
- Simulate WebGL failure: in DevTools console run `document.querySelector("canvas").getContext("webgl2").getExtension("WEBGL_lose_context").loseContext()` — static first image stays visible (canvas freezes on its last frame; acceptable, no crash).

- [ ] **Step 6: Commit**

```bash
git add components/MorphSlider.tsx components/Slideshow.tsx package.json package-lock.json
git commit -m "Replace Swiper fade with WebGL morph slideshow"
```

---

### Task 6: Docs and production verification

**Files:**
- Modify: `docs/adding-images.md`

**Interfaces:** none.

- [ ] **Step 1: Update the how-to**

In `docs/adding-images.md` replace the bullet that starts "Có nhiều ảnh thì tự chuyển mờ lần lượt (autofade), mỗi ảnh 4 giây." with:

```
- Có nhiều ảnh thì tự chuyển bằng hiệu ứng morph (WebGL) lần lượt, mỗi ảnh 4 giây. Chỉ có 1 ảnh thì đứng yên. Thư mục trống thì khung ảnh để trống.
- Tất cả ảnh được tải sẵn khi vào web (ảnh của trang đang xem trước, màn hình loading chỉ hiện ở lần tải đầu của phiên). Không cần khai báo thêm; ảnh nào bỏ vào thư mục cũng được tải.
```

(and delete the old "Chỉ có 1 ảnh… Thư mục trống…" tail of the replaced bullet so it is not duplicated).

- [ ] **Step 2: Build, lint, test**

Run: `npm run build && npm run lint && npm test`
Expected: build succeeds with no hydration or "blocking route" errors (routes `/`, `/about`, 4 sections prerender), lint clean, tests PASS.

- [ ] **Step 3: Verify cache behaviour in production mode**

Dev mode serves `/_next/image` with `max-age=0`, so cache hits can only be judged on a production build. Run `npm run start`, open `/` in a fresh private window with DevTools → Network → "Disable cache" OFF:
- Home images load first; the loading screen leaves once the 5 are in.
- Afterwards other images stream in (Img filter, waterfall priority Lowest).
- Click through to `/performing`: its images show with no new `/_next/image` requests (or `(memory cache)` / `(disk cache)` in the Size column).
- Open `/competition` and watch the slideshow: textures appear without new network requests.
- Reload in the same tab: no loading screen; Network shows revalidation-free cache hits for already-seen images.

Record what you saw (pass/fail per bullet) in the task report. If the slideshow or page `<Image>` re-requests a URL the preloader already fetched, compare the two URLs (`w=` differs?) — the cause is a `sizes` mismatch between `lib/image-sizes.ts` and the consumer.

- [ ] **Step 4: Commit**

```bash
git add docs/adding-images.md
git commit -m "Document morph slideshow and preloading in adding-images"
```
