import { ListPlus } from "lucide-react";

export function HomeShoppingEmpty() {
  return (
    <section className="rounded-xl border border-prep-tint bg-prep px-5 py-8 text-center">
      <span className="mx-auto flex size-11 items-center justify-center rounded-xl bg-paper text-accent-text shadow-neu-inset">
        <ListPlus className="size-5" aria-hidden />
      </span>
      <h2 className="mt-3 text-[18px] leading-6 font-semibold text-ink">
        쇼핑리스트
      </h2>
      <p className="mx-auto mt-1 max-w-64 text-[13px] leading-5 text-ink-2">
        여행을 추가하면 살 물건을 바로 정리할 수 있어요.
      </p>
    </section>
  );
}
