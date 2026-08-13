import type { ShoppingItem } from "@/features/shopping-items/schema";
import type { Trip } from "@/features/trips/schema";
import type { Shot } from "../schema";
import type { CatalogRankedItem } from "../data/item-ranking-catalog";

export const ITEM_RANKING_PERIOD_OPTIONS = [
  { id: "realtime", label: "실시간", description: "최근 24시간", hours: 24 },
  { id: "weekly", label: "주간", description: "최근 7일", hours: 24 * 7 },
  { id: "monthly", label: "월간", description: "최근 30일", hours: 24 * 30 },
] as const;

export type ItemRankingPeriod =
  (typeof ITEM_RANKING_PERIOD_OPTIONS)[number]["id"];

export type RankedShoppingItem = {
  key: string;
  rank: number;
  name: string;
  localName: string | null;
  imageDataUrl: string | null;
  country: string;
  city: string;
  currency: string;
  estimatedPrice: number;
  listCount: number;
  shotCount: number;
  activityCount: number;
  latestAt: string;
  tripId: string;
};

export type RankingDestination = {
  city: string;
  country?: string;
} | null;

type MutableRankedItem = Omit<RankedShoppingItem, "rank">;

function normalizeName(value: string) {
  return value.trim().replace(/\s+/g, " ").toLocaleLowerCase("ko-KR");
}

function rankingIdentity(
  name: string,
  city: string,
  country: string,
) {
  return `${country.trim().toLocaleLowerCase("ko-KR")}::${city.trim().toLocaleLowerCase("ko-KR")}::${normalizeName(name)}`;
}

function timestamp(value: string) {
  const result = Date.parse(value);
  return Number.isFinite(result) ? result : null;
}

function isInPeriod(value: string, since: number, now: number) {
  const time = timestamp(value);
  return time !== null && time >= since && time <= now;
}

function matchesDestination(
  trip: Pick<Trip, "city" | "country">,
  destination: RankingDestination,
) {
  if (!destination?.city) return true;
  const cityMatches =
    trip.city.trim().toLocaleLowerCase("ko-KR") ===
    destination.city.trim().toLocaleLowerCase("ko-KR");
  if (!cityMatches || !destination.country) return cityMatches;
  return (
    trip.country.trim().toLocaleLowerCase("ko-KR") ===
    destination.country.trim().toLocaleLowerCase("ko-KR")
  );
}

/**
 * 현재 계정의 로컬 상품 기록과 때샷 연결만 집계합니다. 서버 전체 사용자의
 * 인기처럼 보이는 임의 숫자나 광고 행은 만들지 않습니다.
 */
export function buildItemRanking({
  items,
  trips,
  shots,
  period,
  destination = null,
  now = new Date(),
}: {
  items: ShoppingItem[];
  trips: Trip[];
  shots: Shot[];
  period: ItemRankingPeriod;
  destination?: RankingDestination;
  now?: Date;
}): RankedShoppingItem[] {
  const periodOption =
    ITEM_RANKING_PERIOD_OPTIONS.find((option) => option.id === period) ??
    ITEM_RANKING_PERIOD_OPTIONS[0];
  const nowMs = now.getTime();
  const since = nowMs - periodOption.hours * 60 * 60 * 1000;
  const tripById = new Map(trips.map((trip) => [trip.id, trip]));
  const itemById = new Map(items.map((item) => [item.id, item]));
  const groups = new Map<string, MutableRankedItem>();

  function ensureGroup(item: ShoppingItem, trip: Trip) {
    const key = rankingIdentity(item.name, trip.city, trip.country);
    const existing = groups.get(key);
    if (existing) return existing;

    const group: MutableRankedItem = {
      key,
      name: item.name.trim(),
      localName: item.localName?.trim() || null,
      imageDataUrl: item.imageDataUrl ?? null,
      country: trip.country,
      city: trip.city,
      currency: trip.currency,
      estimatedPrice: item.estimatedPrice,
      listCount: 0,
      shotCount: 0,
      activityCount: 0,
      latestAt: item.createdAt,
      tripId: trip.id,
    };
    groups.set(key, group);
    return group;
  }

  for (const item of items) {
    const trip = tripById.get(item.tripId);
    if (!trip || !matchesDestination(trip, destination)) continue;
    if (!isInPeriod(item.createdAt, since, nowMs)) continue;

    const group = ensureGroup(item, trip);
    group.listCount += 1;
    group.activityCount += 1;
    if ((timestamp(item.createdAt) ?? 0) > (timestamp(group.latestAt) ?? 0)) {
      group.latestAt = item.createdAt;
      group.estimatedPrice = item.estimatedPrice;
      group.tripId = trip.id;
      group.currency = trip.currency;
      group.localName = item.localName?.trim() || group.localName;
      group.imageDataUrl = item.imageDataUrl ?? group.imageDataUrl;
    }
  }

  for (const shot of shots) {
    if (shot.channel !== "shots") continue;
    if (!isInPeriod(shot.createdAt, since, nowMs)) continue;

    for (const itemId of new Set(shot.shoppingItemIds)) {
      const item = itemById.get(itemId);
      const trip = item ? tripById.get(item.tripId) : undefined;
      if (!item || !trip || !matchesDestination(trip, destination)) continue;

      const group = ensureGroup(item, trip);
      group.shotCount += 1;
      group.activityCount += 1;
      if ((timestamp(shot.createdAt) ?? 0) > (timestamp(group.latestAt) ?? 0)) {
        group.latestAt = shot.createdAt;
      }
    }
  }

  return [...groups.values()]
    .filter((item) => item.activityCount > 0)
    .sort(
      (a, b) =>
        b.activityCount - a.activityCount ||
        b.shotCount - a.shotCount ||
        (timestamp(b.latestAt) ?? 0) - (timestamp(a.latestAt) ?? 0) ||
        a.name.localeCompare(b.name, "ko-KR"),
    )
    .map((item, index) => ({ ...item, rank: index + 1 }));
}

export type CatalogItemWithAccountActivity = CatalogRankedItem & {
  accountActivityCount: number;
  accountTripId: string | null;
};

/**
 * 카탈로그 순위는 그대로 두고 같은 상품의 실제 계정 활동만 보강합니다.
 * 카탈로그에 없는 실제 상품은 별도 `accountOnly` 행으로 돌려 출처와 숫자를
 * 섞지 않습니다.
 */
export function mergeItemRankingSources(
  accountRanking: RankedShoppingItem[],
  catalogRanking: ReadonlyArray<CatalogRankedItem>,
) {
  const accountByIdentity = new Map(
    accountRanking.map((item) => [
      rankingIdentity(item.name, item.city, item.country),
      item,
    ]),
  );
  const matchedAccountKeys = new Set<string>();
  const catalog: CatalogItemWithAccountActivity[] = catalogRanking.map(
    (item) => {
      const identity = rankingIdentity(item.name, item.city, item.country);
      const accountItem = accountByIdentity.get(identity);
      if (accountItem) matchedAccountKeys.add(identity);
      return {
        ...item,
        accountActivityCount: accountItem?.activityCount ?? 0,
        accountTripId: accountItem?.tripId ?? null,
      };
    },
  );
  const accountOnly = accountRanking.filter(
    (item) =>
      !matchedAccountKeys.has(
        rankingIdentity(item.name, item.city, item.country),
      ),
  );

  return { accountOnly, catalog };
}
