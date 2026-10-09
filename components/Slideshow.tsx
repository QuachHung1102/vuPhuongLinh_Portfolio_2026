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
