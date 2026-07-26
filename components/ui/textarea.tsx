import * as React from "react"

import { cn } from "@/lib/utils"

/**
 * 텍스트영역 공통 스타일
 * - 기본: 흰 배경 (활성 입력)
 * - disabled: 회색 배경 (입력 불가)
 */
function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex field-sizing-content min-h-16 w-full resize-none rounded-lg border border-[#CFD4DA] bg-background px-3 py-3 text-[13px] shadow-none transition-[color,box-shadow,background-color] outline-none placeholder:text-[13px] placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30 disabled:cursor-not-allowed disabled:border-transparent disabled:bg-input disabled:opacity-100 disabled:text-muted-foreground aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40",
        className,
      )}
      {...props}
    />
  )
}

export { Textarea }
