import {
  getTripHomeMode,
  selectHomeTrip,
} from "@/features/home/utils/get-home-mode";
import { getCouponCanonicalId } from "@/features/coupons/lib/coupon-identity";
import { CURRENCIES } from "@/config/currencies";
import type { DemoDataFixture } from "./fixtures";

function koreaDayKey(reference: Date) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(reference);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

/** Returns human-readable invariant violations without mutating the fixture. */
export function validateDemoDataFixture(
  fixture: DemoDataFixture,
  reference = new Date(),
) {
  const issues: string[] = [];
  const today = koreaDayKey(reference);
  const trips = new Map(fixture.trips.map((trip) => [trip.id, trip]));
  const supportedCurrencies = new Set<string>(
    CURRENCIES.map((currency) => currency.code),
  );
  const items = new Map(fixture.items.map((item) => [item.id, item]));
  const shots = new Map(fixture.shots.map((shot) => [shot.id, shot]));
  const allIds: string[] = [];

  allIds.push(...trips.keys(), ...items.keys(), ...shots.keys());
  allIds.push(...fixture.scraps.map((scrap) => scrap.id));
  for (const shot of fixture.shots) {
    allIds.push(...shot.pins.map((pin) => pin.id));
    allIds.push(...shot.comments.map((comment) => comment.id));
  }
  if (new Set(allIds).size !== allIds.length) {
    issues.push("entity, pin, and comment IDs must be globally unique");
  }

  const tripsByMode = {
    idle: fixture.trips.filter(
      (trip) => getTripHomeMode(trip, today) === "idle",
    ),
    prep: fixture.trips.filter(
      (trip) => getTripHomeMode(trip, today) === "prep",
    ),
    live: fixture.trips.filter(
      (trip) => getTripHomeMode(trip, today) === "live",
    ),
    after: fixture.trips.filter(
      (trip) => getTripHomeMode(trip, today) === "after",
    ),
  };
  for (const [mode, modeTrips] of Object.entries(tripsByMode)) {
    if (modeTrips.length === 0) {
      issues.push(`demo fixture needs a ${mode} trip`);
    }
  }
  if (!tripsByMode.idle.some((trip) => trip.startDate > today)) {
    issues.push("idle mode needs a distant upcoming trip");
  }
  if (!tripsByMode.after.some((trip) => trip.endDate < today)) {
    issues.push("settlement mode needs completed trip history");
  }

  const activeTrip = trips.get(fixture.activeTripId);
  if (
    !activeTrip ||
    getTripHomeMode(activeTrip, today) !== "idle" ||
    activeTrip.startDate <= today
  ) {
    issues.push("active trip must reference the distant upcoming demo trip");
  }
  if (selectHomeTrip(fixture.trips, today)?.id !== tripsByMode.live[0]?.id) {
    issues.push("automatic fallback must still resolve to the live demo trip");
  }

  for (const trip of fixture.trips) {
    if (!supportedCurrencies.has(trip.currency)) {
      issues.push(`trip ${trip.id} uses an unsupported currency`);
    }
  }

  for (const trip of fixture.trips) {
    if (fixture.items.filter((item) => item.tripId === trip.id).length < 5) {
      issues.push(`trip ${trip.id} must have at least five items`);
    }
  }
  const prepItems = fixture.items.filter((item) =>
    tripsByMode.prep.some((trip) => trip.id === item.tripId),
  );
  if (prepItems.some((item) => item.purchased)) {
    issues.push("prep trip items must remain pending");
  }
  const liveItems = fixture.items.filter((item) =>
    tripsByMode.live.some((trip) => trip.id === item.tripId),
  );
  if (
    !liveItems.some((item) => item.purchased) ||
    !liveItems.some((item) => !item.purchased)
  ) {
    issues.push("live trip needs both pending and purchased items");
  }
  const afterItemGroups = tripsByMode.after.map((trip) =>
    fixture.items.filter((item) => item.tripId === trip.id),
  );
  if (
    !afterItemGroups.some(
      (tripItems) =>
        tripItems.length > 0 && tripItems.every((item) => item.purchased),
    )
  ) {
    issues.push("settlement mode needs a fully purchased trip");
  }
  if (
    !afterItemGroups.some(
      (tripItems) =>
        tripItems.length > 0 &&
        tripItems.filter((item) => !item.purchased).length === 1,
    )
  ) {
    issues.push("settlement mode needs a trip with exactly one pending item");
  }

  for (const item of fixture.items) {
    const trip = trips.get(item.tripId);
    if (!trip) {
      issues.push(`item ${item.id} references a missing trip`);
      continue;
    }
    if (Boolean(item.purchasedAt) !== item.purchased) {
      issues.push(`item ${item.id} has an inconsistent purchase timestamp`);
    }
    if (
      item.plannedPurchaseDate &&
      (item.plannedPurchaseDate < trip.startDate ||
        item.plannedPurchaseDate > trip.endDate)
    ) {
      issues.push(`item ${item.id} is planned outside its trip`);
    }
  }
  if (!fixture.items.some((item) => !item.purchased)) {
    issues.push("missing a pending item");
  }
  if (!fixture.items.some((item) => item.purchased)) {
    issues.push("missing a purchased item");
  }
  if (!fixture.items.some((item) => item.giftTags.length > 0)) {
    issues.push("missing a gift-tagged item");
  }
  for (const shot of fixture.shots) {
    if (!trips.has(shot.tripId)) {
      issues.push(`shot ${shot.id} references a missing trip`);
    }
    if (new Set(shot.shoppingItemIds).size !== shot.shoppingItemIds.length) {
      issues.push(`shot ${shot.id} has duplicate linked items`);
    }
    for (const itemId of shot.shoppingItemIds) {
      if (items.get(itemId)?.tripId !== shot.tripId) {
        issues.push(`shot ${shot.id} links an item from another trip`);
      }
    }
    for (const pin of shot.pins) {
      if (
        pin.imageIndex < 0 ||
        pin.imageIndex >= shot.images.length ||
        pin.xPct < 0 ||
        pin.xPct > 100 ||
        pin.yPct < 0 ||
        pin.yPct > 100
      ) {
        issues.push(`shot ${shot.id} has an invalid image pin`);
      }
    }
    if (
      shot.authorId === fixture.profile.id &&
      shot.authorNickname !== fixture.profile.nickname
    ) {
      issues.push(`own shot ${shot.id} is out of sync with the profile`);
    }
    for (const comment of shot.comments) {
      if (
        comment.authorId === fixture.profile.id &&
        comment.authorNickname !== fixture.profile.nickname
      ) {
        issues.push(`own comment ${comment.id} is out of sync with the profile`);
      }
    }
  }

  for (const scrap of fixture.scraps) {
    if (!shots.has(scrap.shotId)) {
      issues.push(`scrap ${scrap.id} references a missing shot`);
    }
  }
  if (
    fixture.shots.filter((shot) => shot.authorId === fixture.profile.id).length <
    2
  ) {
    issues.push("profile needs at least two own shots");
  }
  if (fixture.shots.filter((shot) => shot.likedByMe).length < 2) {
    issues.push("profile needs at least two liked shots");
  }
  if (fixture.scraps.length < 2) {
    issues.push("profile needs at least two scraps");
  }
  if (fixture.receivedCoupons.length < 2) {
    issues.push("profile needs at least two received coupons");
  }
  for (const coupon of fixture.receivedCoupons) {
    if (coupon.id !== getCouponCanonicalId(coupon)) {
      issues.push(`coupon ${coupon.id} is not canonical`);
    }
  }

  const recentCities = new Set(
    fixture.shots
      .filter(
        (shot) =>
          reference.getTime() - Date.parse(shot.createdAt) <=
          30 * 86_400_000,
      )
      .map((shot) => shot.destinationCity),
  );
  if (recentCities.size < 2) {
    issues.push("hot destinations need recent shots in at least two cities");
  }

  if (!fixture.auth.isLoggedIn || fixture.auth.email !== fixture.accounts[0]?.email) {
    issues.push("demo auth session and account must match");
  }

  return issues;
}

export function assertValidDemoDataFixture(
  fixture: DemoDataFixture,
  reference = new Date(),
) {
  const issues = validateDemoDataFixture(fixture, reference);
  if (issues.length > 0) {
    throw new Error(`Invalid demo fixture: ${issues.join("; ")}`);
  }
}
