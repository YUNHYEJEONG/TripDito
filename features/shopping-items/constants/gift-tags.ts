export const GIFT_TAG_IDS = [
  "acquaintance",
  "colleague",
  "friend",
] as const;

export type GiftTagId = (typeof GIFT_TAG_IDS)[number];

export const GIFT_TAG_OPTIONS: {
  id: GiftTagId;
  label: string;
  className: string;
}[] = [
  {
    id: "acquaintance",
    label: "지인",
    className: "bg-gift-acq text-ink",
  },
  {
    id: "colleague",
    label: "동료",
    className: "bg-gift-col text-ink",
  },
  {
    id: "friend",
    label: "친구",
    className: "bg-gift-fri text-ink",
  },
];

export function getGiftTagOption(id: GiftTagId) {
  return GIFT_TAG_OPTIONS.find((tag) => tag.id === id);
}
