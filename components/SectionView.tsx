"use client";

import Image from "next/image";
import Link from "next/link";
import { Fragment, useState, ViewTransition, type CSSProperties } from "react";
import type { Section } from "@/lib/content";
import { u } from "@/lib/design";
import { Slideshow } from "./Slideshow";

const BUTTON =
  "mt-10 inline-block cursor-pointer border border-white px-10 py-5 text-18 leading-25 transition-colors hover:bg-white hover:text-black";
const FIT_UNIT = "min(100vw / 1920, 100dvh / 1080)";

export function SectionView({ section }: { section: Section }) {
  const [active, setActive] = useState(0);
  const item = section.items[active];

  return (
    <ViewTransition>
      <main className="relative h-dvh overflow-hidden bg-ink">
        <div
          className={`absolute inset-y-0 right-0 w-1390 ${item.inset ? "bg-white" : ""}`}
        >
          <div
            className={
              item.inset ? "absolute inset-x-0 top-183 h-664" : "absolute inset-0"
            }
          >
            {item.images.length > 0 && (
              <Slideshow
                key={`${section.slug}-${active}`}
                images={item.images}
                alt={item.title}
                focus={item.focus}
              />
            )}
          </div>
        </div>

        {/* Lề trên/dưới cố định theo đơn vị cột; khoảng trống còn lại chia cho các spacer
            (header↔list ưu tiên hơn, giữa các mục có min/max), không bao giờ cuộn. */}
        <div
          className="absolute inset-y-0 left-0 flex flex-col pt-64.5 pb-50 pl-50"
          style={{ "--u": FIT_UNIT } as CSSProperties}
        >
          <header
            className="flex shrink-0 flex-col gap-42"
            style={{ width: u(section.titleWidth) }}
          >
            <nav
              className="relative h-[calc(var(--u)*14.906)] w-115"
              aria-label="Sections"
            >
              {section.next ? (
                <>
                  <Image
                    src="/icons/arrows-nav.svg"
                    alt=""
                    width={115}
                    height={15}
                    className="block h-auto w-115"
                  />
                  <Link
                    href={section.prev}
                    aria-label="Previous section"
                    className="absolute inset-y-0 left-0 w-35"
                  />
                  <Link
                    href={section.next}
                    aria-label="Next section"
                    className="absolute inset-y-0 right-0 w-35"
                  />
                </>
              ) : (
                <Link
                  href={section.prev}
                  aria-label="Previous section"
                  className="block"
                >
                  <Image
                    src="/icons/arrow-back.svg"
                    alt=""
                    width={35}
                    height={15}
                    className="h-auto w-35"
                  />
                </Link>
              )}
            </nav>
            <div className="flex flex-col gap-10">
              <h1 className="text-50 leading-[normal] whitespace-nowrap">
                {section.title}
              </h1>
              <p className="text-30 leading-30">{section.tagline}</p>
            </div>
          </header>

          <ul
            className="flex min-h-0 flex-1 flex-col"
            style={{ width: u(section.listWidth) }}
          >
            <li aria-hidden className="min-h-14 flex-[3_1_0%]" />
            {section.items.map((it, i) => {
              const open = i === active;
              return (
                <Fragment key={it.title}>
                  {i > 0 && (
                    <li aria-hidden className="max-h-16 min-h-7 flex-[1_1_0%]" />
                  )}
                  <li className="shrink-0">
                    <button
                      type="button"
                      aria-expanded={open}
                      onClick={() => setActive(i)}
                      className={`block w-full cursor-pointer text-left text-25 leading-25 whitespace-pre-line transition-colors duration-300 motion-reduce:transition-none ${
                        open ? "text-white" : "text-white/40 hover:text-white/70"
                      }`}
                    >
                      {it.title}
                    </button>
                    {/* 0fr -> 1fr để animate chiều cao mà không cần đo; `inert` giữ phần đang gập ngoài Tab và trình đọc màn hình. */}
                    <div
                      inert={!open}
                      className={`grid transition-[grid-template-rows,opacity] ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none ${
                        open
                          ? "grid-rows-[1fr] opacity-100 duration-500"
                          : "grid-rows-[0fr] opacity-0 duration-300"
                      }`}
                    >
                      <div className="min-h-0 overflow-hidden">
                        <div style={{ paddingTop: u(section.descGap) }}>
                          <div
                            className="text-18 whitespace-pre-line [&>p+p]:mt-[1lh]"
                            style={{ lineHeight: u(section.descLeading) }}
                          >
                            {it.description?.map((p) => (
                              <p key={p}>{p}</p>
                            ))}
                          </div>
                          {it.button &&
                            (it.button.href ? (
                              <a
                                href={it.button.href}
                                target="_blank"
                                rel="noreferrer"
                                className={BUTTON}
                              >
                                {it.button.label}
                              </a>
                            ) : (
                              <button type="button" className={BUTTON}>
                                {it.button.label}
                              </button>
                            ))}
                        </div>
                      </div>
                    </div>
                  </li>
                </Fragment>
              );
            })}
          </ul>
        </div>
      </main>
    </ViewTransition>
  );
}
