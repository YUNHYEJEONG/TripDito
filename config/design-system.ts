/**
 * Trip Ditto 디자인 시스템
 * - 레퍼런스: 오늘의집(1), 토스(2)
 * - 화이트 베이스 + 강한 블루 CTA + 회색 설명 카드
 */
export const designSystem = {
  brand: {
    skyBlueLight: "#8ECAE6",
    blueGreen: "#219EBC",
    deepSpaceBlue: "#191F28",
    amberFlame: "#FFB703",
    princetonOrange: "#FB8500",
    /** 주요 액션 (토스형 강한 블루) */
    actionBlue: "#3182F6",
    /** 서비스 설명용 회색 카드 */
    surfaceGray: "#F2F4F6",
  },
  typography: {
    korean: "Noto Sans KR",
    english: "Roboto",
    weights: {
      regular: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
  },
  radius: {
    /** 네모 버튼/컨트롤 — 약한 라운드 */
    control: "0.5rem",
    surface: "1rem",
    pill: "9999px",
  },
  breakpoints: {
    min: 320,
    mobileMax: 767,
    tabletMin: 768,
    tabletMax: 1023,
    desktopMin: 1024,
    contentMaxMobile: 480,
    contentMaxTablet: 720,
    contentMaxDesktop: 960,
  },
  cards: {
    /** 기존 흰 카드 */
    default: "Card",
    /** 추가 에셋: 회색 서피스 카드 (설명/안내) */
    gray: "GrayCard",
  },
} as const;
