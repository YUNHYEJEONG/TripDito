"use client";

import { Package } from "lucide-react";

/**
 * 쇼핑리스트 상품 이미지 프레임 (조회/수정 공통)
 * - 상단 중앙 정사각 + 얇은 회색 테두리 + 5px 라운드
 * - 구매/선물 태그는 목록·상세 텍스트 영역에 ItemStatusTags로 표시
 */
export function ItemImageFrame({
  imageDataUrl,
  className,
}: {
  imageDataUrl?: string | null;
  className?: string;
}) {
  return (
    <div
      className={
        className ??
        "relative mx-auto mt-2 mb-1.5 aspect-square w-full max-w-[280px] overflow-hidden rounded-[5px] border border-[#E5E8EB] bg-[#F2F4F6]"
      }
    >
      {imageDataUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={imageDataUrl}
          alt=""
          className="size-full object-cover"
        />
      ) : (
        <div className="flex size-full items-center justify-center">
          <Package className="size-12 text-muted-foreground" />
        </div>
      )}
    </div>
  );
}
