"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Pause, Play } from "lucide-react";
import {
  getNextHomeAdIndex,
  HOME_AD_INTERVAL_MS,
  HOME_ADS,
} from "@/features/home/data/home-ad-carousel";
import { cn } from "@/lib/utils";

/** 운영판과 같은 3초 주기의 홈 광고 롤링 배너. */
export function HomeAdBanner() {
  const [index, setIndex] = useState(0);
  const [userPaused, setUserPaused] = useState(false);
  const pausedRef = useRef(false);
  const total = HOME_ADS.length;

  useEffect(() => {
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    let timer: number | null = null;

    const syncTimer = () => {
      if (timer !== null) {
        window.clearInterval(timer);
        timer = null;
      }
      if (motionQuery.matches) return;

      timer = window.setInterval(() => {
        if (
          !userPaused &&
          !pausedRef.current &&
          document.visibilityState === "visible"
        ) {
          setIndex((current) => getNextHomeAdIndex(current, total));
        }
      }, HOME_AD_INTERVAL_MS);
    };

    syncTimer();
    motionQuery.addEventListener("change", syncTimer);

    return () => {
      motionQuery.removeEventListener("change", syncTimer);
      if (timer !== null) {
        window.clearInterval(timer);
      }
    };
  }, [total, userPaused]);

  return (
    <section
      aria-label="여행 쇼핑 추천"
      aria-roledescription="carousel"
      className="relative"
      onMouseEnter={() => {
        pausedRef.current = true;
      }}
      onMouseLeave={() => {
        pausedRef.current = false;
      }}
      onTouchStart={() => {
        pausedRef.current = true;
      }}
      onTouchEnd={() => {
        pausedRef.current = false;
      }}
      onFocusCapture={() => {
        pausedRef.current = true;
      }}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          pausedRef.current = false;
        }
      }}
    >
      <div className="overflow-hidden rounded-2xl bg-ink">
        <div
          className="flex transition-transform duration-500 ease-[var(--ease-out)] motion-reduce:transition-none"
          style={{ transform: `translateX(-${index * 100}%)` }}
        >
          {HOME_ADS.map((ad, adIndex) => {
            const active = adIndex === index;
            const className =
              "relative block aspect-[16/5] w-full shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-focus";
            const image = (
              <Image
                src={ad.imageSrc}
                alt={ad.alt}
                fill
                sizes="(max-width: 480px) calc(100vw - 2rem), 448px"
                priority={adIndex === 0}
                className="object-cover object-center"
                draggable={false}
              />
            );

            if ("external" in ad && ad.external) {
              return (
                <a
                  key={ad.id}
                  href={ad.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={className}
                  tabIndex={active ? undefined : -1}
                  aria-hidden={!active}
                >
                  {image}
                </a>
              );
            }

            return (
              <Link
                key={ad.id}
                href={ad.href}
                className={className}
                tabIndex={active ? undefined : -1}
                aria-hidden={!active}
              >
                {image}
              </Link>
            );
          })}
        </div>
      </div>

      <button
        type="button"
        aria-label={userPaused ? "추천 자동 넘김 재생" : "추천 자동 넘김 일시정지"}
        aria-pressed={userPaused}
        className="absolute top-1 right-1 flex size-11 items-center justify-center rounded-full text-paper outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-focus"
        onClick={() => {
          setUserPaused((paused) => {
            const nextPaused = !paused;
            if (!nextPaused) {
              pausedRef.current = false;
            }
            return nextPaused;
          });
        }}
      >
        <span className="flex size-7 items-center justify-center rounded-full bg-ink/70 shadow-sm">
          {userPaused ? (
            <Play className="size-3.5 fill-current" aria-hidden />
          ) : (
            <Pause className="size-3.5 fill-current" aria-hidden />
          )}
        </span>
      </button>

      <div className="absolute inset-x-0 bottom-0 flex justify-center">
        {HOME_ADS.map((ad, adIndex) => (
          <button
            key={ad.id}
            type="button"
            aria-label={`${adIndex + 1}번째 추천 보기`}
            aria-current={adIndex === index ? "true" : undefined}
            className="group flex size-11 items-end justify-center pb-2 outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-focus"
            onClick={() => setIndex(adIndex)}
          >
            <span
              className={cn(
                "block size-1.5 rounded-full transition-colors duration-120 motion-reduce:transition-none",
                adIndex === index ? "bg-paper" : "bg-paper/45",
              )}
              aria-hidden
            />
          </button>
        ))}
      </div>
    </section>
  );
}
