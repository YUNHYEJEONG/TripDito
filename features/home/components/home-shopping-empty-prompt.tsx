/**
 * 다가오는 여행이 없을 때 — 기존 쇼핑리스트 카드 타이틀 + 리스트 영역 안내
 */
export function HomeShoppingEmptyPrompt() {
  return (
    <section className="overflow-hidden rounded-2xl border border-border/80 bg-background">
      <div className="flex items-center justify-between gap-2 px-4 pt-3 pb-2">
        <h2 className="text-[13px] font-semibold text-foreground">
          쇼핑리스트
        </h2>
      </div>
      <div className="flex min-h-[160px] items-center justify-center px-4 pb-6 pt-2">
        <p className="text-center text-[13px] leading-relaxed text-muted-foreground">
          여행지 등록하고 쇼핑리스트를 채워보세요.
        </p>
      </div>
    </section>
  );
}
