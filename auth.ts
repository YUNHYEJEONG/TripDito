import NextAuth from "next-auth";
import Kakao from "next-auth/providers/kakao";
import Naver from "next-auth/providers/naver";
import type { Provider } from "next-auth/providers";

const authRuntimeReady =
  Boolean(process.env.AUTH_SECRET?.trim()) ||
  process.env.NODE_ENV === "development";

function buildProviders(): Provider[] {
  const providers: Provider[] = [];

  // OAuth credentials without a stable secret are not a usable production
  // configuration. Keep local email auth available and hide social entry.
  if (!authRuntimeReady) return providers;

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

const configuredProviders = buildProviders();

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: configuredProviders,
  secret:
    process.env.AUTH_SECRET ??
    (configuredProviders.length === 0 || process.env.NODE_ENV === "development"
      ? "trip-ditto-local-session-without-oauth"
      : undefined),
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, account }) {
      if (account?.provider) {
        token.provider = account.provider;
      }
      return token;
    },
    async session({ session, token }) {
      if (token.provider) {
        session.provider = String(token.provider);
      }
      if (token.sub) {
        session.accountId = token.sub;
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
    kakao: authRuntimeReady && Boolean(
      process.env.AUTH_KAKAO_ID && process.env.AUTH_KAKAO_SECRET,
    ),
    naver: authRuntimeReady && Boolean(
      process.env.AUTH_NAVER_ID && process.env.AUTH_NAVER_SECRET,
    ),
  };
}
