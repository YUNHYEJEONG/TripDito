"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { appConfig } from "@/config/app";

/**
 * 짧은 로고 인터랙션 후 메인(/home)으로 자동 진입
 */
export default function LandingPage() {
  const router = useRouter();
  const [phase, setPhase] = useState<"enter" | "hold" | "exit">("enter");

  useEffect(() => {
    const enterTimer = window.setTimeout(() => setPhase("hold"), 400);
    const exitTimer = window.setTimeout(() => setPhase("exit"), 1600);
    const navTimer = window.setTimeout(() => {
      router.replace("/home");
    }, 2100);

    return () => {
      window.clearTimeout(enterTimer);
      window.clearTimeout(exitTimer);
      window.clearTimeout(navTimer);
    };
  }, [router]);

  return (
    <main className="brand-gradient relative flex min-h-dvh min-w-[320px] flex-col items-center justify-center overflow-hidden px-6">
      <div
        className={[
          "relative z-10 flex flex-col items-center gap-4 transition-all duration-500 ease-out",
          phase === "enter" ? "translate-y-3 scale-95 opacity-0" : "",
          phase === "hold" ? "translate-y-0 scale-100 opacity-100" : "",
          phase === "exit" ? "-translate-y-2 scale-105 opacity-0" : "",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={appConfig.brand.symbolWhiteSrc}
          alt=""
          className={[
            "size-16 object-contain transition-transform duration-700 ease-out",
            phase === "hold" ? "scale-100" : "scale-95",
          ].join(" ")}
        />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={appConfig.brand.logoTextWhiteSrc}
          alt={appConfig.name}
          className={[
            "h-12 w-auto max-w-[min(240px,70vw)] object-contain transition-transform duration-700 ease-out md:h-14",
            phase === "hold" ? "scale-100" : "scale-95",
          ].join(" ")}
        />
        <p className="text-center text-[14px] font-medium text-white/85">
          {appConfig.tagline}
        </p>
      </div>
    </main>
  );
}
