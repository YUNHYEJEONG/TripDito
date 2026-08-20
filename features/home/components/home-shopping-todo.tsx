"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Check, Package } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";
import { CurrencyText } from "@/components/common/currency-text";
import { Button } from "@/components/ui/button";
import {
  itemKeys,
  useItems,
  useTogglePurchased,
} from "@/features/shopping-items/hooks/use-items";
import type { ShoppingItem } from "@/features/shopping-items/types";
import { lineTotal } from "@/features/budget/utils/calculate-budget";
import { getTripDayFilterOptions } from "@/features/shopping-items/utils/trip-day";
import { useMouseDragScroll } from "@/features/shots/hooks/use-mouse-drag-scroll";
import { migrateShoppingListDemoFields } from "@/features/shopping-items/data/migrate-shopping-demo-fields";
import {
  GIFT_TAG_OPTIONS,
  type GiftTagId,
} from "@/features/shopping-items/constants/gift-tags";
import type { HomeMode } from "@/features/home/utils/get-home-mode";
import {
  filterHomeShoppingItems,
  getHomeShoppingFilterOptions,
  getHomeShoppingPreview,
  type HomeListFilter,
} from "@/features/home/utils/home-shopping-list";
import { AddFromImagesSheet } from "@/features/image-upload/components/add-from-images-sheet";
import { todayIsoDate } from "@/features/home/utils/get-upcoming-trip";
import { cn } from "@/lib/utils";

/**
 * 홈에서 제일 중요한 건 **리스트가 한눈에 보이는 것**이다. 제목·필터가 차지하던 자리를 줄여
 * 확보한 높이를 그대로 목록에 쓴다.
 *
 * 목록은 `더보기` 버튼 대신 **카드 안에서 스크롤**한다. 홈 전체를 늘리면 아래의 환율·광고
 * 카드가 리스트 길이에 밀려나므로, 이 영역만 자기 높이를 갖고 스크롤한다.
 * 한 번에 다 그리지 않고 스크롤이 끝에 닿을 때마다 `PAGE_SIZE`씩 붙인다.
 */
const PAGE_SIZE = 8;
/** 상품 한 줄의 높이(px). 스크롤러 최대 높이와 "끝에 닿았다" 판정에 함께 쓴다. */
const ROW_HEIGHT = 62;

/**
 * `camera` + 추가 배지. lucide에 `camera-plus`가 없어 직접 그리되, **관례를 그대로 따른다.**
 *
 * 구글 Material `add_a_photo`, 애플 SF Symbols `camera.badge.plus` 모두 같은 규칙이다:
 * `+`는 **본체 바깥 오른쪽 위에 붙는 배지**이고, 본체는 배지가 앉을 자리를 비워 주되
 * **자기 형태는 그대로 유지**한다. 렌즈를 `+`로 바꾸면 카메라를 카메라로 읽게 하는 유일한
 * 특징이 사라져서, 무엇에 더하는 건지 알 수 없게 된다.
 *
 * 치수는 lucide 자매 아이콘(`image-plus`·`file-plus`)과 맞췄다 — `+`는 (19, 5) 중심에
 * 팔 길이 3, 본체는 오른쪽 위 사분면을 열어 배지와 3 이상 떨어뜨린다.
 */
function CameraPlusIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      {/* 본체 — 오른쪽 위를 열어 둔 것 말고는 lucide `camera`와 같은 경로다. */}
      <path d="M20 12.5V18a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h1.997a2 2 0 0 0 1.759-1.048l.489-.904A2 2 0 0 1 10.004 4h2.5" />
      {/* 렌즈는 남긴다. 이게 없으면 카메라로 안 읽힌다. */}
      <circle cx="11" cy="13" r="3" />
      {/* 추가 배지 */}
      <path d="M16 5h6M19 2v6" />
    </svg>
  );
}

