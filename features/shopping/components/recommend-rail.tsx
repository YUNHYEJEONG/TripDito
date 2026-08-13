"use client";

import { useId, useMemo, useRef, useSyncExternalStore } from "react";
import Image from "next/image";
import { ArrowUpRight, Heart, MoveHorizontal, Star } from "lucide-react";
import type { ShoppingRecommendItem } from "../data/demo-shopping-content";
import { storageKeys } from "@/lib/storage/keys";
import { resolveLocalStorageKey } from "@/lib/storage/local-storage";
import { cn } from "@/lib/utils";

const FAVORITES_STORAGE_KEY = storageKeys.shoppingFavorites;
const EMPTY_FAVORITES_SNAPSHOT = "[]";
const favoriteSubscribers = new Set<() => void>();
let memoryFavoriteSnapshot = EMPTY_FAVORITES_SNAPSHOT;
let memoryOnlyFavorites = false;

function normalizeFavoriteSnapshot(value: string | null) {
  if (!value) return EMPTY_FAVORITES_SNAPSHOT;

  try {
    const parsed: unknown = JSON.parse(value);
    if (!Array.isArray(parsed)) return EMPTY_FAVORITES_SNAPSHOT;

    return JSON.stringify(
      [...new Set(parsed.filter((id): id is string => typeof id === "string"))]
        .sort(),
    );
  } catch {
    return EMPTY_FAVORITES_SNAPSHOT;
  }
}

function getFavoriteSnapshot() {
  if (memoryOnlyFavorites) return memoryFavoriteSnapshot;

  try {
    memoryFavoriteSnapshot = normalizeFavoriteSnapshot(
      window.localStorage.getItem(resolveLocalStorageKey(FAVORITES_STORAGE_KEY)),
    );
  } catch {
    // Private browsing and embedded contexts can deny localStorage access.
    memoryOnlyFavorites = true;
  }

  return memoryFavoriteSnapshot;
}

function getServerFavoriteSnapshot() {
  return EMPTY_FAVORITES_SNAPSHOT;
}

function subscribeToFavorites(onStoreChange: () => void) {
  favoriteSubscribers.add(onStoreChange);

  function handleStorage(event: StorageEvent) {
    if (event.key !== resolveLocalStorageKey(FAVORITES_STORAGE_KEY)) return;
    memoryFavoriteSnapshot = normalizeFavoriteSnapshot(event.newValue);
    onStoreChange();
  }

  window.addEventListener("storage", handleStorage);
  return () => {
    favoriteSubscribers.delete(onStoreChange);
    window.removeEventListener("storage", handleStorage);
  };
}

function writeFavorites(favorites: Set<string>) {
  memoryFavoriteSnapshot = JSON.stringify([...favorites].sort());

  try {
    window.localStorage.setItem(
      resolveLocalStorageKey(FAVORITES_STORAGE_KEY),
      memoryFavoriteSnapshot,
    );
  } catch {
    // Keep the interaction working in memory when persistence is unavailable.
    memoryOnlyFavorites = true;
  }

  for (const notify of favoriteSubscribers) notify();
}

