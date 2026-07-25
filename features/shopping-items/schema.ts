import { z } from "zod";
import { GIFT_TAG_IDS } from "./constants/gift-tags";

export const giftTagSchema = z.enum(GIFT_TAG_IDS);

export const shoppingItemFormSchema = z.object({
  name: z.string().trim().min(1, "상품명을 입력하세요"),
  estimatedPrice: z.number().min(0, "가격은 0 이상이어야 합니다"),
  quantity: z.number().int().min(1, "수량은 1 이상이어야 합니다"),
  memo: z.string().trim(),
  imageDataUrl: z.string().nullable(),
  /** 예상 구매일 (YYYY-MM-DD). 미입력이면 null */
  plannedPurchaseDate: z.string().nullable(),
  giftTags: z.array(giftTagSchema).default([]),
});

export type ShoppingItemFormValues = z.infer<typeof shoppingItemFormSchema>;

export type ShoppingItem = Omit<ShoppingItemFormValues, "giftTags"> & {
  id: string;
  tripId: string;
  giftTags: z.infer<typeof giftTagSchema>[];
  purchased: boolean;
  purchasedAt: string | null;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

export type ItemPurchaseFilter = "all" | "pending" | "purchased";
export type ItemSort =
  | "createdAt_desc"
  | "price_desc"
  | "price_asc"
  | "name_asc";