export function HomeShoppingTodo({
  tripId,
  currency,
  startDate,
  endDate,
  mode,
  today = todayIsoDate(),
}: {
  tripId: string;
  currency: string;
  startDate: string;
  endDate: string;
  mode: Exclude<HomeMode, "idle">;
  today?: string;
}) {
  const queryClient = useQueryClient();
  const { data: items = [], isLoading } = useItems(tripId);
  const togglePurchased = useTogglePurchased(tripId);
  const [filter, setFilter] = useState<HomeListFilter>("all");
  /** 지금까지 그린 줄 수. 스크롤이 끝에 닿을 때마다 `PAGE_SIZE`씩 늘어난다. */
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [uploadOpen, setUploadOpen] = useState(false);
  const filterScrollerRef = useRef<HTMLDivElement>(null);
  const listScrollerRef = useRef<HTMLDivElement>(null);
  const listId = `home-shopping-list-${useId()}`;

  useMouseDragScroll(filterScrollerRef, true, { snap: false, wheel: true });

  useEffect(() => {
    const updated = migrateShoppingListDemoFields();
    if (updated) {
      void queryClient.invalidateQueries({ queryKey: itemKeys.all });
    }
  }, [queryClient]);

  const dayOptions = useMemo(
    () => getTripDayFilterOptions(startDate, endDate),
    [startDate, endDate],
  );

  const filtered = useMemo(
    () => filterHomeShoppingItems(items, filter, { startDate, endDate }),
    [items, filter, startDate, endDate],
  );

  const preview = getHomeShoppingPreview(filtered, visibleCount);
  const hasMore = preview.length < filtered.length;
  const purchasedCount = items.filter((item) => item.purchased).length;

  // 필터가 바뀌면 다시 첫 페이지부터 본다. 안 그러면 3개짜리 결과에 스크롤 위치만 남는다.
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
    listScrollerRef.current?.scrollTo({ top: 0 });
  }, [filter]);

  /**
   * 스크롤이 끝에서 한 줄 남았을 때 다음 페이지를 붙인다. `IntersectionObserver` 대신
   * `onScroll`을 쓰는 이유는 감시할 대상이 스크롤러 하나뿐이라서다 — 관찰자를 붙였다
   * 떼는 수명 관리가 오히려 더 큰 비용이다.
   */
  function loadMoreWhenNearEnd(
    event: React.UIEvent<HTMLDivElement>,
  ) {
    if (!hasMore) return;
    const el = event.currentTarget;
    if (el.scrollTop + el.clientHeight < el.scrollHeight - ROW_HEIGHT) return;
    setVisibleCount((current) => current + PAGE_SIZE);
  }

  /**
   * 필터는 **모드와 무관하게 일차 하나**다. 여행 중이라고 구매 상태로 바꿔 걸지 않는다 —
   * 상태는 각 행의 체크박스와 제목 옆 숫자가 이미 말하고 있다.
   */
  const filterOptions = getHomeShoppingFilterOptions(dayOptions);

  return (
    <section
      id={`home-purchase-checklist-${tripId}`}
      tabIndex={-1}
      className="scroll-mt-20 overflow-hidden rounded-xl border border-rule/80 bg-paper outline-none focus-visible:ring-2 focus-visible:ring-focus"
    >
      {/*
        이름은 모드와 무관하게 **쇼핑리스트** 하나로 간다. `챙길 쇼핑 / 구매 체크리스트 /
        여행 쇼핑 기록`처럼 모드마다 이름이 바뀌면 같은 자리에 있는 같은 목록을 매번 다시
        읽어야 한다. 달라지는 건 이름이 아니라 옆의 숫자다.

        추가 버튼이 화면 오른쪽 아래 FAB로 빠졌으므로 제목 줄에는 제목만 남는다. 줄 높이를
        버튼에 맞출 필요가 없어져 글자 크기가 곧 줄 높이가 되고, 위아래 여백도 그만큼 줄어든다.
      */}
      <div className="px-4 pt-2 pb-1">
        <h2 className="flex min-w-0 items-baseline gap-1.5 text-[17px] leading-6 font-semibold text-ink">
          쇼핑리스트
          <span className="text-[13px] font-medium text-ink-2 tabular-nums">
            {mode === "live"
              ? `${purchasedCount}/${items.length} 완료`
              : items.length}
          </span>
        </h2>
      </div>

      {/*
        모드마다 **거르는 기준만** 다르고 줄의 생김새와 동작은 하나다. 예전에는 여행 중과
        예정이 각자 스크롤러 마크업을 갖고 있어서, 한쪽에만 드래그 후 클릭을 막는 처리가
        빠지고(끌다가 필터가 눌렸다) 스크롤바 숨김 방식도 달랐다. 지금은 데이터만 갈라진다.

        `py-2`가 칩의 44px 터치 영역을 품고 `-my-1`이 그중 8px을 레이아웃에서 되돌려 준다.
        스크롤러가 세로로 넘치면 `overflow-x-auto`가 세로 스크롤까지 만들기 때문에,
        터치 영역은 반드시 컨테이너 패딩 **안에** 들어와야 한다.
      */}
      <div className="px-4 pb-2">
        <div
          ref={filterScrollerRef}
          aria-label="쇼핑리스트 필터"
          className={cn(
            "-my-1 flex min-w-0 touch-auto items-center gap-2 overflow-x-auto overscroll-x-contain py-2",
            "cursor-grab [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
          )}
        >
          {filterOptions.map((option) => (
            <FilterChip
              key={option.key}
              active={filter === option.key}
              onClick={() => {
                // 끌어서 스크롤한 직후의 클릭은 필터 선택으로 치지 않는다.
                if (filterScrollerRef.current?.dataset.dragMoved) return;
                setFilter(option.key);
              }}
            >
              {option.label}
            </FilterChip>
          ))}
        </div>
      </div>

      {isLoading ? (
        <p
          className="border-t border-rule/80 px-4 py-6 text-center text-[13px] text-ink-2"
          role="status"
        >
          불러오는 중…
        </p>
      ) : preview.length === 0 ? (
        <div className="border-t border-rule/80 px-4 py-6 text-center">
          {/*
            비었다는 말은 모드와 무관하게 같다. 갈라지는 건 **아무것도 없는 것**과
            **거른 결과가 없는 것**뿐이다. 추가 위치는 FAB를 가리킨다 — 카드 안에
            버튼이 있던 시절의 "위 카메라로"를 그대로 두면 없는 곳을 가리키게 된다.
          */}
          <p className="text-[13px] text-ink-2">
            {items.length === 0
              ? "쇼핑리스트가 비어 있어요. 오른쪽 아래 버튼으로 사진을 올려 추가해 보세요."
              : "이 조건에 해당하는 상품이 없어요."}
          </p>
        </div>
      ) : (
        /*
         * 목록은 카드 안에서 스크롤한다. 홈 전체를 늘리는 대신 이 영역만 스크롤하면
         * 아래의 환율·광고 카드가 리스트 길이에 밀려나지 않는다.
         * 높이는 줄 높이의 **정수배를 피한다**(62 × 4.5). 다섯째 줄이 반쯤 잘려 보여야
         * 스크롤바 없이도 아래에 더 있다는 게 읽힌다.
         */
        <div
          ref={listScrollerRef}
          onScroll={loadMoreWhenNearEnd}
          className="scrollbar-none max-h-[279px] overflow-y-auto overscroll-contain border-t border-rule/80"
        >
          <ul id={listId} className="divide-y divide-rule/80 px-4">
            {preview.map((item) => (
              <li key={item.id}>
                <ShoppingRow
                  item={item}
                  currency={currency}
                  toggling={
                    togglePurchased.isPending &&
                    togglePurchased.variables === item.id
                  }
                  onToggle={() => {
                    togglePurchased.mutate(item.id, {
                      onError: () =>
                        toast.error(
                          "상태를 바꾸지 못했어요. 다시 시도해 주세요.",
                        ),
                    });
                  }}
                />
              </li>
            ))}
          </ul>
          {/*
            아직 안 그린 줄이 있다는 표시. 실제 로딩이 아니라 슬라이스라 "불러오는 중"이라고
            하지 않는다. 스크롤이 여기까지 닿으면 다음 묶음이 붙는다.
          */}
          {hasMore ? (
            <p
              className="px-4 py-3 text-center text-[12px] text-ink-3 tabular-nums"
              aria-live="polite"
            >
              스크롤해서 {filtered.length - preview.length}개 더 보기
            </p>
          ) : null}
        </div>
      )}

      {/*
        추가는 화면 전체의 행동이므로 카드 안이 아니라 **오른쪽 아래 FAB**로 띄운다.
        `fixed`라 카드의 `overflow-hidden`에 잘리지 않는다 — 조상 중에 `transform`이나
        `filter`가 있으면 그 순간 잘리므로, 앱셸에 그런 속성을 넣지 않는다.
        레일 폭(`--app-rail-max`) 안에 가둬서 넓은 화면에서 FAB만 멀리 떨어지지 않게 하고,
        탭바와 안전 영역 위로 띄운다. 크기는 Material FAB 표준 56px.
      */}
      <div className="pointer-events-none fixed inset-x-0 bottom-[calc(var(--tab-bar-height)+var(--app-bottom-gap)+env(safe-area-inset-bottom))] z-30">
        <div className="mx-auto flex w-full max-w-[var(--app-rail-max)] justify-end px-[var(--app-gutter)]">
          <Button
            type="button"
            aria-label="사진으로 상품 추가"
            onClick={() => setUploadOpen(true)}
            className="pointer-events-auto size-14 rounded-full p-0 shadow-float focus-visible:ring-offset-2 focus-visible:ring-offset-mode-canvas"
          >
            <CameraPlusIcon className="size-6" />
          </Button>
        </div>
      </div>

      <AddFromImagesSheet
        tripId={tripId}
        currency={currency}
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        intent={
          mode === "live"
            ? { kind: "trip-purchases", purchasedOn: today }
            : mode === "after"
              ? {
                  kind: "trip-purchases",
                  purchasedOn: endDate,
                  context: "settlement",
                }
              : { kind: "pretrip-candidates" }
        }
      />
    </section>
  );
}

