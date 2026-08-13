import { getJson, setJson } from "@/lib/storage/local-storage";
import { storageKeys } from "@/lib/storage/keys";
import { EMPTY_PROFILE } from "../constants";
import type { LocalProfile } from "../schema";
import type { Shot } from "@/features/shots/schema";

function readProfile(): LocalProfile {
  return getJson<LocalProfile>(storageKeys.profile, EMPTY_PROFILE);
}

function syncProfileToShots(profile: LocalProfile) {
  const shots = getJson<Shot[]>(storageKeys.shots, []);
  let changed = false;
  const next = shots.map((shot) => {
    const ownShot = shot.authorId === profile.id;
    const comments = (shot.comments ?? []).map((comment) => {
      if (comment.authorId !== profile.id) return comment;
      if (comment.authorNickname === profile.nickname) return comment;
      changed = true;
      return { ...comment, authorNickname: profile.nickname };
    });
    if (!ownShot && comments === shot.comments) return shot;
    if (ownShot) changed = true;
    return {
      ...shot,
      ...(ownShot
        ? {
            authorNickname: profile.nickname,
            authorAvatarDataUrl: profile.avatarDataUrl,
          }
        : {}),
      comments,
    };
  });
  if (changed) setJson(storageKeys.shots, next);
}

export type ProfileUpdateInput = {
  nickname?: string;
  avatarDataUrl?: string | null;
};

export const profileRepository = {
  get(): LocalProfile {
    const profile = readProfile();
    return {
      ...EMPTY_PROFILE,
      ...profile,
      id: profile.id || EMPTY_PROFILE.id,
      nickname: profile.nickname?.trim() ?? "",
      avatarDataUrl: profile.avatarDataUrl ?? null,
    };
  },

  /** 회원가입 직후 등 — 닉네임·아바타 미등록 상태로 초기화 */
  clear(): LocalProfile {
    const cleared: LocalProfile = {
      ...EMPTY_PROFILE,
      updatedAt: new Date().toISOString(),
    };
    setJson(storageKeys.profile, cleared);
    return cleared;
  },

  update(input: ProfileUpdateInput): LocalProfile {
    const current = this.get();
    if (input.nickname !== undefined) {
      const next = input.nickname.trim();
      if (!next) throw new Error("닉네임을 입력해 주세요");
    }

    const updated: LocalProfile = {
      ...current,
      nickname:
        input.nickname !== undefined
          ? input.nickname.trim()
          : current.nickname,
      avatarDataUrl:
        input.avatarDataUrl === undefined
          ? current.avatarDataUrl
          : input.avatarDataUrl,
      updatedAt: new Date().toISOString(),
    };
    setJson(storageKeys.profile, updated);
    syncProfileToShots(updated);
    return updated;
  },
};
