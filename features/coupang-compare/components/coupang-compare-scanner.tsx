"use client";

import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { itemRepository } from "@/features/shopping-items/data/item-repository";
import { itemKeys } from "@/features/shopping-items/hooks/use-items";
import { tripRepository } from "@/features/trips/data/trip-repository";
import { notificationRepository } from "@/features/notifications/data/notification-repository";
import { notificationKeys } from "@/features/notifications/hooks/use-notifications";
import { storageKeys } from "@/lib/storage/keys";
import { resolveLocalStorageKey } from "@/lib/storage/local-storage";
import {
  DEMO_MODE_CHANGE_EVENT,
  isDemoMode,
} from "@/features/demo/lib/demo-mode";

const POLL_MS = 30_000;
const TEST_POLL_MS = 3_000;

type CoupangSearchResponse = {
  deal?: {
    title: string;
    unitPriceKrw: number;
    url: string;
    source: string;
  } | null;
  error?: string;
};

async function runCompareForItem(
  itemId: string,
  expectedItemsKey: string,
): Promise<boolean> {
  if (resolveLocalStorageKey(storageKeys.items) !== expectedItemsKey) {
    return false;
  }
  const item = itemRepository.getById(itemId);
  if (!item || item.coupangCompareStatus !== "pending") return false;
  const comparisonFingerprint = [
    item.updatedAt,
    item.name,
    item.estimatedPrice,
    item.quantity,
  ].join("\u0000");

  const trip = tripRepository.getById(item.tripId);
  const currency = trip?.currency ?? "KRW";

  try {
    const res = await fetch("/api/coupang-search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: item.name,
        memo: item.memo,
        estimatedPrice: item.estimatedPrice,
        currency,
        quantity: item.quantity,
      }),
    });

    const body = (await res.json()) as CoupangSearchResponse;
    // A scheduled request can finish after logout/account switch. Leave the
    // old item pending so it can retry when that account is active again.
    if (resolveLocalStorageKey(storageKeys.items) !== expectedItemsKey) {
      return false;
    }
    const current = itemRepository.getById(itemId);
    if (
      !current ||
      current.coupangCompareStatus !== "pending" ||
      [
        current.updatedAt,
        current.name,
        current.estimatedPrice,
        current.quantity,
      ].join("\u0000") !== comparisonFingerprint
    ) {
      return false;
    }
    if (!res.ok) {
      itemRepository.setCoupangCompareResult(itemId, {
        status: "failed",
        deal: null,
      });
      return false;
    }

    const deal = body.deal
      ? {
          title: body.deal.title,
          unitPriceKrw: body.deal.unitPriceKrw,
          url: body.deal.url,
          checkedAt: new Date().toISOString(),
        }
      : null;

    itemRepository.setCoupangCompareResult(itemId, {
      status: "done",
      deal,
    });

    if (deal) {
      const priceLabel = deal.unitPriceKrw.toLocaleString("ko-KR");
      notificationRepository.create({
        type: "coupang-cheaper",
        title: "좀 더 저렴한 상품을 찾았어요",
        body: `${item.name} · 쿠팡 1개당 ${priceLabel}원`,
        href: `/trips/${item.tripId}`,
        dedupeKey: `coupang-cheaper:${item.id}`,
      });
      return true;
    }
    return false;
  } catch {
    if (resolveLocalStorageKey(storageKeys.items) !== expectedItemsKey) {
      return false;
    }
    const current = itemRepository.getById(itemId);
    if (
      !current ||
      current.coupangCompareStatus !== "pending" ||
      [
        current.updatedAt,
        current.name,
        current.estimatedPrice,
        current.quantity,
      ].join("\u0000") !== comparisonFingerprint
    ) {
      return false;
    }
    itemRepository.setCoupangCompareResult(itemId, {
      status: "failed",
      deal: null,
    });
    return false;
  }
}

/** 등록 후 예약된 시각에 쿠팡 저가 비교를 실행한다. */
export function CoupangCompareScanner() {
  const queryClient = useQueryClient();
  const runningRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    let intervalId = 0;

    async function tick() {
      if (cancelled || runningRef.current) return;
      const due = itemRepository.listDueCoupangCompare();
      if (due.length === 0) return;
      const itemsStorageKey = resolveLocalStorageKey(storageKeys.items);

      runningRef.current = true;
      let notified = false;
      const tripIds = new Set<string>();

      try {
        for (const item of due) {
          if (cancelled) break;
          const created = await runCompareForItem(item.id, itemsStorageKey);
          tripIds.add(item.tripId);
          if (created) notified = true;
        }
      } finally {
        runningRef.current = false;
      }

      for (const tripId of tripIds) {
        void queryClient.invalidateQueries({
          queryKey: itemKeys.byTrip(tripId),
        });
      }
      void queryClient.invalidateQueries({ queryKey: itemKeys.all });
      if (notified) {
        void queryClient.invalidateQueries({
          queryKey: notificationKeys.all,
        });
      }
    }

    function schedule() {
      window.clearInterval(intervalId);
      intervalId = window.setInterval(
        () => void tick(),
        isDemoMode() ? TEST_POLL_MS : POLL_MS,
      );
    }

    void tick();
    schedule();

    function onFocus() {
      void tick();
    }
    function onDemoModeChange() {
      schedule();
      void tick();
    }
    window.addEventListener("focus", onFocus);
    window.addEventListener("online", onFocus);
    window.addEventListener(DEMO_MODE_CHANGE_EVENT, onDemoModeChange);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("online", onFocus);
      window.removeEventListener(DEMO_MODE_CHANGE_EVENT, onDemoModeChange);
    };
  }, [queryClient]);

  return null;
}
