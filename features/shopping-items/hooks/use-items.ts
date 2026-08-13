"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { itemRepository } from "../data/item-repository";
import { migrateShoppingItemsForCompatibility } from "../data/migrate-shopping-demo-fields";
import type { ShoppingItemFormValues } from "../schema";

export const itemKeys = {
  all: ["items"] as const,
  byTrip: (tripId: string) => ["items", tripId] as const,
  detail: (id: string) => ["items", "detail", id] as const,
  favorited: ["items", "favorited"] as const,
};

function ensureCompatibleItems() {
  migrateShoppingItemsForCompatibility();
}

export function useItems(tripId: string) {
  return useQuery({
    queryKey: itemKeys.byTrip(tripId),
    queryFn: () => {
      ensureCompatibleItems();
      return itemRepository.listByTrip(tripId);
    },
    enabled: Boolean(tripId),
  });
}

export function useItem(id: string) {
  return useQuery({
    queryKey: itemKeys.detail(id),
    queryFn: () => {
      ensureCompatibleItems();
      return itemRepository.getById(id) ?? null;
    },
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
      void queryClient.invalidateQueries({ queryKey: itemKeys.all });
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
      void queryClient.invalidateQueries({ queryKey: itemKeys.favorited });
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
      void queryClient.invalidateQueries({ queryKey: itemKeys.favorited });
    },
  });
}

export function useCreateManyItems(
  tripId: string,
  options: { markPurchased?: boolean } = {},
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (inputs: ShoppingItemFormValues[]) =>
      itemRepository.createMany(tripId, inputs, {
        purchased: options.markPurchased,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: itemKeys.byTrip(tripId) });
      void queryClient.invalidateQueries({ queryKey: itemKeys.all });
      void queryClient.invalidateQueries({ queryKey: itemKeys.favorited });
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
      void queryClient.invalidateQueries({ queryKey: itemKeys.all });
      void queryClient.invalidateQueries({ queryKey: itemKeys.favorited });
    },
  });
}

export function useTogglePurchased(tripId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (itemId: string) => itemRepository.togglePurchased(itemId),
    onMutate: async (itemId) => {
      await queryClient.cancelQueries({ queryKey: itemKeys.byTrip(tripId) });
      await queryClient.cancelQueries({ queryKey: itemKeys.detail(itemId) });
      const previousList = queryClient.getQueryData(itemKeys.byTrip(tripId));
      const previousDetail = queryClient.getQueryData(itemKeys.detail(itemId));

      const applyToggle = <
        T extends {
          purchased: boolean;
          purchasedAt: string | null;
          updatedAt: string;
        },
      >(
        current: T,
      ): T => {
        const purchased = !current.purchased;
        return {
          ...current,
          purchased,
          purchasedAt: purchased ? new Date().toISOString() : null,
          updatedAt: new Date().toISOString(),
        };
      };

      queryClient.setQueryData(
        itemKeys.byTrip(tripId),
        (old: ReturnType<typeof itemRepository.listByTrip> | undefined) =>
          old?.map((item) =>
            item.id === itemId ? applyToggle(item) : item,
          ),
      );
      queryClient.setQueryData(
        itemKeys.detail(itemId),
        (old: ReturnType<typeof itemRepository.getById> | null | undefined) =>
          old ? applyToggle(old) : old,
      );
      return { previousList, previousDetail };
    },
    onError: (_error, itemId, context) => {
      if (context?.previousList) {
        queryClient.setQueryData(itemKeys.byTrip(tripId), context.previousList);
      }
      if (context?.previousDetail !== undefined) {
        queryClient.setQueryData(
          itemKeys.detail(itemId),
          context.previousDetail,
        );
      }
    },
    onSettled: (_data, _error, itemId) => {
      void queryClient.invalidateQueries({ queryKey: itemKeys.byTrip(tripId) });
      void queryClient.invalidateQueries({ queryKey: itemKeys.detail(itemId) });
      void queryClient.invalidateQueries({ queryKey: itemKeys.all });
    },
  });
}

export function useToggleFavorited(tripId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (itemId: string) => itemRepository.toggleFavorited(itemId),
    onSuccess: (_item, itemId) => {
      void queryClient.invalidateQueries({ queryKey: itemKeys.byTrip(tripId) });
      void queryClient.invalidateQueries({ queryKey: itemKeys.detail(itemId) });
      void queryClient.invalidateQueries({ queryKey: itemKeys.favorited });
      void queryClient.invalidateQueries({ queryKey: itemKeys.all });
    },
  });
}

export function useFavoritedItems() {
  return useQuery({
    queryKey: itemKeys.favorited,
    queryFn: () => {
      ensureCompatibleItems();
      return itemRepository.listFavorited();
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
    onSuccess: (itemId) => {
      queryClient.removeQueries({
        queryKey: itemKeys.detail(itemId),
        exact: true,
      });
      void queryClient.invalidateQueries({ queryKey: itemKeys.byTrip(tripId) });
      void queryClient.invalidateQueries({ queryKey: itemKeys.all });
      void queryClient.invalidateQueries({ queryKey: itemKeys.favorited });
      void queryClient.invalidateQueries({ queryKey: ["shots"] });
    },
  });
}
