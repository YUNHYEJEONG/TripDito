import type { Shot } from "@/features/shots/types";
import { getJson, setJson } from "@/lib/storage/local-storage";
import { storageKeys } from "@/lib/storage/keys";
import { DEMO_SHOT_IMAGES, SHOT_DEMO_IMAGE_VERSION } from "./fixtures";

function isPlaceholderImage(src: string) {
  return src.startsWith("data:image/svg");
}

/** One-time compatibility migration for fixture data from before raster assets. */
export function migrateDemoShotImages(): boolean {
  const shots = getJson<Shot[]>(storageKeys.shots, []);
  const meta = getJson<Record<string, unknown>>(storageKeys.meta, {});
  const hasPlaceholder = shots.some((shot) =>
    shot.images.some(isPlaceholderImage),
  );

  if (!hasPlaceholder) {
    if (meta.shotDemoImageVersion !== SHOT_DEMO_IMAGE_VERSION) {
      setJson(storageKeys.meta, {
        ...meta,
        shotDemoImageVersion: SHOT_DEMO_IMAGE_VERSION,
      });
    }
    return false;
  }

  const next = shots.map((shot, index) => {
    if (!shot.images.some(isPlaceholderImage)) return shot;
    const images = shot.images.map(
      (_, imageIndex) =>
        DEMO_SHOT_IMAGES[(index + imageIndex) % DEMO_SHOT_IMAGES.length],
    );
    return {
      ...shot,
      images:
        images.length > 0
          ? images
          : [DEMO_SHOT_IMAGES[index % DEMO_SHOT_IMAGES.length]],
      shareCount: shot.shareCount ?? 0,
    };
  });

  setJson(storageKeys.shots, next);
  setJson(storageKeys.meta, {
    ...meta,
    shotDemoImageVersion: SHOT_DEMO_IMAGE_VERSION,
  });
  return true;
}
