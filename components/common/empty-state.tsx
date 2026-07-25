import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  GrayCard,
  GrayCardDescription,
  GrayCardTitle,
} from "@/components/ui/gray-card";

export function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
  secondaryLabel,
  onSecondary,
  className,
}: {
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  secondaryLabel?: string;
  onSecondary?: () => void;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <GrayCard>
        <GrayCardTitle>{title}</GrayCardTitle>
        {description ? (
          <GrayCardDescription>{description}</GrayCardDescription>
        ) : null}
        {(actionLabel && onAction) || (secondaryLabel && onSecondary) ? (
          <div className="mt-1 flex flex-col gap-2 sm:flex-row">
            {actionLabel && onAction ? (
              <Button className="w-full sm:w-auto" onClick={onAction}>
                {actionLabel}
              </Button>
            ) : null}
            {secondaryLabel && onSecondary ? (
              <Button
                variant="surfaceOutline"
                className="w-full sm:w-auto"
                onClick={onSecondary}
              >
                {secondaryLabel}
              </Button>
            ) : null}
          </div>
        ) : null}
      </GrayCard>
    </div>
  );
}
