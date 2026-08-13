import type { Metadata } from "next";

export const metadata: Metadata = { title: "전체 여행 관리" };

export default function MyTripsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
