import { createId } from "@/lib/storage/id";
import { getJson, setJson } from "@/lib/storage/local-storage";
import { storageKeys } from "@/lib/storage/keys";
import type { Trip, TripFormValues } from "../schema";
import { itemRepository } from "@/features/shopping-items/data/item-repository";

function readTrips(): Trip[] {
  return getJson<Trip[]>(storageKeys.trips, []).map((trip) => ({
    ...trip,
    budgetMode:
      trip.budgetMode ?? (trip.budget > 0 ? "input" : "unknown"),
    tripTags: Array.isArray(trip.tripTags) ? trip.tripTags : [],
  }));
}

function writeTrips(trips: Trip[]) {
  setJson(storageKeys.trips, trips);
}

export const tripRepository = {
  list(): Trip[] {
    return readTrips().sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    );
  },

  getById(id: string): Trip | undefined {
    return readTrips().find((trip) => trip.id === id);
  },

  create(input: TripFormValues): Trip {
    const now = new Date().toISOString();
    const trip: Trip = {
      ...input,
      id: createId(),
      createdAt: now,
      updatedAt: now,
    };
    writeTrips([trip, ...readTrips()]);
    return trip;
  },

  update(id: string, input: TripFormValues): Trip {
    const trips = readTrips();
    const index = trips.findIndex((trip) => trip.id === id);
    if (index < 0) throw new Error("여행을 찾을 수 없어요");
    const current = trips[index];
    if (
      current.currency !== input.currency &&
      itemRepository.listByTrip(id).length > 0
    ) {
      throw new Error(
        "상품이 있는 여행은 기준 통화를 바꿀 수 없어요. 상품을 먼저 정리해 주세요.",
      );
    }
    const updated: Trip = {
      ...trips[index],
      ...input,
      updatedAt: new Date().toISOString(),
    };
    trips[index] = updated;
    writeTrips(trips);
    if (
      current.startDate !== input.startDate ||
      current.endDate !== input.endDate
    ) {
      itemRepository.rebasePlannedDates(
        id,
        current.startDate,
        input.startDate,
        input.endDate,
      );
    }
    return updated;
  },

  remove(id: string) {
    writeTrips(readTrips().filter((trip) => trip.id !== id));
    itemRepository.removeByTripId(id);
  },
};
