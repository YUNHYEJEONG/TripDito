import type { Metadata } from "next";

export const metadata: Metadata = { title: "내 때샷" };

export default function ProfileShotsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
