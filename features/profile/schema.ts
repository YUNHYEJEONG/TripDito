import { z } from "zod";

export const localProfileSchema = z.object({
  id: z.string().min(1),
  nickname: z.string().trim().min(1, "닉네임을 입력하세요").max(20),
  avatarDataUrl: z.string().nullable(),
  updatedAt: z.string(),
});

export type LocalProfile = z.infer<typeof localProfileSchema>;

export const localProfileFormSchema = z.object({
  nickname: z.string().trim().min(1, "닉네임을 입력하세요").max(20),
  avatarDataUrl: z.string().nullable().optional(),
});

export type LocalProfileFormValues = z.infer<typeof localProfileFormSchema>;
