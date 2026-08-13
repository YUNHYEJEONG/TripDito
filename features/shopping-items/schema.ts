import { z } from "zod";
import { GIFT_TAG_IDS } from "./constants/gift-tags";

export const giftTagSchema = z.enum(GIFT_TAG_IDS);

const isoDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "구매 예정일을 다시 확인해 주세요");

export const shoppingItemFormSchema = z.object({
  name: z.string().trim().min(1, "상품명을 입력해 주세요"),
  estimatedPrice: z.number().min(0, "가격은 0 이상이어야 해요"),
  quantity: z.number().int().min(1, "수량은 1 이상이어야 해요"),
  memo: z.string().trim(),
  imageDataUrl: z.string().nullable(),
  /**
   * 현재 디자인에서 사용했던 단일 필드입니다. 새 저장 형식에서도 첫
   * 구매일 alias로 유지해, 아직 전환되지 않은 호출부가 깨지지 않게 합니다.
   */
  plannedPurchaseDate: isoDateSchema.nullable(),
  /** 운영판 canonical 필드 — 한 상품을 여러 여행 일차에 살 수 있습니다. */
  plannedPurchaseDates: z.array(isoDateSchema).optional(),
  giftTags: z.array(giftTagSchema),
  /** AI가 제안한 현지어 상품명과 예상 구매처 */
  localName: z.string().trim().nullable().optional(),
  expectedStores: z.array(z.string().trim().min(1)).optional(),
  similarMatchCount: z.number().int().min(0).nullable().optional(),
  /** 종료 여행에서 다시 찾기 위한 상품 즐겨찾기 */
  favorited: z.boolean().optional(),
  /** 퍼온 상품에서 사용자가 확인해야 하는 값 */
  priceNeedsReview: z.boolean().optional(),
  scheduleNeedsReview: z.boolean().optional(),
  copiedFromItemId: z.string().nullable().optional(),
  sourceCurrency: z.string().nullable().optional(),
});

export type ShoppingItemFormValues = z.infer<typeof shoppingItemFormSchema>;

export type CoupangCompareStatus =
  | "pending"
  | "checking"
  | "done"
  | "failed";

export type CoupangDeal = {
  title: string;
  unitPriceKrw: number;
  url: string;
  checkedAt: string;
};

/**
 * optional인 운영 필드는 구버전 fixture와 raw localStorage를 타입 수준에서
 * 허용하기 위한 것입니다. repository가 반환할 때는 모두 정규화합니다.
 */
export type ShoppingItem = Omit<
  ShoppingItemFormValues,
  "giftTags" | "plannedPurchaseDate"
> & {
  id: string;
  tripId: string;
  giftTags: z.infer<typeof giftTagSchema>[];
  plannedPurchaseDate: string | null;
  purchased: boolean;
  purchasedAt: string | null;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  coupangCompareStatus?: CoupangCompareStatus;
  coupangCompareRunAfter?: string | null;
  coupangDeal?: CoupangDeal | null;
};

export type ItemPurchaseFilter = "all" | "pending" | "purchased" | "gift";
export type ItemSort =
  | "day_asc"
  | "createdAt_desc"
  | "price_desc"
  | "price_asc"
  | "name_asc";
