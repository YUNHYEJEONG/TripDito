"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";

export type StoreSuggestion = {
  name: string;
  area: string;
  note: string;
  url: string | null;
};

export type StoreSuggestResult = {
  stores: StoreSuggestion[];
  source: "gemini" | "maps" | "none";
  city: string;
  country: string;
};

const storeKeys = {
  suggest: (tripId: string, productName: string) =>
    ["store-suggest", tripId, productName.trim().toLowerCase()] as const,
};

/**
 * 여행 도시 인근 매장 추천. 사용자가 버튼을 눌렀을 때만 호출하고,
 * 같은 여행·상품명 결과는 세션 동안 캐시해 재조회하지 않는다.
 */
export function useStoreSuggest(tripId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (productName: string) => {
      const key = storeKeys.suggest(tripId, productName);
      const cached = queryClient.getQueryData<StoreSuggestResult>(key);
      if (cached) return cached;
      const result = await api<StoreSuggestResult>(
        `/api/trips/${tripId}/store-suggest`,
        { method: "POST", body: { productName } },
      );
      queryClient.setQueryData(key, result);
      return result;
    },
  });
}
