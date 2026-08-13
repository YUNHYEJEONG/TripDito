import type { Metadata } from "next";

export const metadata: Metadata = { title: "즐겨찾기한 상품" };

export default function FavoritesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
