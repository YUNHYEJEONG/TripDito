/**
 * Trip Ditto 디자인 시스템의 코드 소비용 별칭입니다.
 * 정본은 DESIGN.md v5.7과 app/globals.css이며, 여기서는 반복 사용하는
 * 타입·라운드·최소 터치 타깃·레이아웃 값을 같은 이름으로 노출합니다.
 */
export const designSystem = {
  typography: {
    /** 본문과 제목 모두 동일한 한글 산세리프 스택을 사용합니다. */
    fontFamily: "var(--font-body)",
    weights: {
      regular: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
  },
  radius: {
    /** 입력 컨트롤 12px (`--r-m`, Tailwind `rounded-lg`). */
    control: "0.75rem",
    controlClass: "rounded-lg",
    /** 입력란·옆 액션 버튼 공통 높이이자 최소 터치 타깃(44px). */
    fieldHeightClass: "h-11",
    /** 입력+액션 조합 시 버튼 size */
    fieldActionSize: "fieldAction",
    /** 일반 카드 16px (`--r-xl`). */
    surface: "1rem",
    /** 바텀시트 20px (`--r-2xl`). */
    sheet: "1.25rem",
    pill: "9999px",
  },
  interaction: {
    /** WCAG 타깃 바닥값: 가로·세로 44px. */
    targetMin: "2.75rem",
    targetMinClass: "min-h-11 min-w-11",
  },
  breakpoints: {
    /** 지원하는 최소 모바일 viewport. */
    supportedMin: 320,
    /** 더 큰 viewport에서도 이 모바일 앱 너비를 넘지 않습니다. */
    appRailMax: 480,
    /** 이 너비부터는 레이아웃 확장이 아니라 중앙 preview 배경만 적용합니다. */
    previewMin: 481,
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
    /** 카드 스택 간격(4pt 그리드의 12px). */
    cardStackGap: "0.75rem",
    /** Tailwind: gap-3 */
    cardStackGapClass: "gap-3",
  },
} as const;
