import "server-only";
import { getSql } from "./client";
import { codeName, resolveCode } from "./codes";
import { ApiError } from "@/lib/server/api";
import { fetchTaxFreeCoupons } from "@/features/coupons/lib/fetch-taxfree-coupons";
import type { TaxFreeCoupon } from "@/features/coupons/types";

/** 앱 TaxFreeCoupon 과 호환되는 쿠폰 DTO */
export type CouponDto = TaxFreeCoupon & {
  countryCode: string;
  applyBase: "DPRTR" | "ARVL";
  source: "LIVE" | "FALLBACK";
};

export type ReceivedCouponDto = CouponDto & {
  receivedAt: string;
  usedAt: string | null;
  couponNo: string | null;
};

type CpnRow = {
  cpn_sn: string | number;
  cpn_sj: string;
  mrhst_nm: string;
  bnef_cn: string;
  link_url: string;
  ntn_cd: string;
  aply_base_cd: "DPRTR" | "ARVL";
  vld_begin_de: string | null;
  vld_end_de: string | null;
  src_cd: "LIVE" | "FALLBACK";
  regions: string[] | null;
  issu_dttm?: string;
  use_dttm?: string | null;
  cpn_no?: string | null;
};

const COLS = `c.cpn_sn, c.cpn_sj, c.mrhst_nm, c.bnef_cn, c.link_url, c.ntn_cd, c.aply_base_cd,
  to_char(c.vld_begin_de,'YYYY-MM-DD') AS vld_begin_de, to_char(c.vld_end_de,'YYYY-MM-DD') AS vld_end_de,
  c.src_cd,
  (SELECT array_agg(r.regn_nm ORDER BY r.regn_nm) FROM cpn_regn_info r WHERE r.cpn_sn = c.cpn_sn) AS regions`;

async function toDto(r: CpnRow): Promise<CouponDto> {
  const today = new Date().toISOString().slice(0, 10);
  const active =
    (!r.vld_begin_de || r.vld_begin_de <= today) &&
    (!r.vld_end_de || r.vld_end_de >= today);
  return {
    id: String(r.cpn_sn),
    title: r.cpn_sj,
    href: r.link_url,
    benefit: r.bnef_cn,
    country: await codeName("NTN", r.ntn_cd),
    countryCode: r.ntn_cd,
    regions: r.regions ?? [],
    active,
    merchant: r.mrhst_nm,
    applyBase: r.aply_base_cd,
    source: r.src_cd,
  };
}

export async function listCoupons(filter?: { country?: string }) {
  const sql = getSql();
  const params: unknown[] = [];
  let where = `c.use_at = 'Y'`;
  if (filter?.country) {
    const ntn = await resolveCode("NTN", filter.country);
    if (!ntn) return [];
    params.push(ntn);
    where += ` AND c.ntn_cd = $1`;
  }
  const rows = (await sql.query(
    `SELECT ${COLS} FROM cpn_info c WHERE ${where} ORDER BY c.cpn_sn`,
    params,
  )) as CpnRow[];
  return Promise.all(rows.map(toDto));
}

/**
 * 외부(taxfreecoupon.com) 파싱 결과를 CPN_INFO/CPN_REGN_INFO 에 적재.
 * 매 요청 파싱 대신 배치(또는 관리자 호출)로 실행한다. link_url 기준 upsert.
 */
export async function syncCouponsFromSource() {
  const { coupons, source } = await fetchTaxFreeCoupons();
  const sql = getSql();
  let upserted = 0;
  for (const c of coupons) {
    const ntn = (await resolveCode("NTN", c.country)) ?? "JP";
    const rows = (await sql.query(
      `INSERT INTO cpn_info (cpn_sj, mrhst_nm, bnef_cn, link_url, ntn_cd, aply_base_cd, src_cd, use_at)
       VALUES ($1, $2, $3, $4, $5, 'ARVL', $6, $7)
       ON CONFLICT (link_url) DO UPDATE
         SET cpn_sj = EXCLUDED.cpn_sj, mrhst_nm = EXCLUDED.mrhst_nm, bnef_cn = EXCLUDED.bnef_cn,
             ntn_cd = EXCLUDED.ntn_cd, src_cd = EXCLUDED.src_cd, use_at = EXCLUDED.use_at
       RETURNING cpn_sn`,
      [c.title.slice(0, 255), c.merchant.slice(0, 100), c.benefit.slice(0, 50), c.href.slice(0, 500),
       ntn, source.toUpperCase(), c.active ? "Y" : "N"],
    )) as { cpn_sn: string | number }[];
    const cpnSn = rows[0].cpn_sn;
    await sql.query(`DELETE FROM cpn_regn_info WHERE cpn_sn = $1`, [cpnSn]);
    const regions = c.regions.length ? c.regions : ["전국"];
    for (const regn of regions) {
      await sql.query(
        `INSERT INTO cpn_regn_info (cpn_sn, regn_nm) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
        [cpnSn, regn.slice(0, 50)],
      );
    }
    upserted += 1;
  }
  return { upserted, source };
}

/** 프로필 > 내가 받은 쿠폰 */
export async function listReceivedCoupons(userSn: number): Promise<ReceivedCouponDto[]> {
  const sql = getSql();
  const rows = (await sql.query(
    `SELECT ${COLS}, uc.issu_dttm, uc.use_dttm, uc.cpn_no
       FROM user_cpn_info uc JOIN cpn_info c ON c.cpn_sn = uc.cpn_sn
      WHERE uc.user_sn = $1 AND uc.use_at = 'Y'
      ORDER BY uc.issu_dttm DESC`,
    [userSn],
  )) as CpnRow[];
  return Promise.all(
    rows.map(async (r) => ({
      ...(await toDto(r)),
      receivedAt: new Date(r.issu_dttm!).toISOString(),
      usedAt: r.use_dttm ? new Date(r.use_dttm).toISOString() : null,
      couponNo: r.cpn_no ?? null,
    })),
  );
}

/** 쿠폰 받기 (사용자+쿠폰 복합 UK → 중복 발급 방지) */
export async function receiveCoupon(userSn: number, couponId: string) {
  if (!/^\d+$/.test(couponId)) throw new ApiError(404, "COUPON_NOT_FOUND");
  const sql = getSql();
  const exists = (await sql.query(
    `SELECT 1 FROM cpn_info WHERE cpn_sn = $1 AND use_at = 'Y'`,
    [couponId],
  )) as unknown[];
  if (!exists[0]) throw new ApiError(404, "COUPON_NOT_FOUND");
  await sql.query(
    `INSERT INTO user_cpn_info (user_sn, cpn_sn) VALUES ($1, $2)
     ON CONFLICT (user_sn, cpn_sn) DO UPDATE SET use_at = 'Y'`,
    [userSn, couponId],
  );
  return listReceivedCoupons(userSn);
}

export async function removeReceivedCoupon(userSn: number, couponId: string) {
  const sql = getSql();
  await sql.query(
    `UPDATE user_cpn_info SET use_at = 'N' WHERE user_sn = $1 AND cpn_sn = $2`,
    [userSn, couponId],
  );
}
