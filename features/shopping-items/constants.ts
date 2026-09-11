import type { ShoppingItemFormValues } from "./schema";

export const defaultItemFormValues: ShoppingItemFormValues = {
  name: "",
  estimatedPrice: 0,
  quantity: 1,
  memo: "",
  purchasePlace: "",
  imageDataUrl: null,
  plannedPurchaseDate: null,
  giftTags: [],
};
