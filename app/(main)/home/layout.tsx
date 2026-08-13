import type { Metadata } from "next";

export const metadata: Metadata = { title: "홈" };

export default function HomeLayout({ children }: { children: React.ReactNode }) {
  return children;
}
