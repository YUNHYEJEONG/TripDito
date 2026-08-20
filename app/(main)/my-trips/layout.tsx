import type { Metadata } from "next";

export const metadata: Metadata = { title: "여행" };

export default function MyTripsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
