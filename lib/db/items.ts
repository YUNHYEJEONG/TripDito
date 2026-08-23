import "server-only";
import { z } from "zod";
import { getSql } from "./client";
import { CODE_TO_GIFT_TAG, GIFT_TAG_TO_CODE, isValidCode } from "./codes";
import { getAttachments } from "./attachments";
import { requireTrip } from "./trips";
import { ApiError } from "@/lib/server/api";

/** API 응답용 쇼핑품목 (앱 ShoppingItem 과 호환) */
export type ShoppingItemDto = {
  id: string;
  tripId: string;
  name: string;
  estimatedPrice: number;
  quantity: number;
  memo: string;
  /** 첨부 묶음 ID (R2) */
  attachmentId: string | null;
  /** 대표 이미지 공개 URL */
  imageUrl: string | null;
  plannedPurchaseDate: string | null;
  giftTags: string[];
  purchased: boolean;
  purchasedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export const itemInputSchema = z.object({
  name: z.string().trim().min(1).max(200),
  estimatedPrice: z.number().min(0).default(0),
  quantity: z.number().int().min(1).default(1),
  memo: z.string().trim().max(500).default(""),
  attachmentId: z.string().max(30).nullable().optional(),
  plannedPurchaseDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .nullable()
    .optional(),
  /** 앱 태그 id(acquaintance·colleague·friend) 또는 DB 코드 */
  giftTags: z.array(z.string()).default([]),
  purchased: z.boolean().optional(),
});

export type ItemInput = z.infer<typeof itemInputSchema>;

export type ItemRow = {
  shop_item_sn: string | number;
  trip_sn: string | number;
  item_nm: string;
  estm_amt: string | number;
  qy: number;
  memo_cn: string | null;
  atcm_file_id: string | null;
  prchs_plan_de: string | null;
  prchs_dttm: string | null;
  rgst_dttm: string;
  altr_dttm: string;
  gift_tags: string[] | null;
};

export const ITEM_COLS = `i.shop_item_sn, i.trip_sn, i.item_nm, i.estm_amt, i.qy, i.memo_cn, i.atcm_file_id,
  to_char(i.prchs_plan_de, 'YYYY-MM-DD') AS prchs_plan_de, i.prchs_dttm, i.rgst_dttm, i.altr_dttm,
  (SELECT array_agg(t.gift_tag_cd ORDER BY t.rgst_dttm)
     FROM shop_item_tag_mpng t WHERE t.shop_item_sn = i.shop_item_sn) AS gift_tags`;

export async function itemsToDtos(rows: ItemRow[]): Promise<ShoppingItemDto[]> {
  const attachments = await getAttachments(
    rows.map((r) => r.atcm_file_id).filter((x): x is string => Boolean(x)),
  );
  return rows.map((r) => ({
    id: String(r.shop_item_sn),
    tripId: String(r.trip_sn),
    name: r.item_nm,
    estimatedPrice: Number(r.estm_amt),
    quantity: r.qy,
    memo: r.memo_cn ?? "",
    attachmentId: r.atcm_file_id,
    imageUrl: r.atcm_file_id
      ? (attachments.get(r.atcm_file_id)?.files[0]?.url ?? null)
      : null,
    plannedPurchaseDate: r.prchs_plan_de,
    giftTags: (r.gift_tags ?? []).map((c) => CODE_TO_GIFT_TAG[c] ?? c),
    purchased: r.prchs_dttm != null,
    purchasedAt: r.prchs_dttm ? new Date(r.prchs_dttm).toISOString() : null,
    createdAt: new Date(r.rgst_dttm).toISOString(),
    updatedAt: new Date(r.altr_dttm).toISOString(),
  }));
}

async function normalizeTags(tags: string[]) {
  const codes = [...new Set(tags.map((t) => GIFT_TAG_TO_CODE[t] ?? t.toUpperCase()))];
  for (const c of codes) {
    if (!(await isValidCode("GIFT_TAG", c))) throw new ApiError(400, "INVALID_GIFT_TAG");
  }
  return codes;
}

export async function listItems(userSn: number, tripId: string) {
  await requireTrip(userSn, tripId);
  const sql = getSql();
  const rows = (await sql.query(
    `SELECT ${ITEM_COLS} FROM shop_item_info i
      WHERE i.trip_sn = $1 AND i.use_at = 'Y'
      ORDER BY i.rgst_dttm DESC, i.shop_item_sn DESC`,
    [tripId],
  )) as ItemRow[];
  return itemsToDtos(rows);
}

/** 소유자 검증: 품목 → 여행 → 사용자 */
async function requireItemRow(userSn: number, itemId: string) {
  if (!/^\d+$/.test(itemId)) throw new ApiError(404, "ITEM_NOT_FOUND");
  const sql = getSql();
  const rows = (await sql.query(
    `SELECT ${ITEM_COLS} FROM shop_item_info i
       JOIN trip_info tr ON tr.trip_sn = i.trip_sn
      WHERE i.shop_item_sn = $1 AND tr.user_sn = $2 AND i.use_at = 'Y' AND tr.use_at = 'Y'`,
    [itemId, userSn],
  )) as ItemRow[];
  if (!rows[0]) throw new ApiError(404, "ITEM_NOT_FOUND");
  return rows[0];
}

export async function getItem(userSn: number, itemId: string) {
  return (await itemsToDtos([await requireItemRow(userSn, itemId)]))[0];
}

export async function createItem(
  userSn: number,
  tripId: string,
  input: ItemInput,
) {
  await requireTrip(userSn, tripId);
  const codes = await normalizeTags(input.giftTags);
  const sql = getSql();
  const rows = (await sql.query(
    `INSERT INTO shop_item_info
       (trip_sn, item_nm, estm_amt, qy, memo_cn, atcm_file_id, prchs_plan_de, prchs_dttm)
     VALUES ($1, $2, $3, $4, $5, $6, $7, CASE WHEN $8 THEN now() END)
     RETURNING shop_item_sn`,
    [tripId, input.name, input.estimatedPrice, input.quantity, input.memo || null,
     input.attachmentId ?? null, input.plannedPurchaseDate ?? null, Boolean(input.purchased)],
  )) as { shop_item_sn: string | number }[];
  const id = String(rows[0].shop_item_sn);
  await replaceTags(id, codes);
  return getItem(userSn, id);
}

export async function updateItem(
  userSn: number,
  itemId: string,
  input: ItemInput,
) {
  const before = await requireItemRow(userSn, itemId);
  const codes = await normalizeTags(input.giftTags);
  const sql = getSql();
  // purchased 가 명시되지 않으면 기존 구매 상태 유지
  const purchased = input.purchased ?? before.prchs_dttm != null;
  await sql.query(
    `UPDATE shop_item_info
        SET item_nm = $2, estm_amt = $3, qy = $4, memo_cn = $5, atcm_file_id = $6,
            prchs_plan_de = $7,
            prchs_dttm = CASE WHEN $8 THEN COALESCE(prchs_dttm, now()) ELSE NULL END
      WHERE shop_item_sn = $1`,
    [itemId, input.name, input.estimatedPrice, input.quantity, input.memo || null,
     input.attachmentId === undefined ? before.atcm_file_id : input.attachmentId,
     input.plannedPurchaseDate ?? null, purchased],
  );
  await replaceTags(itemId, codes);
  return getItem(userSn, itemId);
}

/** 구매 토글: PRCHS_DTTM 이 NULL 이면 구매 처리, 아니면 미구매로 */
export async function togglePurchased(userSn: number, itemId: string) {
  await requireItemRow(userSn, itemId);
  const sql = getSql();
  await sql.query(
    `UPDATE shop_item_info
        SET prchs_dttm = CASE WHEN prchs_dttm IS NULL THEN now() ELSE NULL END
      WHERE shop_item_sn = $1`,
    [itemId],
  );
  return getItem(userSn, itemId);
}

export async function deleteItem(userSn: number, itemId: string) {
  await requireItemRow(userSn, itemId);
  const sql = getSql();
  await sql.query(
    `UPDATE shop_item_info SET use_at = 'N' WHERE shop_item_sn = $1`,
    [itemId],
  );
}

async function replaceTags(itemId: string, codes: string[]) {
  const sql = getSql();
  await sql.query(`DELETE FROM shop_item_tag_mpng WHERE shop_item_sn = $1`, [itemId]);
  for (const c of codes) {
    await sql.query(
      `INSERT INTO shop_item_tag_mpng (shop_item_sn, gift_tag_cd) VALUES ($1, $2)
       ON CONFLICT DO NOTHING`,
      [itemId, c],
    );
  }
}
