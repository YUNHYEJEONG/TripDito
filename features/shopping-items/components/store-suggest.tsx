"use client";

import { ExternalLink, Loader2, MapPin, Search } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  useStoreSuggest,
  type StoreSuggestion,
} from "../hooks/use-store-suggest";
import { cn } from "@/lib/utils";

/** 구매 장소 칸 값에 매장명을 덧붙인다 (쉼표 구분, 중복 제외) */
export function appendPlace(current: string, name: string) {
  const parts = current
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  if (parts.some((p) => p.toLowerCase() === name.toLowerCase())) return current;
  return [...parts, name].join(", ");
}

/**
 * "근처 매장 찾기" 버튼 + 결과 칩.
 * 여행 도시 인근에서 상품을 살 수 있는 매장을 찾아 주고, 칩을 누르면 구매 장소에 들어간다.
 */
export function StoreSuggest({
  tripId,
  productName,
  onPick,
  compact = false,
  className,
}: {
  tripId: string;
  productName: string;
  onPick: (store: StoreSuggestion) => void;
  /** 분석 검토 시트처럼 좁은 칸용 (버튼 작게, 설명 생략) */
  compact?: boolean;
  className?: string;
}) {
  const suggest = useStoreSuggest(tripId);
  const name = productName.trim();
  const result = suggest.data;

  async function handleSearch() {
    if (!name) {
      toast.error("상품명을 먼저 입력해 주세요");
      return;
    }
    try {
      const found = await suggest.mutateAsync(name);
      if (!found.stores.length) {
        toast.info(`${found.city} 인근에서 매장을 찾지 못했어요`, {
          description: "구매 장소를 직접 입력해 주세요",
        });
      }
    } catch {
      toast.error("매장 검색에 실패했습니다");
    }
  }

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <Button
        type="button"
        variant="outline"
        size={compact ? "sm" : "default"}
        disabled={suggest.isPending || !name}
        onClick={() => void handleSearch()}
        className={cn("w-fit", compact && "h-8 px-2.5 text-[12px]")}
      >
        {suggest.isPending ? (
          <Loader2 className="animate-spin" />
        ) : (
          <Search />
        )}
        {suggest.isPending ? "찾는 중…" : "근처 매장 찾기"}
      </Button>

      {result?.stores.length ? (
        <ul className="flex flex-col gap-1.5" aria-label="추천 매장">
          {result.stores.map((store) => (
            <li key={store.name} className="flex items-start gap-1.5">
              <button
                type="button"
                onClick={() => onPick(store)}
                className={cn(
                  "flex min-w-0 flex-1 items-start gap-2 rounded-lg border border-border/80 bg-background px-2.5 py-2 text-left transition-colors hover:border-primary hover:bg-brand-soft",
                )}
              >
                <MapPin
                  className="mt-0.5 size-3.5 shrink-0 text-primary"
                  aria-hidden
                />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13px] font-semibold text-foreground">
                    {store.name}
                  </span>
                  {store.area || store.note ? (
                    <span className="block truncate text-[11px] text-muted-foreground">
                      {[store.area, store.note].filter(Boolean).join(" · ")}
                    </span>
                  ) : null}
                </span>
              </button>
              {store.url ? (
                <a
                  href={store.url}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={`${store.name} 근거 링크 열기`}
                  className="mt-2 shrink-0 text-muted-foreground hover:text-foreground"
                >
                  <ExternalLink className="size-3.5" />
                </a>
              ) : null}
            </li>
          ))}
          {!compact ? (
            <li className="text-[11px] text-muted-foreground">
              {result.city} 인근 검색 결과예요. 매장을 누르면 구매 장소에
              들어가요.
            </li>
          ) : null}
        </ul>
      ) : null}
    </div>
  );
}
