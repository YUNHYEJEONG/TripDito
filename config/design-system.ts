/**
 * TripDito 디자인 시스템
 * - 기준: 트립디토 로고 (트립디토_로고_20260828) — 블루 그라데이션 아이덴티티
 * - 화이트 베이스 + 로고 블루 CTA + 회색 설명 카드
 */
export const designSystem = {
  brand: {
    /** 로고 primary 블루 */
    primary: "#3182F6",
    /** 로고 secondary 스카이 블루 */
    secondary: "#62CBFF",
    /** 로고 그라데이션 (secondary → primary) */
    gradient: "linear-gradient(135deg, #62CBFF 0%, #3182F6 100%)",
    /** 소프트 블루 서피스 (배지·배너) */
    brandSoft: "#E8F3FF",
    /** 딥 블루 텍스트 (로고 black) */
    deepSpaceBlue: "#191F28",
    /** 주요 액션 블루 (= primary) */
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
     * 폼 컨트롤 (Input / Textarea / Select / Button)
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
  },
} as const;
