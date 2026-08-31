import {
  PASSPORT_TRIPS_PER_PAGE,
  type PassportPage,
} from "@/features/profile/utils/passport-pagination";
import { getJson, setJson } from "@/lib/storage/local-storage";
import { storageKeys } from "@/lib/storage/keys";

type PassportStampTrip = { id: string };

const PASSPORT_STAMP_PAGES_FIELD = "passportStampPages";
const MAX_PASSPORT_PAGE_NUMBER = 100;

export type PassportStampPageAssignments = Readonly<Record<string, number>>;

export type PassportStampFlowState =
  | "browse"
  | "select-page"
  | "already-stamped"
  | "invalid-target";

export type PassportStampFlow<T extends PassportStampTrip> = {
  state: PassportStampFlowState;
  target: T | null;
  pages: PassportPage<T>[];
  initialPageIndex: number;
  stampedPageIndex: number | null;
  selectablePageIndices: number[];
};

function validTripId(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.length > 0 &&
    value.length <= 200 &&
    !/[\u0000-\u001f\u007f]/.test(value)
  );
}

function validPageNumber(value: unknown): value is number {
  return (
    typeof value === "number" &&
    Number.isSafeInteger(value) &&
    value > 0 &&
    value <= MAX_PASSPORT_PAGE_NUMBER
  );
}

export function sanitizePassportStampPageAssignments(
  value: unknown,
): PassportStampPageAssignments {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};

  return Object.fromEntries(
    Object.entries(value).filter(
      ([tripId, pageNumber]) =>
        validTripId(tripId) && validPageNumber(pageNumber),
    ),
  );
}

/** Stored inside the account-scoped profile document, so another login cannot inherit it. */
export function readPassportStampPageAssignments() {
  const profile = getJson<Record<string, unknown>>(storageKeys.profile, {});
  return sanitizePassportStampPageAssignments(
    profile[PASSPORT_STAMP_PAGES_FIELD],
  );
}

export function savePassportStampPageAssignments(
  assignments: PassportStampPageAssignments,
) {
  try {
    const profile = getJson<Record<string, unknown>>(storageKeys.profile, {});
    setJson(storageKeys.profile, {
      ...profile,
      [PASSPORT_STAMP_PAGES_FIELD]:
        sanitizePassportStampPageAssignments(assignments),
    });
    return true;
  } catch {
    return false;
  }
}

export function assignPassportStampPage(
  assignments: PassportStampPageAssignments,
  tripId: string,
  pageNumber: number,
) {
  if (!validTripId(tripId) || !validPageNumber(pageNumber)) {
    return sanitizePassportStampPageAssignments(assignments);
  }

  return {
    ...sanitizePassportStampPageAssignments(assignments),
    [tripId]: pageNumber,
  } satisfies PassportStampPageAssignments;
}

function withPageMetadata<T>(tripsByPage: readonly (readonly T[])[]) {
  const pageCount = Math.max(1, tripsByPage.length);
  const safePages = tripsByPage.length > 0 ? tripsByPage : [[]];

  return safePages.map((trips, index) => ({
    index,
    pageNumber: index + 1,
    trips: [...trips],
    positionLabel: `${index + 1} / ${pageCount}`,
  }));
}

/**
 * Persisted choices are placed first. Legacy trips without metadata then fill
 * the remaining spaces in source order, so old passports keep working while a
 * manually stamped trip remains on its chosen physical page.
 */
export function paginatePassportTripsWithAssignments<
  T extends PassportStampTrip,
