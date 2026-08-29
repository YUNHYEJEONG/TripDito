import "server-only";
import { z } from "zod";
import { getSql } from "./client";
import { codeName } from "./codes";
import { getAttachments, type AttachmentFile } from "./attachments";
import { getTripAny, requireTrip } from "./trips";
import { ITEM_COLS, itemsToDtos, type ItemRow } from "./items";
import { ApiError } from "@/lib/server/api";

export type ShotChannel = "shots" | "community";
const CHNL_CODE: Record<ShotChannel, string> = {
  shots: "SHOTS",
  community: "COMMUNITY",
};
const CODE_CHNL: Record<string, ShotChannel> = {
  SHOTS: "shots",
  COMMUNITY: "community",
};

export type ShotPinDto = {
  id: string;
  imageIndex: number;
  xPct: number;
  yPct: number;
  text: string;
  /** 연결된 쇼핑 아이템 (없으면 null) */
  itemId: string | null;
};

export type ShotCommentDto = {
  id: string;
  parentId: string | null;
  authorId: string; // USER_UUID
  authorNickname: string;
  text: string;
  deleted: boolean;
  createdAt: string;
};

export type ShotDto = {
  id: string;
  channel: ShotChannel;
  tripId: string;
  authorId: string; // USER_UUID
  authorNickname: string;
  authorAvatarUrl: string | null;
  destinationCountry: string;
  destinationCity: string;
  attachmentId: string;
  images: AttachmentFile[];
  pins: ShotPinDto[];
  body: string;
  shoppingItemIds: string[];
  comments: ShotCommentDto[];
  likeCount: number;
  commentCount: number;
  likedByMe: boolean;
  scrappedByMe: boolean;
  isMine: boolean;
  createdAt: string;
  updatedAt: string;
};

export const shotInputSchema = z
  .object({
    channel: z.enum(["shots", "community"]),
    tripId: z.string().regex(/^\d+$/),
    /** R2 업로드 후 등록한 첨부 묶음 ID (이미지 1~10장) */
    attachmentId: z.string().min(1).max(30),
    body: z.string().max(2000).default(""),
    pins: z
      .array(
        z.object({
          imageIndex: z.number().int().min(0),
          xPct: z.number().min(0).max(100),
          yPct: z.number().min(0).max(100),
          text: z.string().trim().min(1).max(200),
          itemId: z.string().regex(/^\d+$/).nullable().optional(),
        }),
      )
      .default([]),
    shoppingItemIds: z.array(z.string().regex(/^\d+$/)).default([]),
  })
  .superRefine((d, ctx) => {
    if (d.channel === "community" && d.shoppingItemIds.length > 0) {
      ctx.addIssue({
        code: "custom",
        message: "커뮤니티 업로드에는 쇼핑리스트를 연결할 수 없습니다",
        path: ["shoppingItemIds"],
      });
    }
  });
export type ShotInput = z.infer<typeof shotInputSchema>;

export const shotQuerySchema = z.object({
  channel: z.enum(["shots", "community"]).optional(),
  sort: z.enum(["newest", "likes"]).default("newest"),
  /** 국가 코드 또는 도시명 필터 */
  country: z.string().optional(),
  city: z.string().optional(),
  /** 특정 작성자(USER_UUID) 또는 'me' */
  author: z.string().optional(),
  /** 'me' 면 내가 좋아요한 게시글만 */
  liked: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(30),
  offset: z.coerce.number().int().min(0).default(0),
});
export type ShotQuery = z.infer<typeof shotQuerySchema>;

type ShotRow = {
  shot_sn: string | number;
  user_sn: string | number;
  trip_sn: string | number;
  chnl_cd: string;
  atcm_file_id: string;
  body_cn: string | null;
  like_cnt: number;
  cmnt_cnt: number;
  rgst_dttm: string;
  altr_dttm: string;
  author_uuid: string;
  author_ncknm: string | null;
  author_prfl_file: string | null;
  ntn_cd: string;
  cty_nm: string;
  liked: boolean;
  scrapped: boolean;
  pins: unknown;
  item_sns: (string | number)[] | null;
  comments: unknown;
};

