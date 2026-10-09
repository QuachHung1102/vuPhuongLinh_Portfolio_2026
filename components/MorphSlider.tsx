"use client";

import { useEffect, useRef } from "react";
import { Mesh, Program, Renderer, Texture, Triangle } from "ogl";
import { parseFocus } from "@/lib/focus";
import { imageSet, setImageSource } from "@/lib/image-set";

// Trimmed port of React Bits "Morph Slider" (melt, intensity 0, aberration 0, scale 1).
// Differences: renders on demand (no continuous loop), no vignette, per-image focus,
// progress remapped so 0 and 1 are exactly the current and next image.

const VERTEX = `
attribute vec2 position;
attribute vec2 uv;
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

const FRAGMENT = `
precision highp float;
uniform sampler2D tCurrent;
uniform sampler2D tNext;
uniform vec2 uResolution;
uniform vec2 uCurrentSize;
uniform vec2 uNextSize;
uniform vec2 uCurrentFocus;
uniform vec2 uNextFocus;
uniform float uProgress;
uniform float uScale;
uniform float uSeed;
varying vec2 vUv;

float hash21(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}
float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash21(i), hash21(i + vec2(1.0, 0.0)), u.x),
             mix(hash21(i + vec2(0.0, 1.0)), hash21(i + vec2(1.0, 1.0)), u.x), u.y);
}
float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  for (int i = 0; i < 5; i++) {
    v += a * noise(p);
    p *= 2.0;
    a *= 0.5;
  }
  return v;
}

// object-fit: cover with object-position = focus (v axis points up).
vec2 coverUV(vec2 uv, vec2 res, vec2 img, vec2 focus) {
  float ratio = (res.x / res.y) / (img.x / img.y);
  vec2 s = ratio > 1.0 ? vec2(1.0, 1.0 / ratio) : vec2(ratio, 1.0);
  return uv * s + (1.0 - s) * focus;
}

