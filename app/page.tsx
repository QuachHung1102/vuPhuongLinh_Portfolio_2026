import Image from "next/image";
import Link from "next/link";

// x = object-position-x của khung 384px nhìn vào mỗi ảnh (theo crop trong Figma).
const columns = [
  { href: "/about", label: "about me", src: "/images/about/hero.jpg", x: 50 },
  { href: "/competition", label: "competitions", src: "/images/home/competition.jpg", x: 59.9 },
  { href: "/performing", label: "performing", src: "/images/home/performing.jpg", x: 27.8 },
  { href: "/culture-writing", label: "culture and writing", src: "/images/home/culture-writing.jpg", x: 53.8 },
  { href: "/community-services", label: "community services", src: "/images/home/community.jpg", x: 47.4 },
];

const SHOW = "opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-focus-visible:opacity-100";

export default function Home() {
  return (
    <main className="relative flex h-1080 min-h-dvh bg-white text-50 leading-36 text-white">
      {columns.map((c) => (
        <Link key={c.href} href={c.href} className="group relative block h-full w-384 shrink-0 overflow-hidden">
          <Image
            src={c.src}
            alt=""
            fill
            sizes="90vw" // ảnh vẽ rộng ~1650px rồi crop vào cột 384px
            loading="eager"
            className="object-cover"
            style={{ objectPosition: `${c.x}% 50%` }}
          />
          <span className={`absolute inset-0 bg-black/70 ${SHOW}`} />
          <span className={`absolute top-648 left-1/2 w-223.75 -translate-x-1/2 -translate-y-1/2 text-center ${SHOW}`}>
            {c.label}
          </span>
        </Link>
      ))}
      <p className="pointer-events-none absolute top-29.75 left-36.25 w-296">
        hanoi,
        <br />
        vietnam
      </p>
      <p className="pointer-events-none absolute top-29.75 left-1/2 w-350 -translate-x-1/2 text-center">
        phuong linh vu
      </p>
      <p className="pointer-events-none absolute top-31.75 right-36.25 w-296 text-right">
        21st oct, 2008
      </p>
    </main>
  );
}
