"use client"

import { Checkbox as CheckboxPrimitive } from "@base-ui/react/checkbox"

import { cn } from "@/lib/utils"
import { CheckIcon } from "lucide-react"

function Checkbox({ className, ...props }: CheckboxPrimitive.Root.Props) {
  return (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      className={cn(
        "peer relative flex size-4 shrink-0 items-center justify-center rounded-xs border border-control bg-paper transition-colors duration-120 outline-none hover:border-ink-2 hover:bg-paper-2 active:border-ink active:bg-paper-3 group-has-disabled/field:opacity-50 after:absolute after:-inset-3.5 focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-focus disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-2 aria-invalid:ring-destructive aria-invalid:aria-checked:border-accent-text data-checked:border-accent-text data-checked:bg-accent-text data-checked:text-paper data-checked:hover:bg-accent-text data-checked:active:border-ink data-checked:active:bg-accent-text",
        className
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator
        data-slot="checkbox-indicator"
        className="grid place-content-center text-current transition-none [&>svg]:size-3.5"
      >
        <CheckIcon />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  )
}

export { Checkbox }
