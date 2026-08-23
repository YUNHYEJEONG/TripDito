import "server-only";
import { getSql } from "./client";

/**
 * 공통코드(CMMN_GRP_CD_DETL) 조회/검증.
 * 코드 컬럼에는 FK가 없으므로(정의서 p.40) 애플리케이션에서 값 존재를 검사한다.
 */
export type CodeGroup =
  | "NTN"
  | "CRNCY"
  | "TRIP_STTUS"
  | "GIFT_TAG"
  | "CHNL"
  | "SHOT_STTUS"
  | "PRVDR"
  | "LINK_TY"
  | "USER_STTUS"
  | "APLY_BASE"
  | "CPN_SRC";

export type CodeDetail = { code: string; name: string; sortOrder: number };

const cache = new Map<CodeGroup, { at: number; items: CodeDetail[] }>();
const TTL_MS = 5 * 60 * 1000;

export async function listCodes(group: CodeGroup): Promise<CodeDetail[]> {
  const hit = cache.get(group);
  if (hit && Date.now() - hit.at < TTL_MS) return hit.items;
  const sql = getSql();
  const rows = (await sql.query(
    `SELECT detl_cd, detl_cd_nm, sort_ordr
       FROM cmmn_grp_cd_detl
      WHERE cmmn_grp_cd_id = $1 AND use_at = 'Y'
      ORDER BY sort_ordr, detl_cd`,
    [group],
  )) as { detl_cd: string; detl_cd_nm: string; sort_ordr: number }[];
  const items = rows.map((r) => ({
    code: r.detl_cd,
    name: r.detl_cd_nm,
    sortOrder: r.sort_ordr,
  }));
  cache.set(group, { at: Date.now(), items });
  return items;
}

export async function isValidCode(group: CodeGroup, code: string) {
  return (await listCodes(group)).some((c) => c.code === code);
}

/**
 * 화면 입력(한글명 또는 코드) → 코드. 예: "일본" → "JP", "JP" → "JP".
 * 매칭 실패 시 null.
 */
export async function resolveCode(
  group: CodeGroup,
  value: string,
): Promise<string | null> {
  const v = value.trim();
  if (!v) return null;
  const items = await listCodes(group);
  const byCode = items.find((c) => c.code.toUpperCase() === v.toUpperCase());
  if (byCode) return byCode.code;
  const byName = items.find((c) => c.name === v);
  return byName?.code ?? null;
}

export async function codeName(group: CodeGroup, code: string) {
  return (await listCodes(group)).find((c) => c.code === code)?.name ?? code;
}

/** 앱 선물태그 id ↔ DB GIFT_TAG 코드 */
export const GIFT_TAG_TO_CODE: Record<string, string> = {
  acquaintance: "ACQNT",
  colleague: "COWORK",
  friend: "FRIEND",
  self: "SELF",
  family: "FAMILY",
};
export const CODE_TO_GIFT_TAG: Record<string, string> = Object.fromEntries(
  Object.entries(GIFT_TAG_TO_CODE).map(([k, v]) => [v, k]),
);
