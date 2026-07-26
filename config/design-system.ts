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
    /**
     * 폼 컨트롤 (Input / Textarea / Select / Button / Checkbox)
     * - 기본 입력 서피스: 흰 배경 (회색은 disabled 전용)
     * - Checkbox도 동일: 활성=흰 배경+테두리, 체크=primary, disabled=회색
     * - 숫자 데이터(가격·수량·합계): 등록/수정은 우측 정렬, 조회(상세)는 좌측 정렬
     * - 값: 8px (`rounded-lg`)
     * - 너무 둥근 `rounded-xl`(12px) 사용 금지
     */
    control: "0.5rem",
    /** Tailwind 클래스 — 입력·선택·버튼에 공통 적용 */
    controlClass: "rounded-lg",
    /** 입력란·옆 액션 버튼 공통 높이 */
    fieldHeightClass: "h-10",
    /** 입력+액션 조합 시 버튼 size */
    fieldActionSize: "fieldAction",
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
  /**
   * 화면 레이아웃 간격
   * - cardStack: 홈 등 세로로 쌓인 섹션/카드 사이 간격
   */
  layout: {
    /** 카드 스택 간격 (기존 gap-6=24px의 절반) */
    cardStackGap: "0.75rem",
    /** Tailwind: gap-3 */
    cardStackGapClass: "gap-3",
    /**
     * 하단 고정 액션 바 (직접 추가 / 사진으로 추가 등)
     * - 버튼 위 구분선(border-t) 사용하지 않음
     * - 탭 바(bottom-nav)의 border-t와 구분
     */
    bottomActionBarNoDivider: true,
  },
} as const;
