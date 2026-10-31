"use client";

import Image from "next/image";
import Link from "next/link";
import { ViewTransition, useState } from "react";
import { Goudy_Bookletter_1911 } from "next/font/google";

const goudy = Goudy_Bookletter_1911({ weight: "400", subsets: ["latin"], display: "swap" });

/* ---------- Thiết kế gốc 1920 x 1076 -> co giãn theo chiều rộng màn hình ---------- */
const W = 1920;
const H = 1076;
const box = (l: number, t: number, w: number, h: number) => ({
  left: `${(l / W) * 100}%`,
  top: `${(t / H) * 100}%`,
  width: `${(w / W) * 100}%`,
  height: `${(h / H) * 100}%`,
});
const fs = (px: number) => `${(px / W) * 100}cqw`; // font-size theo container

/* ---------- Dữ liệu ---------- */
const NAV = [
  { label: "About Me", href: "/about", l: 266, w: 218 },
  { label: "Competitions", href: "/competition", l: 561, w: 172 },
  { label: "Performing", href: "/performing", l: 810, w: 146 },
  { label: "Culture and Writing", href: "/culture-writing", l: 1033, w: 265 },
  { label: "Community Services", href: "/community-services", l: 1375, w: 269 },
];

// Đổi src cho đúng ảnh trong thư mục /public của bạn
const PHOTOS = [
  { label: "Culture and Writing", href: "/culture-writing", src: "/images/home/culture-writing.jpg", l: 1499, t: 160, w: 421, h: 306 },
  { label: "About Me", href: "/about", src: "/images/home/about-me.jpg", l: 238, t: 465, w: 420, h: 305 },
  { label: "Performing", href: "/performing", src: "/images/home/performing.jpg", l: 1078, t: 466, w: 421, h: 304 },
  { label: "Competitions", href: "/competition", src: "/images/home/competition.jpg", l: 658, t: 770, w: 420, h: 306 },
  { label: "Community Services", href: "/community-services", src: "/images/home/community.jpg", l: 1499, t: 770, w: 421, h: 306 },
];

// Các khối xám trang trí
const DECOR = [
  [246, 0, 1691, 77], // thanh nav
  [0, 77, 246, 45],
  [19, 444, 219, 21],
  [95, 770, 142, 66],
  [888, 387, 190, 79],
  [777, 362, 111, 25],
  [43, 731, 52, 39],
];

const HOME_SIZES = "(min-width: 1920px) 421px, 22vw";

export default function Home() {
  const [active, setActive] = useState<number | null>(null);
  const hovering = active !== null;

  return (
    <ViewTransition>
      <main
        className={`${goudy.className} relative w-full overflow-hidden bg-white text-[#1e1e1e]`}
        style={{ aspectRatio: `${W} / ${H}`, containerType: "inline-size" }}
      >
        {/* ===== Nền: ảnh đang hover, phủ kín + blur ===== */}
        {PHOTOS.map((p, i) => (
          <Image
            key={p.src}
            src={p.src}
            alt=""
            fill
            sizes="100vw"
            loading="eager"
            aria-hidden
            className="pointer-events-none z-0 scale-110 object-cover blur-[20px] transition-opacity duration-500 ease-out"
            style={{ opacity: active === i ? 1 : 0 }}
          />
        ))}

        {/* ===== Khối xám trang trí ===== */}
        {DECOR.map(([l, t, w, h], i) => (
          <span key={i} className="pointer-events-none absolute z-10 bg-[#efefef]" style={box(l, t, w, h)} />
        ))}

        {/* ===== Thanh điều hướng ===== */}
        {NAV.map((n) => (
          <Link
            key={n.href}
            href={n.href}
            className="absolute z-20 text-center transition-opacity hover:opacity-60"
            style={{
              left: `${(n.l / W) * 100}%`,
              top: `${(21 / H) * 100}%`,
              width: `${(n.w / W) * 100}%`,
              fontSize: fs(32),
              lineHeight: fs(36),
            }}
          >
            {n.label}
          </Link>
        ))}

        {/* ===== Tiêu đề lớn: xám -> trắng khi hover ===== */}
        <h1
          className="pointer-events-none absolute z-20 font-normal transition-colors duration-500"
          style={{
            left: `${(15 / W) * 100}%`,
            top: `${(167 / H) * 100}%`,
            width: `${(1363 / W) * 100}%`,
            fontSize: fs(185),
            lineHeight: fs(133),
            color: hovering ? "#ffffff" : "#cdcdcd",
          }}
        >
          Phuong Linh Vu’s
          <br />
          Portfolio
        </h1>

        {/* ===== Các ảnh ===== */}
        {PHOTOS.map((p, i) => (
          <Link
            key={p.src}
            href={p.href}
            className="group absolute z-20 block overflow-hidden"
            style={box(p.l, p.t, p.w, p.h)}
            onMouseEnter={() => setActive(i)}
            onMouseLeave={() => setActive(null)}
            onFocus={() => setActive(i)}
            onBlur={() => setActive(null)}
          >
            <Image
              src={p.src}
              alt={p.label}
              fill
              sizes={HOME_SIZES}
              loading="eager"
              className="object-cover"
            />
            {/* lớp tối + nhãn khi hover */}
            <span className="absolute inset-0 bg-black/40 opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-focus-visible:opacity-100" />
            <span
              className="absolute inset-0 flex items-center justify-center text-center text-[#d9dfe4] opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-focus-visible:opacity-100"
              style={{ fontSize: fs(32), lineHeight: fs(36) }}
            >
              {p.label}
            </span>
          </Link>
        ))}

        {/* ===== Chữ nhỏ ===== */}
        <p
          className="pointer-events-none absolute z-20"
          style={{
            left: `${(238 / W) * 100}%`,
            top: `${(780 / H) * 100}%`,
            width: `${(318 / W) * 100}%`,
            fontSize: fs(50),
            lineHeight: fs(36),
          }}
        >
          hanoi,
          <br />
          vietnam
        </p>
        <p
          className="pointer-events-none absolute z-20"
          style={{
            left: `${(671 / W) * 100}%`,
            top: `${(715 / H) * 100}%`,
            width: `${(319 / W) * 100}%`,
            fontSize: fs(50),
            lineHeight: fs(36),
          }}
        >
          phuong linh vu
        </p>
        <p
          className="pointer-events-none absolute z-20"
          style={{
            left: `${(1524 / W) * 100}%`,
            top: `${(718 / H) * 100}%`,
            width: `${(319 / W) * 100}%`,
            fontSize: fs(50),
            lineHeight: fs(36),
          }}
        >
          3rd Apr, 2009
        </p>
      </main>
    </ViewTransition>
  );
}