import { storageKeys } from "@/lib/storage/keys";
import {
  DEMO_DATA_VERSION,
  DEMO_HOME_PREVIEW_STORAGE_KEY,
  DEMO_STORAGE_MARKER_KEY,
  USER_DATA_STORAGE_KEYS,
  demoIds,
} from "./constants";
import { buildDemoDataFixture, type DemoDataFixture } from "./fixtures";
import { assertValidDemoDataFixture } from "./validate";

export type DemoStorage = Pick<
  Storage,
  "getItem" | "setItem" | "removeItem"
>;

export type DemoBootstrapMarker = {
  kind: "tripdito-demo-bootstrap";
  version: number;
  state: "seeded" | "suppressed";
  updatedAt: string;
};

export type DemoBootstrapResult =
  | { status: "seeded"; fixture: DemoDataFixture }
  | { status: "upgraded" }
  | { status: "already-seeded" }
  | { status: "existing-data" }
  | { status: "suppressed" }
  | { status: "unavailable"; error: unknown };

function parseStoredValue(raw: string | null) {
  if (raw === null) return { valid: true as const, value: null };
  try {
    return { valid: true as const, value: JSON.parse(raw) as unknown };
  } catch {
    return { valid: false as const, value: raw };
  }
}

function hasMeaningfulValue(key: string, raw: string | null) {
  const parsed = parseStoredValue(raw);
  if (!parsed.valid) return parsed.value.trim().length > 0;

  const value = parsed.value;
  if (value === null) return false;

  if (
    key === storageKeys.trips ||
    key === storageKeys.items ||
    key === storageKeys.shots ||
    key === storageKeys.scraps ||
    key === storageKeys.accounts ||
    key === storageKeys.receivedCoupons
  ) {
    // Unknown/corrupt non-array values still belong to the user. Preserve them
    // rather than silently replacing them with preview data.
    return !Array.isArray(value) || value.length > 0;
  }

  if (key === storageKeys.profile) {
    if (typeof value !== "object" || Array.isArray(value)) return true;
    const profile = value as Record<string, unknown>;
    return Boolean(
      (typeof profile.nickname === "string" && profile.nickname.trim()) ||
        (typeof profile.avatarDataUrl === "string" && profile.avatarDataUrl),
    );
  }

  if (key === storageKeys.auth) {
    if (typeof value !== "object" || Array.isArray(value)) return true;
    const auth = value as Record<string, unknown>;
    return Boolean(
      auth.isLoggedIn || auth.email || auth.provider || auth.loggedInAt,
    );
  }

  if (key === storageKeys.activeTrip) {
    return typeof value === "string" && value.length > 0;
  }

  return true;
}

function readMarker(storage: DemoStorage): DemoBootstrapMarker | null {
  const parsed = parseStoredValue(storage.getItem(DEMO_STORAGE_MARKER_KEY));
  if (!parsed.valid || !parsed.value || typeof parsed.value !== "object") {
    return null;
  }
  const value = parsed.value as Partial<DemoBootstrapMarker>;
  if (
    value.kind !== "tripdito-demo-bootstrap" ||
    (value.state !== "seeded" && value.state !== "suppressed") ||
    typeof value.version !== "number" ||
    typeof value.updatedAt !== "string"
  ) {
    return null;
  }
  return value as DemoBootstrapMarker;
}

function hasExistingUserData(storage: DemoStorage) {
  return USER_DATA_STORAGE_KEYS.some((key) =>
    hasMeaningfulValue(key, storage.getItem(key)),
  );
}

type StoredEntity = Record<string, unknown> & { id: string };

const V2_DEMO_TRIP_ANCHOR_IDS = [
  demoIds.trips.tokyo,
  demoIds.trips.osaka,
  demoIds.trips.taipei,
  demoIds.trips.paris,
  demoIds.trips.fukuoka,
] as const;

const V2_DEMO_ITEM_ANCHOR_IDS = [
  demoIds.items.tokyoSunscreen,
  demoIds.items.osakaKitkat,
  demoIds.items.taipeiPineappleCake,
  demoIds.items.parisSoap,
  demoIds.items.fukuokaMentaiko,
] as const;