function FilterChip({
  children,
  active,
  onClick,
}: {
  children: React.ReactNode;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        // 보이는 크기는 28px로 줄이되 터치 영역은 `after`로 44px을 유지한다 —
        // 칩이 커서 리스트를 밀어내던 것이지, 누르기 어려웠던 게 아니다.
        "relative inline-flex h-7 shrink-0 items-center gap-1 rounded-full border px-2.5 text-[12px] leading-none font-medium whitespace-nowrap outline-none transition-colors duration-120 after:absolute after:-inset-y-2 after:inset-x-0 focus-visible:ring-2 focus-visible:ring-focus",
        active
          ? "border-accent-text bg-accent-text text-paper hover:bg-accent active:bg-accent-text"
          : "border-rule bg-paper text-ink-2 hover:border-control hover:bg-paper-2 active:bg-paper-3",
      )}
    >
      {children}
    </button>
  );
}

function GiftTags({ tags }: { tags: GiftTagId[] }) {
  if (!tags.length) return null;
  return (
    <div className="flex flex-wrap gap-1">
      {tags.map((id) => {
        const option = GIFT_TAG_OPTIONS.find((tag) => tag.id === id);
        if (!option) return null;
        return (
          <span
            key={id}
            className={cn(
              "rounded-xs px-1.5 py-0.5 text-[11px] leading-4 font-semibold text-ink",
              id === "acquaintance" && "bg-gift-acq",
              id === "colleague" && "bg-gift-col",
              id === "friend" && "bg-gift-fri",
            )}
          >
            {option.label}
          </span>
        );
      })}
    </div>
  );
}

