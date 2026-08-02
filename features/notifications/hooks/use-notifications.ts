"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { notificationRepository } from "../data/notification-repository";
import type { AppNotificationType } from "../types";

export const notificationKeys = {
  all: ["notifications"] as const,
};

export function useNotifications() {
  return useQuery({
    queryKey: notificationKeys.all,
    queryFn: () => notificationRepository.list(),
  });
}

export function useUnreadNotificationCount() {
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
