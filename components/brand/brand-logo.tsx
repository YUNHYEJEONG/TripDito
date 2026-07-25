import Link from "next/link";
import { appConfig } from "@/config/app";
import { cn } from "@/lib/utils";

type BrandLogoProps = {
  /** symbol: 캐리어만 / wordmark: 로고만 / full: 심볼+로고 */
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
  const showSymbol = variant === "symbol" || variant === "full";
  const showLogo = variant === "wordmark" || variant === "full";

  const content = (
    <span className={cn("inline-flex items-center gap-0.5", className)}>
      {showSymbol ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={appConfig.brand.symbolSrc}
          alt=""
          width={SYMBOL_SIZE[size]}
          height={SYMBOL_SIZE[size]}
          className="shrink-0 object-contain"
        />
      ) : null}
      {showLogo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={appConfig.brand.logoSrc}
          alt={appConfig.name}
          style={{ height: LOGO_HEIGHT[size] }}
          className="w-auto max-w-[min(180px,52vw)] object-contain object-left"
        />
      ) : null}
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
