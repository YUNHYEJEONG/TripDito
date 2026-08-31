import Link from "next/link";
import { appConfig } from "@/config/app";
import { cn } from "@/lib/utils";

type BrandLogoProps = {
  /**
   * symbol: 하트 체크 마크만
   * wordmark/full: 완성 로고 (마크+TripDito 워드마크 포함)
   */
  variant?: "symbol" | "wordmark" | "full";
  size?: "sm" | "md" | "lg" | "xl";
  href?: string | null;
  className?: string;
};

const SYMBOL_SIZE = {
  sm: 22,
  md: 28,
  lg: 40,
  xl: 72,
} as const;

const LOGO_HEIGHT = {
  sm: 22,
  md: 30,
  lg: 38,
  xl: 56,
} as const;

export function BrandLogo({
  variant = "full",
  size = "md",
  href = "/home",
  className,
}: BrandLogoProps) {
  // 새 로고(logo.svg)는 마크+워드마크가 합쳐진 완성형 — full도 로고 하나만 렌더
  const showSymbol = variant === "symbol";

  const content = (
    <span className={cn("inline-flex items-center", className)}>
      {showSymbol ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={appConfig.brand.symbolSrc}
          alt=""
          width={SYMBOL_SIZE[size]}
          height={SYMBOL_SIZE[size]}
          className="shrink-0 object-contain"
        />
      ) : (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={appConfig.brand.logoSrc}
            alt={appConfig.name}
            style={{ height: LOGO_HEIGHT[size] }}
            className="w-auto max-w-[min(180px,52vw)] object-contain object-left dark:hidden"
          />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={appConfig.brand.logoWhiteSrc}
            alt={appConfig.name}
            style={{ height: LOGO_HEIGHT[size] }}
            className="hidden w-auto max-w-[min(180px,52vw)] object-contain object-left dark:block"
          />
        </>
      )}
      <span className="sr-only">{appConfig.name}</span>
    </span>
  );

  if (href === null) return content;

  return (
    <Link
      href={href}
      className="inline-flex rounded-lg focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/30"
      aria-label={appConfig.name}
    >
      {content}
    </Link>
  );
}
