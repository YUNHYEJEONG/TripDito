import { z } from "zod";

export const localProfileSchema = z.object({
  id: z.string().min(1),
  /** 빈 문자열 = 미등록 */
  nickname: z.string().trim().max(20),
  avatarDataUrl: z.string().nullable(),
  updatedAt: z.string(),
});

export type LocalProfile = z.infer<typeof localProfileSchema>;

export const localProfileFormSchema = z.object({
  nickname: z.string().trim().min(1, "닉네임을 입력하세요.").max(20),
  avatarDataUrl: z.string().nullable().optional(),
});

export type LocalProfileFormValues = z.infer<typeof localProfileFormSchema>;

/** 아바타만 갱신할 때 (닉네임 미등록 상태 허용) */
export const localProfileAvatarFormSchema = z.object({
  nickname: z.string().trim().max(20).optional(),
  avatarDataUrl: z.string().nullable(),
});
