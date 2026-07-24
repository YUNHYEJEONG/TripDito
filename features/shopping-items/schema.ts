import { z } from "zod";

export const shoppingItemFormSchema = z.object({
  name: z.string().trim().min(1, "상품명을 입력하세요"),
  estimatedPrice: z.number().min(0, "가격은 0 이상이어야 합니다"),
  quantity: z.number().int().min(1, "수량은 1 이상이어야 합니다"),
  memo: z.string().trim(),
  imageDataUrl: z.string().nullable(),
});

export type ShoppingItemFormValues = z.infer<typeof shoppingItemFormSchema>;

export type ShoppingItem = ShoppingItemFormValues & {
  id: string;
  tripId: string;
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
