import type { Metadata } from "next";

export const metadata: Metadata = { title: "좋아요" };

export default function LikesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
