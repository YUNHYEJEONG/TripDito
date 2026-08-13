import { getCurrency, ZERO_DECIMAL_CURRENCIES } from "@/config/currencies";

export function formatCurrency(amount: number, currencyCode: string) {
  const code = currencyCode.trim().toUpperCase();
  const currency = getCurrency(code);

  try {
    const fractionOptions = ZERO_DECIMAL_CURRENCIES.has(code)
      ? { maximumFractionDigits: 0 }
      : { maximumFractionDigits: 2 };

    return new Intl.NumberFormat(currency.locale, {
      style: "currency",
      currency: code,
      ...fractionOptions,
    }).format(amount);
  } catch {
    const suffix = code || currencyCode.trim() || "통화 미지정";
    return `${amount.toLocaleString("ko-KR")} ${suffix}`;
  }
}
