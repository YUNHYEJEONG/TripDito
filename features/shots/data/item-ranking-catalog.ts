import type { ItemRankingPeriod } from "../utils/item-ranking";

/** 운영판에서 사용하던 읽기 전용 잇템 랭킹 카탈로그. 저장소에는 기록하지 않습니다. */
export type CatalogRankedItem = {
  readonly id: string;
  readonly rank: number;
  readonly name: string;
  readonly localName?: string;
  readonly city: string;
  readonly country: string;
  readonly packCount: number;
  readonly priceLabel: string;
  readonly delta: number | null;
  readonly tone: string;
  readonly imageSrc: string;
};

const IMG = "/demo/item-ranking";

const REALTIME = Object.freeze(
  [
    {
      id: "rt-1",
      rank: 1,
      name: "시세이도 화이트루센트 세럼",
      localName: "資生堂 ホワイトルーセント",
      city: "도쿄",
      country: "일본",
      packCount: 1284,
      priceLabel: "¥4,800",
      delta: 2,
      tone: "#FFE8EC",
      imageSrc: `${IMG}/rank-01-serum.png`,
    },
    {
      id: "rt-2",
      rank: 2,
      name: "킷캣 사쿠라 맛 12개입",
      city: "오사카",
      country: "일본",
      packCount: 1102,
      priceLabel: "¥980",
      delta: 0,
      tone: "#FFF3E0",
      imageSrc: `${IMG}/rank-02-kitkat.png`,
    },
    {
      id: "rt-3",
      rank: 3,
      name: "다이소 캐릭터 파우치",
      city: "후쿠오카",
      country: "일본",
      packCount: 956,
      priceLabel: "¥550",
      delta: -1,
      tone: "#E8F4FF",
      imageSrc: `${IMG}/rank-03-pouch.png`,
    },
    {
      id: "rt-4",
      rank: 4,
      name: "마츠키요 비타민C 1000",
      city: "도쿄",
      country: "일본",
      packCount: 841,
      priceLabel: "¥1,280",
      delta: 5,
      tone: "#EAF8F0",
      imageSrc: `${IMG}/rank-04-vitamin.png`,
    },
    {
      id: "rt-5",
      rank: 5,
      name: "타이페이 펑리수 파인애플 케이크",
      city: "타이베이",
      country: "대만",
      packCount: 792,
      priceLabel: "NT$280",
      delta: null,
      tone: "#FFF8E1",
      imageSrc: `${IMG}/rank-05-pineapple.png`,
    },
    {
      id: "rt-6",
      rank: 6,
      name: "돈키 로얄 젤리빈 믹스",
      city: "오사카",
      country: "일본",
      packCount: 720,
      priceLabel: "¥1,100",
      delta: 1,
      tone: "#F3E8FF",
      imageSrc: `${IMG}/rank-06-jellybeans.png`,
    },
    {
      id: "rt-7",
      rank: 7,
      name: "올리브영 선크림 SPF50+",
      city: "서울",
      country: "한국",
      packCount: 688,
      priceLabel: "₩18,900",
      delta: -2,
      tone: "#E0F7FA",
      imageSrc: `${IMG}/rank-07-sunscreen.png`,
    },
    {
      id: "rt-8",
      rank: 8,
      name: "방콕 망고 스티키라이스 키트",
      city: "방콕",
      country: "태국",
      packCount: 641,
      priceLabel: "฿320",
      delta: 3,
      tone: "#FFFDE7",
      imageSrc: `${IMG}/rank-08-mango.png`,
    },
    {
      id: "rt-9",
      rank: 9,
      name: "로히토 쿨링 파스 40매",
      city: "도쿄",
      country: "일본",
      packCount: 598,
      priceLabel: "¥1,650",
      delta: 0,
      tone: "#E8EEF9",
      imageSrc: `${IMG}/rank-09-patches.png`,
    },
    {
      id: "rt-10",
      rank: 10,
      name: "홍콩 에그타르트 6입",
      city: "홍콩",
      country: "홍콩",
      packCount: 552,
      priceLabel: "HK$68",
      delta: -3,
      tone: "#FBE9E7",
      imageSrc: `${IMG}/rank-10-eggtart.png`,
    },
    {
      id: "rt-11",
      rank: 11,
      name: "유니클로 에어리즘 티셔츠",
      city: "오사카",
      country: "일본",
      packCount: 510,
      priceLabel: "¥1,490",
      delta: 4,
      tone: "#ECEFF1",
      imageSrc: `${IMG}/rank-11-tshirt.png`,
    },
    {
      id: "rt-12",
      rank: 12,
      name: "다낭 카사바 칩 대용량",
      city: "다낭",
      country: "베트남",
      packCount: 477,
      priceLabel: "₫95,000",
      delta: 1,
      tone: "#F1F8E9",
      imageSrc: `${IMG}/rank-12-cassava.png`,
    },
    {
      id: "rt-13",
      rank: 13,
      name: "무인양품 여행용 파우치 세트",
      city: "도쿄",
      country: "일본",
      packCount: 449,
      priceLabel: "¥1,990",
      delta: -1,
      tone: "#EFEBE9",
      imageSrc: `${IMG}/rank-13-muji.png`,
    },
    {
      id: "rt-14",
      rank: 14,
      name: "세부 말롱고 건조망고",
      city: "세부",
      country: "필리핀",
      packCount: 412,
      priceLabel: "₱280",
      delta: null,
      tone: "#FFF3E0",
      imageSrc: `${IMG}/rank-14-driedmango.png`,
    },
    {
      id: "rt-15",
      rank: 15,
      name: "상하이 화이트래빗 캔디",
      city: "상하이",
      country: "중국",
      packCount: 388,
      priceLabel: "¥28",
      delta: 2,
      tone: "#FCE4EC",
      imageSrc: `${IMG}/rank-15-candy.png`,
    },
    {
      id: "rt-16",
      rank: 16,
      name: "제주 감귤칩 3팩",
      city: "제주",
      country: "한국",
      packCount: 361,
      priceLabel: "₩12,000",
      delta: 0,
      tone: "#FFF8E1",
      imageSrc: `${IMG}/rank-16-tangerine.png`,
    },
    {
      id: "rt-17",
      rank: 17,
      name: "파리 라뒤레 마카롱 박스",
      city: "파리",
      country: "프랑스",
      packCount: 334,
      priceLabel: "€28",
      delta: -4,
      tone: "#F3E5F5",
      imageSrc: `${IMG}/rank-17-macaron.png`,
    },
    {
      id: "rt-18",
      rank: 18,
      name: "싱가포르 카야토스트 스프레드",
      city: "싱가포르",
      country: "싱가포르",
      packCount: 301,
      priceLabel: "S$8.90",
      delta: 1,
      tone: "#E8F5E9",
      imageSrc: `${IMG}/rank-18-kaya.png`,
    },
    {
      id: "rt-19",
      rank: 19,
      name: "괌 ABC 마카다미아 초콜릿",
      city: "괌",
      country: "미국",
      packCount: 276,
      priceLabel: "$14.99",
      delta: 6,
      tone: "#E3F2FD",
      imageSrc: `${IMG}/rank-19-macadamia.png`,
    },
    {
      id: "rt-20",
      rank: 20,
      name: "부산 어묵 스낵 세트",
      city: "부산",
      country: "한국",
      packCount: 248,
      priceLabel: "₩9,800",
      delta: -2,
      tone: "#E0F2F1",
      imageSrc: `${IMG}/rank-20-fishcake.png`,
    },
  ].map((item) => Object.freeze(item)),
) satisfies ReadonlyArray<CatalogRankedItem>;

