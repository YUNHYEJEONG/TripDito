import type { Metadata } from "next";

export const metadata: Metadata = { title: "알림" };

export default function NotificationsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
