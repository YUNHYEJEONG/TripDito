"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { appConfig } from "@/config/app";
import { cn } from "@/lib/utils";

type LandingPhase = "enter" | "hold" | "exit";

/** 운영판의 짧은 로고 액션 뒤 홈으로 진입한다. */
export default function LandingPage() {
  const router = useRouter();
  const [phase, setPhase] = useState<LandingPhase>("enter");

  useEffect(() => {
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (reduceMotion) {
      const reducedMotionTimer = window.setTimeout(() => {
        router.replace("/home");
      }, 250);
      return () => window.clearTimeout(reducedMotionTimer);
    }

    const enterTimer = window.setTimeout(() => setPhase("hold"), 400);
    const exitTimer = window.setTimeout(() => setPhase("exit"), 1_600);
    const navigationTimer = window.setTimeout(() => {
      router.replace("/home");
    }, 2_100);

    return () => {
      window.clearTimeout(enterTimer);
      window.clearTimeout(exitTimer);
      window.clearTimeout(navigationTimer);
    };
  }, [router]);

  return (
    <main className="app-rail mx-auto flex min-h-dvh w-full min-w-[320px] max-w-[var(--app-rail-max)] flex-col items-center justify-center overflow-hidden bg-paper px-6">
      <div
        className={cn(
          "relative z-10 flex flex-col items-center gap-4 transition-all duration-500 ease-[var(--ease-out)] motion-reduce:transition-none",
          phase === "enter" &&
            "translate-y-3 scale-95 opacity-0 motion-reduce:translate-y-0 motion-reduce:scale-100 motion-reduce:opacity-100",
          phase === "hold" && "translate-y-0 scale-100 opacity-100",
          phase === "exit" && "-translate-y-2 scale-105 opacity-0",
        )}
      >
        <Image
          src="/brand/symbol.png"
          alt=""
          width={1_075}
          height={1_075}
          priority
          className={cn(
            "size-[4.5rem] object-contain transition-transform duration-700 ease-[var(--ease-out)] motion-reduce:transition-none",
            phase === "hold" ? "scale-100" : "scale-95",
          )}
        />
        <Image
          src="/brand/logo.png"
          alt={appConfig.name}
          width={821}
          height={324}
          priority
          className={cn(
            "h-12 w-auto max-w-[min(240px,70vw)] object-contain transition-transform duration-700 ease-[var(--ease-out)] motion-reduce:transition-none",
            phase === "hold" ? "scale-100" : "scale-95",
          )}
        />
        <p className="text-center text-[14px] font-medium text-ink-2">
          {appConfig.tagline}
        </p>
      </div>
    </main>
  );
}