const V3_DEMO_TRIP_IDS = new Set<string>([
  demoIds.trips.kyoto,
  demoIds.trips.seoul,
  demoIds.trips.bangkok,
  demoIds.trips.rome,
]);

const V3_DEMO_ITEM_IDS = new Set<string>([
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
]);

function readStoredEntities(storage: DemoStorage, key: string) {
  const parsed = parseStoredValue(storage.getItem(key));
  if (!parsed.valid || !Array.isArray(parsed.value)) return null;
  if (
    !parsed.value.every(
      (entity): entity is StoredEntity =>
        typeof entity === "object" &&
        entity !== null &&
        !Array.isArray(entity) &&
        typeof (entity as Record<string, unknown>).id === "string",
    )
  ) {
    return null;
  }
  return parsed.value;
}

function containsEveryId(
  entities: StoredEntity[],
  expectedIds: readonly string[],
) {
  const ids = new Set(entities.map((entity) => entity.id));
  return expectedIds.every((id) => ids.has(id));
}

function appendMissingEntities<T extends { id: string }>(
  current: StoredEntity[],
  additions: T[],
) {
  const existingIds = new Set(current.map((entity) => entity.id));
  return [
    ...current,
    ...additions.filter((entity) => !existingIds.has(entity.id)),
  ];
}

/**
 * Upgrades only a recognizable v2 demo snapshot. Existing records always win,
 * so user edits, user-created entities, and even user-created v3 ID collisions
 * are preserved. Only the new passport records absent from storage are added.
 */
function upgradeSeededV2DemoData(
  storage: DemoStorage,
  marker: DemoBootstrapMarker,
  reference: Date,
) {
  if (marker.state !== "seeded" || marker.version !== 2) return false;

  const storedTrips = readStoredEntities(storage, storageKeys.trips);
  const storedItems = readStoredEntities(storage, storageKeys.items);
  if (
    !storedTrips ||
    !storedItems ||
    !containsEveryId(storedTrips, V2_DEMO_TRIP_ANCHOR_IDS) ||
    !containsEveryId(storedItems, V2_DEMO_ITEM_ANCHOR_IDS)
  ) {
    return false;
  }

  const fixture = buildDemoDataFixture(reference);
  assertValidDemoDataFixture(fixture, reference);
  const mergedTrips = appendMissingEntities(
    storedTrips,
    fixture.trips.filter((trip) => V3_DEMO_TRIP_IDS.has(trip.id)),
  );
  const mergedItems = appendMissingEntities(
    storedItems,
    fixture.items.filter((item) => V3_DEMO_ITEM_IDS.has(item.id)),
  );
  const writes: Array<[string, unknown]> = [
    [storageKeys.trips, mergedTrips],
    [storageKeys.items, mergedItems],
    [DEMO_STORAGE_MARKER_KEY, seededMarker(reference)],
  ];
  const previous = new Map(
    writes.map(([key]) => [key, storage.getItem(key)]),
  );

  try {
    for (const [key, value] of writes) {
      storage.setItem(key, JSON.stringify(value));
    }
  } catch (error) {
    for (const [key, value] of previous) {
      try {
        if (value === null) storage.removeItem(key);
        else storage.setItem(key, value);
      } catch {
        // Best-effort rollback for browsers that revoke storage mid-write.
      }
    }
    throw error;
  }

  return true;
}

function fixtureWrites(
  fixture: DemoDataFixture,
  includeSession: boolean,
): Array<[string, unknown]> {
  const contentWrites: Array<[string, unknown]> = [
    [storageKeys.trips, fixture.trips],
    [storageKeys.items, fixture.items],
    [storageKeys.shots, fixture.shots],
    [storageKeys.scraps, fixture.scraps],
    [storageKeys.profile, fixture.profile],
    [storageKeys.receivedCoupons, fixture.receivedCoupons],
    [storageKeys.activeTrip, fixture.activeTripId],
    [storageKeys.meta, fixture.meta],
  ];

  return includeSession
    ? [
        ...contentWrites,
        [storageKeys.auth, fixture.auth],
        [storageKeys.accounts, fixture.accounts],
      ]
    : contentWrites;
}

