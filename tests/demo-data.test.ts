import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  bootstrapDemoData,
  buildDemoDataFixture,
  DEMO_ACCOUNT_CREDENTIALS,
  DEMO_DATA_VERSION,
  DEMO_STORAGE_MARKER_KEY,
  demoIds,
  replaceWithDemoData,
  suppressAutomaticDemoData,
  validateDemoDataFixture,
} from "../features/demo";
import {
  getTripHomeMode,
  selectHomeTrip,
} from "../features/home/utils/get-home-mode";
import { storageKeys } from "../lib/storage/keys";

const REFERENCE = new Date("2026-08-12T03:00:00.000Z");
const REFERENCE_DAY = "2026-08-12";

class MemoryStorage {
  private values = new Map<string, string>();

  getItem(key: string) {
    return this.values.get(key) ?? null;
  }

  setItem(key: string, value: string) {
    this.values.set(key, value);
  }

  removeItem(key: string) {
    this.values.delete(key);
  }
}

describe("demo fixture", () => {
  it("keeps rich examples for every home mode in one valid fixture", () => {
    const fixture = buildDemoDataFixture(REFERENCE);
    const tripById = new Map(fixture.trips.map((trip) => [trip.id, trip]));

    assert.deepEqual(validateDemoDataFixture(fixture, REFERENCE), []);
    assert.equal(fixture.trips.length, 5);
    assert.equal(
      getTripHomeMode(tripById.get(demoIds.trips.osaka)!, REFERENCE_DAY),
      "idle",
    );
    assert.equal(
      getTripHomeMode(tripById.get(demoIds.trips.fukuoka)!, REFERENCE_DAY),
      "prep",
    );
    assert.equal(
      getTripHomeMode(tripById.get(demoIds.trips.tokyo)!, REFERENCE_DAY),
      "live",
    );
    assert.equal(
      getTripHomeMode(tripById.get(demoIds.trips.taipei)!, REFERENCE_DAY),
      "after",
    );
    assert.equal(
      getTripHomeMode(tripById.get(demoIds.trips.paris)!, REFERENCE_DAY),
      "after",
    );
    assert.ok(tripById.get(demoIds.trips.osaka)!.startDate > REFERENCE_DAY);
    assert.ok(tripById.get(demoIds.trips.paris)!.endDate < REFERENCE_DAY);
    assert.equal(
      selectHomeTrip(fixture.trips, REFERENCE_DAY)?.id,
      demoIds.trips.tokyo,
    );
    assert.equal(fixture.activeTripId, demoIds.trips.osaka);
    const itemCount = (tripId: string) =>
      fixture.items.filter((item) => item.tripId === tripId).length;
    assert.equal(itemCount(demoIds.trips.fukuoka), 5);
    assert.ok(
      fixture.items
        .filter((item) => item.tripId === demoIds.trips.fukuoka)
        .every((item) => !item.purchased),
    );
    assert.ok(
      fixture.items
        .filter((item) => item.tripId === demoIds.trips.taipei)
        .every((item) => item.purchased),
    );
    const tokyoItems = fixture.items.filter(
      (item) => item.tripId === demoIds.trips.tokyo,
    );
    assert.ok(tokyoItems.some((item) => item.purchased));
    assert.ok(tokyoItems.some((item) => !item.purchased));
    for (const trip of fixture.trips) {
      assert.ok(
        fixture.items.filter((item) => item.tripId === trip.id).length >= 5,
      );
    }
    assert.ok(fixture.items.length >= 26);
    assert.ok(fixture.shots.some((shot) => shot.channel === "shots"));
    assert.equal(
      fixture.shots.filter((shot) => shot.channel === "community").length,
      2,
    );
    assert.ok(fixture.shots.some((shot) => shot.images.length === 3));
    assert.ok(fixture.shots.some((shot) => shot.comments.length === 3));
    assert.ok(fixture.shots.some((shot) => shot.pins.length >= 2));
    assert.ok(fixture.shots.filter((shot) => shot.likedByMe).length >= 2);
    assert.ok(fixture.scraps.length >= 2);
    assert.ok(fixture.receivedCoupons.length >= 2);
    assert.equal(fixture.auth.email, DEMO_ACCOUNT_CREDENTIALS.email);
    assert.equal(
      fixture.accounts[0]?.passwordHash,
      DEMO_ACCOUNT_CREDENTIALS.passwordHash,
    );
  });
});

