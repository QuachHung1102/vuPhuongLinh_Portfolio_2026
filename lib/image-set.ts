import { getImageProps } from "next/image";
import type { ImageRef } from "./manifest";

/** What next/image would emit for a `fill` image, so manual loads hit the same cache entries. */
export function imageSet({ src, sizes }: ImageRef): { src: string; srcSet?: string; sizes: string } {
  // loading "eager": in dev getImageProps registers this URL for the LCP check, and a default (lazy) entry would trigger the "add loading=eager" warning for real above-the-fold <Image>s.
  const { props } = getImageProps({ src, alt: "", fill: true, sizes, loading: "eager" });
  return { src: props.src, srcSet: props.srcSet, sizes };
}

/** Point an Image() at the right source: srcset+sizes when there are candidates, else plain src. */
export function setImageSource(img: HTMLImageElement, set: ReturnType<typeof imageSet>) {
  if (set.srcSet) {
    img.sizes = set.sizes; // before srcset so the right candidate is picked
    img.srcset = set.srcSet;
  }
  img.src = set.src;
}
