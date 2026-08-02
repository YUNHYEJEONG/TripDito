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
  /** 백그라운드 디토 AI 분석 잡 (단일) */
  analysisJob: `${appConfig.storagePrefix}:analysis-job`,
  /** 인앱 알림 인박스 */
  notifications: `${appConfig.storagePrefix}:notifications`,
  /** PoC 데모 모드 (쿠팡 비교 대기 단축 등) */
  demoMode: `${appConfig.storagePrefix}:demo-mode`,
} as const;
