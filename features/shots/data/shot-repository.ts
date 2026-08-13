import { createId } from "@/lib/storage/id";
import { getJson, setJson } from "@/lib/storage/local-storage";
import { storageKeys } from "@/lib/storage/keys";
import { tripRepository } from "@/features/trips/data/trip-repository";
import { profileRepository } from "@/features/profile/data/profile-repository";
import { authRepository } from "@/features/auth/data/auth-repository";
import { itemRepository } from "@/features/shopping-items/data/item-repository";
import type { Shot, ShotComment, ShotFormValues, Scrap } from "../schema";

function normalizeShot(shot: Shot): Shot {
  // 운영판 데이터에는 channel 필드가 없었습니다. 누락값은 기존 때샷으로
  // 간주해야 피드와 연결 쇼핑리스트가 업그레이드 뒤에도 사라지지 않습니다.
  const channel = shot.channel === "community" ? "community" : "shots";
  const shoppingItemIds =
    channel === "shots"
      ? [...new Set(shot.shoppingItemIds ?? [])].filter(
          (itemId) => itemRepository.getById(itemId)?.tripId === shot.tripId,
        )
      : [];
  return {
    ...shot,
    channel,
    shareCount: shot.shareCount ?? 0,
    pins: shot.pins ?? [],
    comments: shot.comments ?? [],
    shoppingItemIds,
  };
}

function readShots(): Shot[] {
  return getJson<Shot[]>(storageKeys.shots, []).map(normalizeShot);
}

function writeShots(shots: Shot[]) {
  setJson(storageKeys.shots, shots);
}

function requireRegisteredProfile(loginMessage: string) {
  if (!authRepository.get().isLoggedIn) {
    throw new Error(loginMessage);
  }
  const profile = profileRepository.get();
  const nickname = profile.nickname.trim();
  if (!nickname) {
    throw new Error("프로필에서 닉네임을 먼저 등록해 주세요.");
  }
  return { ...profile, nickname };
}

function resolveShoppingItemIds(input: ShotFormValues): string[] {
  if (input.channel !== "shots") return [];

  const itemIds = [...new Set(input.shoppingItemIds)];
  const includesInvalidItem = itemIds.some(
    (itemId) => itemRepository.getById(itemId)?.tripId !== input.tripId,
  );
  if (includesInvalidItem) {
    throw new Error("연결한 상품을 확인하지 못했어요. 다시 선택해 주세요.");
  }
  return itemIds;
}

