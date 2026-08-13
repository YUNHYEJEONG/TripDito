import type { Metadata } from "next";

export const metadata: Metadata = { title: "내 쿠폰" };

export default function CouponsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