const SELECT = `
  SELECT s.shot_sn, s.user_sn, s.trip_sn, s.chnl_cd, s.atcm_file_id, s.body_cn,
         s.like_cnt, s.cmnt_cnt, s.rgst_dttm, s.altr_dttm,
         u.user_uuid AS author_uuid, u.ncknm AS author_ncknm, u.prfl_atcm_file_id AS author_prfl_file,
         t.ntn_cd, t.cty_nm,
         EXISTS (SELECT 1 FROM shot_like_info l WHERE l.shot_sn = s.shot_sn AND l.user_sn = $1) AS liked,
         EXISTS (SELECT 1 FROM shot_scrp_info c WHERE c.shot_sn = s.shot_sn AND c.user_sn = $1) AS scrapped,
         (SELECT json_agg(json_build_object(
              'id', p.shot_pin_sn, 'imageIndex', p.atcm_file_seq,
              'xPct', p.x_pstn_rt, 'yPct', p.y_pstn_rt, 'text', p.pin_cn,
              'itemId', p.item_sn) ORDER BY p.shot_pin_sn)
            FROM shot_pin_info p WHERE p.shot_sn = s.shot_sn AND p.use_at = 'Y') AS pins,
         (SELECT array_agg(m.shop_item_sn ORDER BY m.rgst_dttm)
            FROM shot_item_mpng m WHERE m.shot_sn = s.shot_sn) AS item_sns,
         (SELECT json_agg(json_build_object(
              'id', c2.shot_cmnt_sn, 'parentId', c2.upper_cmnt_sn, 'authorId', cu.user_uuid,
              'authorNickname', cu.ncknm, 'text', c2.cmnt_cn, 'deleted', c2.del_dttm IS NOT NULL,
              'createdAt', c2.rgst_dttm) ORDER BY c2.rgst_dttm, c2.shot_cmnt_sn)
            FROM shot_cmnt_info c2 JOIN user_info cu ON cu.user_sn = c2.user_sn
           WHERE c2.shot_sn = s.shot_sn AND c2.use_at = 'Y') AS comments
    FROM shot_info s
    JOIN user_info u ON u.user_sn = s.user_sn
    JOIN trip_info t ON t.trip_sn = s.trip_sn`;

type RawComment = {
  id: number | string;
  parentId: number | string | null;
  authorId: string;
  authorNickname: string | null;
  text: string;
  deleted: boolean;
  createdAt: string;
};

async function toDtos(rows: ShotRow[], viewerSn: number): Promise<ShotDto[]> {
  const attachments = await getAttachments([
    ...rows.map((r) => r.atcm_file_id),
    ...rows.map((r) => r.author_prfl_file).filter((x): x is string => Boolean(x)),
  ]);
  return Promise.all(
    rows.map(async (r) => {
      const pins = (Array.isArray(r.pins) ? r.pins : []) as Array<{
        id: number | string;
        imageIndex: number;
        xPct: string | number;
        yPct: string | number;
        text: string;
        itemId: number | string | null;
      }>;
      return {
        id: String(r.shot_sn),
        channel: CODE_CHNL[r.chnl_cd] ?? "shots",
        tripId: String(r.trip_sn),
        authorId: r.author_uuid,
        authorNickname: r.author_ncknm ?? "여행자",
        authorAvatarUrl: r.author_prfl_file
          ? (attachments.get(r.author_prfl_file)?.files[0]?.url ?? null)
          : null,
        destinationCountry: await codeName("NTN", r.ntn_cd),
        destinationCity: r.cty_nm,
        attachmentId: r.atcm_file_id,
        images: attachments.get(r.atcm_file_id)?.files ?? [],
        pins: pins.map((p) => ({
          id: String(p.id),
          imageIndex: Math.max(0, Number(p.imageIndex) - 1),
          xPct: Number(p.xPct),
          yPct: Number(p.yPct),
          text: p.text,
          itemId: p.itemId == null ? null : String(p.itemId),
        })),
        body: r.body_cn ?? "",
        shoppingItemIds: (r.item_sns ?? []).map(String),
        comments: ((Array.isArray(r.comments) ? r.comments : []) as RawComment[]).map(
          (c) => ({
            id: String(c.id),
            parentId: c.parentId == null ? null : String(c.parentId),
            authorId: c.authorId,
            authorNickname: c.authorNickname ?? "여행자",
            text: c.deleted ? "삭제된 댓글입니다" : c.text,
            deleted: Boolean(c.deleted),
            createdAt: new Date(c.createdAt).toISOString(),
          }),
        ),
        likeCount: r.like_cnt,
        commentCount: r.cmnt_cnt,
        likedByMe: r.liked,
        scrappedByMe: r.scrapped,
        isMine: Number(r.user_sn) === viewerSn,
        createdAt: new Date(r.rgst_dttm).toISOString(),
        updatedAt: new Date(r.altr_dttm).toISOString(),
      };
    }),
  );
}

