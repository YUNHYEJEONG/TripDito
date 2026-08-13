/**
 * 디토 AI — 유사 상품 비교용 카탈로그
 * 실제 Google Lens/검색 API 연동 전, 이미지별 유사 후보 5개를 뽑아 합의 결과를 만듭니다.
 */
export type SimilarProductCandidate = {
  id: string;
  nameKo: string;
  nameLocal: string;
  /** JPY 기준 참고가 (다른 통화는 환산) */
  priceJpy: number;
  stores: string[];
  regions: string[];
};

export const SIMILAR_PRODUCT_CATALOG: SimilarProductCandidate[] = [
  {
    id: "donki-kitkat",
    nameKo: "킷캣 말차 어소트",
    nameLocal: "キットカット 抹茶アソート",
    priceJpy: 680,
    stores: ["돈키호테", "면세점", "편의점"],
    regions: ["전국", "도쿄", "오사카"],
  },
  {
    id: "matsukiyo-transino",
    nameKo: "트랜시노 미백 세럼",
    nameLocal: "トランシーノ 薬用ホワイトニングエッセンス",
    priceJpy: 1980,
    stores: ["마츠모토키요시", "다이코쿠 드럭", "돈키호테"],
    regions: ["전국", "도쿄", "오사카", "후쿠오카"],
  },
  {
    id: "biore-uv",
    nameKo: "비오레 UV 아쿠아 리치",
    nameLocal: "ビオレUV アクアリッチ",
    priceJpy: 980,
    stores: ["마츠모토키요시", "돈키호테", "편의점"],
    regions: ["전국"],
  },
  {
    id: "shiseido-senka",
    nameKo: "센카 퍼펙트 휩",
    nameLocal: "専科 パーフェクトホイップ",
    priceJpy: 550,
    stores: ["마츠모토키요시", "돈키호테", "다이소"],
    regions: ["전국", "홋카이도", "삿포로"],
  },
  {
    id: "royce-chocolate",
    nameKo: "로이스 생초콜릿",
    nameLocal: "ロイズ 生チョコレート",
    priceJpy: 1200,
    stores: ["로이스 매장", "신치토세 공항", "돈키호테"],
    regions: ["홋카이도", "삿포로", "전국"],
  },
  {
    id: "kuromon-snack",
    nameKo: "쿠로몬 시장 건어물 세트",
    nameLocal: "黒門市場 おつまみセット",
    priceJpy: 1500,
    stores: ["쿠로몬 시장", "도톤보리 상점가"],
    regions: ["오사카"],
  },
  {
    id: "usj-keyring",
    nameKo: "유니버설 스튜디오 키링",
    nameLocal: "ユニバーサル・スタジオ・ジャパン キーホルダー",
    priceJpy: 1800,
    stores: ["USJ 공식숍", "도톤보리 기념품점"],
    regions: ["오사카"],
  },
  {
    id: "tokyo-banana",
    nameKo: "도쿄바나나 오리지널",
    nameLocal: "東京ばな奈 オリジナル",
    priceJpy: 1200,
    stores: ["도쿄역", "하네다 공항", "돈키호테"],
    regions: ["도쿄", "전국"],
  },
  {
    id: "adapter",
    nameKo: "여행용 멀티 어댑터",
    nameLocal: "海外旅行用 変換プラグ",
    priceJpy: 2200,
    stores: ["돈키호테", "빅카메라", "요도바시카메라"],
    regions: ["전국", "도쿄", "오사카"],
  },
  {
    id: "hand-cream",
    nameKo: "하토무기 핸드크림",
    nameLocal: "ハトムギ ハンドクリーム",
    priceJpy: 450,
    stores: ["다이소", "마츠모토키요시", "돈키호테"],
    regions: ["전국"],
  },
  {
    id: "lipbalm",
    nameKo: "멘소래담 립밤",
    nameLocal: "メンソレータム リップ",
    priceJpy: 420,
    stores: ["편의점", "마츠모토키요시", "돈키호테"],
    regions: ["전국"],
  },
  {
    id: "pokeru",
    nameKo: "포케루 마스크팩",
    nameLocal: "ルルルン フェイスマスク",
    priceJpy: 890,
    stores: ["돈키호테", "마츠모토키요시", "로프트"],
    regions: ["전국", "도쿄", "후쿠오카"],
  },
  {
    id: "meiji-chocolate",
    nameKo: "메이지 초콜릿 세트",
    nameLocal: "明治 チョコレートアソート",
    priceJpy: 650,
    stores: ["편의점", "돈키호테", "슈퍼"],
    regions: ["전국"],
  },
  {
    id: "electric-toothbrush",
    nameKo: "휴대용 전동칫솔",
    nameLocal: "電動歯ブラシ 携帯用",
    priceJpy: 3980,
    stores: ["빅카메라", "요도바시카메라", "돈키호테"],
    regions: ["도쿄", "오사카", "전국"],
  },
  {
    id: "fukuoka-mentaiko",
    nameKo: "하카타 명란젓 선물세트",
    nameLocal: "博多 辛子明太子",
    priceJpy: 2500,
    stores: ["하카타역", "후쿠오카 공항", "돈키호테"],
    regions: ["후쿠오카", "규슈"],
  },
];

