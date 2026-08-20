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

class FailOnceStorage extends MemoryStorage {
  private failingKey: string | null = null;

  failNextWriteTo(key: string) {
    this.failingKey = key;
  }

  override setItem(key: string, value: string) {
    if (key === this.failingKey) {
      this.failingKey = null;
      throw new Error(`storage write failed for ${key}`);
    }
    super.setItem(key, value);
  }
}

const V3_TRIP_IDS = [
  demoIds.trips.kyoto,
  demoIds.trips.seoul,
  demoIds.trips.bangkok,
  demoIds.trips.rome,
] as const;

const V3_ITEM_IDS = [
  demoIds.items.kyotoIncense,
  demoIds.items.kyotoFuroshiki,
  demoIds.items.kyotoMatcha,
  demoIds.items.kyotoTenugui,
  demoIds.items.kyotoCeramics,
  demoIds.items.seoulCandle,
  demoIds.items.seoulTray,
  demoIds.items.seoulYakgwa,
  demoIds.items.seoulBeans,
  demoIds.items.seoulTeacup,
  demoIds.items.bangkokCoconutOil,
  demoIds.items.bangkokRattanBag,
  demoIds.items.bangkokSilkScarf,
  demoIds.items.bangkokHerbBalm,
  demoIds.items.bangkokMangoJelly,
  demoIds.items.romeTruffleOil,
  demoIds.items.romeParmigiano,
  demoIds.items.romeSoap,
  demoIds.items.romeCardWallet,
  demoIds.items.romeMokaPot,
] as const;
const V3_TRIP_ID_SET = new Set<string>(V3_TRIP_IDS);
const V3_ITEM_ID_SET = new Set<string>(V3_ITEM_IDS);

function installV2DemoSnapshot(storage: MemoryStorage) {
  const fixture = buildDemoDataFixture(REFERENCE);
  storage.setItem(
    storageKeys.trips,
    JSON.stringify(
      fixture.trips.filter((trip) => !V3_TRIP_ID_SET.has(trip.id)),
    ),
  );
  storage.setItem(
    storageKeys.items,
    JSON.stringify(
      fixture.items.filter((item) => !V3_ITEM_ID_SET.has(item.id)),
    ),
  );
  storage.setItem(storageKeys.shots, JSON.stringify(fixture.shots));
  storage.setItem(storageKeys.profile, JSON.stringify(fixture.profile));
  storage.setItem(storageKeys.auth, JSON.stringify(fixture.auth));
  storage.setItem(storageKeys.activeTrip, JSON.stringify(fixture.activeTripId));
  storage.setItem(
    DEMO_STORAGE_MARKER_KEY,
    JSON.stringify({
      kind: "tripdito-demo-bootstrap",
      version: 2,
      state: "seeded",
      updatedAt: "2026-01-01T00:00:00.000Z",
    }),
  );
  return fixture;
}

