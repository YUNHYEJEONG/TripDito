import Link from "next/link";

const HOME_AD = {
  href: "https://taxfreecoupon.com/43?category=859686",
  imageSrc: "/ads/osaka-pass-usj-banner.png",
  alt: "오사카 필수템 — 주유패스 & USJ 최저가 예약하기",
} as const;

/**
 * 홈 광고 배너
 */
export function HomeAdBanner() {
  return (
    <section aria-label="광고">
      <Link
        href={HOME_AD.href}
        target="_blank"
        rel="noopener noreferrer"
        className="block overflow-hidden rounded-2xl focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/30"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={HOME_AD.imageSrc}
          alt={HOME_AD.alt}
          className="aspect-[16/5] w-full object-cover object-center"
        />
      </Link>
    </section>
  );
}