function ShoppingRow({
  item,
  currency,
  onToggle,
  toggling,
}: {
  item: ShoppingItem;
  currency: string;
  onToggle: () => void;
  toggling?: boolean;
}) {
  const quantity = item.quantity >= 1 ? item.quantity : 1;
  const giftTags = item.giftTags ?? [];

  return (
    <article className="grid min-w-0 grid-cols-[2.25rem_minmax(0,1fr)] items-stretch gap-2 py-2">
      <div className="flex min-h-14 items-center justify-center">
        <Checkbox
          checked={item.purchased}
          disabled={toggling}
          onCheckedChange={() => onToggle()}
          aria-label={`${item.name} 구매 완료`}
          className="size-5 border border-control bg-paper shadow-none after:-inset-3.5 data-checked:border-success-text data-checked:bg-success-text data-checked:text-paper"
        />
      </div>

      <Link
        href={`/trips/${item.tripId}/items/${item.id}/edit?returnTo=${encodeURIComponent("/home")}`}
        aria-label={`${item.name} 상품 수정`}
        className="grid min-h-12 min-w-0 grid-cols-[2.5rem_minmax(0,1fr)] items-center gap-2.5 rounded-xl py-1 pr-1 outline-none transition-colors duration-120 hover:bg-paper-2 active:bg-paper-3 focus-visible:ring-2 focus-visible:ring-focus motion-reduce:transition-none"
      >
        <div className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-paper-2">
          {item.imageDataUrl ? (
            // User-created data URLs have no stable intrinsic dimensions.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={item.imageDataUrl}
              alt=""
              className={cn(
                "size-full object-cover",
                item.purchased && "opacity-60",
              )}
            />
          ) : (
            <Package
              className={cn(
                "size-5 text-ink-3",
                item.purchased && "opacity-60",
              )}
              aria-hidden
            />
          )}
        </div>

        <div className="min-w-0 space-y-0.5">
          <GiftTags tags={giftTags} />
          <div className="flex min-w-0 items-start gap-2">
            <p
              className={cn(
                "min-w-0 flex-1 truncate text-[15px] leading-5 font-semibold text-ink",
                item.purchased && "line-through text-ink-2",
              )}
            >
              {item.name}
            </p>
            {item.purchased ? (
              <span className="inline-flex h-5 shrink-0 items-center gap-1 rounded-full bg-success-text/10 px-1.5 text-[10px] font-semibold text-success-text">
                <Check className="size-3" strokeWidth={3} aria-hidden />
                완료
              </span>
            ) : null}
          </div>
          {/*
            금액과 수량은 **한 줄**로 붙인다(`¥3,600 · 3개`). 두 줄로 나누면 행이 그만큼
            길어져 한 화면에 보이는 상품이 줄어든다. 일차는 여기서 빼고 여행 상세가 맡는다 —
            일차 필터가 바로 위에 있어 지금 무엇을 보고 있는지는 이미 알 수 있다.
          */}
          <p className="truncate text-[12px] leading-4 text-ink-2">
            <span className="font-medium text-ink">
              <CurrencyText amount={lineTotal(item)} currency={currency} />
            </span>
            <span className="px-1" aria-hidden>
              ·
            </span>
            <span>{quantity}개</span>
          </p>
        </div>
      </Link>
    </article>
  );
}
