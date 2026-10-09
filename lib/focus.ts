/** CSS object-position ("18.5% 50%") -> [x, y] in 0..1, top-left origin. Anything unparsable is centre. */
export function parseFocus(focus?: string): [number, number] {
  const m = focus?.match(/^\s*(-?\d+(?:\.\d+)?)%\s+(-?\d+(?:\.\d+)?)%\s*$/);
  if (!m) return [0.5, 0.5];
  const c = (s: string) => Math.min(100, Math.max(0, Number(s))) / 100;
  return [c(m[1]), c(m[2])];
}
