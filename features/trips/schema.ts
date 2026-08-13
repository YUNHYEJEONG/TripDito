import { z } from "zod";

export const tripTagSchema = z.enum([
  "with-friends",
  "with-colleagues",
  "family",
  "filial",
  "solo",
  "foodie",
  "shopping",
  "business",
]);

export const tripFormSchema = z
  .object({
    name: z.string().trim().min(1, "여행 이름을 입력해 주세요"),
    country: z.string().trim().min(1, "국가를 입력해 주세요"),
    city: z.string().trim().min(1, "도시를 입력해 주세요"),
    startDate: z.string().min(1, "시작일을 선택해 주세요"),
    endDate: z.string().min(1, "종료일을 선택해 주세요"),
    currency: z.string().min(1, "통화를 선택해 주세요"),
    budget: z.number().min(0, "예산은 0 이상이어야 해요"),
    /** `input` keeps an explicitly entered zero distinct from "아직 모름". */
    budgetMode: z.enum(["unknown", "input"]).optional(),
    tripTags: z.array(tripTagSchema).max(3).optional(),
  })
  .refine((data) => data.endDate >= data.startDate, {
    message: "종료일은 시작일 이후여야 해요",
    path: ["endDate"],
  });

export type TripFormValues = z.infer<typeof tripFormSchema>;

export type Trip = TripFormValues & {
  id: string;
  createdAt: string;
  updatedAt: string;
};
