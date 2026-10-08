import type { Metadata } from "next";
import { SectionView } from "@/components/SectionView";
import { getSection } from "@/lib/content";

export const metadata: Metadata = { title: "Culture & Writing" };

export default function Page() {
  return <SectionView section={getSection("culture-writing")} />;
}
