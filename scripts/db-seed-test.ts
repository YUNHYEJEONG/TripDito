/**
 * 테스트 데이터 시드: `npm run db:seed:test`
 * DEV_LOGIN_EMAIL 계정(없으면 생성)에 완료·진행중·예정 여행 3개와 쇼핑품목을 넣고,
 * R2 가 설정돼 있으면 public/demo/shots 이미지를 올려 떼샷 피드와 품목 썸네일까지 채운다.
 * 같은 이름의 여행·같은 본문의 떼샷이 이미 있으면 건너뛴다 (재실행 안전).
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { neon, type NeonQueryFunction } from "@neondatabase/serverless";
import { ulid } from "ulid";
import { isR2Configured, putObject } from "./lib/r2";

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
  /** public/demo/shots 의 파일명. 있으면 품목 썸네일로 올린다 */
  image?: string;
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

type ShotSeed = {
  trip: string; // TripSeed.name
  channel: "SHOTS" | "COMMUNITY";
  images: string[]; // public/demo/shots 파일명 (1~10장)
  body: string;
  /** 연결할 품목명 (해당 여행의 품목) */
  items?: string[];
  /** 첫 사진 위의 핀. itemName 이 있으면 품목과 연결 */
  pins?: { x: number; y: number; text: string; itemName?: string }[];
  likes?: number;
};

