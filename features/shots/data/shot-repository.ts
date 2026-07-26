import { createId } from "@/lib/storage/id";
import { getJson, setJson } from "@/lib/storage/local-storage";
import { storageKeys } from "@/lib/storage/keys";
import { tripRepository } from "@/features/trips/data/trip-repository";
import { profileRepository } from "@/features/profile/data/profile-repository";
import { authRepository } from "@/features/auth/data/auth-repository";
import type { Shot, ShotComment, ShotFormValues, Scrap } from "../schema";

function normalizeShot(shot: Shot): Shot {
  return {
    ...shot,
    shareCount: shot.shareCount ?? 0,
    pins: shot.pins ?? [],
    comments: shot.comments ?? [],
    shoppingItemIds: shot.shoppingItemIds ?? [],
  };
}

function readShots(): Shot[] {
  return getJson<Shot[]>(storageKeys.shots, []).map(normalizeShot);
}

function writeShots(shots: Shot[]) {
  setJson(storageKeys.shots, shots);
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
    if (!authRepository.get().isLoggedIn) {
      throw new Error("로그인 후 업로드할 수 있습니다.");
    }
    const trip = tripRepository.getById(input.tripId);
    if (!trip) throw new Error("여행을 찾을 수 없습니다.");
    const profile = profileRepository.get();
    const now = new Date().toISOString();
    const shoppingItemIds =
      input.channel === "shots" ? input.shoppingItemIds : [];

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
    if (index < 0) throw new Error("피드를 찾을 수 없습니다.");
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
    if (index < 0) throw new Error("피드를 찾을 수 없습니다.");
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
    if (!authRepository.get().isLoggedIn) {
      throw new Error("로그인 후 댓글을 달 수 있습니다.");
    }
    const trimmed = text.trim();
    if (!trimmed) throw new Error("댓글을 입력하세요.");
    const shots = readShots();
    const index = shots.findIndex((shot) => shot.id === id);
    if (index < 0) throw new Error("피드를 찾을 수 없습니다.");
    const profile = profileRepository.get();
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
    const shots = readShots();
    const index = shots.findIndex((shot) => shot.id === shotId);
    if (index < 0) throw new Error("피드를 찾을 수 없습니다.");
    const shot = shots[index];
    const comment = shot.comments.find((item) => item.id === commentId);
    if (!comment) throw new Error("댓글을 찾을 수 없습니다.");

    const profile = profileRepository.get();
    const canDelete =
      profile.id === shot.authorId || profile.id === comment.authorId;
    if (!canDelete) throw new Error("댓글을 삭제할 권한이 없습니다.");

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
    if (!authRepository.get().isLoggedIn) {
      throw new Error("로그인 후 수정할 수 있습니다.");
    }
    const shots = readShots();
    const index = shots.findIndex((shot) => shot.id === id);
    if (index < 0) throw new Error("피드를 찾을 수 없습니다.");

    const current = shots[index];
    const profile = profileRepository.get();
    if (profile.id !== current.authorId) {
      throw new Error("피드를 수정할 권한이 없습니다.");
    }

    const trip = tripRepository.getById(input.tripId);
    if (!trip) throw new Error("여행을 찾을 수 없습니다.");

    const shoppingItemIds =
      input.channel === "shots" ? input.shoppingItemIds : [];

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
      throw new Error("로그인 후 삭제할 수 있습니다.");
    }
    const shots = readShots();
    const shot = shots.find((item) => item.id === id);
    if (!shot) throw new Error("피드를 찾을 수 없습니다.");

    const profile = profileRepository.get();
    if (profile.id !== shot.authorId) {
      throw new Error("피드를 삭제할 권한이 없습니다.");
    }

    writeShots(shots.filter((item) => item.id !== id));

    const scraps = getJson<Scrap[]>(storageKeys.scraps, []);
    setJson(
      storageKeys.scraps,
      scraps.filter((scrap) => scrap.shotId !== id),
    );
  },
};
