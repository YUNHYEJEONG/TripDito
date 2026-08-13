import Link from "next/link";
import Image from "next/image";
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
    <span className={cn("inline-flex items-center gap-1", className)}>
      {showSymbol ? (
        <Image
          src="/brand/symbol.png"
          alt=""
          width={SYMBOL_SIZE[size]}
          height={SYMBOL_SIZE[size]}
          className="shrink-0 object-contain"
        />
      ) : null}
      {showLogo ? (
        <Image
          src="/brand/logo.png"
          alt=""
          width={Math.round((LOGO_HEIGHT[size] * 821) / 324)}
          height={LOGO_HEIGHT[size]}
          loading="eager"
          className="w-auto object-contain object-left"
        />
      ) : null}
      <span className="sr-only">{appConfig.name}</span>
    </span>
  );

  if (href === null) return content;

  return (
    <Link
      href={href}
      className="inline-flex min-h-11 items-center rounded-lg px-1 outline-none transition-colors duration-120 hover:bg-paper-2 active:bg-paper-3 focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-paper"
      aria-label={appConfig.name}
    >
      {content}
    </Link>
  );
}
