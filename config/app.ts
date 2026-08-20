export const appConfig = {
  /** 한글 브랜드명 (기본 표시) */
  name: "트립디토",
  /** 영문 브랜드명 (필요 시 사용) */
  nameEn: "TripDito",
  tagline: "복잡함 없이, 여행 쇼핑",
  storagePrefix: "trip-shopping",
  storageVersion: 1,
  defaultCurrency: "JPY" as const,
  imageMaxEdge: 960,
  imageQuality: 0.72,
  brand: {
    /** 승인된 D 심볼과 워드마크의 원본 가로 락업 */
    lockupSrc: "/brand/d/lockup.png",
    /** TripDito 워드마크 */
    logoSrc: "/brand/d/wordmark.png",
    /** 열린 리본형 하트·체크 D 심볼 */
    symbolSrc: "/brand/d/symbol.png",
    symbolPngSrc: "/brand/d/symbol.png",
    appIconSrc: "/brand/d/apple-touch-icon.png?v=2",
    faviconSrc: "/brand/d/favicon-32.png?v=2",
  },
} as const;
