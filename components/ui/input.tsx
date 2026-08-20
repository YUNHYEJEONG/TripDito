import * as React from "react"
import { Input as InputPrimitive } from "@base-ui/react/input"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const inputVariants = cva(
  "h-12 w-full min-w-0 rounded-xl border px-3.5 py-1 text-[16px] transition-[color,background-color,border-color,box-shadow] duration-120 outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-[15px] file:font-medium file:text-foreground placeholder:text-[15px] placeholder:text-ink-3 focus-visible:border-focus focus-visible:bg-paper focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-solid focus-visible:outline-focus disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-2 aria-invalid:ring-destructive/20",
  {
    variants: {
      variant: {
        /** 기본: 터치 화면에서 비활성으로 보이지 않는 filled 필드 */
        default: "border-transparent bg-paper-2 shadow-none hover:bg-paper-3",
        /**
         * 입력란 + 액션 버튼 조합용.
         * 비활성처럼 보이지 않도록 흰 배경 + 테두리.
         */
        field:
          "h-11 rounded-lg border-rule bg-background shadow-none hover:border-control",
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
