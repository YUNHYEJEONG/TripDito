import { z } from "zod";
import { TRIP_TAG_IDS } from "./constants/trip-tags";

export const tripTagIdSchema = z.enum(TRIP_TAG_IDS);

export const tripFormSchema = z
  .object({
    name: z.string().trim().min(1, "여행명을 입력하세요."),
    country: z.string().trim().min(1, "국가를 입력하세요."),
    city: z.string().trim().min(1, "도시를 입력하세요."),
    startDate: z.string().min(1, "시작일을 선택하세요."),
    endDate: z.string().min(1, "종료일을 선택하세요."),
    currency: z.string().min(1, "통화를 선택하세요."),
    budget: z.number().min(0, "예산은 0 이상이어야 합니다."),
    /** 선택 입력 — 최대 3개 */
    tripTags: z.array(tripTagIdSchema).max(3).default([]),
  })
  .refine((data) => data.endDate >= data.startDate, {
    message: "종료일은 시작일 이후여야 합니다.",
    path: ["endDate"],
  });

export type TripFormValues = z.infer<typeof tripFormSchema>;

export type Trip = TripFormValues & {
  id: string;
  createdAt: string;
  updatedAt: string;
};
