import { isBrowser } from "./local-storage";
import { storageKeys } from "./keys";

const WARN_BYTES = 4 * 1024 * 1024; // ~4MB
const DANGER_BYTES = 4.5 * 1024 * 1024;

export type StorageUsage = {
  usedBytes: number;
  usedLabel: string;
  level: "ok" | "warn" | "danger";
};

function byteLength(value: string) {
  return new Blob([value]).size;
}

export function getStorageUsage(): StorageUsage {
  if (!isBrowser()) {
    return { usedBytes: 0, usedLabel: "0 KB", level: "ok" };
  }

  const keys = Object.values(storageKeys);
  let usedBytes = 0;
  for (const key of keys) {
    const value = window.localStorage.getItem(key);
    if (value) usedBytes += byteLength(key) + byteLength(value);
  }

  const usedLabel =
    usedBytes >= 1024 * 1024
      ? `${(usedBytes / (1024 * 1024)).toFixed(1)} MB`
      : `${Math.max(1, Math.round(usedBytes / 1024))} KB`;

  const level =
    usedBytes >= DANGER_BYTES
      ? "danger"
      : usedBytes >= WARN_BYTES
        ? "warn"
        : "ok";

  return { usedBytes, usedLabel, level };
}
