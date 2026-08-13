import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import type { ShoppingMagazineItem } from "../data/demo-shopping-content";
import { cn } from "@/lib/utils";

function MagazineRow({ item }: { item: ShoppingMagazineItem }) {
  const content = (
    <>
      <div
        className={cn(
          "relative size-24 shrink-0 overflow-hidden rounded-xl bg-paper-2",
          item.tone,
        )}
      >
        {item.imageSrc ? (
          <Image
            src={item.imageSrc}
            alt={`${item.title} 표지`}
            fill
            sizes="96px"
            className="object-cover"
          />
        ) : null}
      </div>
      <div className="min-w-0 flex-1 py-1">
        <div className="flex items-center justify-between gap-2">
          <p className="text-[12px] font-semibold text-accent-text">{item.tag}</p>
          {item.href ? (
            <span className="inline-flex shrink-0 items-center gap-1 text-[11px] font-medium text-ink-2">
              외부 글
              <ArrowUpRight className="size-3.5" aria-hidden />
            </span>
          ) : null}
        </div>
        <h3 className="mt-1 line-clamp-2 text-[18px] font-semibold leading-[1.45] text-ink">
          {item.title}
        </h3>
        <p className="mt-1 line-clamp-2 text-[12px] leading-[1.45] text-ink-2">
          {item.summary}
        </p>
      </div>
    </>
  );

  if (item.href) {
    return (
      <a
        href={item.href}
        target="_blank"
        rel="noopener noreferrer"
        className="-mx-2 flex gap-3 rounded-xl px-2 py-3 outline-none transition-colors duration-120 hover:bg-paper-2 active:bg-paper-3 focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2"
      >
        {content}
      </a>
    );
  }

  return <article className="flex gap-3 py-3">{content}</article>;
}

export function MagazineList({ items }: { items: ShoppingMagazineItem[] }) {
  return (
    <ul aria-label="쇼핑 매거진" className="divide-y divide-rule">
      {items.map((item) => (
        <li key={item.id}>
          <MagazineRow item={item} />
        </li>
      ))}
    </ul>
  );
}
