import { appConfig } from "@/config/app";

export const storageKeys = {
  trips: `${appConfig.storagePrefix}:trips`,
  items: `${appConfig.storagePrefix}:items`,
  meta: `${appConfig.storagePrefix}:meta`,
  shots: `${appConfig.storagePrefix}:shots`,
  scraps: `${appConfig.storagePrefix}:scraps`,
  profile: `${appConfig.storagePrefix}:profile`,
  /** 로그인 세션 (PoC 로컬) */
  auth: `${appConfig.storagePrefix}:auth`,
  /** 이메일 회원가입 계정 (PoC 로컬) */
  accounts: `${appConfig.storagePrefix}:accounts`,
  /** 내가 받은 쿠폰 (PoC 로컬) */
  receivedCoupons: `${appConfig.storagePrefix}:received-coupons`,
  /** 홈·지도·리스트가 공유하는 현재 여행 */
  activeTrip: `${appConfig.storagePrefix}:active-trip`,
  /** 백그라운드 디토 AI 분석 잡 (운영판 호환) */
  analysisJob: `${appConfig.storagePrefix}:analysis-job`,
  /** 인앱 알림 인박스 (운영판 호환) */
  notifications: `${appConfig.storagePrefix}:notifications`,
  /** 쿠팡 비교 대기시간 등을 줄이는 명시적 데모 모드 */
  demoMode: `${appConfig.storagePrefix}:demo-mode`,
  /** 자동 미리보기 시드/초기화 상태. 계정마다 독립적으로 유지한다. */
  demoBootstrap: `${appConfig.storagePrefix}:demo-bootstrap`,
  /** 쇼핑 허브 장소 찜 (기존 점 표기 키 호환) */
  shoppingFavorites: "tripdito.shopping.favorites.v1",
  shoppingCompatMigration: `${appConfig.storagePrefix}:migrate:shopping-items-compat-v2`,
} as const;

/** 로그인 계정마다 분리해야 하는 사용자 소유 데이터입니다. */
export const accountScopedStorageKeys = [
  storageKeys.trips,
  storageKeys.items,
  storageKeys.meta,
  storageKeys.shots,
  storageKeys.scraps,
  storageKeys.profile,
  storageKeys.receivedCoupons,
  storageKeys.activeTrip,
  storageKeys.analysisJob,
  storageKeys.notifications,
  storageKeys.demoMode,
  storageKeys.demoBootstrap,
  storageKeys.shoppingFavorites,
  storageKeys.shoppingCompatMigration,
] as const;
