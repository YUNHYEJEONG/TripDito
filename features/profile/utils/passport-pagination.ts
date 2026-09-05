/**
 * 한 장에 찍히는 도장 수. 내지를 세 단 계단으로 나누고 도장 하나가 단 하나를 채우므로,
 * **세 개가 화면 한 장을 가득 채운다.** 이 값을 바꾸면 칸 배치
 * (`passport-stamp-layout.ts`의 `CELL_PATTERNS`)도 같이 바꿔야 한다.
 */
export const PASSPORT_TRIPS_PER_PAGE = 3;

export type PassportPage<T> = {
  index: number;
  pageNumber: number;
  trips: T[];
  positionLabel: string;
};

/**
 * A passport page is a complete physical page, never one half of a spread.
 * Three stamps per page fill the phone screen, and the same page carries over to
 * the two-page Fold layout without repartitioning or moving a stamp.
 */
export function paginatePassportTrips<T>(
  trips: readonly T[],
): PassportPage<T>[] {
  const pageCount = Math.max(
    1,
    Math.ceil(trips.length / PASSPORT_TRIPS_PER_PAGE),
  );

  return Array.from({ length: pageCount }, (_, index) => ({
    index,
    pageNumber: index + 1,
    trips: trips.slice(
      index * PASSPORT_TRIPS_PER_PAGE,
      (index + 1) * PASSPORT_TRIPS_PER_PAGE,
    ),
    positionLabel: `${index + 1} / ${pageCount}`,
  }));
}

export function getPassportPageNavigation(
  requestedIndex: number,
  pageCount: number,
  pageStep = 1,
) {
  const safePageCount = Math.max(1, pageCount);
  const safePageStep = Math.max(1, Math.trunc(pageStep));
  const boundedIndex = Math.min(
    Math.max(0, Math.trunc(requestedIndex)),
    safePageCount - 1,
  );
  const index = Math.floor(boundedIndex / safePageStep) * safePageStep;
  const previousIndex = index - safePageStep;
  const nextIndex = index + safePageStep;

  return {
    index,
    previousIndex: previousIndex >= 0 ? previousIndex : null,
    nextIndex: nextIndex < safePageCount ? nextIndex : null,
    canGoPrevious: index > 0,
    canGoNext: nextIndex < safePageCount,
  };
}

export function getPassportPageRange(
  startIndex: number,
  pageCount: number,
  visiblePageCount = 1,
) {
  const safePageCount = Math.max(1, pageCount);
  const safeVisiblePageCount = Math.max(1, Math.trunc(visiblePageCount));
  const safeStartIndex = Math.min(
    Math.max(0, Math.trunc(startIndex)),
    safePageCount - 1,
  );
  const startPageNumber = safeStartIndex + 1;
  const endPageNumber = Math.min(
    safeStartIndex + safeVisiblePageCount,
    safePageCount,
  );

  return {
    startPageNumber,
    endPageNumber,
    pageLabel:
      startPageNumber === endPageNumber
        ? `${startPageNumber}쪽`
        : `${startPageNumber}–${endPageNumber}쪽`,
    positionLabel:
      startPageNumber === endPageNumber
        ? `${startPageNumber} / ${safePageCount}`
        : `${startPageNumber}–${endPageNumber} / ${safePageCount}`,
  };
}

export function getPassportPageIndexAfterLayoutChange(
  currentIndex: number,
  pageCount: number,
  isFoldLayout: boolean,
) {
  return getPassportPageNavigation(
    currentIndex,
    pageCount,
    isFoldLayout ? 2 : 1,
  ).index;
}

export function shouldShowPassportPageNavigation(
  pageCount: number,
  visiblePageCount: number,
) {
  return Math.max(1, pageCount) > Math.max(1, Math.trunc(visiblePageCount));
}
