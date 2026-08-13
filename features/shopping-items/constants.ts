import type { ShoppingItemFormValues } from "./schema";

export const defaultItemFormValues: ShoppingItemFormValues = {
  name: "",
  estimatedPrice: 0,
  quantity: 1,
  memo: "",
  imageDataUrl: null,
  plannedPurchaseDate: null,
  plannedPurchaseDates: [],
  giftTags: [],
  localName: null,
  expectedStores: [],
  similarMatchCount: null,
  favorited: false,
  priceNeedsReview: false,
  scheduleNeedsReview: false,
  copiedFromItemId: null,
  sourceCurrency: null,
};
