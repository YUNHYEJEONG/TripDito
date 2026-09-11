import "server-only";
import { z } from "zod";
import { getSql } from "./client";
import { codeName, resolveCode } from "./codes";
import { ApiError } from "@/lib/server/api";

/** API 응답용 여행 (앱 Trip 타입과 호환 + 코드 필드) */
export type TripDto = {
  id: string; // TRIP_SN 문자열
  name: string;
  country: string; // 한글명 (NTN 코드명)
  countryCode: string;
  city: string;
  timezone: string;
  startDate: string; // YYYY-MM-DD
  endDate: string;
  currency: string;
  budget: number;
  status: "PREP" | "PLANNED" | "ONGOING" | "DONE";
  /** 여권 도장을 찍은 페이지 (1~100). NULL 이면 아직 안 찍음 */
  passportPage: number | null;
  /** 쇼핑 품목 집계 — 목록 조회(listTrips)에서만 채워진다 */
  stats?: TripItemStats;
  createdAt: string;
  updatedAt: string;
};

export type TripItemStats = {
  itemCount: number;
  purchasedCount: number;
  /** 예상 금액 합계 (estm_amt × qy) */
  estimatedTotal: number;
};

export const tripInputSchema = z
  .object({
    name: z.string().trim().min(1).max(100),
    /** 국가 코드(JP) 또는 한글명(일본) */
    country: z.string().trim().min(1),
    city: z.string().trim().min(1).max(100),
    timezone: z.string().trim().min(1).max(50).optional(),
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    currency: z.string().trim().length(3),
    budget: z.number().min(0).default(0),
    status: z.enum(["PREP", "PLANNED", "ONGOING", "DONE"]).optional(),
  })
  .refine((d) => d.endDate >= d.startDate, {
    message: "종료일은 시작일 이후여야 합니다",
    path: ["endDate"],
  });

export type TripInput = z.infer<typeof tripInputSchema>;

type TripRow = {
  trip_sn: string | number;
  trip_nm: string;
  ntn_cd: string;
  cty_nm: string;
  tz_id: string;
  begin_de: string;
  end_de: string;
  crncy_cd: string;
  bdgt_amt: string | number;
  trip_sttus_cd: TripDto["status"];
  psprt_page_no: number | null;
  rgst_dttm: string;
  altr_dttm: string;
  item_cnt?: string | number | null;
  prchs_cnt?: string | number | null;
  estm_total?: string | number | null;
};

const COLS = `trip_sn, trip_nm, ntn_cd, cty_nm, tz_id,
  to_char(begin_de, 'YYYY-MM-DD') AS begin_de, to_char(end_de, 'YYYY-MM-DD') AS end_de,
  crncy_cd, bdgt_amt, trip_sttus_cd, psprt_page_no, rgst_dttm, altr_dttm`;

const DEFAULT_TZ: Record<string, string> = {
  JP: "Asia/Tokyo",
  CN: "Asia/Shanghai",
  TW: "Asia/Taipei",
  TH: "Asia/Bangkok",
  KR: "Asia/Seoul",
  VN: "Asia/Ho_Chi_Minh",
  SG: "Asia/Singapore",
  US: "America/New_York",
  AU: "Australia/Sydney",
  FR: "Europe/Paris",
  GB: "Europe/London",
  IT: "Europe/Rome",
  ES: "Europe/Madrid",
};

async function toDto(r: TripRow): Promise<TripDto> {
  const stats: TripItemStats | undefined =
    r.item_cnt === undefined
      ? undefined
      : {
          itemCount: Number(r.item_cnt ?? 0),
          purchasedCount: Number(r.prchs_cnt ?? 0),
          estimatedTotal: Number(r.estm_total ?? 0),
        };
  return {
    id: String(r.trip_sn),
    name: r.trip_nm,
    country: await codeName("NTN", r.ntn_cd),
    countryCode: r.ntn_cd,
    city: r.cty_nm,
    timezone: r.tz_id,
    startDate: r.begin_de,
    endDate: r.end_de,
    currency: r.crncy_cd,
    budget: Number(r.bdgt_amt),
    status: r.trip_sttus_cd,
    passportPage: r.psprt_page_no ?? null,
    ...(stats ? { stats } : {}),
    createdAt: new Date(r.rgst_dttm).toISOString(),
    updatedAt: new Date(r.altr_dttm).toISOString(),
  };
}

