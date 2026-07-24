import type { Metadata } from "next";
import "./globals.css";
import { cn } from "@/lib/utils";
import { AppProviders } from "@/providers/app-providers";
import { appConfig } from "@/config/app";

export const metadata: Metadata = {
  title: appConfig.name,
  description: "여행 쇼핑 리스트",
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
      className={cn("h-full", "antialiased", "font-sans")}
    >
      <head>
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css"
        />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, viewport-fit=cover"
        />
      </head>
      <body className="flex min-h-full flex-col bg-canvas text-foreground">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
