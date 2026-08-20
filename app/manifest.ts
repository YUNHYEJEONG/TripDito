import type { MetadataRoute } from "next";
import { appConfig } from "@/config/app";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: appConfig.name,
    short_name: appConfig.name,
    description: appConfig.tagline,
    start_url: "/home",
    display: "standalone",
    orientation: "portrait",
    background_color: "#ffffff",
    theme_color: "#4949d7",
    categories: ["travel", "shopping", "lifestyle"],
    icons: [
      {
        src: "/brand/d/pwa-192.png?v=2",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/brand/d/pwa-512.png?v=2",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/brand/d/pwa-512.png?v=2",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
