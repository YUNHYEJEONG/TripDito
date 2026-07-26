import { formatCurrency } from "@/lib/format/currency";
import { cn } from "@/lib/utils";

export function CurrencyText({
  amount,
  currency,
  className,
}: {
  amount: number;
  currency: string;
  className?: string;
}) {
  return (
    <span className={cn("inline-block tabular-nums text-right", className)}>
      {formatCurrency(amount, currency)}
    </span>
  );
}
