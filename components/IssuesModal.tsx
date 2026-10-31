"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import type { Issue } from "@/lib/content";

const CAPTION = "CNN Zoom is FLSS Official Media Representative and News Publication";

/**
 * Bảng đọc các số báo CNN ZOOM (layout theo ref trong Content_Portfolio.docx):
 * lưới bìa → bấm một số → khung đọc PDF có tiêu đề, mũi tên chuyển số và nút đóng.
 */
export function IssuesModal({ issues, onClose }: { issues: Issue[]; onClose: () => void }) {
  const [open, setOpen] = useState<number | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  // Esc: đóng khung đọc trước, rồi mới đóng cả bảng; ←/→ chuyển số khi đang đọc.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (open !== null) setOpen(null);
        else onClose();
      } else if (open !== null && e.key === "ArrowLeft") {
        setOpen((i) => (i === null ? i : (i + issues.length - 1) % issues.length));
      } else if (open !== null && e.key === "ArrowRight") {
        setOpen((i) => (i === null ? i : (i + 1) % issues.length));
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, issues.length, onClose]);

  useEffect(() => {
    closeRef.current?.focus();
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  const current = open === null ? null : issues[open];
  const go = (d: number) => setOpen((i) => (i === null ? i : (i + d + issues.length) % issues.length));

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="CNN ZOOM issues"
      className="fixed inset-0 z-[100] overflow-y-auto bg-gradient-to-br from-[#4b3379] via-[#6e52a8] to-[#8a73c4] text-white"
    >
      <button
        ref={closeRef}
        type="button"
        onClick={onClose}
        aria-label="Close"
        className="fixed top-30 right-40 z-10 flex size-50 cursor-pointer items-center justify-center rounded-full border border-white/70 text-30 leading-none transition-colors hover:bg-white hover:text-black"
      >
        ×
      </button>

      <div className="mx-auto w-1100 max-w-[92vw] pt-80 pb-100">
        <h2 className="text-center text-50 leading-[normal]">CNN ZOOM</h2>
        <p className="mt-10 text-center text-22 leading-30">
          Official publication of the Foreign Language Specialized School
        </p>

        <div className="my-50 flex items-center gap-30">
          <span className="h-1 flex-1 bg-white/60" />
          <h3 className="text-30 leading-[normal]">Issues</h3>
          <span className="h-1 flex-1 bg-white/60" />
        </div>

        <ul className="grid grid-cols-2 gap-x-14 gap-y-14">
          {issues.map((it, i) => (
            <li key={it.pdf}>
              <button
                type="button"
                onClick={() => setOpen(i)}
                className="group relative block aspect-[3/2] w-full cursor-pointer overflow-hidden bg-[#2a2150] text-left"
              >
                {it.cover && (
                  <Image
                    src={it.cover}
                    alt=""
                    fill
                    unoptimized
                    sizes="50vw"
                    className="object-cover"
                  />
                )}
                <span
                  className={`absolute inset-0 flex items-center justify-center bg-[#272a4a]/70 p-20 text-center text-22 leading-30 transition-opacity duration-300 ${
                    it.cover ? "opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100" : "opacity-100"
                  }`}
                >
                  {it.title}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>

      {current && (
        <div className="fixed inset-0 z-20 flex flex-col bg-white text-black">
          <div className="flex shrink-0 text-white">
            <div className="flex w-1/2 items-center bg-[#111827] px-60 py-30">
              <h3 className="text-35 leading-45">{current.title}</h3>
            </div>
            <div className="flex w-1/2 items-center bg-white px-30 text-22 leading-30 text-black">
              {CAPTION}
            </div>
          </div>

          <div className="relative min-h-0 flex-1 bg-[#7a5fb3]">
            <iframe
              key={current.pdf}
              src={current.pdf}
              title={current.title}
              className="absolute inset-y-0 right-100 left-100 h-full w-[calc(100%-200*var(--u))] bg-white"
            />
            {issues.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={() => go(-1)}
                  aria-label="Previous issue"
                  className="absolute top-1/2 left-20 flex size-60 -translate-y-1/2 cursor-pointer items-center justify-center text-50 leading-none text-white transition-opacity hover:opacity-70"
                >
                  ‹
                </button>
                <button
                  type="button"
                  onClick={() => go(1)}
                  aria-label="Next issue"
                  className="absolute top-1/2 right-20 flex size-60 -translate-y-1/2 cursor-pointer items-center justify-center text-50 leading-none text-white transition-opacity hover:opacity-70"
                >
                  ›
                </button>
              </>
            )}
          </div>

          <button
            type="button"
            onClick={() => setOpen(null)}
            aria-label="Back to all issues"
            className="fixed top-30 right-40 z-30 flex size-50 cursor-pointer items-center justify-center rounded-full border border-white bg-black/50 text-30 leading-none text-white transition-colors hover:bg-white hover:text-black"
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
}
