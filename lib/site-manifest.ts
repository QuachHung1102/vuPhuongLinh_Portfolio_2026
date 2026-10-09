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
