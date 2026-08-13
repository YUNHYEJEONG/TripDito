import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"
import { LoaderCircle } from "lucide-react"
import type { ReactNode } from "react"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-lg border border-transparent bg-clip-padding text-[15px] font-semibold whitespace-nowrap transition-[color,background-color,transform,opacity] duration-120 ease-[var(--ease-out)] outline-none select-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-focus active:not-aria-[haspopup]:scale-[0.98] disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:cursor-not-allowed aria-disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-2 aria-invalid:ring-destructive [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "press-overlay bg-accent-text text-primary-foreground hover:bg-accent-text",
        outline:
          "border-border bg-background text-foreground hover:bg-secondary active:bg-paper-3 aria-expanded:bg-secondary",
        /** 회색 서피스(GrayCard 등) 위 — 흰 배경 + 테두리로 구분 */
        surfaceOutline:
          "border-control bg-background text-foreground hover:bg-paper-2 active:bg-paper-3 aria-expanded:bg-paper-2",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-paper-3 active:bg-paper-3 aria-expanded:bg-secondary",
        ghost:
          "hover:bg-secondary hover:text-foreground active:bg-paper-3 aria-expanded:bg-secondary",
        highlight:
          "bg-highlight text-highlight-foreground hover:bg-highlight/90 active:bg-highlight/80",
        destructive:
          "bg-destructive/10 text-ink hover:bg-destructive/15 active:bg-destructive/20 focus-visible:border-destructive focus-visible:ring-destructive",
        link:
          "text-accent-text underline-offset-4 hover:underline active:scale-100 active:text-ink font-medium",
      },
      size: {
        default:
          "h-11 gap-2 px-4 has-data-[icon=inline-end]:pr-3 has-data-[icon=inline-start]:pl-3",
        xs: "h-11 gap-1 px-3 text-xs font-medium has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-11 gap-1 px-3 text-sm has-data-[icon=inline-end]:pr-3 has-data-[icon=inline-start]:pl-3",
        /** 입력란(h-11·rounded-lg) 옆 액션 — 높이·라운드·타이포를 필드에 맞춤 */
        fieldAction:
          "h-11 gap-1 rounded-lg px-3 text-[13px] font-semibold leading-none has-data-[icon=inline-end]:pr-3 has-data-[icon=inline-start]:pl-3",
        lg: "h-12 gap-2 px-5 text-base has-data-[icon=inline-end]:pr-4 has-data-[icon=inline-start]:pl-4",
        icon: "size-11",
        "icon-xs": "size-11 [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-11",
        "icon-lg": "size-12",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  loading = false,
  loadingLabel,
  children,
  disabled,
  ...props
}: ButtonPrimitive.Props &
  VariantProps<typeof buttonVariants> & {
    loading?: boolean
    loadingLabel?: ReactNode
  }) {
  return (
    <ButtonPrimitive
      data-slot="button"
      data-loading={loading ? "" : undefined}
      aria-busy={loading || undefined}
      disabled={disabled || loading}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    >
      {loading ? (
        <LoaderCircle
          data-icon="inline-start"
          className="size-4 animate-spin"
          aria-hidden
        />
      ) : null}
      {loading && loadingLabel !== undefined ? loadingLabel : children}
    </ButtonPrimitive>
  )
}

export { Button, buttonVariants }