/** 오늘 날짜(현지 기준)로 여행 상태 계산 */
export function computeTripStatus(
  startDate: string,
  endDate: string,
  timezone: string,
): TripDto["status"] {
  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
  if (today < startDate) return "PLANNED";
  if (today > endDate) return "DONE";
  return "ONGOING";
}

async function normalize(input: TripInput) {
  const ntn = await resolveCode("NTN", input.country);
  if (!ntn) throw new ApiError(400, "INVALID_COUNTRY");
  const crncy = await resolveCode("CRNCY", input.currency);
  if (!crncy) throw new ApiError(400, "INVALID_CURRENCY");
  const tz = input.timezone ?? DEFAULT_TZ[ntn] ?? "Asia/Seoul";
  const status =
    input.status ?? computeTripStatus(input.startDate, input.endDate, tz);
  return { ntn, crncy, tz, status };
}

/**
 * 내 여행 목록 + 여행별 쇼핑 품목 집계를 한 번의 쿼리로.
 * (목록 화면이 여행마다 품목 API 를 따로 부르던 N+1 을 없앤다)
 */
export async function listTrips(userSn: number): Promise<TripDto[]> {
  const sql = getSql();
  const rows = (await sql.query(
    `SELECT t.trip_sn, t.trip_nm, t.ntn_cd, t.cty_nm, t.tz_id,
            to_char(t.begin_de, 'YYYY-MM-DD') AS begin_de,
            to_char(t.end_de, 'YYYY-MM-DD') AS end_de,
            t.crncy_cd, t.bdgt_amt, t.trip_sttus_cd, t.psprt_page_no, t.rgst_dttm, t.altr_dttm,
            COALESCE(s.item_cnt, 0) AS item_cnt,
            COALESCE(s.prchs_cnt, 0) AS prchs_cnt,
            COALESCE(s.estm_total, 0) AS estm_total
       FROM trip_info t
       LEFT JOIN (
         SELECT trip_sn,
                COUNT(*) AS item_cnt,
                COUNT(prchs_dttm) AS prchs_cnt,
                COALESCE(SUM(estm_amt * qy), 0) AS estm_total
           FROM shop_item_info
          WHERE use_at = 'Y'
          GROUP BY trip_sn
       ) s ON s.trip_sn = t.trip_sn
      WHERE t.user_sn = $1 AND t.use_at = 'Y'
      ORDER BY t.begin_de DESC, t.trip_sn DESC`,
    [userSn],
  )) as TripRow[];
  return Promise.all(rows.map(toDto));
}

export async function getTrip(
  userSn: number,
  tripId: string,
): Promise<TripDto | null> {
  const sql = getSql();
  const rows = (await sql.query(
    `SELECT ${COLS} FROM trip_info
      WHERE user_sn = $1 AND trip_sn = $2 AND use_at = 'Y'`,
    [userSn, tripId],
  )) as TripRow[];
  return rows[0] ? toDto(rows[0]) : null;
}

/** 소유자 검증 없이 조회 (때샷 카드의 목적지·기간 표시용) */
export async function getTripAny(tripId: string): Promise<TripDto | null> {
  const sql = getSql();
  const rows = (await sql.query(
    `SELECT ${COLS} FROM trip_info WHERE trip_sn = $1`,
    [tripId],
  )) as TripRow[];
  return rows[0] ? toDto(rows[0]) : null;
}