describe("demo fixture", () => {
  it("keeps rich examples for every home mode in one valid fixture", () => {
    const fixture = buildDemoDataFixture(REFERENCE);
    const tripById = new Map(fixture.trips.map((trip) => [trip.id, trip]));

    assert.deepEqual(validateDemoDataFixture(fixture, REFERENCE), []);
    assert.equal(fixture.trips.length, 9);
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
    const completedTripIds = fixture.trips
      .filter((trip) => trip.endDate < REFERENCE_DAY)
      .toSorted((a, b) => b.endDate.localeCompare(a.endDate))
      .map((trip) => trip.id);
    assert.deepEqual(completedTripIds, [
      demoIds.trips.taipei,
      demoIds.trips.kyoto,
      demoIds.trips.seoul,
      demoIds.trips.paris,
      demoIds.trips.bangkok,
      demoIds.trips.rome,
    ]);
    assert.ok(
      completedTripIds
        .slice(0, 4)
        .includes(demoIds.trips.kyoto),
    );
    assert.equal(
      selectHomeTrip(fixture.trips, REFERENCE_DAY)?.id,
      demoIds.trips.tokyo,
    );
    assert.equal(fixture.activeTripId, demoIds.trips.osaka);
    const itemCount = (tripId: string) =>
      fixture.items.filter((item) => item.tripId === tripId).length;
    assert.equal(itemCount(demoIds.trips.fukuoka), 5);
    assert.equal(itemCount(demoIds.trips.kyoto), 5);
    assert.equal(itemCount(demoIds.trips.seoul), 5);
    assert.equal(itemCount(demoIds.trips.bangkok), 5);
    assert.equal(itemCount(demoIds.trips.rome), 5);
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
    assert.equal(fixture.items.length, 46);
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

  it("upgrades only missing v3 records while preserving edits and user records", () => {
    const storage = new MemoryStorage();
    const fixture = installV2DemoSnapshot(storage);
    const v2Trips = JSON.parse(storage.getItem(storageKeys.trips) ?? "[]");
    const v2Items = JSON.parse(storage.getItem(storageKeys.items) ?? "[]");
    const editedTokyo = {
      ...v2Trips.find((trip: { id: string }) => trip.id === demoIds.trips.tokyo),
      name: "사용자가 이름을 바꾼 도쿄 여행",
    };
    const userTrip = {
      ...fixture.trips[0],
      id: "user-trip-preserved",
      name: "내가 추가한 여행",
    };
    const existingKyoto = {
      ...fixture.trips.find((trip) => trip.id === demoIds.trips.kyoto),
      name: "사용자가 먼저 만든 교토 기록",
      budget: 1,
    };
    const userItem = {
      ...fixture.items[0],
      id: "user-item-preserved",
      tripId: userTrip.id,
      name: "내가 추가한 상품",
    };
    const existingKyotoItem = {
      ...fixture.items.find(
        (item) => item.id === demoIds.items.kyotoIncense,
      ),
      name: "사용자가 수정한 교토 향",
    };
    storage.setItem(
      storageKeys.trips,
      JSON.stringify([
        ...v2Trips.filter(
          (trip: { id: string }) => trip.id !== demoIds.trips.tokyo,
        ),
        editedTokyo,
        userTrip,
        existingKyoto,
      ]),
    );
    storage.setItem(
      storageKeys.items,
      JSON.stringify([...v2Items, userItem, existingKyotoItem]),
    );
    const untouched = new Map(
      [
        storageKeys.shots,
        storageKeys.profile,
        storageKeys.auth,
        storageKeys.activeTrip,
      ].map((key) => [key, storage.getItem(key)]),
    );

    assert.equal(bootstrapDemoData(storage, REFERENCE).status, "upgraded");

    const trips = JSON.parse(storage.getItem(storageKeys.trips) ?? "[]");
    const items = JSON.parse(storage.getItem(storageKeys.items) ?? "[]");
    assert.ok(
      V3_TRIP_IDS.every((id) =>
        trips.some((trip: { id: string }) => trip.id === id),
      ),
    );
    assert.ok(
      V3_ITEM_IDS.every((id) =>
        items.some((item: { id: string }) => item.id === id),
      ),
    );
    assert.equal(
      trips.find((trip: { id: string }) => trip.id === demoIds.trips.tokyo)
        ?.name,
      editedTokyo.name,
    );
    assert.deepEqual(
      trips.find((trip: { id: string }) => trip.id === userTrip.id),
      userTrip,
    );
    assert.deepEqual(
      trips.find((trip: { id: string }) => trip.id === demoIds.trips.kyoto),
      existingKyoto,
    );
    assert.deepEqual(
      items.find((item: { id: string }) => item.id === userItem.id),
      userItem,
    );
    assert.deepEqual(
      items.find(
        (item: { id: string }) => item.id === demoIds.items.kyotoIncense,
      ),
      existingKyotoItem,
    );
    for (const [key, value] of untouched) {
      assert.equal(storage.getItem(key), value);
    }
    const marker = JSON.parse(storage.getItem(DEMO_STORAGE_MARKER_KEY) ?? "{}");
    assert.equal(marker.version, DEMO_DATA_VERSION);

    const tripSnapshot = storage.getItem(storageKeys.trips);
    const itemSnapshot = storage.getItem(storageKeys.items);
    assert.equal(bootstrapDemoData(storage, REFERENCE).status, "already-seeded");
    assert.equal(storage.getItem(storageKeys.trips), tripSnapshot);
    assert.equal(storage.getItem(storageKeys.items), itemSnapshot);
  });

  it("does not upgrade malformed, markerless, or suppressed v2 storage", () => {
    const malformed = new MemoryStorage();
    installV2DemoSnapshot(malformed);
    malformed.setItem(storageKeys.items, JSON.stringify({ malformed: true }));
    const malformedMarker = malformed.getItem(DEMO_STORAGE_MARKER_KEY);
    assert.equal(bootstrapDemoData(malformed, REFERENCE).status, "existing-data");
    assert.equal(malformed.getItem(DEMO_STORAGE_MARKER_KEY), malformedMarker);

    const markerless = new MemoryStorage();
    installV2DemoSnapshot(markerless);
    markerless.removeItem(DEMO_STORAGE_MARKER_KEY);
    const markerlessTrips = markerless.getItem(storageKeys.trips);
    assert.equal(bootstrapDemoData(markerless, REFERENCE).status, "existing-data");
    assert.equal(markerless.getItem(storageKeys.trips), markerlessTrips);
    assert.equal(markerless.getItem(DEMO_STORAGE_MARKER_KEY), null);

    const suppressed = new MemoryStorage();
    installV2DemoSnapshot(suppressed);
    const suppressedMarker = JSON.stringify({
      kind: "tripdito-demo-bootstrap",
      version: 2,
      state: "suppressed",
      updatedAt: "2026-01-01T00:00:00.000Z",
    });
    suppressed.setItem(DEMO_STORAGE_MARKER_KEY, suppressedMarker);
    const suppressedTrips = suppressed.getItem(storageKeys.trips);
    assert.equal(bootstrapDemoData(suppressed, REFERENCE).status, "suppressed");
    assert.equal(suppressed.getItem(storageKeys.trips), suppressedTrips);
    assert.equal(suppressed.getItem(DEMO_STORAGE_MARKER_KEY), suppressedMarker);
  });

  it("rolls back a failed v2 upgrade before advancing the marker", () => {
    const storage = new FailOnceStorage();
    installV2DemoSnapshot(storage);
    const before = new Map(
      [storageKeys.trips, storageKeys.items, DEMO_STORAGE_MARKER_KEY].map(
        (key) => [key, storage.getItem(key)],
      ),
    );
    storage.failNextWriteTo(DEMO_STORAGE_MARKER_KEY);

    assert.equal(bootstrapDemoData(storage, REFERENCE).status, "unavailable");
    for (const [key, value] of before) {
      assert.equal(storage.getItem(key), value);
    }

    assert.equal(bootstrapDemoData(storage, REFERENCE).status, "upgraded");
    const marker = JSON.parse(storage.getItem(DEMO_STORAGE_MARKER_KEY) ?? "{}");
    assert.equal(marker.version, DEMO_DATA_VERSION);
  });
});
