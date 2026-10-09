import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ViewTransition } from "react";
import { u } from "@/lib/design";
import { ABOUT_GALLERY_SIZES, ABOUT_HERO_SIZES } from "@/lib/image-sizes";

// Lưới ảnh dưới hero: tên file + vị trí/kích thước theo design px.
const grid = [
  { src: "gallery-03.jpg", x: 642.51, y: 1080.16, w: 631.82, h: 425.41 },
  { src: "gallery-01.jpg", x: 0, y: 1505.74, w: 642.51, h: 425.41 },
  { src: "gallery-02.jpg", x: 1274.34, y: 1505.58, w: 645.66, h: 425.58 },
  { src: "gallery-05.jpg", x: 642.51, y: 1931.15, w: 631.82, h: 420.96 },
  { src: "gallery-04.jpg", x: 0, y: 2352.11, w: 642.5, h: 420.96 },
  { src: "gallery-06.jpg", x: 1274.34, y: 2352.11, w: 645.66, h: 420.96 },
];

export const metadata: Metadata = { title: "About" };


const CHIP =
  "absolute top-[calc(var(--u)*245.62)] cursor-pointer border-2 border-white p-10 text-30 leading-35 whitespace-nowrap transition-colors hover:bg-white hover:text-chip-hover";

export default function About() {
  return (
    <ViewTransition>
      <main className="relative h-3777 bg-ink text-white">
        <div className="absolute top-0 left-0 h-1080 w-full">
          <Image
            src="/images/about/hero.jpg"
            alt="Phuong Linh"
            fill
            sizes={ABOUT_HERO_SIZES}
            preload
            loading="eager"
            className="object-cover"
          />
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                "linear-gradient(90deg, rgba(0,0,0,0.5) 0%, rgba(102,102,102,0) 29.669%), linear-gradient(90deg, rgba(102,102,102,0) 44.441%, rgba(0,0,0,0.6) 98.932%)",
            }}
          />
        </div>

        <Link href="/" className="absolute top-62 left-51 flex items-center gap-15 text-30 leading-35">
          <Image src="/icons/arrow-back.svg" alt="" width={35} height={15} className="h-auto w-35" />
          Back
        </Link>

        <p className="absolute top-114 left-51 w-560 text-35 leading-35">
          Name: Phuong Linh
          <br />
          Height: 5’6’’
          <br />
          Signature look: Dumpling cheeks
        </p>
        <button type="button" className={`${CHIP} left-51`}>
          Resumé (CV)
        </button>
        <Link href="/competition" className={`${CHIP} left-263`}>
          What’s more?!
        </Link>

        <p className="absolute top-114 w-560 text-25 leading-25" style={{ left: u(1309.43) }}>
          If you ask my childhood friends to describe me, they’ll probably mention two things: I was
          always the tallest kid in the room and I have signature &apos;dumpling&apos; cheeks. But
          beyond that, my journey started super early on my primary school stage. I was a little ball
          of energy. Dancing, singing, and exploring everything around me.
        </p>

        {grid.map((g) => (
          <div
            key={g.src}
            className="absolute"
            style={{ left: u(g.x), top: u(g.y), width: u(g.w), height: u(g.h) }}
          >
            <Image src={`/images/about/${g.src}`} alt="" fill sizes={ABOUT_GALLERY_SIZES} className="object-cover" />
          </div>
        ))}

        <iframe
          className="absolute"
          style={{ left: u(267.63), top: u(2882.83), width: u(1384.75), height: u(768.25) }}
          src="https://www.youtube-nocookie.com/embed/uIDOAhuE0yA"
          title="Phuong Linh Vu video"
          loading="lazy"
          allow="encrypted-media; picture-in-picture; fullscreen"
        />
      </main>
    </ViewTransition>
  );
}
