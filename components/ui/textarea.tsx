import * as React from "react"

import { cn } from "@/lib/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex field-sizing-content min-h-24 w-full resize-none rounded-lg border border-control bg-paper px-3 py-3 text-[15px] transition-[color,background-color] duration-120 outline-2 outline-transparent outline-offset-1 placeholder:text-[15px] placeholder:text-ink-3 hover:bg-paper-2 focus-visible:outline-focus disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:outline-destructive",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
