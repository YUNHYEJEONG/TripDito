import { z } from "zod";

export const shotChannelSchema = z.enum(["shots", "community"]);
export type ShotChannel = z.infer<typeof shotChannelSchema>;

export const shotSortSchema = z.enum(["newest", "likes"]);
export type ShotSort = z.infer<typeof shotSortSchema>;

export const imagePinSchema = z.object({
  id: z.string(),
  imageIndex: z.number().int().min(0),
  xPct: z.number().min(0).max(100),
  yPct: z.number().min(0).max(100),
  text: z
    .string()
    .trim()
    .min(1, "핀 메모를 입력해 주세요")
    .max(200, "핀 메모는 200자까지 입력할 수 있어요"),
});

export type ImagePin = z.infer<typeof imagePinSchema>;

export const shotCommentSchema = z.object({
  id: z.string(),
  authorId: z.string(),
  authorNickname: z.string(),
  text: z.string().trim().min(1).max(500),
  createdAt: z.string(),
});

export type ShotComment = z.infer<typeof shotCommentSchema>;

export const shotFormSchema = z
  .object({
    channel: shotChannelSchema,
    tripId: z.string().min(1, "여행을 선택해 주세요"),
    images: z
      .array(z.string().min(1))
      .min(1, "이미지를 1장 이상 올려 주세요")
      .max(10, "이미지는 최대 10장까지 올릴 수 있어요"),
    body: z
      .string()
      .max(2000, "본문은 2,000자까지 입력할 수 있어요")
      .optional(),
    pins: z.array(imagePinSchema),
    shoppingItemIds: z.array(z.string()),
  })
  .superRefine((data, ctx) => {
    if (data.channel === "community" && data.shoppingItemIds.length > 0) {
      ctx.addIssue({
        code: "custom",
        message: "커뮤니티 업로드에는 쇼핑리스트를 연결할 수 없어요",
        path: ["shoppingItemIds"],
      });
    }
  });

export type ShotFormValues = z.infer<typeof shotFormSchema>;

export type Shot = {
  id: string;
  channel: ShotChannel;
  tripId: string;
  authorId: string;
  authorNickname: string;
  authorAvatarDataUrl: string | null;
  destinationCountry: string;
  destinationCity: string;
  images: string[];
  pins: ImagePin[];
  body: string;
  shoppingItemIds: string[];
  likeCount: number;
  likedByMe: boolean;
  shareCount: number;
  comments: ShotComment[];
  createdAt: string;
  updatedAt: string;
};

export type Scrap = {
  id: string;
  shotId: string;
  createdAt: string;
};
