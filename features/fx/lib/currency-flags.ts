import { isKoreaEximSupported } from "@/features/fx/lib/koreaexim";

/** 통화 → 국기 에셋 (public/flags) */
const FLAG_BY_CURRENCY: Record<string, string> = {
  JPY: "/flags/jp.svg",
  USD: "/flags/us.svg",
  EUR: "/flags/eu.svg",
  CNY: "/flags/cn.svg",
  KRW: "/flags/kr.svg",
  TWD: "/flags/tw.svg",
  HKD: "/flags/hk.svg",
};

export function getCurrencyFlagSrc(currency: string): string | null {
  return FLAG_BY_CURRENCY[currency.toUpperCase()] ?? null;
}

export function isFxSupported(currency: string): boolean {
  return isKoreaEximSupported(currency);
}
