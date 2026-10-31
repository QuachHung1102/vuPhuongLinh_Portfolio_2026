import type { Metadata } from "next";
import { SectionView } from "@/components/SectionView";
import { getSection } from "@/lib/content";
import Nav from "@/components/Nav";

export const metadata: Metadata = { title: "Community Services" };

export default function Page() {
  return (
    <>
      <Nav />
      <SectionView section={getSection("community-services")} />
    </>
  );
}
