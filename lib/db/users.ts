import "server-only";
import { getSql } from "./client";

export type ProviderCode = "GOOGLE" | "KAKAO" | "NAVER" | "DEV";

export type DbUser = {
  userSn: number;
  userUuid: string;
  email: string | null;
  nickname: string | null;
  profileFileId: string | null;
  status: string;
};

type UserRow = {
  user_sn: string | number;
  user_uuid: string;
  email: string | null;
  ncknm: string | null;
  prfl_atcm_file_id: string | null;
  user_sttus_cd: string;
};

function toUser(r: UserRow): DbUser {
  return {
    userSn: Number(r.user_sn),
    userUuid: r.user_uuid,
    email: r.email,
    nickname: r.ncknm,
    profileFileId: r.prfl_atcm_file_id,
    status: r.user_sttus_cd,
  };
}

const USER_COLS =
  "user_sn, user_uuid, email, ncknm, prfl_atcm_file_id, user_sttus_cd";

export async function findUserByUuid(uuid: string): Promise<DbUser | null> {
  const sql = getSql();
  const rows = (await sql.query(
    `SELECT ${USER_COLS} FROM user_info WHERE user_uuid = $1 AND use_at = 'Y'`,
    [uuid],
  )) as UserRow[];
  return rows[0] ? toUser(rows[0]) : null;
}

/**
 * 소셜 콜백 처리 (정의서 p.17)
 * 1) 제공자코드+계정ID 로 이미 연결된 계정 → 그대로 로그인
 * 2) 같은 이메일(검증됨)의 회원 → OAUTH_ACNT_INFO 행만 추가 (EMAIL_MATCH)
 * 3) 없으면 USER_INFO 신규 + OAUTH_ACNT_INFO (SIGNUP)
 */
export async function upsertSocialUser(input: {
  provider: ProviderCode;
  providerAccountId: string;
  email?: string | null;
  emailVerified?: boolean;
  accessToken?: string | null;
  refreshToken?: string | null;
  expiresAt?: number | null; // unix seconds
}): Promise<DbUser> {
  const sql = getSql();
  const tokenExpr = input.expiresAt
    ? new Date(input.expiresAt * 1000).toISOString()
    : null;

  // 1) 이미 연결된 계정
  const linked = (await sql.query(
    `SELECT u.${USER_COLS.replaceAll(", ", ", u.")}
       FROM oauth_acnt_info o
       JOIN user_info u ON u.user_sn = o.user_sn
      WHERE o.prvdr_cd = $1 AND o.prvdr_acnt_id = $2 AND o.use_at = 'Y'`,
    [input.provider, input.providerAccountId],
  )) as UserRow[];

  if (linked[0]) {
    await sql.query(
      `UPDATE oauth_acnt_info
          SET acs_token = $3, rfrsh_token = COALESCE($4, rfrsh_token), token_expr_dttm = $5
        WHERE prvdr_cd = $1 AND prvdr_acnt_id = $2`,
      [input.provider, input.providerAccountId, input.accessToken ?? null, input.refreshToken ?? null, tokenExpr],
    );
    await sql.query(
      `UPDATE user_info SET last_lgn_dttm = now() WHERE user_sn = $1`,
      [linked[0].user_sn],
    );
    return toUser(linked[0]);
  }

  // 2) 같은 이메일의 기존 회원 (email_verified 일 때만)
  let user: UserRow | undefined;
  let linkType: "SIGNUP" | "EMAIL_MATCH" = "SIGNUP";
  const email = input.email?.trim().toLowerCase() || null;

  if (email && input.emailVerified) {
    const byEmail = (await sql.query(
      `SELECT ${USER_COLS} FROM user_info WHERE email = $1 AND use_at = 'Y'`,
      [email],
    )) as UserRow[];
    if (byEmail[0]) {
      user = byEmail[0];
      linkType = "EMAIL_MATCH";
    }
  }

  // 3) 신규 회원
  if (!user) {
    const created = (await sql.query(
      `INSERT INTO user_info (email, user_sttus_cd, last_lgn_dttm)
       VALUES ($1, 'ACTIVE', now())
       RETURNING ${USER_COLS}`,
      [email && input.emailVerified ? email : null],
    )) as UserRow[];
    user = created[0];
  }

  await sql.query(
    `INSERT INTO oauth_acnt_info
       (user_sn, prvdr_cd, prvdr_acnt_id, link_ty_cd, acs_token, rfrsh_token, token_expr_dttm)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     ON CONFLICT (prvdr_cd, prvdr_acnt_id) DO NOTHING`,
    [user.user_sn, input.provider, input.providerAccountId, linkType, input.accessToken ?? null, input.refreshToken ?? null, tokenExpr],
  );
  await sql.query(
    `UPDATE user_info SET last_lgn_dttm = now() WHERE user_sn = $1`,
    [user.user_sn],
  );

  return toUser(user);
}

export async function updateProfile(
  userSn: number,
  input: { nickname?: string | null; profileFileId?: string | null },
): Promise<DbUser> {
  const sql = getSql();
  const rows = (await sql.query(
    `UPDATE user_info
        SET ncknm = COALESCE($2, ncknm),
            prfl_atcm_file_id = CASE WHEN $4 THEN $3 ELSE prfl_atcm_file_id END
      WHERE user_sn = $1
      RETURNING ${USER_COLS}`,
    [userSn, input.nickname ?? null, input.profileFileId ?? null, input.profileFileId !== undefined],
  )) as UserRow[];
  return toUser(rows[0]);
}

export async function withdrawUser(userSn: number) {
  const sql = getSql();
  await sql.query(
    `UPDATE user_info
        SET user_sttus_cd = 'WTHDRW', wthdrw_dttm = now(), use_at = 'N'
      WHERE user_sn = $1`,
    [userSn],
  );
}
