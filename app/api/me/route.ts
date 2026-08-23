import { z } from "zod";
import { handleApi, readJson, requireUser } from "@/lib/server/api";
import { updateProfile, withdrawUser, type DbUser } from "@/lib/db/users";
import { getAttachment } from "@/lib/db/attachments";

async function toProfile(user: DbUser) {
  const avatar = user.profileFileId
    ? await getAttachment(user.profileFileId)
    : null;
  return {
    id: user.userUuid,
    email: user.email,
    nickname: user.nickname,
    profileFileId: user.profileFileId,
    avatarUrl: avatar?.files[0]?.url ?? null,
    status: user.status,
  };
}

/** 내 프로필 */
export async function GET() {
  return handleApi(async () => toProfile(await requireUser()));
}

const profileSchema = z.object({
  nickname: z.string().trim().min(1).max(20).optional(),
  /** 아바타 첨부 묶음 ID. null 이면 제거 */
  profileFileId: z.string().max(30).nullable().optional(),
});

/** 닉네임·아바타 수정 */
export async function PATCH(request: Request) {
  return handleApi(async () => {
    const user = await requireUser();
    const input = profileSchema.parse(await readJson(request));
    return toProfile(await updateProfile(user.userSn, input));
  });
}

/** 탈퇴 (상태만 WTHDRW 로, 유예 후 파기) */
export async function DELETE() {
  return handleApi(async () => {
    const user = await requireUser();
    await withdrawUser(user.userSn);
    return { ok: true };
  });
}
