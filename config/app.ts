export const appConfig = {
  /** 한글 브랜드명 (기본 표시) */
  name: "트립디토",
  /** 영문 브랜드명 (필요 시 사용) */
  nameEn: "Trip Ditto",
  tagline: "복잡함 없이, 여행 쇼핑",
  storagePrefix: "trip-shopping",
  storageVersion: 1,
  defaultCurrency: "JPY" as const,
  /** 용도별 이미지 압축 프리셋 (긴 변 px / JPEG 품질) */
  imagePresets: {
    /** 떼샷 본문 이미지 — 전체폭 레티나 표시 */
    shot: { maxEdge: 2048, quality: 0.85 },
    /** 상품 썸네일 */
    item: { maxEdge: 1024, quality: 0.8 },
    /** 사진 분석(Gemini) 입력 — 글씨 선명도 우선 */
    analysis: { maxEdge: 1600, quality: 0.85 },
    /** 프로필 아바타 */
    avatar: { maxEdge: 512, quality: 0.85 },
  },
  brand: {
    /** 워드마크 로고 (헤더·랜딩, 라이트 배경) */
    logoSrc: "/brand/logo.svg?v=5",
    /** 워드마크 로고 (다크 배경용 화이트, 그라데이션 마크 포함) */
    logoWhiteSrc: "/brand/logo-white.svg?v=5",
    /** 텍스트 전용 화이트 워드마크 (그라데이션 배경 위 스플래시용) */
    logoTextWhiteSrc: "/brand/logo-text-white.svg?v=5",
    /** 하트 체크 마크 심볼 (아이콘용) */
    symbolSrc: "/brand/symbol.svg?v=5",
    /** 하트 체크 마크 (다크·그라데이션 배경용 화이트) */
    symbolWhiteSrc: "/brand/symbol-white.svg?v=5",
    symbolPngSrc: "/brand/symbol.png?v=5",
    appIconSrc: "/brand/app-icon.png?v=5",
    faviconSrc: "/brand/favicon.png?v=5",
  },
} as const;
