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
