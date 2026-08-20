import Image from "next/image";
import Link from "next/link";
import { appConfig } from "@/config/app";
import { cn } from "@/lib/utils";

type BrandLogoProps = {
  /** symbol: D 리본 하트 / wordmark: TripDito / full: 승인된 D 락업 */
  variant?: "symbol" | "wordmark" | "full";
  size?: "sm" | "md" | "lg" | "xl";
  href?: string | null;
  className?: string;
};

const RENDER_HEIGHT = {
  symbol: { sm: 20, md: 26, lg: 38, xl: 60 },
  wordmark: { sm: 16, md: 22, lg: 30, xl: 44 },
  full: { sm: 20, md: 26, lg: 34, xl: 52 },
} as const;

const SOURCE = {
  symbol: appConfig.brand.symbolSrc,
  wordmark: appConfig.brand.logoSrc,
  full: appConfig.brand.lockupSrc,
} as const;

const INTRINSIC_SIZE = {
  symbol: { width: 70, height: 60 },
  wordmark: { width: 166, height: 42 },
  full: { width: 244, height: 60 },
} as const;

export function BrandLogo({
  variant = "full",
  size = "md",
  href = "/home",
  className,
}: BrandLogoProps) {
  const intrinsic = INTRINSIC_SIZE[variant];
  const height = RENDER_HEIGHT[variant][size];
  const width = Math.round((height * intrinsic.width) / intrinsic.height);

  const content = (
    <span className={cn("inline-flex items-center", className)}>
      <Image
        src={SOURCE[variant]}
        alt=""
        width={intrinsic.width}
        height={intrinsic.height}
        loading="eager"
        unoptimized
        style={{ width, height }}
        className="shrink-0 object-contain"
      />
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
