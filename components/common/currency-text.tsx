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
    <span className={cn("tabular-nums", className)}>
      {formatCurrency(amount, currency)}
    </span>
  );
}
