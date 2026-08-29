import type { Metadata } from "next";

export const metadata: Metadata = { title: "여권" };

export default function PassportLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
