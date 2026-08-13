"use client"

import * as React from "react"
import { Dialog as SheetPrimitive } from "@base-ui/react/dialog"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { XIcon } from "lucide-react"

function Sheet({ ...props }: SheetPrimitive.Root.Props) {
  return <SheetPrimitive.Root data-slot="sheet" {...props} />
}

function SheetTrigger({ ...props }: SheetPrimitive.Trigger.Props) {
  return <SheetPrimitive.Trigger data-slot="sheet-trigger" {...props} />
}

function SheetClose({ ...props }: SheetPrimitive.Close.Props) {
  return <SheetPrimitive.Close data-slot="sheet-close" {...props} />
}

function SheetPortal({ ...props }: SheetPrimitive.Portal.Props) {
  return <SheetPrimitive.Portal data-slot="sheet-portal" {...props} />
}

function SheetOverlay({ className, ...props }: SheetPrimitive.Backdrop.Props) {
  return (
    <SheetPrimitive.Backdrop
      data-slot="sheet-overlay"
      className={cn(
        "fixed inset-0 z-50 bg-ink/30 transition-opacity duration-[var(--dur-slow)] data-ending-style:opacity-0 data-starting-style:opacity-0",
        className
      )}
      {...props}
    />
  )
}

function SheetContent({
  className,
  children,
  side = "bottom",
  showCloseButton = true,
  ...props
}: SheetPrimitive.Popup.Props & {
  side?: "top" | "right" | "bottom" | "left"
  showCloseButton?: boolean
}) {
  return (
    <SheetPortal>
      <SheetOverlay />
      <SheetPrimitive.Popup
        data-slot="sheet-content"
        data-side={side}
        className={cn(
          "fixed z-50 flex flex-col overflow-hidden bg-popover bg-clip-padding text-sm text-popover-foreground shadow-float outline-none transition-[opacity,transform] duration-200 ease-[var(--ease-out)] data-ending-style:opacity-0 data-starting-style:opacity-0",
          "data-[side=bottom]:inset-x-0 data-[side=bottom]:bottom-0 data-[side=bottom]:mx-auto data-[side=bottom]:max-h-[calc(100dvh_-_env(safe-area-inset-top)_-_0.5rem)] data-[side=bottom]:w-full data-[side=bottom]:max-w-[var(--app-rail-max)] data-[side=bottom]:overscroll-contain data-[side=bottom]:rounded-t-3xl data-[side=bottom]:border data-[side=bottom]:border-b-0 data-[side=bottom]:data-ending-style:translate-y-12 data-[side=bottom]:data-starting-style:translate-y-12",
          "data-[side=left]:inset-y-0 data-[side=left]:left-0 data-[side=left]:h-dvh data-[side=left]:w-[min(90%,24rem)] data-[side=left]:border-r data-[side=left]:pt-[env(safe-area-inset-top)] data-[side=left]:pb-[env(safe-area-inset-bottom)] data-[side=left]:data-ending-style:-translate-x-12 data-[side=left]:data-starting-style:-translate-x-12",
          "data-[side=right]:inset-y-0 data-[side=right]:right-0 data-[side=right]:h-dvh data-[side=right]:w-[min(90%,24rem)] data-[side=right]:border-l data-[side=right]:pt-[env(safe-area-inset-top)] data-[side=right]:pb-[env(safe-area-inset-bottom)] data-[side=right]:data-ending-style:translate-x-12 data-[side=right]:data-starting-style:translate-x-12",
          "data-[side=top]:inset-x-0 data-[side=top]:top-0 data-[side=top]:mx-auto data-[side=top]:max-h-[calc(100dvh_-_env(safe-area-inset-bottom)_-_0.5rem)] data-[side=top]:w-full data-[side=top]:max-w-[var(--app-rail-max)] data-[side=top]:rounded-b-3xl data-[side=top]:border-b data-[side=top]:pt-[env(safe-area-inset-top)] data-[side=top]:data-ending-style:-translate-y-12 data-[side=top]:data-starting-style:-translate-y-12",
          "data-[side=bottom]:after:block data-[side=bottom]:after:h-[env(safe-area-inset-bottom)] data-[side=bottom]:after:shrink-0 data-[side=bottom]:after:content-['']",
          className
        )}
        {...props}
      >
        {children}
        {showCloseButton && (
          <SheetPrimitive.Close
            data-slot="sheet-close"
            render={
              <Button
                variant="ghost"
                className="absolute top-3 right-3 bg-secondary"
                size="icon-sm"
              />
            }
          >
            <XIcon />
            <span className="sr-only">닫기</span>
          </SheetPrimitive.Close>
        )}
      </SheetPrimitive.Popup>
    </SheetPortal>
  )
}

function SheetHandle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sheet-handle"
      aria-hidden
      className={cn(
        "mx-auto mt-2 h-1 w-10 shrink-0 rounded-full bg-paper-3",
        className
      )}
      {...props}
    />
  )
}

function SheetHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sheet-header"
      className={cn("shrink-0 flex flex-col gap-2 px-4 pt-4 pb-3", className)}
      {...props}
    />
  )
}

function SheetBody({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sheet-body"
      className={cn(
        "min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-4",
        className
      )}
      {...props}
    />
  )
}

function SheetFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sheet-footer"
      className={cn(
        "mt-auto flex shrink-0 flex-col gap-2 border-t border-rule bg-paper px-4 pt-3 pb-4",
        className
      )}
      {...props}
    />
  )
}

function SheetTitle({ className, ...props }: SheetPrimitive.Title.Props) {
  return (
    <SheetPrimitive.Title
      data-slot="sheet-title"
      className={cn(
        "font-heading text-[18px] leading-snug font-semibold text-foreground",
        className
      )}
      {...props}
    />
  )
}

function SheetDescription({
  className,
  ...props
}: SheetPrimitive.Description.Props) {
  return (
    <SheetPrimitive.Description
      data-slot="sheet-description"
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  )
}

export {
  Sheet,
  SheetTrigger,
  SheetClose,
  SheetContent,
  SheetHandle,
  SheetHeader,
  SheetBody,
  SheetFooter,
  SheetTitle,
  SheetDescription,
}
