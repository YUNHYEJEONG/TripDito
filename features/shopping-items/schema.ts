import { z } from "zod";
import { GIFT_TAG_IDS } from "./constants/gift-tags";

export const giftTagSchema = z.enum(GIFT_TAG_IDS);

export const shoppingItemFormSchema = z.object({
  name: z.string().trim().min(1, "상품명을 입력하세요."),
  estimatedPrice: z.number().min(0, "가격은 0 이상이어야 합니다."),
  quantity: z.number().int().min(1, "수량은 1 이상이어야 합니다."),
  memo: z.string().trim(),
  imageDataUrl: z.string().nullable(),
  /** 예상 구매일들 (YYYY-MM-DD). 복수 선택 가능 */
  plannedPurchaseDates: z.array(z.string()),
  giftTags: z.array(giftTagSchema),
  /** 현지 언어 상품명 (화면 비표시 메타) */
  localName: z.string().nullable(),
  /** 예상 구매처 (AI는 최대 3곳 제안, 사용자 입력은 제한 없음) */
  expectedStores: z.array(z.string().trim().min(1)),
  /** 종료 여행에서 즐겨찾기 */
  favorited: z.boolean(),
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

export type ShoppingItem = Omit<
  ShoppingItemFormValues,
  "giftTags" | "localName" | "expectedStores" | "plannedPurchaseDates" | "favorited"
> & {
  id: string;
  tripId: string;
  giftTags: z.infer<typeof giftTagSchema>[];
  plannedPurchaseDates: string[];
  /** @deprecated 레거시 단일 필드 — 읽기 시 plannedPurchaseDates로 정규화 */
  plannedPurchaseDate?: string | null;
  localName?: string | null;
  expectedStores?: string[];
  favorited: boolean;
  purchased: boolean;
  purchasedAt: string | null;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  /** 쿠팡 저가 비교 상태 */
  coupangCompareStatus: CoupangCompareStatus;
  /** 비교 실행 시각 (ISO). 생성 시 now+1h */
  coupangCompareRunAfter: string | null;
  /** 예상가보다 저렴한 쿠팡 딜 (없으면 null) */
  coupangDeal: CoupangDeal | null;
};

export type ItemPurchaseFilter = "all" | "pending" | "purchased";
export type ItemSort =
  | "createdAt_desc"
  | "price_desc"
  | "price_asc"
  | "name_asc";
