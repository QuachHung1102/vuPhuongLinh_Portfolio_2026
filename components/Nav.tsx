"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { homeColumns } from "@/lib/home-columns";

export function Nav() {
  const pathname = usePathname();
  const [openPath, setOpenPath] = useState<string | null>(null);
  const open = openPath === pathname;

  const navItems = [{ href: "/", label: "Home" }, ...homeColumns];

  return (
    <>
      {/* 1. NÚT TOGGLE Ở GÓC TRÊN PHẢI (Chỉ hiện ở màn nhỏ < md) */}
      <div className="fixed top-24 right-24 z-50 flex flex-col items-end md:hidden">
        <button
          type="button"
          onClick={() => setOpenPath((prev) => (prev === pathname ? null : pathname))}
          aria-expanded={open}
          aria-label="Toggle navigation menu"
          className="flex h-48 w-48 cursor-pointer flex-col items-center justify-center gap-6 border-2 border-white/80 bg-black/65 text-white backdrop-blur-md transition-colors hover:bg-white hover:text-black"
        >
          <span
            className={`block h-2 w-24 bg-current transition-transform duration-300 ${
              open ? "translate-y-8 rotate-45" : ""
            }`}
          />
          <span
            className={`block h-2 w-24 bg-current transition-opacity duration-300 ${
              open ? "opacity-0" : "opacity-100"
            }`}
          />
          <span
            className={`block h-2 w-24 bg-current transition-transform duration-300 ${
              open ? "-translate-y-8 -rotate-45" : ""
            }`}
          />
        </button>

        <nav
          aria-label="Mobile navigation"
          className={`mt-10 flex min-w-220 origin-top-right flex-col items-end border-2 border-white/80 bg-black/85 p-20 text-right text-25 leading-30 text-white backdrop-blur-md transition-all duration-200 ${
            open
              ? "pointer-events-auto scale-100 opacity-100"
              : "pointer-events-none scale-95 opacity-0"
          }`}
        >
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpenPath(null)}
                className={`py-10 whitespace-nowrap transition-opacity ${
                  isActive
                    ? "underline underline-offset-8 opacity-100"
                    : "opacity-65 hover:opacity-100"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>

      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs md:hidden"
          onClick={() => setOpenPath(null)}
          aria-hidden="true"
        />
      )}

      {/* 2. THANH NAV NGANG NGAY TRÊN ĐẦU (top-24, chỉ hiện ở màn lớn >= md) */}
      <nav
        aria-label="Desktop navigation"
        className="fixed top-24 left-1/2 z-50 hidden -translate-x-1/2 items-center gap-30 border-2 border-white/80 bg-black/55 px-35 py-14 text-25 leading-25 text-white backdrop-blur-md md:flex"
      >
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`whitespace-nowrap transition-opacity ${
                isActive
                  ? "underline underline-offset-8 opacity-100"
                  : "opacity-65 hover:opacity-100"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </>
  );
}

export default Nav;