void main() {
  float nn = fbm(vUv * uScale + uSeed);
  float t = uProgress * 1.3 - 0.15;
  float m = smoothstep(nn - 0.15, nn + 0.15, t);
  vec3 a = texture2D(tCurrent, coverUV(vUv, uResolution, uCurrentSize, uCurrentFocus)).rgb;
  vec3 b = texture2D(tNext, coverUV(vUv, uResolution, uNextSize, uNextFocus)).rgb;
  gl_FragColor = vec4(mix(a, b, m), 1.0);
}
`;

const easeInOutCubic = (k: number) => (k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2);

type Props = {
  images: string[];
  sizes: string;
  /** object-position of the first image only, e.g. "18.5% 50%". */
  focus?: string;
  delayMs?: number;
  durationMs?: number;
};

export function MorphSlider({ images, sizes, focus, delayMs = 4000, durationMs = 1000 }: Props) {
  const host = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = host.current;
    if (!el) return;

    let renderer: Renderer;
    try {
      renderer = new Renderer({ alpha: false, antialias: false, dpr: Math.min(window.devicePixelRatio || 1, 2) });
    } catch {
      return; // no WebGL: the static first image under us stays
    }
    const gl = renderer.gl;
    if (!gl) return;
    const canvas = gl.canvas as HTMLCanvasElement;
    canvas.style.cssText = "position:absolute;inset:0;width:100%;height:100%;opacity:0;transition:opacity 300ms";
    el.appendChild(canvas);

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const blank = new Texture(gl, {
      image: new Uint8Array([39, 39, 39, 255]),
      width: 1,
      height: 1,
      generateMipmaps: false,
    });
    const program = new Program(gl, {
      vertex: VERTEX,
      fragment: FRAGMENT,
      uniforms: {
        tCurrent: { value: blank },
        tNext: { value: blank },
        uResolution: { value: [1, 1] },
        uCurrentSize: { value: [1, 1] },
        uNextSize: { value: [1, 1] },
        uCurrentFocus: { value: [0.5, 0.5] },
        uNextFocus: { value: [0.5, 0.5] },
        uProgress: { value: 0 },
        uScale: { value: 1 },
        uSeed: { value: 0 },
      },
    });
    const mesh = new Mesh(gl, { geometry: new Triangle(gl), program });
    const u = program.uniforms;
    const render = () => renderer.render({ scene: mesh });

    const fit = () => {
      const { width, height } = el.getBoundingClientRect();
      renderer.setSize(Math.max(width, 1), Math.max(height, 1));
      u.uResolution.value = [gl.canvas.width, gl.canvas.height];
      render();
    };
    const ro = new ResizeObserver(fit);
    ro.observe(el);

    // Focus is CSS top-left based; the shader's v axis points up.
    const foci = images.map((_, i) => {
      const [x, y] = parseFocus(i === 0 ? focus : undefined);
      return [x, 1 - y];
    });
    // Originals are up to 4096px (~45 MB as an RGBA texture), so images stay as decoded
    // elements and a GPU texture exists only for the current and the next slide.
    const loaded: (HTMLImageElement | undefined)[] = [];
    const textures: (Texture | undefined)[] = [];
    const dims: [number, number][] = [];
    // Mipmaps stop the 4096px source aliasing when it is minified into the canvas (WebGL2 only: NPOT-safe).
    const mips = renderer.isWebgl2;
    const textureFor = (i: number) => {
      const image = loaded[i];
      if (!image) return undefined;
      return (textures[i] ??= new Texture(gl, {
        image,
        generateMipmaps: mips,
        minFilter: mips ? gl.LINEAR_MIPMAP_LINEAR : gl.LINEAR,
      }));
    };
    const freeExcept = (keep: number) => {
      textures.forEach((t, i) => {
        if (t && i !== keep) gl.deleteTexture(t.texture);
        if (i !== keep) delete textures[i];
      });
    };
    let current = 0;
    let disposed = false;
    let timer = 0;
    let raf = 0;
    canvas.addEventListener("webglcontextlost", () => {
      canvas.style.opacity = "0";
      clearTimeout(timer);
    });

    const showCurrent = () => {
      const t = textureFor(current);
      u.tCurrent.value = t;
      u.tNext.value = t; // never leave a freed texture bound
      freeExcept(current);
      u.uCurrentSize.value = dims[current];
      u.uCurrentFocus.value = foci[current];
      u.uProgress.value = 0;
      render();
      canvas.style.opacity = "1";
    };

    images.forEach((src, i) => {
      const img = new Image();
      img.onload = () => {
        if (disposed) return;
        loaded[i] = img;
        dims[i] = [img.naturalWidth, img.naturalHeight];
        if (i === current) showCurrent();
      };
      setImageSource(img, imageSet({ src, sizes }));
    });

    const schedule = () => {
      timer = window.setTimeout(advance, delayMs);
    };
    const advance = () => {
      const next = (current + 1) % images.length;
      // Hidden tab or texture not ready yet: skip this beat instead of queueing transitions.
      if (document.hidden || !loaded[current] || !loaded[next]) return schedule();
      u.tNext.value = textureFor(next);
      u.uNextSize.value = dims[next];
      u.uNextFocus.value = foci[next];
      u.uSeed.value = Math.random() * 100;
      const ms = reduce ? 0 : durationMs;
      const start = performance.now();
      const tick = (now: number) => {
        const k = ms ? Math.min((now - start) / ms, 1) : 1;
        u.uProgress.value = easeInOutCubic(k);
        render();
        if (k < 1) {
          raf = requestAnimationFrame(tick);
          return;
        }
        current = next;
        showCurrent();
        schedule();
      };
      raf = requestAnimationFrame(tick);
    };
    if (images.length > 1) schedule();

    return () => {
      disposed = true;
      clearTimeout(timer);
      cancelAnimationFrame(raf);
      ro.disconnect();
      canvas.remove();
      freeExcept(-1);
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    };
  }, [images, sizes, focus, delayMs, durationMs]);

  return <div ref={host} className="absolute inset-0" />;
}
