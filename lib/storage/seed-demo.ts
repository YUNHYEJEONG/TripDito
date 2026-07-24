import { createId } from "@/lib/storage/id";
import { setJson } from "@/lib/storage/local-storage";
import { storageKeys } from "@/lib/storage/keys";
import { appConfig } from "@/config/app";
import type { Trip } from "@/features/trips/types";
import type { ShoppingItem } from "@/features/shopping-items/types";

function daysFromNow(offset: number) {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  return date.toISOString().slice(0, 10);
}

export function seedDemoData() {
  const now = new Date().toISOString();
  const tripId = createId();

  const trip: Trip = {
    id: tripId,
    name: "도쿄 주말 쇼핑",
    country: "일본",
    city: "도쿄",
    startDate: daysFromNow(14),
    endDate: daysFromNow(17),
    currency: "JPY",
    budget: 50000,
    createdAt: now,
    updatedAt: now,
  };

  const items: ShoppingItem[] = [
    {
      id: createId(),
      tripId,
      name: "돈키호테 스낵 세트",
      estimatedPrice: 1280,
      quantity: 2,
      memo: "출국장 전에 사기",
      imageDataUrl: null,
      purchased: false,
      purchasedAt: null,
      sortOrder: 1,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: createId(),
      tripId,
      name: "약국 비타민",
      estimatedPrice: 980,
      quantity: 1,
      memo: "마츠모토 키요시",
      imageDataUrl: null,
      purchased: true,
      purchasedAt: now,
      sortOrder: 2,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: createId(),
      tripId,
      name: "캐릭터 파우치",
      estimatedPrice: 1500,
      quantity: 1,
      memo: "선물용",
      imageDataUrl: null,
      purchased: false,
      purchasedAt: null,
      sortOrder: 3,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: createId(),
      tripId,
      name: "핸드크림",
      estimatedPrice: 890,
      quantity: 2,
      memo: "",
      imageDataUrl: null,
      purchased: false,
      purchasedAt: null,
      sortOrder: 4,
      createdAt: now,
      updatedAt: now,
    },
  ];

  setJson(storageKeys.trips, [trip]);
  setJson(storageKeys.items, items);
  setJson(storageKeys.meta, {
    version: appConfig.storageVersion,
    seededAt: now,
  });

  return { trip, items };
}
