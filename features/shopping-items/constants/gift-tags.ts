import { designSystem } from "@/config/design-system";

export const GIFT_TAG_IDS = [
  "acquaintance",
  "colleague",
  "friend",
] as const;

export type GiftTagId = (typeof GIFT_TAG_IDS)[number];

/**
 * 선물 대상 태그 톤
 * - 구매완료(bg-success/10 + text-success)와 같은 soft pastel 방식
 */
export const GIFT_TAG_OPTIONS: {
  id: GiftTagId;
  label: string;
  bg: string;
  text: string;
}[] = [
  {
    id: "acquaintance",
    label: "지인",
    bg: "#E8F4FC",
    text: designSystem.brand.blueGreen,
  },
  {
    id: "colleague",
    label: "동료",
    bg: "#FFF6E0",
    text: "#C47F00",
  },
  {
    id: "friend",
    label: "친구",
    bg: "#FFF1E0",
    text: "#E85D04",
  },
];

export function getGiftTagOption(id: GiftTagId) {
  return GIFT_TAG_OPTIONS.find((tag) => tag.id === id);
}
