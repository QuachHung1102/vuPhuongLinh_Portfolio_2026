"use client";

import Image from "next/image";
import { Suspense } from "react";
import { Autoplay, EffectFade } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import "swiper/css/effect-fade";

const DELAY_MS = 4000; // mỗi ảnh hiện 4s, theo yêu cầu của bạn
const FADE_MS = 1000; // chưa có yêu cầu nên mình tự chọn

type Props = { images: string[]; alt: string; focus?: string };

function Photo({
  src,
  alt,
  focus,
  preload,
}: {
  src: string;
  alt: string;
  focus?: string;
  preload?: boolean;
}) {
  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes="73vw"
      preload={preload}
      className="object-cover"
      style={focus ? { objectPosition: focus } : undefined}
    />
  );
}

function Fader({ images, alt, focus }: Props) {
  return (
    <Swiper
      modules={[EffectFade, Autoplay]}
      effect="fade"
      fadeEffect={{ crossFade: true }}
      speed={FADE_MS}
      rewind
      allowTouchMove={false}
      autoplay={images.length > 1 ? { delay: DELAY_MS, disableOnInteraction: false } : false}
      className="size-full"
    >
      {images.map((src, n) => (
        <SwiperSlide key={src}>
          <Photo src={src} alt={alt} focus={n === 0 ? focus : undefined} preload={n === 0} />
        </SwiperSlide>
      ))}
    </Swiper>
  );
}

// Swiper đọc đồng hồ lúc khởi tạo nên Cache Components chặn khi prerender.
// Fallback của Suspense là ảnh đầu tiên, nên ảnh vẫn có sẵn trong HTML.
export function Slideshow(props: Props) {
  return (
    <Suspense
      fallback={
        <div className="relative size-full">
          <Photo src={props.images[0]} alt={props.alt} focus={props.focus} preload />
        </div>
      }
    >
      <Fader {...props} />
    </Suspense>
  );
}
