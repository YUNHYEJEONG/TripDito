import { api } from "@/lib/api/client";
import { isDataUrl, uploadImages } from "@/lib/api/upload";
import type { ShoppingItem, ShoppingItemFormValues } from "../schema";
import type { GiftTagId } from "../constants/gift-tags";

/** 서버 /api/items 응답 (lib/db/items.ts ShoppingItemDto) */
export type ShoppingItemDto = {
  id: string;
  tripId: string;
  name: string;
  estimatedPrice: number;
  quantity: number;
  memo: string;
  attachmentId: string | null;
  imageUrl: string | null;
  plannedPurchaseDate: string | null;
  giftTags: string[];
  purchased: boolean;
  purchasedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export function fromItemDto(dto: ShoppingItemDto): ShoppingItem {
  return {
    id: dto.id,
    tripId: dto.tripId,
    name: dto.name,
    estimatedPrice: dto.estimatedPrice,
    quantity: dto.quantity,
    memo: dto.memo,
    imageDataUrl: dto.imageUrl,
    attachmentId: dto.attachmentId,
    plannedPurchaseDate: dto.plannedPurchaseDate,
    giftTags: dto.giftTags as GiftTagId[],
    purchased: dto.purchased,
    purchasedAt: dto.purchasedAt,
    sortOrder: new Date(dto.createdAt).getTime(),
    createdAt: dto.createdAt,
    updatedAt: dto.updatedAt,
  };
}

/**
 * 폼 값 → API 페이로드. 이미지가 새 data URL 이면 R2 에 올리고 첨부 ID 로 바꾼다.
 * 기존 URL 그대로면 현재 attachmentId 유지, null 이면 이미지 제거.
 */
async function toPayload(
  input: ShoppingItemFormValues,
  current?: Pick<ShoppingItem, "imageDataUrl" | "attachmentId"> | null,
) {
  let attachmentId: string | null | undefined;
  if (isDataUrl(input.imageDataUrl)) {
    attachmentId = (await uploadImages("items", [input.imageDataUrl])).id;
  } else if (!input.imageDataUrl) {
    attachmentId = null;
  } else if (current && input.imageDataUrl === current.imageDataUrl) {
    attachmentId = current.attachmentId ?? null;
  } else {
    attachmentId = current?.attachmentId ?? null;
  }

  return {
    name: input.name,
    estimatedPrice: input.estimatedPrice,
    quantity: input.quantity,
    memo: input.memo ?? "",
    attachmentId,
    plannedPurchaseDate: input.plannedPurchaseDate ?? null,
    giftTags: input.giftTags ?? [],
  };
}

export const itemRepository = {
  async listByTrip(tripId: string): Promise<ShoppingItem[]> {
    const rows = await api<ShoppingItemDto[]>(`/api/trips/${tripId}/items`);
    return rows.map(fromItemDto);
  },

  async getById(id: string): Promise<ShoppingItem> {
    return fromItemDto(await api<ShoppingItemDto>(`/api/items/${id}`));
  },

  async create(
    tripId: string,
    input: ShoppingItemFormValues,
  ): Promise<ShoppingItem> {
    const body = await toPayload(input);
    return fromItemDto(
      await api<ShoppingItemDto>(`/api/trips/${tripId}/items`, {
        method: "POST",
        body,
      }),
    );
  },

  /** 사진 분석 결과 등 여러 건 일괄 등록 (순차 호출) */
  async createMany(
    tripId: string,
    inputs: ShoppingItemFormValues[],
  ): Promise<ShoppingItem[]> {
    const created: ShoppingItem[] = [];
    for (const input of inputs) {
      created.push(await this.create(tripId, input));
    }
    return created;
  },

  /** 다른 사람 때샷의 쇼핑품목을 내 여행 리스트로 퍼가기 (첨부 ID 재사용) */
  async copyToTrip(
    source: ShoppingItem,
    targetTripId: string,
  ): Promise<ShoppingItem> {
    return fromItemDto(
      await api<ShoppingItemDto>(`/api/trips/${targetTripId}/items`, {
        method: "POST",
        body: {
          name: source.name,
          estimatedPrice: source.estimatedPrice,
          quantity: source.quantity,
          memo: source.memo,
          attachmentId: source.attachmentId ?? null,
          plannedPurchaseDate: source.plannedPurchaseDate ?? null,
          giftTags: source.giftTags ?? [],
        },
      }),
    );
  },

  async copyManyToTrip(
    sources: ShoppingItem[],
    targetTripId: string,
  ): Promise<ShoppingItem[]> {
    const created: ShoppingItem[] = [];
    for (const source of sources) {
      created.push(await this.copyToTrip(source, targetTripId));
    }
    return created;
  },

  async update(
    id: string,
    input: ShoppingItemFormValues,
    current?: ShoppingItem | null,
  ): Promise<ShoppingItem> {
    const body = await toPayload(input, current);
    return fromItemDto(
      await api<ShoppingItemDto>(`/api/items/${id}`, { method: "PUT", body }),
    );
  },

  async togglePurchased(id: string): Promise<ShoppingItem> {
    return fromItemDto(
      await api<ShoppingItemDto>(`/api/items/${id}/purchase`, {
        method: "POST",
      }),
    );
  },

  async remove(id: string): Promise<void> {
    await api(`/api/items/${id}`, { method: "DELETE" });
  },
};
