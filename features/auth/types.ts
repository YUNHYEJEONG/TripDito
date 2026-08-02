export type AuthProvider = "email" | "kakao" | "naver";

export type AuthSession = {
  isLoggedIn: boolean;
  /** 로그인 시각 (ISO) */
  loggedInAt: string | null;
  provider: AuthProvider | null;
  email: string | null;
};

export const DEFAULT_AUTH_SESSION: AuthSession = {
  isLoggedIn: false,
  loggedInAt: null,
  provider: null,
  email: null,
};

export type LocalAccount = {
  email: string;
  /** SHA-256 hex */
  passwordHash: string;
  nickname: string;
  /** 거주지(사는 국가). 목적지 카탈로그 국가명과 동일 */
  homeCountry: string;
  createdAt: string;
};
