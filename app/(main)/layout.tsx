import { BottomNav } from "@/components/layout/bottom-nav";

export default function MainTabLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {children}
      <BottomNav />
    </>
  );
}