function RecommendCard({
  item,
  dragSafe,
  favorite,
  showFavorite,
  preloadImage,
  onToggleFavorite,
}: {
  item: ShoppingRecommendItem;
  dragSafe: React.MutableRefObject<boolean>;
  favorite: boolean;
  showFavorite: boolean;
  preloadImage: boolean;
  onToggleFavorite: () => void;
}) {
  const details = (
    <div className="px-3 pt-3 pb-3">
      <h3 className="line-clamp-1 text-[18px] font-semibold leading-[1.45] text-ink">
        {item.title}
      </h3>
      <p className="mt-1 line-clamp-1 text-[13px] text-ink-2">
        {item.subtitle}
      </p>
      <div className="mt-2 flex min-w-0 items-center gap-2 text-[12px] text-ink-2">
        {item.reviewSourceLabel ? (
          <span className="inline-flex shrink-0 items-center gap-1 font-semibold text-ink tabular-nums">
            <Star
              className="size-4 fill-star text-ink"
              strokeWidth={1.8}
              aria-hidden
            />
            {item.reviewSourceLabel}
          </span>
        ) : null}
        {item.reviewSourceLabel ? (
          <span aria-hidden className="text-ink-3">
            ·
          </span>
        ) : null}
        <span className="truncate">{item.spot}</span>
        {item.href ? (
          <ArrowUpRight
            className="size-3.5 shrink-0 text-ink-3"
            aria-label="외부 지도 열기"
          />
        ) : null}
      </div>
    </div>
  );

  return (
    <article className="overflow-hidden rounded-xl border border-rule bg-paper">
      <div
        className={cn(
          "relative aspect-[4/3] w-full overflow-hidden bg-paper-2",
          item.tone,
        )}
      >
        {item.imageSrc ? (
          <Image
            src={item.imageSrc}
            alt={`${item.title} 전경`}
            fill
            draggable={false}
            preload={preloadImage}
            loading={preloadImage ? undefined : "lazy"}
            sizes="216px"
            className="pointer-events-none object-cover"
          />
        ) : null}

        {item.badges?.length ? (
          <div className="absolute top-3 left-3 flex max-w-[calc(100%-3rem)] flex-wrap gap-1">
            {item.badges.slice(0, 2).map((badge) => (
              <span
                key={badge}
                className="rounded-full bg-paper/95 px-2 py-1 text-[11px] font-semibold leading-none text-ink"
              >
                {badge}
              </span>
            ))}
          </div>
        ) : null}

        {showFavorite ? (
          <button
            type="button"
            aria-label={favorite ? `${item.title} 찜 해제` : `${item.title} 찜`}
            aria-pressed={favorite}
            onClick={() => {
              if (dragSafe.current) return;
              onToggleFavorite();
            }}
            className="absolute top-2 right-2 flex size-11 items-center justify-center rounded-full bg-paper/90 text-ink shadow-float outline-none transition-colors duration-120 hover:bg-paper active:bg-paper-2 focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2"
          >
            <Heart
              className={cn(
                "size-5",
                favorite && "fill-affect text-affect",
              )}
              strokeWidth={1.8}
            />
          </button>
        ) : null}
      </div>

      {item.href ? (
        <a
          href={item.href}
          target="_blank"
          rel="noopener noreferrer"
          draggable={false}
          aria-label={`${item.title}, Google 지도에서 보기 (새 창)`}
          className="block rounded-b-xl text-left outline-none transition-colors duration-120 hover:bg-paper-2 active:bg-paper-3 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-focus"
          onClick={(event) => {
            if (!dragSafe.current) return;
            event.preventDefault();
            event.stopPropagation();
          }}
        >
          {details}
        </a>
      ) : (
        <div>{details}</div>
      )}
    </article>
  );
}

