import { api, isUnauthorized } from "@/lib/api/client";
import { isDataUrl, uploadImages } from "@/lib/api/upload";
import { EMPTY_PROFILE } from "../constants";
import type { LocalProfile } from "../schema";

/** 서버 /api/me 응답 */
type ProfileDto = {
  id: string;
  email: string | null;
  nickname: string | null;
  profileFileId: string | null;
  avatarUrl: string | null;
  status: string;
};

function fromDto(dto: ProfileDto): LocalProfile {
  return {
    id: dto.id,
    nickname: dto.nickname?.trim() ?? "",
    avatarDataUrl: dto.avatarUrl,
    updatedAt: new Date().toISOString(),
  };
}

export type ProfileUpdateInput = {
  nickname?: string;
  /** 새 이미지(data URL) 또는 null(제거) */
  avatarDataUrl?: string | null;
};

export const profileRepository = {
  /** 미로그인이면 빈 프로필 */
  async get(): Promise<LocalProfile> {
    try {
      return fromDto(await api<ProfileDto>("/api/me"));
    } catch (error) {
      if (isUnauthorized(error)) return EMPTY_PROFILE;
      throw error;
    }
  },

  async update(input: ProfileUpdateInput): Promise<LocalProfile> {
    const body: { nickname?: string; profileFileId?: string | null } = {};
    if (input.nickname !== undefined) {
      const next = input.nickname.trim();
      if (!next) throw new Error("닉네임을 입력하세요");
      body.nickname = next;
    }
    if (input.avatarDataUrl === null) {
      body.profileFileId = null;
    } else if (isDataUrl(input.avatarDataUrl)) {
      body.profileFileId = (await uploadImages("avatars", [input.avatarDataUrl])).id;
    }
    return fromDto(await api<ProfileDto>("/api/me", { method: "PATCH", body }));
  },
};