export async function listShots(viewerSn: number, q: ShotQuery) {
  const sql = getSql();
  const where: string[] = [`s.use_at = 'Y'`, `s.shot_sttus_cd = 'PUBLIC'`];
  const params: unknown[] = [viewerSn];
  const add = (clause: string, v: unknown) => {
    params.push(v);
    where.push(clause.replace("?", `$${params.length}`));
  };
  if (q.channel) add(`s.chnl_cd = ?`, CHNL_CODE[q.channel]);
  if (q.country) add(`t.ntn_cd = ?`, q.country.toUpperCase());
  if (q.city) add(`t.cty_nm = ?`, q.city);
  if (q.author === "me") add(`s.user_sn = ?`, viewerSn);
  else if (q.author) add(`u.user_uuid = ?`, q.author);
  if (q.liked === "me") {
    where.push(`EXISTS (SELECT 1 FROM shot_like_info l2 WHERE l2.shot_sn = s.shot_sn AND l2.user_sn = $1)`);
  }

  const order =
    q.sort === "likes"
      ? `s.like_cnt DESC, s.rgst_dttm DESC`
      : `s.rgst_dttm DESC, s.shot_sn DESC`;
  params.push(q.limit, q.offset);
  const rows = (await sql.query(
    `${SELECT} WHERE ${where.join(" AND ")} ORDER BY ${order}
      LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params,
  )) as ShotRow[];
  return toDtos(rows, viewerSn);
}

async function findRow(viewerSn: number, shotId: string) {
  if (!/^\d+$/.test(shotId)) return null;
  const sql = getSql();
  const rows = (await sql.query(
    `${SELECT} WHERE s.shot_sn = $2 AND s.use_at = 'Y' AND s.shot_sttus_cd <> 'DELETED'`,
    [viewerSn, shotId],
  )) as ShotRow[];
  return rows[0] ?? null;
}

export async function getShot(viewerSn: number, shotId: string) {
  const row = await findRow(viewerSn, shotId);
  if (!row) throw new ApiError(404, "SHOT_NOT_FOUND");
  return (await toDtos([row], viewerSn))[0];
}

async function requireOwnShot(userSn: number, shotId: string) {
  const row = await findRow(userSn, shotId);
  if (!row) throw new ApiError(404, "SHOT_NOT_FOUND");
  if (Number(row.user_sn) !== userSn) throw new ApiError(403, "FORBIDDEN");
  return row;
}

/** 검증 대상 아이템: 쇼핑리스트 연결 + 핀에 연결된 아이템 */
function collectItemIds(input: ShotInput) {
  return [
    ...new Set([
      ...input.shoppingItemIds,
      ...input.pins.flatMap((p) => (p.itemId ? [p.itemId] : [])),
    ]),
  ];
}

async function validateItems(userSn: number, tripId: string, itemIds: string[]) {
  if (itemIds.length === 0) return;
  const sql = getSql();
  const rows = (await sql.query(
    `SELECT count(*)::int AS n FROM shop_item_info i
       JOIN trip_info t ON t.trip_sn = i.trip_sn
      WHERE i.shop_item_sn = ANY($1::bigint[]) AND i.trip_sn = $2 AND t.user_sn = $3 AND i.use_at = 'Y'`,
    [itemIds, tripId, userSn],
  )) as { n: number }[];
  if (rows[0].n !== new Set(itemIds).size) throw new ApiError(400, "INVALID_SHOPPING_ITEMS");
}

export async function createShot(userSn: number, input: ShotInput) {
  await requireTrip(userSn, input.tripId);
  await validateItems(userSn, input.tripId, collectItemIds(input));
  const sql = getSql();
  const att = (await sql.query(
    `SELECT file_cnt FROM atcm_file_info WHERE atcm_file_id = $1 AND use_at = 'Y'`,
    [input.attachmentId],
  )) as { file_cnt: number }[];
  if (!att[0] || att[0].file_cnt < 1 || att[0].file_cnt > 10) {
    throw new ApiError(400, "INVALID_ATTACHMENT");
  }

  const rows = (await sql.query(
    `INSERT INTO shot_info (user_sn, trip_sn, chnl_cd, atcm_file_id, body_cn, shot_sttus_cd)
     VALUES ($1, $2, $3, $4, $5, 'PUBLIC') RETURNING shot_sn`,
    [userSn, input.tripId, CHNL_CODE[input.channel], input.attachmentId, input.body || null],
  )) as { shot_sn: string | number }[];
  const shotId = String(rows[0].shot_sn);
  await writePins(shotId, input.pins);
  await writeItems(shotId, input.shoppingItemIds);
  return getShot(userSn, shotId);
}

export async function updateShot(userSn: number, shotId: string, input: ShotInput) {
  await requireOwnShot(userSn, shotId);
  await requireTrip(userSn, input.tripId);
  await validateItems(userSn, input.tripId, collectItemIds(input));
  const sql = getSql();
  await sql.query(
    `UPDATE shot_info SET trip_sn = $2, chnl_cd = $3, atcm_file_id = $4, body_cn = $5
      WHERE shot_sn = $1`,
    [shotId, input.tripId, CHNL_CODE[input.channel], input.attachmentId, input.body || null],
  );
  await sql.query(`UPDATE shot_pin_info SET use_at = 'N' WHERE shot_sn = $1`, [shotId]);
  await sql.query(`DELETE FROM shot_item_mpng WHERE shot_sn = $1`, [shotId]);
  await writePins(shotId, input.pins);
  await writeItems(shotId, input.shoppingItemIds);
  return getShot(userSn, shotId);
}

export async function deleteShot(userSn: number, shotId: string) {
  await requireOwnShot(userSn, shotId);
  const sql = getSql();
  await sql.query(
    `UPDATE shot_info SET shot_sttus_cd = 'DELETED', use_at = 'N' WHERE shot_sn = $1`,
    [shotId],
  );
}

async function writePins(shotId: string, pins: ShotInput["pins"]) {
  const sql = getSql();
  for (const p of pins) {
    await sql.query(
      `INSERT INTO shot_pin_info (shot_sn, atcm_file_seq, x_pstn_rt, y_pstn_rt, pin_cn, item_sn)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [shotId, p.imageIndex + 1, p.xPct, p.yPct, p.text, p.itemId ?? null],
    );
  }
}

