import type { LocalProfile } from "./schema";

export const DEFAULT_PROFILE_ID = "local-me";

/** 기본 프로필 이미지 (public) — 사용자가 설정한 경우만 사용 */
export const DEFAULT_AVATAR_SRC = "/profile/default-avatar.png";

/** 미등록 프로필 (회원가입 직후) */
export const EMPTY_PROFILE: LocalProfile = {
  id: DEFAULT_PROFILE_ID,
  nickname: "",
  avatarDataUrl: null,
  updatedAt: new Date(0).toISOString(),
};

/** @deprecated EMPTY_PROFILE 사용 — 하위 호환용 별칭 */
export const DEFAULT_PROFILE = EMPTY_PROFILE;

export function hasRegisteredProfile(
  profile: Pick<LocalProfile, "nickname" | "avatarDataUrl"> | null | undefined,
): boolean {
  if (!profile) return false;
  return Boolean(profile.nickname.trim()) || Boolean(profile.avatarDataUrl);
}

export function hasNickname(
  profile: Pick<LocalProfile, "nickname"> | null | undefined,
): boolean {
  return Boolean(profile?.nickname.trim());
}
