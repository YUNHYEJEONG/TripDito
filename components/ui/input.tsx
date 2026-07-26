import * as React from "react"
import { Input as InputPrimitive } from "@base-ui/react/input"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

/**
 * 입력란 공통 스타일
 * - 기본: 흰 배경 (활성 입력)
 * - disabled: 회색 배경 (입력 불가)
 */
const inputVariants = cva(
  [
    "h-10 w-full min-w-0 rounded-lg border px-3 py-1 text-[13px]",
    "bg-background text-foreground shadow-none",
    "transition-[color,box-shadow,background-color] outline-none",
    "file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-[13px] file:font-medium file:text-foreground",
    "placeholder:text-[13px] placeholder:text-muted-foreground",
    "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30",
    "disabled:cursor-not-allowed disabled:border-transparent disabled:bg-input disabled:opacity-100 disabled:text-muted-foreground",
    "aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20",
    "dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40",
  ].join(" "),
  {
    variants: {
      variant: {
        /** 기본: 흰 배경 + 테두리 */
        default: "border-[#CFD4DA]",
        /**
         * 입력란 + 액션 버튼 조합용 (default와 동일 서피스, 명시적 별칭)
         */
        field: "border-[#CFD4DA]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
)

function Input({
  className,
  type,
  variant = "default",
  ...props
}: React.ComponentProps<"input"> & VariantProps<typeof inputVariants>) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(inputVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Input, inputVariants }
