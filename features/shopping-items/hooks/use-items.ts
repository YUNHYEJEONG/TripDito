"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { itemRepository } from "../data/item-repository";
import type { ShoppingItemFormValues } from "../schema";

export const itemKeys = {
  all: ["items"] as const,
  byTrip: (tripId: string) => ["items", tripId] as const,
  detail: (id: string) => ["items", "detail", id] as const,
};

export function useItems(tripId: string) {
  return useQuery({
    queryKey: itemKeys.byTrip(tripId),
    queryFn: () => itemRepository.listByTrip(tripId),
    enabled: Boolean(tripId),
  });
}

export function useItem(id: string) {
  return useQuery({
    queryKey: itemKeys.detail(id),
    queryFn: () => itemRepository.getById(id) ?? null,
    enabled: Boolean(id),
  });
}

export function useCreateItem(tripId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: ShoppingItemFormValues) =>
      itemRepository.create(tripId, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: itemKeys.byTrip(tripId) });
    },
  });
}

export function useCopyItemToTrip() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      sourceItemId,
      targetTripId,
    }: {
      sourceItemId: string;
      targetTripId: string;
    }) => itemRepository.copyToTrip(sourceItemId, targetTripId),
    onSuccess: (item) => {
      void queryClient.invalidateQueries({
        queryKey: itemKeys.byTrip(item.tripId),
      });
      void queryClient.invalidateQueries({ queryKey: itemKeys.all });
    },
  });
}

export function useCopyItemsToTrip() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      sourceItemIds,
      targetTripId,
    }: {
      sourceItemIds: string[];
      targetTripId: string;
    }) => itemRepository.copyManyToTrip(sourceItemIds, targetTripId),
    onSuccess: (items) => {
      const tripId = items[0]?.tripId;
      if (tripId) {
        void queryClient.invalidateQueries({
          queryKey: itemKeys.byTrip(tripId),
        });
      }
      void queryClient.invalidateQueries({ queryKey: itemKeys.all });
    },
  });
}

export function useCreateManyItems(tripId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (inputs: ShoppingItemFormValues[]) =>
      itemRepository.createMany(tripId, inputs),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: itemKeys.byTrip(tripId) });
    },
  });
}

export function useUpdateItem(tripId: string, itemId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: ShoppingItemFormValues) =>
      itemRepository.update(itemId, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: itemKeys.byTrip(tripId) });
      void queryClient.invalidateQueries({ queryKey: itemKeys.detail(itemId) });
    },
  });
}

export function useTogglePurchased(tripId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (itemId: string) => itemRepository.togglePurchased(itemId),
    onMutate: async (itemId) => {
      await queryClient.cancelQueries({ queryKey: itemKeys.byTrip(tripId) });
      const previous = queryClient.getQueryData(
        itemKeys.byTrip(tripId),
      );
      queryClient.setQueryData(
        itemKeys.byTrip(tripId),
        (old: ReturnType<typeof itemRepository.listByTrip> | undefined) => {
          if (!old) return old;
          return old.map((item) => {
            if (item.id !== itemId) return item;
            const purchased = !item.purchased;
            return {
              ...item,
              purchased,
              purchasedAt: purchased ? new Date().toISOString() : null,
              updatedAt: new Date().toISOString(),
            };
          });
        },
      );
      return { previous };
    },
    onError: (_error, _itemId, context) => {
      if (context?.previous) {
        queryClient.setQueryData(itemKeys.byTrip(tripId), context.previous);
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: itemKeys.byTrip(tripId) });
    },
  });
}

export function useDeleteItem(tripId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (itemId: string) => {
      itemRepository.remove(itemId);
      return itemId;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: itemKeys.byTrip(tripId) });
    },
  });
}
