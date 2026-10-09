"use client";

import { useEffect, useState } from "react";
import { SEEN_KEY } from "@/lib/first-load";
import { imageSet, setImageSource } from "@/lib/image-set";
import { planFor, type ImageRef, type Manifest } from "@/lib/manifest";
import { runPool } from "@/lib/preload-queue";
import { LoadingScreen } from "./LoadingScreen";

const CONCURRENCY = 3;
const MAX_WAIT_MS = 15_000; // never trap the visitor behind the loading screen
const LEAVE_MS = 600; // keep in sync with the opacity transition in globals.css

/** Resolves when the image loaded or failed; never rejects. */
function load(ref: ImageRef, priority: "high" | "low"): Promise<void> {
  return new Promise((resolve) => {
    const img = new Image();
    img.fetchPriority = priority;
    img.onload = img.onerror = () => resolve();
    setImageSource(img, imageSet(ref));
  });
}

const idle = () =>
  new Promise<void>((resolve) => {
    if ("requestIdleCallback" in window) window.requestIdleCallback(() => resolve());
    else setTimeout(resolve, 200);
  });

export function Preloader({ manifest }: { manifest: Manifest }) {
  const [phase, setPhase] = useState<"loading" | "leaving" | "gone">("loading");

  useEffect(() => {
    let cancelled = false;
    const { critical, rest } = planFor(manifest, window.location.pathname);

    (async () => {
      await Promise.race([
        Promise.all(critical.map((r) => load(r, "high"))),
        new Promise((r) => setTimeout(r, MAX_WAIT_MS)),
      ]);
      if (cancelled) return;
      try {
        sessionStorage.setItem(SEEN_KEY, "1");
      } catch {}
      setPhase("leaving");
      setTimeout(() => {
        if (!cancelled) setPhase("gone");
      }, LEAVE_MS);

      await idle();
      await runPool(rest, CONCURRENCY, (r) => load(r, "low"), () => cancelled);
    })();

    return () => {
      cancelled = true;
    };
  }, [manifest]);

  return phase === "gone" ? null : <LoadingScreen leaving={phase === "leaving"} />;
}
