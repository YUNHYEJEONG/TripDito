import type { LocalProfile } from "./schema";

export const DEFAULT_PROFILE_ID = "local-me";

export const DEFAULT_PROFILE: LocalProfile = {
  id: DEFAULT_PROFILE_ID,
  nickname: "나",
  avatarDataUrl: null,
  updatedAt: new Date(0).toISOString(),
};
