import Image from "next/image";
import Link from "next/link";
import { ImageOff } from "lucide-react";
import type { Shot } from "@/features/shots/types";

function isSafeImageSource(value: unknown): value is string {
  if (typeof value !== "string") return false;
  const source = value.trim();
  if (source.length === 0 || source !== value) return false;

  if (source.startsWith("/") && !source.startsWith("//")) return true;
  if (source.startsWith("data:image/") || source.startsWith("blob:")) {
    return true;
  }

  try {
    const url = new URL(source);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export function ProfileShotGrid({ shots }: { shots: Shot[] }) {
  return (
    <ul className="grid grid-cols-2 gap-x-3 gap-y-5">
      {shots.map((shot) => {
        const coverSrc = Array.isArray(shot.images)
          ? shot.images.find(isSafeImageSource)
          : undefined;

        return (
          <li key={shot.id} className="min-w-0">
            <Link
              href={`/shots#${shot.id}`}
              className="block rounded-xl outline-none transition-shadow duration-120 hover:ring-1 hover:ring-rule active:ring-2 active:ring-ink focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-paper"
            >
              <div className="relative aspect-square overflow-hidden rounded-xl bg-secondary">
                {coverSrc ? (
                  <Image
                    src={coverSrc}
                    alt={`${shot.authorNickname}님의 ${shot.destinationCity} 때샷`}
                    fill
                    sizes="(max-width: 640px) 46vw, (max-width: 1024px) 30vw, 260px"
                    unoptimized
                    className="object-cover"
                  />
                ) : (
                  <div
                    role="img"
                    aria-label={`${shot.authorNickname}님의 ${shot.destinationCity} 때샷 이미지 없음`}
                    className="flex size-full items-center justify-center text-ink-3"
                  >
                    <ImageOff className="size-6" aria-hidden />
                  </div>
                )}
              </div>
              <p className="mt-2 truncate text-[13px] leading-5 font-semibold text-foreground">
                {shot.destinationCity}
              </p>
              <p className="truncate text-[12px] leading-4 text-ink-2">
                {shot.authorNickname}
              </p>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