async function writeItems(shotId: string, itemIds: string[]) {
  const sql = getSql();
  for (const id of new Set(itemIds)) {
    await sql.query(
      `INSERT INTO shot_item_mpng (shot_sn, shop_item_sn) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
      [shotId, id],
    );
  }
}

/** 좋아요 토글. LIKE_CNT 비정규화 카운터 동기화 */
export async function toggleLike(userSn: number, shotId: string) {
  const row = await findRow(userSn, shotId);
  if (!row) throw new ApiError(404, "SHOT_NOT_FOUND");
  const sql = getSql();
  if (row.liked) {
    await sql.query(`DELETE FROM shot_like_info WHERE shot_sn = $1 AND user_sn = $2`, [shotId, userSn]);
    await sql.query(`UPDATE shot_info SET like_cnt = GREATEST(like_cnt - 1, 0) WHERE shot_sn = $1`, [shotId]);
  } else {
    await sql.query(
      `INSERT INTO shot_like_info (shot_sn, user_sn) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
      [shotId, userSn],
    );
    await sql.query(`UPDATE shot_info SET like_cnt = like_cnt + 1 WHERE shot_sn = $1`, [shotId]);
  }
  return getShot(userSn, shotId);
}

/** 스크랩 토글 */
export async function toggleScrap(userSn: number, shotId: string) {
  const row = await findRow(userSn, shotId);
  if (!row) throw new ApiError(404, "SHOT_NOT_FOUND");
  const sql = getSql();
  if (row.scrapped) {
    await sql.query(`DELETE FROM shot_scrp_info WHERE shot_sn = $1 AND user_sn = $2`, [shotId, userSn]);
  } else {
    await sql.query(
      `INSERT INTO shot_scrp_info (shot_sn, user_sn) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
      [shotId, userSn],
    );
  }
  return getShot(userSn, shotId);
}

/** 프로필 > 내 스크랩 (최근 순) */
export async function listScraps(userSn: number, limit = 50, offset = 0) {
  const sql = getSql();
  const rows = (await sql.query(
    `${SELECT}
      JOIN shot_scrp_info sc ON sc.shot_sn = s.shot_sn AND sc.user_sn = $1
     WHERE s.use_at = 'Y' AND s.shot_sttus_cd = 'PUBLIC'
     ORDER BY sc.rgst_dttm DESC LIMIT $2 OFFSET $3`,
    [userSn, limit, offset],
  )) as ShotRow[];
  return toDtos(rows, userSn);
}

/** 때샷에 연결된 쇼핑품목 (다른 사람 것도 열람 가능 — 퍼가기용) */
export async function listShotItems(viewerSn: number, shotId: string) {
  const row = await findRow(viewerSn, shotId);
  if (!row) throw new ApiError(404, "SHOT_NOT_FOUND");
  const sql = getSql();
  const rows = (await sql.query(
    `SELECT ${ITEM_COLS} FROM shop_item_info i
       JOIN shot_item_mpng m ON m.shop_item_sn = i.shop_item_sn
      WHERE m.shot_sn = $1 AND i.use_at = 'Y'
      ORDER BY m.rgst_dttm, i.shop_item_sn`,
    [shotId],
  )) as ItemRow[];
  const items = await itemsToDtos(rows);
  const trip = await getTripAny(String(row.trip_sn));
  return { items, trip };
}

// ---------- 댓글 ----------
type CommentRow = {
  shot_cmnt_sn: string | number;
  upper_cmnt_sn: string | number | null;
  user_uuid: string;
  ncknm: string | null;
  cmnt_cn: string;
  del_dttm: string | null;
  rgst_dttm: string;
};

function toComment(r: CommentRow): ShotCommentDto {
  const deleted = r.del_dttm != null;
  return {
    id: String(r.shot_cmnt_sn),
    parentId: r.upper_cmnt_sn == null ? null : String(r.upper_cmnt_sn),
    authorId: r.user_uuid,
    authorNickname: r.ncknm ?? "여행자",
    text: deleted ? "삭제된 댓글입니다" : r.cmnt_cn,
    deleted,
    createdAt: new Date(r.rgst_dttm).toISOString(),
  };
}

export async function listComments(viewerSn: number, shotId: string) {
  if (!(await findRow(viewerSn, shotId))) throw new ApiError(404, "SHOT_NOT_FOUND");
  const sql = getSql();
  const rows = (await sql.query(
    `SELECT c.shot_cmnt_sn, c.upper_cmnt_sn, u.user_uuid, u.ncknm, c.cmnt_cn, c.del_dttm, c.rgst_dttm
       FROM shot_cmnt_info c JOIN user_info u ON u.user_sn = c.user_sn
      WHERE c.shot_sn = $1 AND c.use_at = 'Y'
      ORDER BY c.rgst_dttm ASC, c.shot_cmnt_sn ASC`,
    [shotId],
  )) as CommentRow[];
  return rows.map(toComment);
}

export const commentInputSchema = z.object({
  text: z.string().trim().min(1).max(500),
  parentId: z.string().regex(/^\d+$/).nullable().optional(),
});

export async function addComment(
  userSn: number,
  shotId: string,
  input: z.infer<typeof commentInputSchema>,
) {
  if (!(await findRow(userSn, shotId))) throw new ApiError(404, "SHOT_NOT_FOUND");
  const sql = getSql();
  if (input.parentId) {
    const parent = (await sql.query(
      `SELECT 1 FROM shot_cmnt_info WHERE shot_cmnt_sn = $1 AND shot_sn = $2`,
      [input.parentId, shotId],
    )) as unknown[];
    if (!parent[0]) throw new ApiError(400, "INVALID_PARENT_COMMENT");
  }
  const rows = (await sql.query(
    `INSERT INTO shot_cmnt_info (shot_sn, user_sn, upper_cmnt_sn, cmnt_cn)
     VALUES ($1, $2, $3, $4) RETURNING shot_cmnt_sn`,
    [shotId, userSn, input.parentId ?? null, input.text],
  )) as { shot_cmnt_sn: string | number }[];
  await sql.query(`UPDATE shot_info SET cmnt_cnt = cmnt_cnt + 1 WHERE shot_sn = $1`, [shotId]);
  const list = await listComments(userSn, shotId);
  return list.find((c) => c.id === String(rows[0].shot_cmnt_sn))!;
}

/** 댓글 삭제: 행은 남기고 DEL_DTTM 표기 (대댓글이 참조) */
export async function deleteComment(userSn: number, shotId: string, commentId: string) {
  const sql = getSql();
  const rows = (await sql.query(
    `UPDATE shot_cmnt_info SET del_dttm = now()
      WHERE shot_cmnt_sn = $1 AND shot_sn = $2 AND user_sn = $3 AND del_dttm IS NULL
      RETURNING shot_cmnt_sn`,
    [commentId, shotId, userSn],
  )) as unknown[];
  if (!rows[0]) throw new ApiError(404, "COMMENT_NOT_FOUND");
  await sql.query(
    `UPDATE shot_info SET cmnt_cnt = GREATEST(cmnt_cnt - 1, 0) WHERE shot_sn = $1`,
    [shotId],
  );
}
