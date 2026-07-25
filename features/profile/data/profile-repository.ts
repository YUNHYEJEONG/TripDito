import { getJson, setJson } from "@/lib/storage/local-storage";
import { storageKeys } from "@/lib/storage/keys";
import { DEFAULT_PROFILE } from "../constants";
import type { LocalProfile, LocalProfileFormValues } from "../schema";

function readProfile(): LocalProfile {
  return getJson<LocalProfile>(storageKeys.profile, DEFAULT_PROFILE);
}

export const profileRepository = {
  get(): LocalProfile {
    const profile = readProfile();
    return {
      ...DEFAULT_PROFILE,
      ...profile,
      nickname: profile.nickname?.trim() || DEFAULT_PROFILE.nickname,
    };
  },

  update(input: LocalProfileFormValues): LocalProfile {
    const current = this.get();
    const updated: LocalProfile = {
      ...current,
      nickname: input.nickname.trim(),
      avatarDataUrl:
        input.avatarDataUrl === undefined
          ? current.avatarDataUrl
          : input.avatarDataUrl,
      updatedAt: new Date().toISOString(),
    };
    setJson(storageKeys.profile, updated);
    return updated;
  },
};
