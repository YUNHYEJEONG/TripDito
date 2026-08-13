import { getJson, removeKey, setJson } from "@/lib/storage/local-storage";
import { storageKeys } from "@/lib/storage/keys";

export const activeTripRepository = {
  get(): string | null {
    const value = getJson<unknown>(storageKeys.activeTrip, null);
    return typeof value === "string" && value ? value : null;
  },

  set(tripId: string) {
    setJson(storageKeys.activeTrip, tripId);
    return tripId;
  },

  clear() {
    removeKey(storageKeys.activeTrip);
  },
};
