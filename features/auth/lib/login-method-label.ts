import type { AuthProvider } from "../types";

export function getLoginMethodLabel(
  provider: AuthProvider | null | undefined,
): string {
  switch (provider) {
    case "kakao":
      return "카카오로 로그인";
    case "naver":
      return "네이버로 로그인";
    case "email":
      return "이메일로 로그인";
    default:
      return "이메일로 로그인";
  }
}
