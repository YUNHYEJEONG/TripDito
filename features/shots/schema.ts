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
  text: z.string().trim().min(1).max(200),
  /** 연결된 쇼핑 아이템 (사진 속 물건) */
  itemId: z.string().nullable().optional(),
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
    tripId: z.string().min(1, "여행을 선택하세요"),
    images: z
      .array(z.string().min(1))
      .min(1, "이미지를 1장 이상 등록하세요")
      .max(10, "이미지는 최대 10장까지 가능합니다"),
    body: z.string().max(2000).optional(),
    pins: z.array(imagePinSchema),
    shoppingItemIds: z.array(z.string()),
  })
  .superRefine((data, ctx) => {
    if (data.channel === "community" && data.shoppingItemIds.length > 0) {
      ctx.addIssue({
        code: "custom",
        message: "커뮤니티 업로드에는 쇼핑리스트를 연결할 수 없습니다",
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
  /** R2 첨부 묶음 ID */
  attachmentId?: string;
  images: string[];
  pins: ImagePin[];
  body: string;
  shoppingItemIds: string[];
  likeCount: number;
  likedByMe: boolean;
  scrappedByMe?: boolean;
  isMine?: boolean;
  shareCount: number;
  comments: ShotComment[];
  createdAt: string;
  updatedAt: string;
};

export type Scrap = {
  id: string;
  shotId: string;
  createdAt: string;
  /** 스크랩한 게시글 (서버 응답에 포함) */
  shot: Shot;
};
