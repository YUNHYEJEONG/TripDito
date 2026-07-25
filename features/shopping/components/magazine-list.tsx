import type { ShoppingMagazineItem } from "../data/demo-shopping-content";
import { cn } from "@/lib/utils";

function MagazineRow({ item }: { item: ShoppingMagazineItem }) {
  const body = (
    <>
      <div
        className={cn(
          "relative size-[72px] shrink-0 overflow-hidden rounded-xl",
          item.tone,
        )}
      >
        {item.imageSrc ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.imageSrc}
            alt=""
            className="absolute inset-0 size-full object-cover"
          />
        ) : null}
        <span className="absolute bottom-1 left-1 rounded bg-black/45 px-1.5 py-0.5 text-[9px] font-semibold text-white">
          {item.tag}
        </span>
      </div>
      <div className="min-w-0 flex-1 py-0.5">
        <p className="line-clamp-2 text-[14px] font-semibold leading-snug text-foreground">
          {item.title}
        </p>
        <p className="mt-1 line-clamp-2 text-[12px] leading-snug text-muted-foreground">
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
        className="flex gap-3 rounded-xl py-1 outline-none active:bg-muted/40"
      >
        {body}
      </a>
    );
  }

  return (
    <div className="flex gap-3 rounded-xl py-1 active:bg-muted/40">{body}</div>
  );
}

export function MagazineList({ items }: { items: ShoppingMagazineItem[] }) {
  return (
    <ul className="flex flex-col gap-2">
      {items.map((item) => (
        <li key={item.id}>
          <MagazineRow item={item} />
        </li>
      ))}
    </ul>
  );
}
