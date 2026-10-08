# Phuong Linh Vu — portfolio

Next.js 16 (App Router, Cache Components), Tailwind CSS 4, Swiper for the photo fades. Built from a Figma design that is the source of truth and is read-only.

```bash
npm install
npm run dev     # http://localhost:3000
npm run build && npm start
npm run lint
```

## Pages

| Route | Content |
| ----- | ------- |
| `/` | five photo columns, each links to a section |
| `/about` | about page |
| `/competition` `/performing` `/culture-writing` `/community-services` | list of items on the left, photos cross-fading on the right |

Copy for the four section pages is in `lib/content.ts`. Photos are read from folders, so adding one needs no code change: see [docs/adding-images.md](docs/adding-images.md).

## Design docs

- [DESIGN.md](DESIGN.md): Figma link, rules, key nodes.
- [docs/figma-spec.md](docs/figma-spec.md): every measurement taken from Figma, so the Figma API (which has a call limit) does not have to be used again.
- [ASSETS.md](ASSETS.md): fonts, tokens, where each image came from, decisions to verify, what is still missing.
- [docs/adding-images.md](docs/adding-images.md): how to add photos (Vietnamese).

The layout is a desktop design (1920px wide) that scales with the viewport width: `1 design px = 100vw / 1920` (see `app/globals.css`). There is no phone layout; tablets in landscape are the smallest target.
