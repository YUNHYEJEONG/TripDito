"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { analysisJobRepository } from "../data/analysis-job-repository";
import type {
  AnalyzableImage,
  ImageAnalysisContext,
} from "../port";
import type { AnalysisJobIntent } from "../types/analysis-job";

export const analysisJobKeys = {
  all: ["analysis-job"] as const,
};

export function useAnalysisJob() {
  return useQuery({
    queryKey: analysisJobKeys.all,
    queryFn: () => analysisJobRepository.get(),
  });
}

export function useStartAnalysisJob() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      tripId: string;
      images: AnalyzableImage[];
      context: ImageAnalysisContext;
      intent?: AnalysisJobIntent;
    }) => analysisJobRepository.start(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: analysisJobKeys.all });
    },
  });
}

export function useClearAnalysisJob() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      analysisJobRepository.clear();
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: analysisJobKeys.all });
    },
  });
}

export function useRetryAnalysisJob() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => analysisJobRepository.retry(),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: analysisJobKeys.all });
    },
  });
}

export function invalidateAnalysisJob(queryClient: {
  invalidateQueries: (opts: { queryKey: readonly unknown[] }) => Promise<void>;
}) {
  return queryClient.invalidateQueries({ queryKey: analysisJobKeys.all });
}
