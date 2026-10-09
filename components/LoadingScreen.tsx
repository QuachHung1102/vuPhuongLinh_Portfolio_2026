import type { CSSProperties } from "react";

const TEXT = "vu * phuong linh * ";

export function LoadingScreen({ leaving }: { leaving: boolean }) {
  const letters = Array.from(TEXT);
  return (
    <div
      id="loading-screen"
      role="status"
      aria-label="Loading"
      data-leaving={leaving || undefined}
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink text-white"
    >
      <div className="loader-ring" aria-hidden style={{ "--n": letters.length } as CSSProperties}>
        {letters.map((ch, i) => (
          <span key={i} style={{ "--i": i } as CSSProperties}>
            {ch}
          </span>
        ))}
      </div>
    </div>
  );
}
