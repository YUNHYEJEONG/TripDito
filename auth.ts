import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Kakao from "next-auth/providers/kakao";
import Naver from "next-auth/providers/naver";
import Credentials from "next-auth/providers/credentials";
import type { Provider } from "next-auth/providers";
import { isDatabaseConfigured } from "@/lib/db/client";
import {
  findUserByUuid,
  upsertSocialUser,
  type ProviderCode,
} from "@/lib/db/users";

const PROVIDER_CODE: Record<string, ProviderCode> = {
  google: "GOOGLE",
  kakao: "KAKAO",
  naver: "NAVER",
  dev: "DEV",
};

/** 소셜 키 발급 전 임시 개발용 로그인. ENABLE_DEV_LOGIN=true + DEV_LOGIN_EMAIL/PASSWORD 필요 */
export function isDevLoginEnabled() {
  return (
    process.env.ENABLE_DEV_LOGIN === "true" &&
    Boolean(process.env.DEV_LOGIN_EMAIL && process.env.DEV_LOGIN_PASSWORD)
  );
}

function buildProviders(): Provider[] {
  const providers: Provider[] = [];

  if (isDevLoginEnabled()) {
    providers.push(
      Credentials({
        id: "dev",
        name: "개발용 로그인",
        credentials: {
          email: { label: "이메일", type: "email" },
          password: { label: "비밀번호", type: "password" },
        },
        async authorize(credentials) {
          const email = String(credentials?.email ?? "").trim().toLowerCase();
          const password = String(credentials?.password ?? "");
          if (
            email !== process.env.DEV_LOGIN_EMAIL!.toLowerCase() ||
            password !== process.env.DEV_LOGIN_PASSWORD
          ) {
            return null;
          }
          if (!isDatabaseConfigured()) return { id: email, email };
          const user = await upsertSocialUser({
            provider: "DEV",
            providerAccountId: email,
            email,
            emailVerified: true,
          });
          if (user.status === "WTHDRW") return null;
          return { id: user.userUuid, email };
        },
      }),
    );
  }

  if (process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET) {
    providers.push(
      Google({
        clientId: process.env.AUTH_GOOGLE_ID,
        clientSecret: process.env.AUTH_GOOGLE_SECRET,
      }),
    );
  }

  if (process.env.AUTH_KAKAO_ID && process.env.AUTH_KAKAO_SECRET) {
    providers.push(
      Kakao({
        clientId: process.env.AUTH_KAKAO_ID,
        clientSecret: process.env.AUTH_KAKAO_SECRET,
      }),
    );
  }

  if (process.env.AUTH_NAVER_ID && process.env.AUTH_NAVER_SECRET) {
    providers.push(
      Naver({
        clientId: process.env.AUTH_NAVER_ID,
        clientSecret: process.env.AUTH_NAVER_SECRET,
      }),
    );
  }

  return providers;
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: buildProviders(),
  secret:
    process.env.AUTH_SECRET ?? "trip-ditto-poc-dev-secret-change-me",
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    /**
     * 소셜 콜백 → USER_INFO / OAUTH_ACNT_INFO 연동 (정의서 p.17)
     * DB 미설정 시에는 로그인만 허용(PoC 동작 유지).
     */
    async signIn({ account, profile, user: authUser }) {
      if (!account || !isDatabaseConfigured()) return true;
      if (account.provider === "dev") {
        // authorize() 에서 이미 USER_INFO 연동 완료
        (account as { userUuid?: string }).userUuid = authUser.id;
        return true;
      }
      const provider = PROVIDER_CODE[account.provider];
      if (!provider) return false;

      const email =
        (profile as { email?: string } | undefined)?.email ?? null;
      const emailVerified = Boolean(
        (profile as { email_verified?: boolean } | undefined)
          ?.email_verified ??
          // 카카오·네이버는 email_verified 필드가 없다 → 이메일이 있으면 검증된 것으로 간주
          (account.provider !== "google" && email),
      );

      const user = await upsertSocialUser({
        provider,
        providerAccountId: account.providerAccountId,
        email,
        emailVerified,
        accessToken: account.access_token ?? null,
        refreshToken: account.refresh_token ?? null,
        expiresAt: account.expires_at ?? null,
      });
      if (user.status === "WTHDRW") return false;
      // jwt 콜백에서 읽을 수 있도록 account 에 실어 보낸다
      (account as { userUuid?: string }).userUuid = user.userUuid;
      return true;
    },
    async jwt({ token, account }) {
      if (account?.provider) {
        token.provider = account.provider;
        const uuid = (account as { userUuid?: string }).userUuid;
        if (uuid) token.userUuid = uuid;
      }
      return token;
    },
    async session({ session, token }) {
      if (token.provider) {
        session.provider = String(token.provider);
      }
      if (token.userUuid) {
        session.userUuid = String(token.userUuid);
        session.user.id = session.userUuid;
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      if (new URL(url).origin === baseUrl) return url;
      return `${baseUrl}/profile`;
    },
  },
  trustHost: true,
});

export function getConfiguredSocialProviders() {
  return {
    dev: isDevLoginEnabled(),
    google: Boolean(
      process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET,
    ),
    kakao: Boolean(
      process.env.AUTH_KAKAO_ID && process.env.AUTH_KAKAO_SECRET,
    ),
    naver: Boolean(
      process.env.AUTH_NAVER_ID && process.env.AUTH_NAVER_SECRET,
    ),
  };
}

/** 현재 세션의 DB 회원. 미로그인/DB 미연동이면 null */
export async function getCurrentUser() {
  const session = await auth();
  if (!session?.userUuid || !isDatabaseConfigured()) return null;
  return findUserByUuid(session.userUuid);
}
