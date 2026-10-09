import { getImageProps } from "next/image";
import type { ImageRef } from "./manifest";

/** The srcSet next/image would emit for a `fill` image, so manual loads hit the same cache entries. */
export function imageSet({ src, sizes }: ImageRef): { srcSet: string; sizes: string } {
  const { props } = getImageProps({ src, alt: "", fill: true, sizes });
  return { srcSet: props.srcSet ?? "", sizes };
}
