import type { Metadata } from "next";
import { SectionView } from "@/components/SectionView";
import { getSection } from "@/lib/content";
import Nav from "@/components/Nav";

export const metadata: Metadata = { title: "Performing" };

export default function Page() {
  return (
    <>
      <Nav />
      <SectionView section={getSection("performing")} />
    </>
  );
}
