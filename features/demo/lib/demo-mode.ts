import { getJson, setJson } from "@/lib/storage/local-storage";
import { storageKeys } from "@/lib/storage/keys";

export const DEMO_MODE_CHANGE_EVENT = "trip-shopping:demo-mode";

export function isDemoMode(): boolean {
  return getJson<boolean>(storageKeys.demoMode, false);
}

export function setDemoMode(enabled: boolean) {
  setJson(storageKeys.demoMode, enabled);
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent(DEMO_MODE_CHANGE_EVENT, { detail: { enabled } }),
    );
  }
}
