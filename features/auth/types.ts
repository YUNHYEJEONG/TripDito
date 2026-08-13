export type AuthProvider = "email" | "kakao" | "naver";

export type AuthSession = {
  isLoggedIn: boolean;
  /** 로그인 시각 (ISO) */
  loggedInAt: string | null;
  provider: AuthProvider | null;
  email: string | null;
  /** OAuth 이메일이 비공개일 때도 계정을 안정적으로 구분하는 provider subject. */
  accountId?: string | null;
};

export const DEFAULT_AUTH_SESSION: AuthSession = {
  isLoggedIn: false,
  loggedInAt: null,
  provider: null,
  email: null,
  accountId: null,
};

export type LocalAccount = {
  email: string;
  /** SHA-256 hex */
  passwordHash: string;
  nickname: string;
  /** Existing accounts without this field migrate to 한국 on read. */
  homeCountry?: string;
  createdAt: string;
};
