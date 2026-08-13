import Image from "next/image";
import Link from "next/link";
import { Bookmark, Images } from "lucide-react";
import { cn } from "@/lib/utils";

type CollectionBoardProps = {
  href: string;
  label: string;
  count: number;
  imageSources: string[];
  kind: "shots" | "scraps";
  preloadImage?: boolean;
};

function BoardPreview({
  imageSources,
  kind,
  preloadImage,
}: Pick<
  CollectionBoardProps,
  "imageSources" | "kind" | "preloadImage"
>) {
  const sources = imageSources.slice(0, 3);
  const EmptyIcon = kind === "shots" ? Images : Bookmark;

  if (sources.length === 0) {
    return (
      <div className="flex size-full items-center justify-center bg-secondary text-ink-3">
        <EmptyIcon className="size-7" strokeWidth={1.8} aria-hidden />
      </div>
    );
  }

  return (
    <div className="grid size-full grid-cols-2 grid-rows-2 gap-px bg-border">
      {sources.map((source, index) => {
        const shouldPreload = Boolean(preloadImage && index === 0);

        return (
          <div
            key={`${kind}-${index}-${source.slice(0, 48)}`}
            className={cn(
              "relative overflow-hidden bg-secondary",
              index === 0 && "row-span-2",
              sources.length === 1 && "col-span-2",
              sources.length === 2 && index === 1 && "row-span-2",
            )}
          >
            <Image
              src={source}
              alt=""
              fill
              preload={shouldPreload}
              loading={shouldPreload ? undefined : "lazy"}
              sizes="(max-width: 480px) calc(50vw - 26px), 216px"
              unoptimized={source.startsWith("data:")}
              className="object-cover"
            />
          </div>
        );
      })}
    </div>
  );
}

export function ProfileCollectionBoard({
  href,
  label,
  count,
  imageSources,
  kind,
  preloadImage = false,
}: CollectionBoardProps) {
  return (
    <Link
      href={href}
      aria-label={`${label}, ${count}개`}
      className="min-w-0 rounded-xl outline-none transition-colors duration-120 hover:bg-paper-2 active:bg-paper-3 focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-paper"
    >
      <div className="aspect-[4/3] overflow-hidden rounded-xl bg-secondary">
        <BoardPreview
          imageSources={imageSources}
          kind={kind}
          preloadImage={preloadImage}
        />
      </div>
      <div className="px-1 pt-2">
        <p className="truncate text-[15px] font-semibold leading-5 text-foreground">
          {label}
        </p>
        <p className="mt-1 text-[12px] leading-4 text-ink-2 tabular-nums">
          {count}개
        </p>
      </div>
    </Link>
  );
}
