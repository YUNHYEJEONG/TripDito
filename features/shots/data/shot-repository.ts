import { api } from "@/lib/api/client";
import { isDataUrl, uploadImages } from "@/lib/api/upload";
import { getJson, setJson } from "@/lib/storage/local-storage";
import { storageKeys } from "@/lib/storage/keys";
import {
  fromItemDto,
  type ShoppingItemDto,
} from "@/features/shopping-items/data/item-repository";
import type { ShoppingItem } from "@/features/shopping-items/types";
import type { Trip } from "@/features/trips/types";
import type { Shot, ShotFormValues } from "../schema";

/** 서버 /api/shots 응답 (lib/db/shots.ts ShotDto) */
type ShotDto = {
  id: string;
  channel: "shots" | "community";
  tripId: string;
  authorId: string;
  authorNickname: string;
  authorAvatarUrl: string | null;
  destinationCountry: string;
  destinationCity: string;
  attachmentId: string;
  images: Array<{ seq: number; path: string; url: string | null }>;
  pins: Array<{
    id: string;
    imageIndex: number;
    xPct: number;
    yPct: number;
    text: string;
    itemId: string | null;
  }>;
  body: string;
  shoppingItemIds: string[];
  comments: Array<{
    id: string;
    parentId: string | null;
    authorId: string;
    authorNickname: string;
    text: string;
    deleted: boolean;
    createdAt: string;
  }>;
  likeCount: number;
  commentCount: number;
  likedByMe: boolean;
  scrappedByMe: boolean;
  isMine: boolean;
  createdAt: string;
  updatedAt: string;
};

export type ShotListFilter = {
  channel?: "shots" | "community";
  sort?: "newest" | "likes";
  country?: string;
  city?: string;
  author?: "me" | string;
  liked?: "me";
  limit?: number;
  offset?: number;
};

/** 공유 횟수는 서버 스키마에 없어 브라우저에만 보관한다 */
function readShareCounts(): Record<string, number> {
  return getJson<Record<string, number>>(`${storageKeys.shots}:shares`, {});
}

export function fromShotDto(dto: ShotDto): Shot {
  return {
    id: dto.id,
    channel: dto.channel,
    tripId: dto.tripId,
    authorId: dto.authorId,
    authorNickname: dto.authorNickname,
    authorAvatarDataUrl: dto.authorAvatarUrl,
    destinationCountry: dto.destinationCountry,
    destinationCity: dto.destinationCity,
    attachmentId: dto.attachmentId,
    images: dto.images.map((f) => f.url ?? ""),
    pins: dto.pins,
    body: dto.body,
    shoppingItemIds: dto.shoppingItemIds,
    likeCount: dto.likeCount,
    likedByMe: dto.likedByMe,
    scrappedByMe: dto.scrappedByMe,
    isMine: dto.isMine,
    shareCount: readShareCounts()[dto.id] ?? 0,
    comments: dto.comments
      .filter((c) => !c.deleted)
      .map((c) => ({
        id: c.id,
        authorId: c.authorId,
        authorNickname: c.authorNickname,
        text: c.text,
        createdAt: c.createdAt,
      })),
    createdAt: dto.createdAt,
    updatedAt: dto.updatedAt,
  };
}

function buildQuery(filter: ShotListFilter = {}) {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(filter)) {
    if (v !== undefined && v !== null && v !== "") p.set(k, String(v));
  }
  const q = p.toString();
  return q ? `?${q}` : "";
}

/**
 * 폼 이미지 → 첨부 ID. 새 이미지(data URL)가 하나라도 있거나 구성이 바뀌면 새로 올리고,
 * 기존 게시글 이미지 그대로면 기존 attachmentId 를 재사용한다.
 */
async function resolveAttachment(images: string[], current?: Shot | null) {
  const unchanged =
    current?.attachmentId &&
    images.length === current.images.length &&
    images.every((src, i) => !isDataUrl(src) && src === current.images[i]);
  if (unchanged) return current.attachmentId!;
  return (await uploadImages("shots", images)).id;
}

async function toPayload(input: ShotFormValues, current?: Shot | null) {
  return {
    channel: input.channel,
    tripId: input.tripId,
    attachmentId: await resolveAttachment(input.images, current),
    body: input.body?.trim() ?? "",
    pins: (input.pins ?? []).map((p) => ({
      imageIndex: p.imageIndex,
      xPct: p.xPct,
      yPct: p.yPct,
      text: p.text,
      itemId: p.itemId ?? null,
    })),
    shoppingItemIds:
      input.channel === "shots" ? input.shoppingItemIds : [],
  };
}

export const shotRepository = {
  async list(filter?: ShotListFilter): Promise<Shot[]> {
    const rows = await api<ShotDto[]>(`/api/shots${buildQuery(filter)}`);
    return rows.map(fromShotDto);
  },

  async getById(id: string): Promise<Shot> {
    return fromShotDto(await api<ShotDto>(`/api/shots/${id}`));
  },

  async create(input: ShotFormValues): Promise<Shot> {
    const body = await toPayload(input);
    return fromShotDto(
      await api<ShotDto>("/api/shots", { method: "POST", body }),
    );
  },

  async update(
    id: string,
    input: ShotFormValues,
    current?: Shot | null,
  ): Promise<Shot> {
    const body = await toPayload(input, current);
    return fromShotDto(
      await api<ShotDto>(`/api/shots/${id}`, { method: "PUT", body }),
    );
  },

  async remove(id: string): Promise<void> {
    await api(`/api/shots/${id}`, { method: "DELETE" });
  },

  async toggleLike(id: string): Promise<Shot> {
    return fromShotDto(
      await api<ShotDto>(`/api/shots/${id}/like`, { method: "POST" }),
    );
  },

  async toggleScrap(id: string): Promise<Shot> {
    return fromShotDto(
      await api<ShotDto>(`/api/shots/${id}/scrap`, { method: "POST" }),
    );
  },

  async addComment(id: string, text: string): Promise<Shot> {
    const trimmed = text.trim();
    if (!trimmed) throw new Error("댓글을 입력하세요");
    await api(`/api/shots/${id}/comments`, {
      method: "POST",
      body: { text: trimmed },
    });
    return this.getById(id);
  },

  async removeComment(shotId: string, commentId: string): Promise<Shot> {
    await api(`/api/shots/${shotId}/comments/${commentId}`, {
      method: "DELETE",
    });
    return this.getById(shotId);
  },

  /** 공유 횟수 (브라우저 로컬 카운터) */
  async incrementShare(id: string): Promise<Shot> {
    const counts = readShareCounts();
    counts[id] = (counts[id] ?? 0) + 1;
    setJson(`${storageKeys.shots}:shares`, counts);
    return this.getById(id);
  },

  /** 때샷에 연결된 쇼핑품목 + 여행 요약 */
  async listItems(
    shotId: string,
  ): Promise<{ items: ShoppingItem[]; trip: Trip | null }> {
    const data = await api<{ items: ShoppingItemDto[]; trip: Trip | null }>(
      `/api/shots/${shotId}/items`,
    );
    return { items: data.items.map(fromItemDto), trip: data.trip };
  },
};
