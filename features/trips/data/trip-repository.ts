import { api } from "@/lib/api/client";
import type { Trip, TripFormValues } from "../schema";

/** 서버 /api/trips 응답 (lib/db/trips.ts TripDto) */
type TripDto = Trip & {
  countryCode: string;
  timezone: string;
  status: "PREP" | "PLANNED" | "ONGOING" | "DONE";
};

function toPayload(input: TripFormValues) {
  return {
    name: input.name,
    country: input.country,
    city: input.city,
    startDate: input.startDate,
    endDate: input.endDate,
    currency: input.currency,
    budget: input.budget,
  };
}

export const tripRepository = {
  list(): Promise<Trip[]> {
    return api<TripDto[]>("/api/trips");
  },

  getById(id: string): Promise<Trip> {
    return api<TripDto>(`/api/trips/${id}`);
  },

  create(input: TripFormValues): Promise<Trip> {
    return api<TripDto>("/api/trips", { method: "POST", body: toPayload(input) });
  },

  update(id: string, input: TripFormValues): Promise<Trip> {
    return api<TripDto>(`/api/trips/${id}`, {
      method: "PUT",
      body: toPayload(input),
    });
  },

  async remove(id: string): Promise<void> {
    await api(`/api/trips/${id}`, { method: "DELETE" });
  },

  /** 여행 마치기 (상태 DONE) */
  complete(id: string): Promise<Trip> {
    return api<TripDto>(`/api/trips/${id}/complete`, { method: "POST" });
  },

  /** 여권 도장 페이지 저장 */
  setPassportPage(id: string, pageNumber: number): Promise<Trip> {
    return api<TripDto>(`/api/trips/${id}/passport-page`, {
      method: "PUT",
      body: { pageNumber },
    });
  },
};