const TRIPS: TripSeed[] = [
  {
    name: "오사카 먹방 쇼핑",
    ntn: "JP", city: "오사카", tz: "Asia/Tokyo",
    begin: iso(-20), end: iso(-16), crncy: "JPY", budget: 150000, status: "DONE",
    items: [
      { name: "로이스 생초콜릿", price: 800, qty: 3, tags: ["FRIEND"], planOffset: 0, purchased: true, image: "haul-1.png" },
      { name: "시세이도 선크림", price: 2400, qty: 2, tags: ["FAMILY"], planOffset: 1, purchased: true, image: "haul-3.png" },
      { name: "곤약젤리", price: 300, qty: 10, planOffset: 1, purchased: true },
      { name: "유니클로 히트텍", price: 1990, qty: 2, memo: "M 사이즈", planOffset: 2, purchased: true },
      { name: "돈키호테 기념품", price: 1500, qty: 1, tags: ["COWORK"], planOffset: 3, purchased: false, image: "haul-4.png" },
    ],
  },
  {
    name: "도쿄 출장 겸 쇼핑",
    ntn: "JP", city: "도쿄", tz: "Asia/Tokyo",
    begin: iso(-1), end: iso(3), crncy: "JPY", budget: 200000, status: "ONGOING",
    items: [
      { name: "무인양품 노트", price: 250, qty: 5, tags: ["COWORK"], planOffset: 0, purchased: true },
      { name: "도쿄바나나", price: 1200, qty: 2, tags: ["FAMILY", "ACQNT"], planOffset: 1, image: "haul-5.png" },
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
  // ── 여권 도장 확인용: 도안이 있는 나라마다 완료한 여행 하나씩 (오래된 순으로 뒤로 갈수록 과거)
  ...([
    ["타이베이 야시장 투어", "TW", "타이베이", "Asia/Taipei", "TWD", 9000, 40, [["펑리수", 350, 4, ["FAMILY"]], ["우롱차", 600, 2]]],
    ["상하이 출장", "CN", "상하이", "Asia/Shanghai", "CNY", 3000, 60, [["백주 미니어처", 120, 2, ["COWORK"]], ["실크 스카프", 260, 1]]],
    ["부산 주말 여행", "KR", "부산", "Asia/Seoul", "KRW", 300000, 75, [["씨앗호떡 믹스", 8000, 3], ["어묵 세트", 15000, 2, ["FAMILY"]]]],
    ["치앙마이 한 달 살기", "TH", "치앙마이", "Asia/Bangkok", "THB", 30000, 95, [["코끼리 바지", 200, 3, ["FRIEND"]], ["허브 밤", 90, 5]]],
    ["다낭 휴양", "VN", "다낭", "Asia/Ho_Chi_Minh", "VND", 6000000, 120, [["G7 커피", 90000, 4, ["COWORK"]], ["라탄 가방", 250000, 1]]],
    ["싱가포르 미식 투어", "SG", "싱가포르", "Asia/Singapore", "SGD", 900, 150, [["카야잼", 8, 3, ["FAMILY"]], ["바쿠테 티백", 12, 2]]],
    ["뉴욕 출장", "US", "뉴욕", "America/New_York", "USD", 1500, 190, [["MoMA 굿즈", 45, 2, ["FRIEND"]], ["센트럴파크 후드", 60, 1]]],
    ["시드니 여름휴가", "AU", "시드니", "Australia/Sydney", "AUD", 1800, 240, [["팀탐", 5, 6, ["COWORK"]], ["유칼립투스 오일", 18, 2]]],
    ["파리 신혼여행", "FR", "파리", "Europe/Paris", "EUR", 2500, 300, [["마카롱 세트", 32, 2, ["FAMILY"]], ["향수", 120, 1, ["SELF"]]]],
    ["런던 뮤지컬 여행", "GB", "런던", "Europe/London", "GBP", 1400, 360, [["얼그레이 틴", 14, 3, ["ACQNT"]], ["해리포터 굿즈", 40, 1]]],
    ["로마 미술관 투어", "IT", "로마", "Europe/Rome", "EUR", 1700, 420, [["올리브 오일", 22, 2, ["FAMILY"]], ["가죽 지갑", 85, 1]]],
    ["바르셀로나 건축 기행", "ES", "바르셀로나", "Europe/Madrid", "EUR", 1600, 480, [["하몽", 30, 2, ["FRIEND"]], ["가우디 타일 마그넷", 9, 4]]],
  ] as const).map(([name, ntn, city, tz, crncy, budget, agoDays, items]): TripSeed => ({
    name, ntn, city, tz, crncy, budget, status: "DONE",
    begin: iso(-agoDays - 4), end: iso(-agoDays),
    items: items.map(([itemName, price, qty, tags]) => ({
      name: itemName, price, qty, tags: tags ? [...tags] : undefined, planOffset: 1, purchased: true,
    })),
  })),
];

const SHOTS: ShotSeed[] = [
  {
    trip: "오사카 먹방 쇼핑",
    channel: "SHOTS",
    images: ["haul-1.png", "haul-2.png"],
    body: "오사카 돈키호테 털기 🛒 로이스 초콜릿은 선물용으로 3박스, 선크림은 면세가로 득템!",
    items: ["로이스 생초콜릿", "시세이도 선크림"],
    pins: [
      { x: 32, y: 48, text: "로이스 생초콜릿 오레", itemName: "로이스 생초콜릿" },
      { x: 70, y: 36, text: "시세이도 아넷사", itemName: "시세이도 선크림" },
    ],
    likes: 12,
  },
  {
    trip: "오사카 먹방 쇼핑",
    channel: "COMMUNITY",
    images: ["haul-4.png"],
    body: "돈키호테 기념품 코너 추천템. 캐릭터 파우치가 1,500엔이면 괜찮은 편이에요.",
    items: ["돈키호테 기념품"],
    pins: [{ x: 50, y: 55, text: "캐릭터 파우치", itemName: "돈키호테 기념품" }],
    likes: 5,
  },
  {
    trip: "도쿄 출장 겸 쇼핑",
    channel: "SHOTS",
    images: ["haul-5.png", "haul-3.png"],
    body: "도쿄역 지하에서 도쿄바나나 2박스. 출장 동료들 선물 완료 🍌",
    items: ["도쿄바나나"],
    pins: [{ x: 40, y: 60, text: "도쿄바나나 8개입", itemName: "도쿄바나나" }],
    likes: 3,
  },
];

const DEMO_DIR = resolve(process.cwd(), "public", "demo", "shots");
const CONTENT_TYPE: Record<string, string> = { png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg", webp: "image/webp" };

type Sql = NeonQueryFunction<false, false>;

/** 데모 이미지들을 R2 에 올리고 첨부 묶음(ATCM_FILE_INFO + DETL)을 만든다 */
async function uploadAttachment(
  sql: Sql,
  ownerSn: string,
  scope: "shots" | "items",
  files: string[],
) {
  const id = ulid();
  await sql.query(
    `INSERT INTO atcm_file_info (atcm_file_id, file_cnt, rgstr_sn) VALUES ($1, $2, $3)`,
    [id, files.length, ownerSn],
  );
  for (const [i, name] of files.entries()) {
    const seq = i + 1;
    const ext = name.split(".").pop()!.toLowerCase();
    const key = `${scope}/${id}/${seq}.${ext}`;
    const body = readFileSync(resolve(DEMO_DIR, name));
    await putObject(key, body, CONTENT_TYPE[ext] ?? "application/octet-stream");
    await sql.query(
      `INSERT INTO atcm_file_detl_info
         (atcm_file_id, atcm_file_seq, file_nm, file_ortx_nm, file_xtns_nm, file_mg, file_path)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [id, seq, `${seq}.${ext}`, name, ext, body.length, key],
    );
  }
  return id;
}

async function main() {
  const url = process.env.DATABASE_URL;
  const email = process.env.DEV_LOGIN_EMAIL?.toLowerCase();
  if (!url) throw new Error("DATABASE_URL 이 없습니다");
  if (!email) throw new Error("DEV_LOGIN_EMAIL 이 없습니다");
  const sql = neon(url);
  const withImages = isR2Configured();
  if (!withImages) console.log("R2 미설정 → 이미지·떼샷 시드는 건너뜁니다");

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

  /** 여행명 → trip_sn, 품목명 → shop_item_sn (기존 것 포함) */
  const tripSn = new Map<string, string>();
  const itemSn = new Map<string, string>(); // `${trip}|${item}`

  for (const t of TRIPS) {
    const exists = (await sql.query(
      `SELECT trip_sn FROM trip_info WHERE user_sn = $1 AND trip_nm = $2 AND use_at = 'Y'`,
      [user.user_sn, t.name],
    )) as { trip_sn: string }[];
    let sn: string;
    if (exists[0]) {
      sn = exists[0].trip_sn;
      console.log(`skip  ${t.name} (이미 있음, trip_sn=${sn})`);
    } else {
      const [trip] = (await sql.query(
        `INSERT INTO trip_info
           (user_sn, trip_nm, ntn_cd, cty_nm, tz_id, begin_de, end_de, crncy_cd, bdgt_amt, trip_sttus_cd)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING trip_sn`,
        [user.user_sn, t.name, t.ntn, t.city, t.tz, t.begin, t.end, t.crncy, t.budget, t.status],
      )) as { trip_sn: string }[];
      sn = trip.trip_sn;

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
          [sn, it.name, it.price, it.qty, it.memo ?? null, planDe, Boolean(it.purchased)],
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
    tripSn.set(t.name, sn);

    // 품목 sn 수집 + 썸네일 없는 품목에 데모 이미지 부착
    const rows = (await sql.query(
      `SELECT shop_item_sn, item_nm, atcm_file_id FROM shop_item_info WHERE trip_sn = $1 AND use_at = 'Y'`,
      [sn],
    )) as { shop_item_sn: string; item_nm: string; atcm_file_id: string | null }[];
    for (const r of rows) itemSn.set(`${t.name}|${r.item_nm}`, r.shop_item_sn);

    if (withImages) {
      for (const it of t.items) {
        const row = rows.find((r) => r.item_nm === it.name);
        if (!it.image || !row || row.atcm_file_id) continue;
        const attId = await uploadAttachment(sql, user.user_sn, "items", [it.image]);
        await sql.query(`UPDATE shop_item_info SET atcm_file_id = $2 WHERE shop_item_sn = $1`, [
          row.shop_item_sn,
          attId,
        ]);
        console.log(`image ${t.name} / ${it.name} ← ${it.image}`);
      }
    }
  }

  if (!withImages) return;

  for (const s of SHOTS) {
    const trip = tripSn.get(s.trip);
    if (!trip) continue;
    const dup = (await sql.query(
      `SELECT shot_sn FROM shot_info WHERE user_sn = $1 AND body_cn = $2 AND use_at = 'Y'`,
      [user.user_sn, s.body],
    )) as { shot_sn: string }[];
    if (dup[0]) {
      console.log(`skip  shot "${s.body.slice(0, 20)}…" (이미 있음, shot_sn=${dup[0].shot_sn})`);
      continue;
    }
    const attId = await uploadAttachment(sql, user.user_sn, "shots", s.images);
    const [shot] = (await sql.query(
      `INSERT INTO shot_info (user_sn, trip_sn, chnl_cd, atcm_file_id, body_cn, like_cnt, shot_sttus_cd)
       VALUES ($1, $2, $3, $4, $5, $6, 'PUBLIC') RETURNING shot_sn`,
      [user.user_sn, trip, s.channel, attId, s.body, s.likes ?? 0],
    )) as { shot_sn: string }[];
    for (const name of s.items ?? []) {
      const item = itemSn.get(`${s.trip}|${name}`);
      if (!item) continue;
      await sql.query(
        `INSERT INTO shot_item_mpng (shot_sn, shop_item_sn) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
        [shot.shot_sn, item],
      );
    }
    for (const p of s.pins ?? []) {
      const item = p.itemName ? (itemSn.get(`${s.trip}|${p.itemName}`) ?? null) : null;
      await sql.query(
        `INSERT INTO shot_pin_info (shot_sn, atcm_file_seq, x_pstn_rt, y_pstn_rt, pin_cn, item_sn)
         VALUES ($1, 1, $2, $3, $4, $5)`,
        [shot.shot_sn, p.x, p.y, p.text, item],
      );
    }
    console.log(`shot  [${s.channel}] ${s.trip}: ${s.images.join(", ")} (shot_sn=${shot.shot_sn})`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