export function convertPriceFromJpy(priceJpy: number, currency: string): number {
  const rates: Record<string, number> = {
    JPY: 1,
    KRW: 9.2,
    USD: 0.0067,
    TWD: 0.21,
    CNY: 0.048,
    EUR: 0.0061,
    HKD: 0.052,
  };
  const rate = rates[currency] ?? 1;
  const converted = priceJpy * rate;
  if (currency === "JPY" || currency === "KRW" || currency === "VND") {
    return Math.round(converted);
  }
  return Math.round(converted * 100) / 100;
}

function scoreCandidate(
  candidate: SimilarProductCandidate,
  city: string,
  country: string,
): number {
  let score = 1;
  if (country.includes("일본") || country.toLowerCase().includes("japan")) {
    score += 2;
  }
  if (candidate.regions.includes("전국")) score += 1;
  if (candidate.regions.some((region) => city.includes(region) || region.includes(city))) {
    score += 4;
  }
  return score;
}

/** 이미지 특성 + 여행지로 유사 후보 5개를 고릅니다. */
export function pickSimilarCandidates(
  imageFingerprint: number,
  city: string,
  country: string,
  limit = 5,
): SimilarProductCandidate[] {
  const ranked = [...SIMILAR_PRODUCT_CATALOG]
    .map((candidate, index) => ({
      candidate,
      score:
        scoreCandidate(candidate, city, country) * 10 +
        ((imageFingerprint + index * 17) % 7),
    }))
    .sort((a, b) => b.score - a.score);

  return ranked.slice(0, limit).map((row) => row.candidate);
}

/** 유사 후보 5개를 합의해 최종 예측을 만듭니다. */
export function consensusFromCandidates(
  candidates: SimilarProductCandidate[],
  currency: string,
  city: string,
): {
  nameKo: string;
  nameLocal: string;
  estimatedPrice: number;
  expectedStores: string[];
} {
  const top = candidates[0];
  if (!top) {
    return {
      nameKo: "여행 쇼핑 아이템",
      nameLocal: "",
      estimatedPrice: 0,
      expectedStores: [],
    };
  }

  const avgJpy = Math.round(
    candidates.reduce((sum, item) => sum + item.priceJpy, 0) / candidates.length,
  );

  const storeVotes = new Map<string, number>();
  for (const candidate of candidates) {
    for (const store of candidate.stores) {
      const weight =
        candidate.regions.includes("전국") ||
        candidate.regions.some((r) => city.includes(r) || r.includes(city))
          ? 2
          : 1;
      storeVotes.set(store, (storeVotes.get(store) ?? 0) + weight);
    }
  }

  const expectedStores = [...storeVotes.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([store]) => store);

  // 오사카 + 돈키호테 투표가 있으면 우선 노출 (요청 예시 반영)
  if (
    city.includes("오사카") &&
    storeVotes.has("돈키호테") &&
    !expectedStores.includes("돈키호테")
  ) {
    expectedStores.unshift("돈키호테");
    expectedStores.splice(3);
  }

  return {
    nameKo: top.nameKo,
    nameLocal: top.nameLocal,
    estimatedPrice: convertPriceFromJpy(avgJpy, currency),
    expectedStores,
  };
}

export function fingerprintFromDataUrl(dataUrl: string): number {
  let hash = 0;
  const sample = dataUrl.slice(0, 8000);
  for (let i = 0; i < sample.length; i += 17) {
    hash = (hash * 31 + sample.charCodeAt(i)) >>> 0;
  }
  return hash + dataUrl.length;
}
