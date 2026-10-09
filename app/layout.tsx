import type { Metadata } from "next";
import localFont from "next/font/local";
import { Preloader } from "@/components/Preloader";
import { SEEN_SCRIPT } from "@/lib/first-load";
import { getManifest } from "@/lib/site-manifest";
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
    // Extensions (Immersive Translate, ColorZilla) inject attrs on <html>/<body> before hydration.
    <html lang="en" className={goudy.variable} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: SEEN_SCRIPT }} />
        <noscript>
          <style>{"#loading-screen{display:none}"}</style>
        </noscript>
      </head>
      <body suppressHydrationWarning>
        {children}
        <Preloader manifest={getManifest()} />
      </body>
    </html>
  );
}
