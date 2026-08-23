import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session extends DefaultSession {
    provider?: string;
    /** USER_INFO.USER_UUID (API·URL 노출용 식별자) */
    userUuid?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    provider?: string;
    userUuid?: string;
  }
}
