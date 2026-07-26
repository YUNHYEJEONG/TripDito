export const appConfig = {
  /** 한글 브랜드명 (기본 표시) */
  name: "트립디토",
  /** 영문 브랜드명 (필요 시 사용) */
  nameEn: "Trip Ditto",
  /** 메타 description 등 공통용 한 줄 */
  tagline: "오늘부터 트립디토, 사진만 찍으면 쇼핑리스트 완성!",
  /** 스플래시 전용 두 줄 */
  splashLines: [
    "오늘부터 트립디토",
    "사진만 찍으면 쇼핑리스트 완성!",
  ] as const,
  storagePrefix: "trip-shopping",
  storageVersion: 1,
  defaultCurrency: "JPY" as const,
  imageMaxEdge: 960,
  imageQuality: 0.72,
  brand: {
    /** 텍스트 대체 로고 (헤더·랜딩) */
    logoSrc: "/brand/logo.png?v=4",
    /** 캐리어 심볼 (아이콘용) */
    symbolSrc: "/brand/symbol.png?v=3",
    symbolPngSrc: "/brand/symbol.png?v=3",
    appIconSrc: "/brand/app-icon.png?v=3",
    faviconSrc: "/brand/favicon.png?v=3",
  },
} as const;
