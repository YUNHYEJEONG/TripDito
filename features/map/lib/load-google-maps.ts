import { setOptions, importLibrary } from "@googlemaps/js-api-loader";

export const SEOUL = { lat: 37.5665, lng: 126.978 };

let loadPromise: Promise<void> | null = null;

/** Places UI Kit 포함 Maps JS API 로드 (한 번만) */
export function loadGoogleMaps(apiKey: string): Promise<void> {
  if (!apiKey) {
    return Promise.reject(new Error("Google Maps API 키가 없습니다."));
  }

  if (loadPromise) return loadPromise;

  loadPromise = (async () => {
    setOptions({
      key: apiKey,
      v: "weekly",
    });

    await Promise.all([importLibrary("maps"), importLibrary("places")]);

    if (typeof customElements !== "undefined") {
      await customElements.whenDefined("gmp-place-details");
    }
  })().catch((error) => {
    loadPromise = null;
    throw error;
  });

  return loadPromise;
}
