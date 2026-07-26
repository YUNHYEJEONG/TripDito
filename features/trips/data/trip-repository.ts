import { createId } from "@/lib/storage/id";
import { getJson, setJson } from "@/lib/storage/local-storage";
import { storageKeys } from "@/lib/storage/keys";
import type { Trip, TripFormValues } from "../schema";
import { itemRepository } from "@/features/shopping-items/data/item-repository";
import {
  findOverlappingTrip,
  TRIP_DATE_OVERLAP_MESSAGE,
} from "../utils/trip-date-overlap";

function readTrips(): Trip[] {
  return getJson<Trip[]>(storageKeys.trips, []).map((trip) => ({
    ...trip,
    tripTags: trip.tripTags ?? [],
  }));
}

function writeTrips(trips: Trip[]) {
  setJson(storageKeys.trips, trips);
}

function assertNoDateOverlap(
  input: TripFormValues,
  excludeTripId?: string,
) {
  if (
    findOverlappingTrip(
      readTrips(),
      input.startDate,
      input.endDate,
      excludeTripId,
    )
  ) {
    throw new Error(TRIP_DATE_OVERLAP_MESSAGE);
  }
}

export const tripRepository = {
  list(): Trip[] {
    return readTrips().sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    );
  },

  getById(id: string): Trip | undefined {
    return readTrips().find((trip) => trip.id === id);
  },

  create(input: TripFormValues): Trip {
    assertNoDateOverlap(input);
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
    assertNoDateOverlap(input, id);
    const trips = readTrips();
    const index = trips.findIndex((trip) => trip.id === id);
    if (index < 0) throw new Error("여행을 찾을 수 없습니다.");
    const updated: Trip = {
      ...trips[index],
      ...input,
      updatedAt: new Date().toISOString(),
    };
    trips[index] = updated;
    writeTrips(trips);
    return updated;
  },

  remove(id: string) {
    writeTrips(readTrips().filter((trip) => trip.id !== id));
    itemRepository.removeByTripId(id);
  },
};
