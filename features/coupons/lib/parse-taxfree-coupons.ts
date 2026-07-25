import type { TaxFreeCoupon } from "../types";

const REGION_KEYWORDS = [
  "도쿄",
  "오사카",
  "후쿠오카",
  "홋카이도",
  "삿포로",
  "나리타",
  "간사이",
  "규슈",
  "오키나와",
] as const;

const MERCHANT_PATTERNS: { match: RegExp; merchant: string }[] = [
  { match: /돈키호테/, merchant: "돈키호테" },
  { match: /알펜/, merchant: "알펜" },
  { match: /오가약국/, merchant: "오가약국" },
  { match: /빅\s*카메라/, merchant: "빅카메라" },
  { match: /나리타/, merchant: "나리타 면세점" },
  { match: /삿포로\s*드럭/, merchant: "삿포로 드럭스토어" },
  { match: /다이코쿠/, merchant: "다이코쿠 드럭" },
  { match: /택시/, merchant: "택시" },
  { match: /마츠모토/, merchant: "마츠모토키요시" },
  { match: /이온몰/, merchant: "이온몰" },
  { match: /유니버설/, merchant: "USJ" },
  { match: /도쿄\s*교통/, merchant: "도쿄 교통패스" },
  { match: /오사카\s*교통/, merchant: "오사카 교통패스" },
  { match: /도쿄타워/, merchant: "도쿄타워" },
  { match: /스카이트리/, merchant: "스카이트리" },
  { match: /드럭\s*일레븐/, merchant: "드럭 일레븐" },
  { match: /츠루하/, merchant: "츠루하" },
  { match: /Joshin/i, merchant: "Joshin" },
  { match: /도큐핸즈/, merchant: "도큐핸즈" },
  { match: /오르골/, merchant: "오르골의 전당" },
  { match: /간사이\s*공항/, merchant: "간사이 공항 면세점" },
  { match: /로손/, merchant: "로손" },
];

function decodeHtml(text: string) {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function stripTags(html: string) {
  return decodeHtml(html.replace(/<[^>]+>/g, ""));
}

function extractBenefit(title: string): string {
  const pct = title.match(/(\d+)\s*%/);
  if (pct) return `${pct[1]}% OFF`;
  const yen = title.match(/(\d[\d,]*)\s*엔/);
  if (yen) return `¥${yen[1]}`;
  if (/할인/.test(title)) return "할인";
  return "쿠폰";
}

function extractMerchant(title: string): string {
  for (const { match, merchant } of MERCHANT_PATTERNS) {
    if (match.test(title)) return merchant;
  }
  return title.slice(0, 16);
}

function extractRegions(title: string): string[] {
  const regions = REGION_KEYWORDS.filter((region) => title.includes(region));
  if (regions.length === 0 || /전국/.test(title)) {
    return regions.length ? [...regions, "전국"] : ["전국"];
  }
  return [...regions];
}

function slugId(title: string, href: string, index: number) {
  const fromHref = href.replace(/^https?:\/\//, "").replace(/[^\w]+/g, "-");
  return `tf-${index}-${fromHref.slice(0, 40)}-${title.slice(0, 8)}`;
}

/**
 * taxfreecoupon.com/70 HTML에서 쿠폰 리스트 링크를 추출합니다.
 * "현재 제공되지 않는" 안내 이전의 활성 목록만 사용합니다.
 */
export function parseTaxFreeCouponHtml(html: string): {
  coupons: TaxFreeCoupon[];
  updatedAt: string | null;
} {
  const updatedAtMatch = html.match(/(\d{4}-\d{2}-\d{2})\s*업데이트/);
  const updatedAt = updatedAtMatch?.[1] ?? null;

  const inactiveMarker = html.search(
    /아래의\s*쿠폰은[\s\S]{0,80}제공\s*되지\s*않고/,
  );
  const activeHtml =
    inactiveMarker >= 0 ? html.slice(0, inactiveMarker) : html;

  const liBlocks = [
    ...activeHtml.matchAll(/<li\b[^>]*>([\s\S]*?)<\/li>/gi),
  ];

  const coupons: TaxFreeCoupon[] = [];
  const seen = new Set<string>();

  for (const match of liBlocks) {
    const block = match[1] ?? "";
    const linkMatch = block.match(
      /<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/i,
    );
    if (!linkMatch) continue;

    const href = decodeHtml(linkMatch[1] ?? "").trim();
    const title = stripTags(linkMatch[2] ?? "");
    if (!href || !title) continue;
    if (!/할인|쿠폰|패스|링크/.test(title)) continue;
    // 카카오 채널 등 비쿠폰 링크 제외
    if (/카카오|채널\s*추가|재사용\s*방법/.test(title)) continue;

    const key = `${href}::${title}`;
    if (seen.has(key)) continue;
    seen.add(key);

    coupons.push({
      id: slugId(title, href, coupons.length),
      title,
      href,
      benefit: extractBenefit(title),
      country: "일본",
      regions: extractRegions(title),
      active: true,
      merchant: extractMerchant(title),
    });
  }

  return { coupons, updatedAt };
}
