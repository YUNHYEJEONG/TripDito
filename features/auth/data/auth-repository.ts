import { getJson, setJson } from "@/lib/storage/local-storage";
import { storageKeys } from "@/lib/storage/keys";
import {
  DEFAULT_AUTH_SESSION,
  type AuthProvider,
  type AuthSession,
} from "../types";

export const authRepository = {
  get(): AuthSession {
    const session = getJson<AuthSession>(
      storageKeys.auth,
      DEFAULT_AUTH_SESSION,
    );
    return {
      ...DEFAULT_AUTH_SESSION,
      ...session,
      isLoggedIn: Boolean(session.isLoggedIn),
      provider: session.provider ?? null,
      email: session.email ?? null,
    };
  },

  login(input?: {
    provider?: AuthProvider;
    email?: string | null;
  }): AuthSession {
    const session: AuthSession = {
      isLoggedIn: true,
      loggedInAt: new Date().toISOString(),
      provider: input?.provider ?? "email",
      email: input?.email ?? null,
    };
    setJson(storageKeys.auth, session);
    return session;
  },

  logout(): AuthSession {
    setJson(storageKeys.auth, DEFAULT_AUTH_SESSION);
    return DEFAULT_AUTH_SESSION;
  },
};
