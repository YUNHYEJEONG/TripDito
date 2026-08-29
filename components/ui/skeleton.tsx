import { cn } from "@/lib/utils";

/** 로딩 자리 표시 — 콘텐츠와 같은 자리·크기로 두고 은은하게 깜빡인다 */
function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn("animate-pulse rounded-md bg-muted", className)}
      {...props}
    />
  );
}

export { Skeleton };
