import type { AuthProvider } from "../types";

export function getLoginMethodLabel(
  provider: AuthProvider | null | undefined,
): string {
  switch (provider) {
    case "google":
      return "구글로 로그인";
    case "kakao":
      return "카카오로 로그인";
    case "naver":
      return "네이버로 로그인";
    case "dev":
      return "개발용 계정으로 로그인";
    default:
      return "소셜 로그인";
  }
}
