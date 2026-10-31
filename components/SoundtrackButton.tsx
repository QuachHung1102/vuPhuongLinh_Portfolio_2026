"use client";

import { useEffect, useRef, useState } from "react";

/** Ô bấm để phát/dừng nhạc của mục (soundtrack). Nhạc tự dừng khi rời trang. */
export function SoundtrackButton({
  src,
  label,
  className,
}: {
  src: string;
  label: string;
  className: string;
}) {
  const audio = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    const el = audio.current;
    return () => el?.pause();
  }, []);

  const toggle = () => {
    const el = audio.current;
    if (!el) return;
    if (el.paused) void el.play().catch(() => setPlaying(false));
    else el.pause();
  };

  return (
    <>
      <button
        type="button"
        onClick={toggle}
        aria-pressed={playing}
        className={className}
      >
        {playing ? "Pause" : "Play"} · {label}
      </button>
      <audio
        ref={audio}
        src={src}
        loop
        preload="none"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
      />
    </>
  );
}
