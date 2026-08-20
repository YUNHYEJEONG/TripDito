import type { Metadata, Viewport } from "next";
import Script from "next/script";
import "./globals.css";
import { AppProviders } from "@/providers/app-providers";
import { appConfig } from "@/config/app";

const unsavedNavigationGuard = `
(function tripditoInstallUnsavedNavigationGuard() {
  var requestEvent = "tripdito:unsaved-navigation-request";
  window.__tripditoUnsavedGuards = window.__tripditoUnsavedGuards || new Set();
  window.__tripditoAllowPopstate = false;
  window.__tripditoRestoreThenPrompt = false;

  function hasUnsavedChanges() {
    return Boolean(
      (window.__tripditoUnsavedGuards && window.__tripditoUnsavedGuards.size) ||
      document.querySelector('form[data-unsaved="true"]')
    );
  }

  function announceRequest() {
    window.dispatchEvent(new Event(requestEvent));
  }

  document.addEventListener("click", function tripditoUnsavedLinkClick(event) {
    if (!hasUnsavedChanges()) return;
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    if (!(event.target instanceof Element)) return;

    var anchor = event.target.closest("a[href]");
    if (!anchor || anchor.hasAttribute("download") || (anchor.target && anchor.target !== "_self")) return;

    var next = new URL(anchor.href, window.location.href);
    var current = new URL(window.location.href);
    if (next.origin !== current.origin) return;
    if (next.pathname === current.pathname && next.search === current.search) return;

    event.preventDefault();
    event.stopImmediatePropagation();
    if (window.__tripditoPendingNavigation) return;

    window.__tripditoPendingNavigation = {
      kind: "href",
      href: next.href,
      discardAll: true
    };
    announceRequest();
  }, true);

  window.addEventListener("popstate", function tripditoUnsavedPopstate(event) {
    if (window.__tripditoAllowPopstate) {
      window.__tripditoAllowPopstate = false;
      if (window.__tripditoRestoreThenPrompt) {
        window.__tripditoRestoreThenPrompt = false;
        window.setTimeout(announceRequest, 0);
      }
      return;
    }

    if (!hasUnsavedChanges()) return;
    event.stopImmediatePropagation();
    if (window.__tripditoPendingNavigation) {
      window.__tripditoAllowPopstate = true;
      window.history.forward();
      return;
    }

    window.__tripditoPendingNavigation = {
      kind: "history-back",
      discardAll: true
    };
    window.__tripditoRestoreThenPrompt = true;
    window.__tripditoAllowPopstate = true;
    window.history.forward();
  }, true);
})();
`;

export const metadata: Metadata = {
  title: {
    default: appConfig.name,
    template: `%s · ${appConfig.name}`,
  },
  description: appConfig.tagline,
  applicationName: appConfig.name,
  formatDetection: {
    telephone: false,
    address: false,
    email: false,
  },
  appleWebApp: {
    capable: true,
    title: appConfig.name,
    statusBarStyle: "default",
  },
  icons: {
    icon: [
      { url: "/brand/d/favicon.ico?v=2" },
      { url: appConfig.brand.faviconSrc, type: "image/png", sizes: "32x32" },
    ],
    apple: [{ url: appConfig.brand.appIconSrc }],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#ffffff",
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
      className="h-full font-sans"
    >
      <body className="flex min-h-full flex-col bg-paper text-foreground">
        <AppProviders>{children}</AppProviders>
        <Script
          id="tripdito-unsaved-navigation-guard"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{ __html: unsavedNavigationGuard }}
        />
      </body>
    </html>
  );
}
