"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useTrips } from "@/features/trips/hooks/use-trips";
import { todayIsoDate } from "@/features/home/utils/get-upcoming-trip";
import { notificationRepository } from "../data/notification-repository";
import { notificationKeys } from "../hooks/use-notifications";

function addDaysIso(isoDate: string, days: number): string {
  const date = new Date(`${isoDate}T00:00:00`);
  date.setDate(date.getDate() + days);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** 여행 종료 +2일 이후 즐겨찾기 유도 알림 생성 */
export function TripEndedNotificationScanner() {
  const { data: trips = [] } = useTrips();
  const queryClient = useQueryClient();

  useEffect(() => {
    const today = todayIsoDate();
    let created = false;
    for (const trip of trips) {
      const notifyOn = addDaysIso(trip.endDate, 2);
      if (today < notifyOn) continue;
      const dedupeKey = `trip-ended-favorite:${trip.id}`;
      const result = notificationRepository.create({
        type: "trip-ended-favorite",
        title: `${trip.city} 여행은 어떠셨나요? 만족한 상품을 즐겨찾기 해보세요!`,
        href: `/trips/${trip.id}`,
        dedupeKey,
      });
      if (result) created = true;
    }
    if (created) {
      void queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    }
  }, [trips, queryClient]);

  return null;
}
