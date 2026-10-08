/** Đổi design px (xem `--u` trong app/globals.css) thành độ dài CSS, dùng cho inline style. */
export const u = (n: number) => `calc(var(--u) * ${n})`;