>(
  trips: readonly T[],
  assignments: PassportStampPageAssignments,
): PassportPage<T>[] {
  const safeAssignments = sanitizePassportStampPageAssignments(assignments);
  const uniqueTrips: T[] = [];
  const seenIds = new Set<string>();
  for (const trip of trips) {
    if (seenIds.has(trip.id)) continue;
    seenIds.add(trip.id);
    uniqueTrips.push(trip);
  }

  // One intentionally sparse physical page is possible when the user chooses
  // the clean page. Ignore corrupted metadata that would allocate dozens of
  // empty pages for only a few trips.
  const maxUsefulPage = Math.min(
    MAX_PASSPORT_PAGE_NUMBER,
    Math.max(1, Math.ceil(uniqueTrips.length / PASSPORT_TRIPS_PER_PAGE) + 1),
  );
  const effectiveAssignment = (tripId: string) => {
    const pageNumber = safeAssignments[tripId];
    return pageNumber && pageNumber <= maxUsefulPage ? pageNumber : null;
  };
  const highestAssignedPage = uniqueTrips.reduce(
    (highest, trip) => Math.max(highest, effectiveAssignment(trip.id) ?? 0),
    0,
  );
  const initialPageCount = Math.max(
    1,
    Math.ceil(uniqueTrips.length / PASSPORT_TRIPS_PER_PAGE),
    highestAssignedPage,
  );
  const tripsByPage: T[][] = Array.from(
    { length: initialPageCount },
    () => [],
  );
  const pending: T[] = [];

  for (const trip of uniqueTrips) {
    const pageNumber = effectiveAssignment(trip.id);
    const assignedPage = pageNumber ? tripsByPage[pageNumber - 1] : undefined;
    if (assignedPage && assignedPage.length < PASSPORT_TRIPS_PER_PAGE) {
      assignedPage.push(trip);
    } else {
      pending.push(trip);
    }
  }

  for (const trip of pending) {
    let page = tripsByPage.find(
      (candidate) => candidate.length < PASSPORT_TRIPS_PER_PAGE,
    );
    if (!page) {
      page = [];
      tripsByPage.push(page);
    }
    page.push(trip);
  }

  return withPageMetadata(tripsByPage);
}

/**
 * Explicit stamp intents temporarily remove an unstamped target, preserving
 * every other physical page, then add one clean page as a safe final choice.
 * A persisted target is never inserted again; the flow opens its existing page.
 */
export function getPassportStampFlow<T extends PassportStampTrip>(
  trips: readonly T[],
  assignments: PassportStampPageAssignments,
  targetTripId: string | null,
): PassportStampFlow<T> {
  const safeAssignments = sanitizePassportStampPageAssignments(assignments);
  const pages = paginatePassportTripsWithAssignments(trips, safeAssignments);
  if (!targetTripId) {
    return {
      state: "browse",
      target: null,
      pages,
      initialPageIndex: 0,
      stampedPageIndex: null,
      selectablePageIndices: [],
    };
  }

  const target = trips.find((trip) => trip.id === targetTripId) ?? null;
  if (!target) {
    return {
      state: "invalid-target",
      target: null,
      pages,
      initialPageIndex: 0,
      stampedPageIndex: null,
      selectablePageIndices: [],
    };
  }

  const existingPageIndex = pages.findIndex((page) =>
    page.trips.some((trip) => trip.id === target.id),
  );
  if (safeAssignments[target.id] && existingPageIndex >= 0) {
    return {
      state: "already-stamped",
      target,
      pages,
      initialPageIndex: existingPageIndex,
      stampedPageIndex: existingPageIndex,
      selectablePageIndices: [],
    };
  }

  const pagesWithoutTarget = paginatePassportTripsWithAssignments(
    trips.filter((trip) => trip.id !== target.id),
    safeAssignments,
  ).map((page) => page.trips);
  const selectionPages = withPageMetadata([...pagesWithoutTarget, []]);
  const originalPageIndex = Math.max(0, existingPageIndex);

  return {
    state: "select-page",
    target,
    pages: selectionPages,
    initialPageIndex: Math.min(originalPageIndex, selectionPages.length - 1),
    stampedPageIndex: null,
    selectablePageIndices: selectionPages
      .filter((page) => page.trips.length < PASSPORT_TRIPS_PER_PAGE)
      .map((page) => page.index),
  };
}
