/**
 * 테스트 데이터 시드: `npm run db:seed:test`
 * DEV_LOGIN_EMAIL 계정(없으면 생성)에 완료·진행중·예정 여행 3개와 쇼핑품목을 넣는다.
 * 같은 이름의 여행이 이미 있으면 건너뛴다 (재실행 안전).
 */
import { neon } from "@neondatabase/serverless";

const DAY = 24 * 60 * 60 * 1000;
function iso(offsetDays: number) {
  return new Date(Date.now() + offsetDays * DAY).toISOString().slice(0, 10);
}

type Item = {
  name: string;
  price: number;
  qty: number;
  memo?: string;
  tags?: string[];
  planOffset?: number; // 여행 시작일 기준 +n일
  purchased?: boolean;
};

type TripSeed = {
  name: string;
  ntn: string;
  city: string;
  tz: string;
  begin: string;
  end: string;
  crncy: string;
  budget: number;
  status: "PREP" | "PLANNED" | "ONGOING" | "DONE";
  items: Item[];
};

const TRIPS: TripSeed[] = [
  {
    name: "오사카 먹방 쇼핑",
    ntn: "JP", city: "오사카", tz: "Asia/Tokyo",
    begin: iso(-20), end: iso(-16), crncy: "JPY", budget: 150000, status: "DONE",
    items: [
      { name: "로이스 생초콜릿", price: 800, qty: 3, tags: ["FRIEND"], planOffset: 0, purchased: true },
      { name: "시세이도 선크림", price: 2400, qty: 2, tags: ["FAMILY"], planOffset: 1, purchased: true },
      { name: "곤약젤리", price: 300, qty: 10, planOffset: 1, purchased: true },
      { name: "유니클로 히트텍", price: 1990, qty: 2, memo: "M 사이즈", planOffset: 2, purchased: true },
      { name: "돈키호테 기념품", price: 1500, qty: 1, tags: ["COWORK"], planOffset: 3, purchased: false },
    ],
  },
  {
    name: "도쿄 출장 겸 쇼핑",
    ntn: "JP", city: "도쿄", tz: "Asia/Tokyo",
    begin: iso(-1), end: iso(3), crncy: "JPY", budget: 200000, status: "ONGOING",
    items: [
      { name: "무인양품 노트", price: 250, qty: 5, tags: ["COWORK"], planOffset: 0, purchased: true },
      { name: "도쿄바나나", price: 1200, qty: 2, tags: ["FAMILY", "ACQNT"], planOffset: 1 },
      { name: "빔즈 셔츠", price: 8900, qty: 1, memo: "신주쿠점", planOffset: 1 },
      { name: "키캡 세트", price: 4500, qty: 1, planOffset: 2 },
      { name: "캔 커피 박스", price: 1100, qty: 1, planOffset: 3 },
    ],
  },
  {
    name: "방콕 휴가",
    ntn: "TH", city: "방콕", tz: "Asia/Bangkok",
    begin: iso(14), end: iso(18), crncy: "THB", budget: 12000, status: "PLANNED",
    items: [
      { name: "짐톰슨 실크 스카프", price: 1500, qty: 1, tags: ["FAMILY"], planOffset: 0 },
      { name: "말린 망고", price: 120, qty: 6, tags: ["FRIEND", "COWORK"], planOffset: 1 },
      { name: "타이거밤", price: 60, qty: 4, planOffset: 1 },
      { name: "코코넛 오일", price: 250, qty: 2, planOffset: 2 },
    ],
  },
];

async function main() {
  const url = process.env.DATABASE_URL;
  const email = process.env.DEV_LOGIN_EMAIL?.toLowerCase();
  if (!url) throw new Error("DATABASE_URL 이 없습니다");
  if (!email) throw new Error("DEV_LOGIN_EMAIL 이 없습니다");
  const sql = neon(url);

  const [user] = (await sql.query(
    `INSERT INTO user_info (email, user_sttus_cd)
     VALUES ($1, 'ACTIVE')
     ON CONFLICT (email) DO UPDATE SET email = EXCLUDED.email
     RETURNING user_sn, user_uuid`,
    [email],
  )) as { user_sn: string; user_uuid: string }[];
  // 닉네임은 비어 있을 때만, 다른 회원과 겹치지 않는 값으로
  await sql.query(
    `UPDATE user_info SET ncknm = $2
      WHERE user_sn = $1 AND ncknm IS NULL
        AND NOT EXISTS (SELECT 1 FROM user_info WHERE ncknm = $2)`,
    [user.user_sn, "테스터_" + email.split("@")[0]],
  );
  await sql.query(
    `INSERT INTO oauth_acnt_info (user_sn, prvdr_cd, prvdr_acnt_id, link_ty_cd)
     VALUES ($1, 'DEV', $2, 'SIGNUP') ON CONFLICT (prvdr_cd, prvdr_acnt_id) DO NOTHING`,
    [user.user_sn, email],
  );
  console.log(`user ${email} (uuid ${user.user_uuid})`);

  for (const t of TRIPS) {
    const exists = (await sql.query(
      `SELECT trip_sn FROM trip_info WHERE user_sn = $1 AND trip_nm = $2 AND use_at = 'Y'`,
      [user.user_sn, t.name],
    )) as { trip_sn: string }[];
    if (exists[0]) {
      console.log(`skip  ${t.name} (이미 있음, trip_sn=${exists[0].trip_sn})`);
      continue;
    }
    const [trip] = (await sql.query(
      `INSERT INTO trip_info
         (user_sn, trip_nm, ntn_cd, cty_nm, tz_id, begin_de, end_de, crncy_cd, bdgt_amt, trip_sttus_cd)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING trip_sn`,
      [user.user_sn, t.name, t.ntn, t.city, t.tz, t.begin, t.end, t.crncy, t.budget, t.status],
    )) as { trip_sn: string }[];

    for (const it of t.items) {
      const planDe =
        it.planOffset == null
          ? null
          : new Date(new Date(`${t.begin}T00:00:00Z`).getTime() + it.planOffset * DAY)
              .toISOString()
              .slice(0, 10);
      const [row] = (await sql.query(
        `INSERT INTO shop_item_info
           (trip_sn, item_nm, estm_amt, qy, memo_cn, prchs_plan_de, prchs_dttm)
         VALUES ($1,$2,$3,$4,$5,$6, CASE WHEN $7 THEN now() END) RETURNING shop_item_sn`,
        [trip.trip_sn, it.name, it.price, it.qty, it.memo ?? null, planDe, Boolean(it.purchased)],
      )) as { shop_item_sn: string }[];
      for (const tag of it.tags ?? []) {
        await sql.query(
          `INSERT INTO shop_item_tag_mpng (shop_item_sn, gift_tag_cd) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
          [row.shop_item_sn, tag],
        );
      }
    }
    console.log(`added ${t.name} [${t.status}] ${t.begin}~${t.end}, items ${t.items.length}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