export const shotRepository = {
  list(): Shot[] {
    return readShots().sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  },

  getById(id: string): Shot | undefined {
    return readShots().find((shot) => shot.id === id);
  },

  create(input: ShotFormValues): Shot {
    const profile = requireRegisteredProfile(
      "로그인한 뒤 때샷을 업로드해 주세요.",
    );
    const trip = tripRepository.getById(input.tripId);
    if (!trip) {
      throw new Error("여행을 찾지 못했어요. 여행을 다시 선택해 주세요.");
    }
    const now = new Date().toISOString();
    const shoppingItemIds = resolveShoppingItemIds(input);

    const shot: Shot = {
      id: createId(),
      channel: input.channel,
      tripId: input.tripId,
      authorId: profile.id,
      authorNickname: profile.nickname,
      authorAvatarDataUrl: profile.avatarDataUrl,
      destinationCountry: trip.country,
      destinationCity: trip.city,
      images: input.images,
      pins: input.pins ?? [],
      body: input.body?.trim() ?? "",
      shoppingItemIds,
      likeCount: 0,
      likedByMe: false,
      shareCount: 0,
      comments: [],
      createdAt: now,
      updatedAt: now,
    };

    writeShots([shot, ...readShots()]);
    return shot;
  },

  toggleLike(id: string): Shot {
    const shots = readShots();
    const index = shots.findIndex((shot) => shot.id === id);
    if (index < 0) throw new Error("때샷을 찾지 못했어요.");
    const current = shots[index];
    const likedByMe = !current.likedByMe;
    const updated: Shot = {
      ...current,
      likedByMe,
      likeCount: Math.max(0, current.likeCount + (likedByMe ? 1 : -1)),
      updatedAt: new Date().toISOString(),
    };
    shots[index] = updated;
    writeShots(shots);
    return updated;
  },

  incrementShare(id: string): Shot {
    const shots = readShots();
    const index = shots.findIndex((shot) => shot.id === id);
    if (index < 0) throw new Error("때샷을 찾지 못했어요.");
    const updated: Shot = {
      ...shots[index],
      shareCount: (shots[index].shareCount ?? 0) + 1,
      updatedAt: new Date().toISOString(),
    };
    shots[index] = updated;
    writeShots(shots);
    return updated;
  },

  addComment(id: string, text: string): Shot {
    const profile = requireRegisteredProfile(
      "로그인한 뒤 댓글을 남겨 주세요.",
    );
    const trimmed = text.trim();
    if (!trimmed) throw new Error("댓글을 입력해 주세요.");
    const shots = readShots();
    const index = shots.findIndex((shot) => shot.id === id);
    if (index < 0) throw new Error("때샷을 찾지 못했어요.");
    const comment: ShotComment = {
      id: createId(),
      authorId: profile.id,
      authorNickname: profile.nickname,
      text: trimmed,
      createdAt: new Date().toISOString(),
    };
    const updated: Shot = {
      ...shots[index],
      comments: [...shots[index].comments, comment],
      updatedAt: new Date().toISOString(),
    };
    shots[index] = updated;
    writeShots(shots);
    return updated;
  },

  removeComment(shotId: string, commentId: string): Shot {
    if (!authRepository.get().isLoggedIn) {
      throw new Error("로그인한 뒤 댓글을 삭제해 주세요.");
    }
    const shots = readShots();
    const index = shots.findIndex((shot) => shot.id === shotId);
    if (index < 0) throw new Error("때샷을 찾지 못했어요.");
    const shot = shots[index];
    const comment = shot.comments.find((item) => item.id === commentId);
    if (!comment) throw new Error("댓글을 찾지 못했어요.");

    const profile = profileRepository.get();
    const canDelete =
      profile.id === shot.authorId || profile.id === comment.authorId;
    if (!canDelete) throw new Error("이 댓글은 삭제할 수 없어요.");

    const updated: Shot = {
      ...shot,
      comments: shot.comments.filter((item) => item.id !== commentId),
      updatedAt: new Date().toISOString(),
    };
    shots[index] = updated;
    writeShots(shots);
    return updated;
  },

  update(id: string, input: ShotFormValues): Shot {
    const profile = requireRegisteredProfile(
      "로그인한 뒤 때샷을 수정해 주세요.",
    );
    const shots = readShots();
    const index = shots.findIndex((shot) => shot.id === id);
    if (index < 0) throw new Error("때샷을 찾지 못했어요.");

    const current = shots[index];
    if (profile.id !== current.authorId) {
      throw new Error("이 때샷은 수정할 수 없어요.");
    }

    const trip = tripRepository.getById(input.tripId);
    if (!trip) {
      throw new Error("여행을 찾지 못했어요. 여행을 다시 선택해 주세요.");
    }

    const shoppingItemIds = resolveShoppingItemIds(input);

    const updated: Shot = {
      ...current,
      channel: input.channel,
      tripId: input.tripId,
      destinationCountry: trip.country,
      destinationCity: trip.city,
      images: input.images,
      pins: input.pins ?? [],
      body: input.body?.trim() ?? "",
      shoppingItemIds,
      authorNickname: profile.nickname,
      authorAvatarDataUrl: profile.avatarDataUrl,
      updatedAt: new Date().toISOString(),
    };
    shots[index] = updated;
    writeShots(shots);
    return updated;
  },

  remove(id: string) {
    if (!authRepository.get().isLoggedIn) {
      throw new Error("로그인한 뒤 때샷을 삭제해 주세요.");
    }
    const shots = readShots();
    const shot = shots.find((item) => item.id === id);
    if (!shot) throw new Error("때샷을 찾지 못했어요.");

    const profile = profileRepository.get();
    if (profile.id !== shot.authorId) {
      throw new Error("이 때샷은 삭제할 수 없어요.");
    }

    writeShots(shots.filter((item) => item.id !== id));

    const scraps = getJson<Scrap[]>(storageKeys.scraps, []);
    setJson(
      storageKeys.scraps,
      scraps.filter((scrap) => scrap.shotId !== id),
    );
  },
};
