import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ViewTransition } from "react";
import Nav from "@/components/Nav";
import { u } from "@/lib/design";
import { ABOUT_GALLERY_SIZES, ABOUT_HERO_SIZES } from "@/lib/image-sizes";

const grid = [
  // Hàng 1 (y = 1104, h = 425.41)
  { src: "gallery-03.jpg", x: 51,   y: 1104, w: 590, h: 425.41 },
  { src: "gallery-01.jpg", x: 665,  y: 1104, w: 590, h: 425.41 },
  { src: "gallery-02.jpg", x: 1279, y: 1104, w: 590, h: 425.41 },

  // Hàng 2 (y = 1104 + 425.41 + 24 = 1553.41, h = 420.96)
  { src: "gallery-04.jpg", x: 51,   y: 1553.41, w: 590, h: 420.96 },
  { src: "gallery-05.jpg", x: 665,  y: 1553.41, w: 590, h: 420.96 },
  { src: "gallery-06.jpg", x: 1279, y: 1553.41, w: 590, h: 420.96 },
];

export const metadata: Metadata = { title: "About" };

const CHIP =
  "absolute top-[calc(var(--u)*245.62)] cursor-pointer border-2 border-white p-10 text-30 leading-35 whitespace-nowrap transition-colors hover:bg-white hover:text-chip-hover";

export default function About() {
  return (
    <ViewTransition>
      <main className="relative bg-ink text-white" style={{ height: u(2985) }}>
        {/* Thanh điều hướng ngay trên đầu */}
        <Nav />

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
        <a
          href="https://drive.google.com/file/d/1aFHn3C7_uQT8XUTGgv7AcCixuflxiRZH/view"
          target="_blank"
          rel="noopener noreferrer"
          className={`${CHIP} left-51`}
        >
          Resumé (CV)
        </a>
        <Link href="/about#gallery" className={`${CHIP} left-263`}>
          What’s more?!
        </Link>

        <p className="absolute top-114 w-560 text-25 leading-25" style={{ left: u(1309.43) }}>
          If you ask my childhood friends to describe me, they’ll probably mention two things: I was
          always the tallest kid in the room and I have signature &apos;dumpling&apos; cheeks. But
          beyond that, my journey started super early on my primary school stage. I was a little ball
          of energy. Dancing, singing, and exploring everything around me.
        </p>

        <div
          id="gallery"
          className="scroll-mt-100"
          style={{ position: "absolute", top: u(1104), left: 0 }}
        />

        {grid.map((g) => {
          const itemId = g.src.replace(/\.[^/.]+$/, "");

          return (
            <div
              key={g.src}
              id={itemId}
              className="absolute scroll-mt-100"
              style={{ left: u(g.x), top: u(g.y), width: u(g.w), height: u(g.h) }}
            >
              <Image
                src={`/images/about/${g.src}`}
                alt=""
                fill
                sizes={ABOUT_GALLERY_SIZES}
                className="object-cover"
              />
            </div>
          );
        })}

        <iframe
          className="absolute"
          style={{ left: u(267.63), top: u(2091), width: u(1384.75), height: u(768.25) }}
          src="https://www.youtube-nocookie.com/embed/uIDOAhuE0yA"
          title="Phuong Linh Vu video"
          loading="lazy"
          allow="encrypted-media; picture-in-picture; fullscreen"
        />
      </main>
    </ViewTransition>
  );
}