export function RecommendRail({
  items,
  ariaLabel,
  showFavorite = false,
  preloadFirstImage = false,
}: {
  items: ShoppingRecommendItem[];
  ariaLabel: string;
  showFavorite?: boolean;
  preloadFirstImage?: boolean;
}) {
  const railRef = useRef<HTMLUListElement>(null);
  const hintId = useId();
  const dragSafe = useRef(false);
  const dragState = useRef<{
    pointerId: number;
    startX: number;
    startScrollLeft: number;
    moved: boolean;
    captured: boolean;
  } | null>(null);
  const favoriteSnapshot = useSyncExternalStore(
    subscribeToFavorites,
    getFavoriteSnapshot,
    getServerFavoriteSnapshot,
  );
  const favorites = useMemo(
    () => new Set<string>(JSON.parse(favoriteSnapshot) as string[]),
    [favoriteSnapshot],
  );

  function onPointerDown(event: React.PointerEvent<HTMLUListElement>) {
    if (event.pointerType !== "mouse" || event.button !== 0) return;
    const rail = railRef.current;
    if (!rail) return;

    dragSafe.current = false;
    dragState.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startScrollLeft: rail.scrollLeft,
      moved: false,
      captured: false,
    };
  }

  function onPointerMove(event: React.PointerEvent<HTMLUListElement>) {
    if (event.pointerType !== "mouse") return;
    const rail = railRef.current;
    const state = dragState.current;
    if (!rail || !state || state.pointerId !== event.pointerId) return;

    const deltaX = event.clientX - state.startX;
    if (!state.moved && Math.abs(deltaX) > 6) {
      state.moved = true;
      dragSafe.current = true;
      rail.dataset.dragging = "true";
      try {
        rail.setPointerCapture(event.pointerId);
        state.captured = true;
      } catch {
        /* pointer capture is optional */
      }
    }
    if (!state.moved) return;

    rail.scrollLeft = state.startScrollLeft - deltaX;
    event.preventDefault();
  }

  function endDrag(event: React.PointerEvent<HTMLUListElement>) {
    const rail = railRef.current;
    const state = dragState.current;
    if (!state || state.pointerId !== event.pointerId) return;

    dragState.current = null;
    if (state.captured && rail?.hasPointerCapture(event.pointerId)) {
      rail.releasePointerCapture(event.pointerId);
    }
    if (rail) delete rail.dataset.dragging;

    if (state.moved) {
      window.setTimeout(() => {
        dragSafe.current = false;
      }, 0);
    }
  }

  function onWheel(event: React.WheelEvent<HTMLUListElement>) {
    const rail = railRef.current;
    if (!rail) return;

    const horizontalDelta = event.shiftKey
      ? event.deltaY
      : Math.abs(event.deltaX) > Math.abs(event.deltaY)
        ? event.deltaX
        : 0;
    if (horizontalDelta === 0) return;

    const maxScroll = rail.scrollWidth - rail.clientWidth;
    if (maxScroll <= 0) return;

    const next = Math.max(
      0,
      Math.min(maxScroll, rail.scrollLeft + horizontalDelta),
    );
    if (next === rail.scrollLeft) return;

    rail.scrollLeft = next;
    event.preventDefault();
  }

  function toggleFavorite(id: string) {
    const next = new Set(favorites);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    writeFavorites(next);
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLUListElement>) {
    if (event.target !== event.currentTarget) return;
    const rail = railRef.current;
    if (!rail) return;

    const cardStep = 228;
    if (event.key === "ArrowRight") rail.scrollBy({ left: cardStep });
    else if (event.key === "ArrowLeft") rail.scrollBy({ left: -cardStep });
    else if (event.key === "Home") rail.scrollTo({ left: 0 });
    else if (event.key === "End") rail.scrollTo({ left: rail.scrollWidth });
    else return;

    event.preventDefault();
  }

  return (
    <div>
      {items.length > 1 ? (
        <p
          id={hintId}
          className="mb-1 flex items-center justify-end gap-1 text-[11px] font-medium text-ink-2"
        >
          좌우로 넘겨 더 보기
          <MoveHorizontal className="size-3.5" aria-hidden />
        </p>
      ) : null}
      <ul
        ref={railRef}
        aria-label={ariaLabel}
        aria-describedby={items.length > 1 ? hintId : undefined}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onWheel={onWheel}
        onKeyDown={onKeyDown}
        tabIndex={items.length > 1 ? 0 : -1}
        className={cn(
          "-mx-4 flex cursor-grab gap-3 overflow-x-auto rounded-xl px-4 pt-1 pb-2 outline-none",
          "touch-auto select-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-focus",
          "[-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
          "data-[dragging=true]:cursor-grabbing",
        )}
      >
        {items.map((item, index) => (
          <li key={item.id} className="w-[216px] shrink-0">
            <RecommendCard
              item={item}
              dragSafe={dragSafe}
              favorite={favorites.has(item.id)}
              showFavorite={showFavorite}
              preloadImage={preloadFirstImage && index === 0}
              onToggleFavorite={() => toggleFavorite(item.id)}
            />
          </li>
        ))}
      </ul>
    </div>
  );
}
