# Phuong Linh Vu — portfolio

Personal portfolio site, built with Next.js 16, Tailwind CSS 4 and Swiper. The layout follows a Figma design.

```bash
npm install
npm run dev      # http://localhost:3000
npm run build && npm start
```

## What's in it

- `/` — five photo columns, each leading to a section
- `/about` — about page
- `/competition`, `/performing`, `/culture-writing`, `/community-services` — a list of items on the left, photos cross-fading on the right

Section copy lives in `lib/content.ts`. Photos are read from folders under `public/images/`, so adding one needs no code change — see [docs/adding-images.md](docs/adding-images.md).

## Good to know

The design is desktop-only (1920px) and scales with the viewport: `1 design px = 100vw / 1920`. There is no phone layout; landscape tablets are the smallest target.

More detail: [DESIGN.md](DESIGN.md) (Figma link and rules), [docs/figma-spec.md](docs/figma-spec.md) (measurements from Figma), [ASSETS.md](ASSETS.md) (fonts, tokens, image sources, open items).
