import { getCurrency, ZERO_DECIMAL_CURRENCIES } from "@/config/currencies";

export function formatCurrency(amount: number, currencyCode: string) {
  const currency = getCurrency(currencyCode);
  const code = currency.code;
  try {
    return new Intl.NumberFormat(currency.locale, {
      style: "currency",
      currency: code,
      maximumFractionDigits: ZERO_DECIMAL_CURRENCIES.has(code) ? 0 : 2,
    }).format(amount);
  } catch {
    return `${amount.toLocaleString()} ${currencyCode}`;
  }
}
