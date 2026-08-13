import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  createAccountScopedStorage,
  initializeAccountStorageScope,
  resolveLocalStorageKey,
} from "../lib/storage/local-storage";
import { isAuthStorageEvent } from "../features/auth/components/account-scope-sync";
import { storageKeys } from "../lib/storage/keys";

function memoryStorage(seed: Record<string, string> = {}) {
  const values = new Map(Object.entries(seed));
  return {
    values,
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => void values.set(key, value),
    removeItem: (key: string) => void values.delete(key),
  };
}

function session(email: string) {
  return JSON.stringify({
    isLoggedIn: true,
    email,
    provider: "email",
    loggedInAt: "2026-08-13T00:00:00.000Z",
  });
}

describe("account-scoped local data", () => {
  it("recognizes only the raw auth key as an account-switch event", () => {
    assert.equal(isAuthStorageEvent(storageKeys.auth), true);
    assert.equal(isAuthStorageEvent(storageKeys.trips), false);
    assert.equal(isAuthStorageEvent(null), false);
  });
  it("claims legacy guest data once and reads it through the scoped adapter", () => {
    const storage = memoryStorage({
      [storageKeys.auth]: session("Traveler@Example.com"),
      [storageKeys.trips]: '[{"id":"guest-trip"}]',
      [storageKeys.profile]: '{"nickname":"디토"}',
    });

    initializeAccountStorageScope(storage);
    const tripKey = resolveLocalStorageKey(storageKeys.trips, storage);
    assert.match(tripKey, /account:traveler%40example\.com$/);
    assert.equal(storage.getItem(storageKeys.trips), null);
    assert.equal(storage.getItem(tripKey), '[{"id":"guest-trip"}]');
    assert.equal(
      createAccountScopedStorage(storage).getItem(storageKeys.profile),
      '{"nickname":"디토"}',
    );
  });

  it("does not mix a returning account with a later guest session", () => {
    const storage = memoryStorage({
      [storageKeys.auth]: session("one@example.com"),
      [storageKeys.trips]: '[{"id":"first"}]',
    });
    initializeAccountStorageScope(storage);
    const firstKey = resolveLocalStorageKey(storageKeys.trips, storage);

    storage.setItem(storageKeys.trips, '[{"id":"later-guest"}]');
    initializeAccountStorageScope(storage);
    assert.equal(storage.getItem(firstKey), '[{"id":"first"}]');
    assert.equal(storage.getItem(storageKeys.trips), '[{"id":"later-guest"}]');

    storage.setItem(storageKeys.auth, session("two@example.com"));
    initializeAccountStorageScope(storage);
    const secondKey = resolveLocalStorageKey(storageKeys.trips, storage);
    assert.notEqual(firstKey, secondKey);
    assert.equal(storage.getItem(secondKey), '[{"id":"later-guest"}]');
    assert.equal(storage.getItem(firstKey), '[{"id":"first"}]');
  });

  it("keeps legacy data readable when a scoped migration cannot be stored", () => {
    const base = memoryStorage({
      [storageKeys.auth]: session("full@example.com"),
      [storageKeys.trips]: '[{"id":"must-survive"}]',
    });
    const storage = {
      getItem: base.getItem,
      removeItem: base.removeItem,
      setItem() {
        throw new Error("QuotaExceededError");
      },
    };

    assert.equal(initializeAccountStorageScope(storage), null);
    assert.equal(
      resolveLocalStorageKey(storageKeys.trips, storage),
      storageKeys.trips,
    );
    assert.equal(storage.getItem(storageKeys.trips), '[{"id":"must-survive"}]');
  });
});
