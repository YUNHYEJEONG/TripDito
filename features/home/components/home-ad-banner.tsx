"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

const HOME_ADS = [
  {
    id: "tokyo",
    href: "/shopping",
    imageSrc: "/ads/home-ad-tokyo.png?v=3",
    alt: "도쿄 쇼핑 특가 — 면세점 & 돈키호테 구경하기",
  },
  {
    id: "taiwan",
    href: "/shopping#coupons",
    imageSrc: "/ads/home-ad-taiwan.png?v=3",
    alt: "대만 여행 쿠폰 — 야시장 & 면세 할인 다운받기",
  },
  {
    id: "osaka",
    href: "https://taxfreecoupon.com/43?category=859686",
    imageSrc: "/ads/home-ad-osaka.png?v=3",
    alt: "오사카 패스 특가 — 교통+명소 한 번에 예약하기",
    external: true,
  },
] as const;

const AUTO_MS = 3000;

/**
 * 홈 광고 롤링 배너
 */
export function HomeAdBanner() {
  const [index, setIndex] = useState(0);
  const timerRef = useRef<number | null>(null);
  const pausedRef = useRef(false);
  const total = HOME_ADS.length;

  useEffect(() => {
    const tick = () => {
      if (pausedRef.current) return;
      setIndex((prev) => (prev + 1) % total);
    };
    timerRef.current = window.setInterval(tick, AUTO_MS);
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
    };
  }, [total]);

  const pause = () => {
    pausedRef.current = true;
  };
  const resume = () => {
    pausedRef.current = false;
  };

  return (
    <section
      aria-label="광고"
      className="relative"
      onMouseEnter={pause}
      onMouseLeave={resume}
      onTouchStart={pause}
      onTouchEnd={resume}
    >
      <div className="relative overflow-hidden rounded-2xl bg-[#0A162B]">
        <div
          className="flex transition-transform duration-500 ease-out"
          style={{ transform: `translateX(-${index * 100}%)` }}
        >
          {HOME_ADS.map((ad) => {
            const className =
              "block w-full shrink-0 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/30";
            const img = (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={ad.imageSrc}
                alt={ad.alt}
                className="aspect-[16/5] w-full object-cover object-center"
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
                >
                  {img}
                </a>
              );
            }

            return (
              <Link key={ad.id} href={ad.href} className={className}>
                {img}
              </Link>
            );
          })}
        </div>
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-2.5 flex justify-center gap-1.5">
        {HOME_ADS.map((ad, i) => (
          <button
            key={ad.id}
            type="button"
            aria-label={`${i + 1}번째 광고`}
            aria-current={i === index}
            className={cn(
              "pointer-events-auto size-1.5 rounded-full transition-colors",
              i === index ? "bg-white" : "bg-white/45",
            )}
            onClick={() => setIndex(i)}
          />
        ))}
      </div>
    </section>
  );
}