/** 소유자 검증 포함. 없으면 404 */
export async function requireTrip(userSn: number, tripId: string) {
  if (!/^\d+$/.test(tripId)) throw new ApiError(404, "TRIP_NOT_FOUND");
  const trip = await getTrip(userSn, tripId);
  if (!trip) throw new ApiError(404, "TRIP_NOT_FOUND");
  return trip;
}

export async function createTrip(
  userSn: number,
  input: TripInput,
): Promise<TripDto> {
  const { ntn, crncy, tz, status } = await normalize(input);
  const sql = getSql();
  const rows = (await sql.query(
    `INSERT INTO trip_info
       (user_sn, trip_nm, ntn_cd, cty_nm, tz_id, begin_de, end_de, crncy_cd, bdgt_amt, trip_sttus_cd)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
     RETURNING ${COLS}`,
    [
      userSn,
      input.name,
      ntn,
      input.city,
      tz,
      input.startDate,
      input.endDate,
      crncy,
      input.budget,
      status,
    ],
  )) as TripRow[];
  return toDto(rows[0]);
}

export async function updateTrip(
  userSn: number,
  tripId: string,
  input: TripInput,
): Promise<TripDto> {
  await requireTrip(userSn, tripId);
  const { ntn, crncy, tz, status } = await normalize(input);
  const sql = getSql();
  const rows = (await sql.query(
    `UPDATE trip_info
        SET trip_nm = $3, ntn_cd = $4, cty_nm = $5, tz_id = $6, begin_de = $7,
            end_de = $8, crncy_cd = $9, bdgt_amt = $10, trip_sttus_cd = $11
      WHERE user_sn = $1 AND trip_sn = $2
      RETURNING ${COLS}`,
    [
      userSn,
      tripId,
      input.name,
      ntn,
      input.city,
      tz,
      input.startDate,
      input.endDate,
      crncy,
      input.budget,
      status,
    ],
  )) as TripRow[];
  return toDto(rows[0]);
}

/** 여행 마치기: 날짜와 무관하게 완료 상태로 바꾼다 (여권 도장 대상이 된다) */
export async function completeTrip(
  userSn: number,
  tripId: string,
): Promise<TripDto> {
  await requireTrip(userSn, tripId);
  const sql = getSql();
  const rows = (await sql.query(
    `UPDATE trip_info SET trip_sttus_cd = 'DONE'
      WHERE user_sn = $1 AND trip_sn = $2
      RETURNING ${COLS}`,
    [userSn, tripId],
  )) as TripRow[];
  return toDto(rows[0]);
}

function todayIn(timezone: string) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

/** 여권 도장 페이지 저장 (한 번 찍은 도장은 옮기지 않는다 → 이미 있으면 유지) */
export async function setTripPassportPage(
  userSn: number,
  tripId: string,
  pageNumber: number,
): Promise<TripDto> {
  const trip = await requireTrip(userSn, tripId);
  if (trip.status !== "DONE" && trip.endDate >= todayIn(trip.timezone)) {
    throw new ApiError(400, "TRIP_NOT_COMPLETED");
  }
  const sql = getSql();
  const rows = (await sql.query(
    `UPDATE trip_info SET psprt_page_no = COALESCE(psprt_page_no, $3)
      WHERE user_sn = $1 AND trip_sn = $2
      RETURNING ${COLS}`,
    [userSn, tripId, pageNumber],
  )) as TripRow[];
  return toDto(rows[0]);
}

/** 소프트 삭제 (쇼핑품목도 함께 숨김) */
export async function deleteTrip(userSn: number, tripId: string) {
  await requireTrip(userSn, tripId);
  const sql = getSql();
  await sql.query(`UPDATE shop_item_info SET use_at = 'N' WHERE trip_sn = $1`, [
    tripId,
  ]);
  await sql.query(
    `UPDATE trip_info SET use_at = 'N' WHERE user_sn = $1 AND trip_sn = $2`,
    [userSn, tripId],
  );
}