function remix(seed: number, packBoost: number) {
  return Object.freeze(
    [...REALTIME]
      .sort((a, b) => {
        const aHash = (a.rank * 17 + seed) % 23;
        const bHash = (b.rank * 17 + seed) % 23;
        return aHash - bHash;
      })
      .map((item, index) =>
        Object.freeze({
          ...item,
          id: `${seed}-${item.id}`,
          rank: index + 1,
          packCount: Math.round(
            item.packCount * packBoost + ((index * 13) % 40),
          ),
          delta: index < 3 ? null : ((index * 3 + seed) % 7) - 3,
        }),
      ),
  ) satisfies ReadonlyArray<CatalogRankedItem>;
}

export const ITEM_RANKING_CATALOG = Object.freeze({
  realtime: REALTIME,
  weekly: remix(11, 4.2),
  monthly: remix(29, 18),
}) satisfies Readonly<Record<ItemRankingPeriod, ReadonlyArray<CatalogRankedItem>>>;

export const DITTO_RECOMMENDATION = Object.freeze({
  id: "ditto-rec-1",
  rank: 0,
  name: "트래블 미니 파우치 세트",
  localName: "TripDitto Pick",
  city: "도쿄",
  country: "일본",
  packCount: 0,
  priceLabel: "¥1,290",
  delta: null,
  tone: "#E8F1FF",
  imageSrc: `${IMG}/rank-03-pouch.png`,
}) satisfies CatalogRankedItem;

export const ITEM_RANKING_CATALOG_DESTINATIONS = Object.freeze(
  [...new Map(
    REALTIME.map((item) => [
      `${item.country}::${item.city}`,
      Object.freeze({ city: item.city, country: item.country }),
    ]),
  ).values()].sort((a, b) => a.city.localeCompare(b.city, "ko-KR")),
);
