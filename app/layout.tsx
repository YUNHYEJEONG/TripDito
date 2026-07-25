import type { Metadata, Viewport } from "next";
import { Noto_Sans_KR, Roboto } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { AppProviders } from "@/providers/app-providers";
import { appConfig } from "@/config/app";

const notoSansKr = Noto_Sans_KR({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-noto-sans-kr",
  display: "swap",
});

const roboto = Roboto({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-roboto",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: appConfig.name,
    template: `%s · ${appConfig.name}`,
  },
  description: appConfig.tagline,
  applicationName: appConfig.name,
  icons: {
    icon: [
      { url: "/brand/favicon.ico?v=3" },
      { url: "/brand/favicon.png?v=3", type: "image/png", sizes: "32x32" },
    ],
    apple: [{ url: "/brand/app-icon.png?v=3" }],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#3182F6",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ko"
      suppressHydrationWarning
      className={cn(
        "h-full",
        notoSansKr.variable,
        roboto.variable,
        "font-sans",
      )}
    >
      <body className="flex min-h-full flex-col bg-canvas text-foreground">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
