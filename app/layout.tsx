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

const APPLE_ICON_SIZES = [57, 60, 72, 76, 114, 120, 144, 152, 180] as const;

export const metadata: Metadata = {
  metadataBase: new URL(appConfig.siteUrl),
  title: {
    default: appConfig.name,
    template: `%s · ${appConfig.name}`,
  },
  description: appConfig.tagline,
  applicationName: appConfig.name,
  manifest: "/favicon/manifest.json",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "32x32" },
      { url: "/favicon/android-icon-192x192.png", type: "image/png", sizes: "192x192" },
      { url: "/favicon/android-icon-512x512.png", type: "image/png", sizes: "512x512" },
      { url: "/favicon/favicon-32x32.png", type: "image/png", sizes: "32x32" },
      { url: "/favicon/favicon-96x96.png", type: "image/png", sizes: "96x96" },
      { url: "/favicon/favicon-16x16.png", type: "image/png", sizes: "16x16" },
    ],
    apple: APPLE_ICON_SIZES.map((size) => ({
      url: `/favicon/apple-icon-${size}x${size}.png`,
      sizes: `${size}x${size}`,
    })),
  },
  openGraph: {
    type: "website",
    title: appConfig.name,
    description: appConfig.tagline,
    url: "/",
    siteName: appConfig.name,
    locale: "ko_KR",
    images: [{ url: "/share.png", width: 1200, height: 630, alt: appConfig.name }],
  },
  twitter: {
    card: "summary_large_image",
    title: appConfig.name,
    description: appConfig.tagline,
    images: ["/share.png"],
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
