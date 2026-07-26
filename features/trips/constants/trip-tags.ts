export const TRIP_TAG_IDS = [
  "with-friends",
  "with-colleagues",
  "family",
  "filial",
  "solo",
  "foodie",
  "shopping",
  "business",
] as const;

export type TripTagId = (typeof TRIP_TAG_IDS)[number];

export const TRIP_TAG_OPTIONS: { id: TripTagId; label: string }[] = [
  { id: "with-friends", label: "친구와 함께" },
  { id: "with-colleagues", label: "동료와 함께" },
  { id: "family", label: "가족여행" },
  { id: "filial", label: "효도여행" },
  { id: "solo", label: "나홀로" },
  { id: "foodie", label: "먹방" },
  { id: "shopping", label: "쇼핑" },
  { id: "business", label: "출장" },
];

export const MAX_TRIP_TAGS = 3;

export function getTripTagLabel(id: TripTagId) {
  return TRIP_TAG_OPTIONS.find((tag) => tag.id === id)?.label ?? id;
}
