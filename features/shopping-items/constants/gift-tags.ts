import { designSystem } from "@/config/design-system";

export const GIFT_TAG_IDS = [
  "acquaintance",
  "colleague",
  "friend",
] as const;

export type GiftTagId = (typeof GIFT_TAG_IDS)[number];

export const GIFT_TAG_OPTIONS: {
  id: GiftTagId;
  label: string;
  bg: string;
  text: string;
}[] = [
  {
    id: "acquaintance",
    label: "지인",
    bg: designSystem.brand.brandSoft,
    text: "#1B64DA",
  },
  {
    id: "colleague",
    label: "동료",
    bg: designSystem.brand.secondary,
    text: designSystem.brand.deepSpaceBlue,
  },
  {
    id: "friend",
    label: "친구",
    bg: designSystem.brand.primary,
    text: "#FFFFFF",
  },
];

export function getGiftTagOption(id: GiftTagId) {
  return GIFT_TAG_OPTIONS.find((tag) => tag.id === id);
}
