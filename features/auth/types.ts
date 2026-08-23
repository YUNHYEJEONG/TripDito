export type AuthProvider = "google" | "kakao" | "naver" | "dev";

export type AuthSession = {
  isLoggedIn: boolean;
  /** 로그인 시각 (ISO) — 서버 세션에서는 제공하지 않음 */
  loggedInAt: string | null;
  provider: AuthProvider | null;
  email: string | null;
  /** USER_UUID */
  userId: string | null;
};

export const DEFAULT_AUTH_SESSION: AuthSession = {
  isLoggedIn: false,
  loggedInAt: null,
  provider: null,
  email: null,
  userId: null,
};
