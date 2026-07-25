import NextAuth from "next-auth";
import Kakao from "next-auth/providers/kakao";
import Naver from "next-auth/providers/naver";
import type { Provider } from "next-auth/providers";

function buildProviders(): Provider[] {
  const providers: Provider[] = [];

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
    kakao: Boolean(
      process.env.AUTH_KAKAO_ID && process.env.AUTH_KAKAO_SECRET,
    ),
    naver: Boolean(
      process.env.AUTH_NAVER_ID && process.env.AUTH_NAVER_SECRET,
    ),
  };
}