describe("demo cold-start bootstrap", () => {
  it("seeds an empty storage once and records its version", () => {
    const storage = new MemoryStorage();
    const first = bootstrapDemoData(storage, REFERENCE);

    assert.equal(first.status, "seeded");
    const storedTrips = JSON.parse(
      storage.getItem(storageKeys.trips) ?? "[]",
    );
    assert.ok(storedTrips.length > 0);
    assert.equal(
      JSON.parse(storage.getItem(storageKeys.activeTrip) ?? "null"),
      demoIds.trips.osaka,
    );

    const marker = JSON.parse(storage.getItem(DEMO_STORAGE_MARKER_KEY) ?? "{}");
    assert.equal(marker.state, "seeded");
    assert.equal(marker.version, DEMO_DATA_VERSION);

    const snapshot = storage.getItem(storageKeys.trips);
    const second = bootstrapDemoData(
      storage,
      new Date("2027-01-01T00:00:00.000Z"),
    );
    assert.equal(second.status, "already-seeded");
    assert.equal(storage.getItem(storageKeys.trips), snapshot);
  });

  it("does not overwrite any non-empty user entity", () => {
    const storage = new MemoryStorage();
    const userTrips = JSON.stringify([
      {
        id: "user-trip",
        name: "내 여행",
      },
    ]);
    storage.setItem(storageKeys.trips, userTrips);

    const result = bootstrapDemoData(storage, REFERENCE);

    assert.equal(result.status, "existing-data");
    assert.equal(storage.getItem(storageKeys.trips), userTrips);
    assert.equal(storage.getItem(storageKeys.items), null);
    assert.equal(storage.getItem(DEMO_STORAGE_MARKER_KEY), null);
  });

  it("preserves malformed non-empty user storage instead of overwriting it", () => {
    const storage = new MemoryStorage();
    storage.setItem(storageKeys.trips, JSON.stringify({ legacy: true }));

    const result = bootstrapDemoData(storage, REFERENCE);

    assert.equal(result.status, "existing-data");
    assert.equal(storage.getItem(storageKeys.items), null);
  });

  it("treats explicit empty defaults as a cold browser", () => {
    const storage = new MemoryStorage();
    storage.setItem(storageKeys.trips, "[]");
    storage.setItem(storageKeys.items, "[]");
    storage.setItem(
      storageKeys.auth,
      JSON.stringify({
        isLoggedIn: false,
        loggedInAt: null,
        provider: null,
        email: null,
      }),
    );

    assert.equal(bootstrapDemoData(storage, REFERENCE).status, "seeded");
  });

  it("honors the reset tombstone across reloads", () => {
    const storage = new MemoryStorage();
    assert.equal(bootstrapDemoData(storage, REFERENCE).status, "seeded");

    storage.removeItem(storageKeys.trips);
    storage.removeItem(storageKeys.items);
    storage.removeItem(storageKeys.shots);
    storage.removeItem(storageKeys.profile);
    storage.removeItem(storageKeys.auth);
    storage.removeItem(storageKeys.accounts);
    storage.removeItem(storageKeys.scraps);
    storage.removeItem(storageKeys.receivedCoupons);
    storage.removeItem(storageKeys.activeTrip);
    suppressAutomaticDemoData(storage, REFERENCE);

    assert.equal(bootstrapDemoData(storage, REFERENCE).status, "suppressed");
    assert.equal(storage.getItem(storageKeys.trips), null);
  });

  it("allows a confirmed manual action to replace existing data", () => {
    const storage = new MemoryStorage();
    storage.setItem(storageKeys.trips, JSON.stringify([{ id: "user-trip" }]));

    const fixture = replaceWithDemoData(storage, REFERENCE);
    const storedTrips = JSON.parse(storage.getItem(storageKeys.trips) ?? "[]");

    assert.equal(storedTrips[0]?.id, fixture.trips[0]?.id);
    assert.ok(!storedTrips.some((trip: { id: string }) => trip.id === "user-trip"));
  });

  it("preserves an existing login and account during a manual replacement", () => {
    const storage = new MemoryStorage();
    const auth = JSON.stringify({
      isLoggedIn: true,
      email: "owner@example.com",
      provider: "email",
      loggedInAt: REFERENCE.toISOString(),
    });
    const accounts = JSON.stringify([
      {
        email: "owner@example.com",
        passwordHash: "owner-hash",
        nickname: "기존 사용자",
        createdAt: REFERENCE.toISOString(),
      },
    ]);
    storage.setItem(storageKeys.auth, auth);
    storage.setItem(storageKeys.accounts, accounts);

    replaceWithDemoData(storage, REFERENCE);

    assert.equal(storage.getItem(storageKeys.auth), auth);
    assert.equal(storage.getItem(storageKeys.accounts), accounts);
  });
});
