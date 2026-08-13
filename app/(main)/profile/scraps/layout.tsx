import type { Metadata } from "next";

export const metadata: Metadata = { title: "스크랩" };

export default function ScrapsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
