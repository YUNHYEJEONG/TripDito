import type { ShotSort } from "./schema";

export const MAX_SHOT_IMAGES = 10;

export const SHOT_SORT_OPTIONS: { value: ShotSort; label: string }[] = [
  { value: "newest", label: "최신순" },
  { value: "likes", label: "좋아요순" },
];

/** @deprecated Prefer `@/features/destinations/constants` */
export {
  POPULAR_DESTINATIONS,
  FLIGHT_DESTINATIONS,
} from "@/features/destinations/constants";
