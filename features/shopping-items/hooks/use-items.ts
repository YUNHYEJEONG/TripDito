"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { itemRepository } from "../data/item-repository";
import type { ShoppingItem, ShoppingItemFormValues } from "../schema";
import { useIsLoggedIn } from "@/features/auth/hooks/use-auth";

export const itemKeys = {
  all: ["items"] as const,
  byTrip: (tripId: string) => ["items", tripId] as const,
  detail: (id: string) => ["items", "detail", id] as const,
};

export function useItems(tripId: string) {
  const { isLoggedIn } = useIsLoggedIn();
  return useQuery({
    queryKey: itemKeys.byTrip(tripId),
    queryFn: () => itemRepository.listByTrip(tripId),
    enabled: Boolean(tripId) && isLoggedIn,
  });
}

export function useItem(id: string) {
  const { isLoggedIn } = useIsLoggedIn();
  return useQuery({
    queryKey: itemKeys.detail(id),
    queryFn: () => itemRepository.getById(id),
    enabled: Boolean(id) && isLoggedIn,
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
      sourceItem,
      targetTripId,
    }: {
      sourceItem: ShoppingItem;
      targetTripId: string;
    }) => itemRepository.copyToTrip(sourceItem, targetTripId),
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
      sourceItems,
      targetTripId,
    }: {
      sourceItems: ShoppingItem[];
      targetTripId: string;
    }) => itemRepository.copyManyToTrip(sourceItems, targetTripId),
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
      itemRepository.update(
        itemId,
        input,
        queryClient.getQueryData<ShoppingItem>(itemKeys.detail(itemId)) ??
          queryClient
            .getQueryData<ShoppingItem[]>(itemKeys.byTrip(tripId))
            ?.find((item) => item.id === itemId),
      ),
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
        (old: ShoppingItem[] | undefined) => {
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
      await itemRepository.remove(itemId);
      return itemId;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: itemKeys.byTrip(tripId) });
    },
  });
}
