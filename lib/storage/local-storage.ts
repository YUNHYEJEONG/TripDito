import {
  accountScopedStorageKeys,
  storageKeys,
} from "./keys";

export function isBrowser() {
  return typeof window !== "undefined";
}

type StorageLike = Pick<Storage, "getItem" | "setItem" | "removeItem">;

type StoredSession = {
  isLoggedIn?: boolean;
  email?: string | null;
  provider?: string | null;
  accountId?: string | null;
};

function readSession(storage: StorageLike): StoredSession | null {
  try {
    const raw = storage.getItem(storageKeys.auth);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    return parsed && typeof parsed === "object"
      ? (parsed as StoredSession)
      : null;
  } catch {
    return null;
  }
}

function storageScopeId(storage: StorageLike) {
  const session = readSession(storage);
  if (!session?.isLoggedIn) return null;
  const identity = session.email?.trim().toLowerCase();
  if (identity) return encodeURIComponent(identity);
  const accountId = session.accountId?.trim();
  return session.provider && accountId
    ? `${encodeURIComponent(session.provider)}-${encodeURIComponent(accountId)}`
    : null;
}

function isAccountScopedKey(key: string) {
  return accountScopedStorageKeys.some(
    (base) => key === base || key.startsWith(`${base}:`),
  );
}

function scopedKey(key: string, scope: string) {
  return `${key}:account:${scope}`;
}

/**
 * First login after the account-scope upgrade claims existing guest data once.
 * Returning accounts never absorb data created in a later guest session.
 */
export function initializeAccountStorageScope(storage: StorageLike) {
  const scope = storageScopeId(storage);
  if (!scope) return null;
  const marker = `${storageKeys.meta}:account:${scope}:initialized`;
  if (storage.getItem(marker) === "1") return scope;

  const relatedKeys = new Set([
    ...accountScopedStorageKeys,
    `${storageKeys.receivedCoupons}:seeded`,
  ]);
  const previous = new Map<string, string | null>();
  previous.set(marker, storage.getItem(marker));

  try {
    for (const key of relatedKeys) {
      const target = scopedKey(key, scope);
      const sourceValue = storage.getItem(key);
      previous.set(target, storage.getItem(target));
      previous.set(key, sourceValue);
      if (storage.getItem(target) === null && sourceValue !== null) {
        storage.setItem(target, sourceValue);
        storage.removeItem(key);
      }
    }
    storage.setItem(marker, "1");
  } catch {
    // Storage may be revoked or full. Roll back the best we can and keep the
    // unscoped data readable instead of partially moving it.
    for (const [key, value] of previous) {
      try {
        if (value === null) storage.removeItem(key);
        else storage.setItem(key, value);
      } catch {
        // No further recovery is possible in a denied storage context.
      }
    }
    return null;
  }
  return scope;
}

export function resolveLocalStorageKey(
  key: string,
  storage: StorageLike = window.localStorage,
) {
  if (!isAccountScopedKey(key)) return key;
  const scope = initializeAccountStorageScope(storage);
  return scope ? scopedKey(key, scope) : key;
}

/** Adapter for subsystems that receive Storage rather than using helpers. */
export function createAccountScopedStorage(storage: StorageLike): StorageLike {
  return {
    getItem: (key) => storage.getItem(resolveLocalStorageKey(key, storage)),
    setItem: (key, value) =>
      storage.setItem(resolveLocalStorageKey(key, storage), value),
    removeItem: (key) =>
      storage.removeItem(resolveLocalStorageKey(key, storage)),
  };
}

export function getJson<T>(key: string, fallback: T): T {
  if (!isBrowser()) return fallback;
  try {
    const raw = window.localStorage.getItem(resolveLocalStorageKey(key));
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function setJson<T>(key: string, value: T) {
  if (!isBrowser()) return;
  window.localStorage.setItem(resolveLocalStorageKey(key), JSON.stringify(value));
}

export function removeKey(key: string) {
  if (!isBrowser()) return;
  window.localStorage.removeItem(resolveLocalStorageKey(key));
}