function writeFixture(
  storage: DemoStorage,
  fixture: DemoDataFixture,
  marker: DemoBootstrapMarker,
  includeSession = true,
) {
  const writes = fixtureWrites(fixture, includeSession);
  const keys = [
    ...writes.map(([key]) => key),
    DEMO_HOME_PREVIEW_STORAGE_KEY,
    DEMO_STORAGE_MARKER_KEY,
  ];
  const previous = new Map(keys.map((key) => [key, storage.getItem(key)]));

  try {
    for (const [key, value] of writes) {
      storage.setItem(key, JSON.stringify(value));
    }
    // v2 briefly stored a global home-mode override. Selection now belongs to
    // an actual trip, so remove that legacy value whenever demo data is written.
    storage.removeItem(DEMO_HOME_PREVIEW_STORAGE_KEY);
    storage.setItem(DEMO_STORAGE_MARKER_KEY, JSON.stringify(marker));
  } catch (error) {
    for (const [key, value] of previous) {
      try {
        if (value === null) storage.removeItem(key);
        else storage.setItem(key, value);
      } catch {
        // Best-effort rollback for browsers that revoke storage mid-write.
      }
    }
    throw error;
  }
}

function seededMarker(reference: Date): DemoBootstrapMarker {
  return {
    kind: "tripdito-demo-bootstrap",
    version: DEMO_DATA_VERSION,
    state: "seeded",
    updatedAt: reference.toISOString(),
  };
}

/**
 * Seeds only a truly cold browser. Strict Mode and repeated mounts are safe:
 * the marker makes the operation idempotent, while any non-empty user entity
 * makes the operation a no-op.
 */
export function bootstrapDemoData(
  storage: DemoStorage,
  reference = new Date(),
): DemoBootstrapResult {
  try {
    const marker = readMarker(storage);
    if (marker?.state === "suppressed") return { status: "suppressed" };
    if (
      marker?.state === "seeded" &&
      marker.version === DEMO_DATA_VERSION
    ) {
      return { status: "already-seeded" };
    }
    if (marker && upgradeSeededV2DemoData(storage, marker, reference)) {
      return { status: "upgraded" };
    }
    if (hasExistingUserData(storage)) return { status: "existing-data" };

    const fixture = buildDemoDataFixture(reference);
    assertValidDemoDataFixture(fixture, reference);
    writeFixture(storage, fixture, seededMarker(reference));
    return { status: "seeded", fixture };
  } catch (error) {
    return { status: "unavailable", error };
  }
}

/**
 * Explicitly replaces preview content after the user's confirmation. An
 * existing account/session is preserved; a completely identity-free browser
 * receives the local preview account so interactive states remain usable.
 */
export function replaceWithDemoData(
  storage: DemoStorage,
  reference = new Date(),
) {
  const fixture = buildDemoDataFixture(reference);
  assertValidDemoDataFixture(fixture, reference);
  const hasExistingSession =
    hasMeaningfulValue(storageKeys.auth, storage.getItem(storageKeys.auth)) ||
    hasMeaningfulValue(
      storageKeys.accounts,
      storage.getItem(storageKeys.accounts),
    );
  writeFixture(
    storage,
    fixture,
    seededMarker(reference),
    !hasExistingSession,
  );
  return fixture;
}

/**
 * Leaves a tombstone after an explicit reset. Keep this marker while deleting
 * user entities so the next reload does not silently recreate the fixture.
 */
export function suppressAutomaticDemoData(
  storage: DemoStorage,
  reference = new Date(),
) {
  const marker: DemoBootstrapMarker = {
    kind: "tripdito-demo-bootstrap",
    version: DEMO_DATA_VERSION,
    state: "suppressed",
    updatedAt: reference.toISOString(),
  };
  storage.removeItem(DEMO_HOME_PREVIEW_STORAGE_KEY);
  storage.setItem(DEMO_STORAGE_MARKER_KEY, JSON.stringify(marker));
  return marker;
}

/** Lets a developer opt a reset browser back into cold-start seeding. */
export function clearDemoBootstrapMarker(storage: DemoStorage) {
  storage.removeItem(DEMO_HOME_PREVIEW_STORAGE_KEY);
  storage.removeItem(DEMO_STORAGE_MARKER_KEY);
}
