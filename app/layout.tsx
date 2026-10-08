import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const goudy = localFont({
  src: "./fonts/GoudyBookletter1911-Regular.ttf",
  variable: "--font-goudy",
  // Font này không có chữ tiếng Việt (vd "MẦM"), các chữ đó sẽ rơi về fallback.
  fallback: ["Georgia", "serif"],
});

export const metadata: Metadata = {
  title: { default: "Phuong Linh Vu", template: "%s – Phuong Linh Vu" },
  description: "Portfolio of Phuong Linh Vu",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={goudy.variable}>
      <body>{children}</body>
    </html>
  );
}
