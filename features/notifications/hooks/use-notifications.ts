"use client";

import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  NOTIFICATIONS_CHANGE_EVENT,
  notificationRepository,
} from "../data/notification-repository";
import type { AppNotificationType } from "../types";
import { storageKeys } from "@/lib/storage/keys";
import { resolveLocalStorageKey } from "@/lib/storage/local-storage";

export const notificationKeys = {
  all: ["notifications"] as const,
};

function useNotificationStorageSync() {
  const queryClient = useQueryClient();
  useEffect(() => {
    const refresh = () => {
      void queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    };
    const onStorage = (event: StorageEvent) => {
      if (event.key === resolveLocalStorageKey(storageKeys.notifications)) {
        refresh();
      }
    };
    window.addEventListener(NOTIFICATIONS_CHANGE_EVENT, refresh);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener(NOTIFICATIONS_CHANGE_EVENT, refresh);
      window.removeEventListener("storage", onStorage);
    };
  }, [queryClient]);
}

export function useNotifications() {
  useNotificationStorageSync();
  return useQuery({
    queryKey: notificationKeys.all,
    queryFn: () => notificationRepository.list(),
  });
}

export function useUnreadNotificationCount() {
  useNotificationStorageSync();
  return useQuery({
    queryKey: [...notificationKeys.all, "unread"],
    queryFn: () => notificationRepository.unreadCount(),
  });
}

export function useCreateNotification() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      type: AppNotificationType;
      title: string;
      body?: string;
      href: string;
      dedupeKey?: string;
    }) => notificationRepository.create(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => notificationRepository.markRead(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => notificationRepository.markAllRead(),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });
}
