import { z } from "zod";

export const tripFormSchema = z
  .object({
    name: z.string().trim().min(1, "여행명을 입력하세요"),
    country: z.string().trim().min(1, "국가를 입력하세요"),
    city: z.string().trim().min(1, "도시를 입력하세요"),
    startDate: z.string().min(1, "시작일을 선택하세요"),
    endDate: z.string().min(1, "종료일을 선택하세요"),
    currency: z.string().min(1, "통화를 선택하세요"),
    budget: z.number().min(0, "예산은 0 이상이어야 합니다"),
  })
  .refine((data) => data.endDate >= data.startDate, {
    message: "종료일은 시작일 이후여야 합니다",
    path: ["endDate"],
  });

export type TripFormValues = z.infer<typeof tripFormSchema>;

export type TripStatus = "PREP" | "PLANNED" | "ONGOING" | "DONE";

export type Trip = TripFormValues & {
  id: string;
  /** 서버 저장 상태. "여행 마치기"로 날짜와 무관하게 DONE 이 될 수 있다 */
  status?: TripStatus;
  /** 여권 도장을 찍은 페이지 (서버 저장). null 이면 아직 안 찍음 */
  passportPage?: number | null;
  createdAt: string;
  updatedAt: string;
};
