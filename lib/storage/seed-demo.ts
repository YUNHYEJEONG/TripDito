import { createId } from "@/lib/storage/id";
import { getJson, setJson } from "@/lib/storage/local-storage";
import { storageKeys } from "@/lib/storage/keys";
import { appConfig } from "@/config/app";
import type { Trip } from "@/features/trips/types";
import type { ShoppingItem } from "@/features/shopping-items/types";
import type { Shot } from "@/features/shots/types";
import type { LocalProfile } from "@/features/profile/types";
import { DEFAULT_PROFILE_ID, DEFAULT_AVATAR_SRC } from "@/features/profile/constants";

/** 데모 때샷 실사 이미지 (`public/demo/shots`) */
export const DEMO_SHOT_IMAGES = [
  "/demo/shots/haul-1.png",
  "/demo/shots/haul-2.png",
  "/demo/shots/haul-3.png",
  "/demo/shots/haul-4.png",
  "/demo/shots/haul-5.png",
  "/demo/shots/haul-6.png",
  "/demo/shots/haul-7.png",
] as const;

/** 데모 이미지 에셋 버전 — 올리면 기존 SVG 플레이스홀더를 실사로 교체 */
export const SHOT_DEMO_IMAGE_VERSION = 3;

/** 때샷 데모 콘텐츠 버전 — 올리면 빈 피드/구버전 데모만 재시드 */
export const SHOT_DEMO_CONTENT_VERSION = 5;

/** 쇼핑리스트 목업 상품 썸네일 (`public/demo/shopping-items`) */
export const DEMO_ITEM_IMAGES = {
  tokyoBanana: "/demo/shopping-items/tokyo-banana.jpg",
  kitkat: "/demo/shopping-items/kitkat.jpg",
  ichiran: "/demo/shopping-items/ichiran.jpg",
  pieNoMi: "/demo/shopping-items/pie-no-mi.jpg",
  takenoko: "/demo/shopping-items/takenoko.jpg",
  patches: "/demo/shopping-items/patches.jpg",
  lululun: "/demo/shopping-items/lululun.jpg",
  honeyOil: "/demo/shopping-items/honey-oil.jpg",
  mascara: "/demo/shopping-items/mascara.jpg",
  plush: "/demo/shopping-items/plush.jpg",
  umaibo: "/demo/shopping-items/umaibo.jpg",
  kyusoku: "/demo/shopping-items/kyusoku.jpg",
  melano: "/demo/shopping-items/melano.jpg",
  fino: "/demo/shopping-items/fino.jpg",
} as const;

function isPlaceholderImage(src: string) {
  return src.startsWith("data:image/svg");
}

/**
 * localStorage에 남아 있는 SVG 플레이스홀더 때샷 이미지를
 * public/demo/shots 실사로 교체합니다. (이미 실사·업로드 이미지는 유지)
 */
export function migrateDemoShotImages(): boolean {
  const shots = getJson<Shot[]>(storageKeys.shots, []);
  const meta = getJson<Record<string, unknown>>(storageKeys.meta, {});
  const hasPlaceholder = shots.some((shot) =>
    shot.images.some(isPlaceholderImage),
  );

  if (!hasPlaceholder) {
    if (meta.shotDemoImageVersion !== SHOT_DEMO_IMAGE_VERSION) {
      setJson(storageKeys.meta, {
        ...meta,
        shotDemoImageVersion: SHOT_DEMO_IMAGE_VERSION,
      });
    }
    return false;
  }

  const next = shots.map((shot, index) => {
    if (!shot.images.some(isPlaceholderImage)) return shot;

    const images = shot.images.map(
      (_, imageIndex) =>
        DEMO_SHOT_IMAGES[(index + imageIndex) % DEMO_SHOT_IMAGES.length],
    );
    return {
      ...shot,
      images:
        images.length > 0
          ? images
          : [DEMO_SHOT_IMAGES[index % DEMO_SHOT_IMAGES.length]],
      shareCount: shot.shareCount ?? 0,
    };
  });

  setJson(storageKeys.shots, next);
  setJson(storageKeys.meta, {
    ...meta,
    shotDemoImageVersion: SHOT_DEMO_IMAGE_VERSION,
  });
  return true;
}

function daysFromNow(offset: number) {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  return date.toISOString().slice(0, 10);
}

function hoursAgo(hours: number) {
  return new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
}

export function seedDemoData() {
  const now = new Date().toISOString();
  const tripId = createId();
  const osakaTripId = createId();
  const taipeiTripId = createId();

  const trip: Trip = {
    id: tripId,
    name: "도쿄 주말 쇼핑",
    country: "일본",
    city: "도쿄",
    startDate: daysFromNow(14),
    endDate: daysFromNow(17),
    currency: "JPY",
    budget: 50000,
    tripTags: ["shopping", "with-friends"],
    createdAt: now,
    updatedAt: now,
  };

  const osakaTrip: Trip = {
    id: osakaTripId,
    name: "오사카 먹방 투어",
    country: "일본",
    city: "오사카",
    startDate: daysFromNow(-20),
    endDate: daysFromNow(-16),
    currency: "JPY",
    budget: 80000,
    tripTags: ["foodie", "family"],
    createdAt: hoursAgo(200),
    updatedAt: hoursAgo(200),
  };

  const taipeiTrip: Trip = {
    id: taipeiTripId,
    name: "타이베이 간식 투어",
    country: "대만",
    city: "타이베이",
    startDate: daysFromNow(-12),
    endDate: daysFromNow(-9),
    currency: "TWD",
    budget: 15000,
    tripTags: ["foodie", "solo"],
    createdAt: hoursAgo(120),
    updatedAt: hoursAgo(120),
  };

  const itemIds = {
    tokyoBanana: createId(),
    kitkat: createId(),
    ichiran: createId(),
    pieNoMi: createId(),
    takenoko: createId(),
    patches: createId(),
    lululun: createId(),
    honeyOil: createId(),
    mascara: createId(),
    plush: createId(),
    umaibo: createId(),
    kyusoku: createId(),
    melano: createId(),
    fino: createId(),
  };

  const rawItems = [
    {
      id: itemIds.tokyoBanana,
      tripId: osakaTripId,
      name: "도쿄바나나 (피카츄 포함)",
      estimatedPrice: 1800,
      quantity: 2,
      memo: "공항/역 한정",
      imageDataUrl: DEMO_ITEM_IMAGES.tokyoBanana,
      plannedPurchaseDates: [daysFromNow(-20)],
      giftTags: ["friend", "colleague"],
      favorited: false,
      purchased: true,
      purchasedAt: hoursAgo(180),
      sortOrder: 1,
      createdAt: hoursAgo(190),
      updatedAt: hoursAgo(180),
    },
    {
      id: itemIds.kitkat,
      tripId: osakaTripId,
      name: "키트캣 모음 (말차·딸기)",
      estimatedPrice: 2200,
      quantity: 4,
      memo: "돈키호테",
      imageDataUrl: DEMO_ITEM_IMAGES.kitkat,
      plannedPurchaseDates: [daysFromNow(-20)],
      giftTags: ["friend"],
      favorited: false,
      purchased: true,
      purchasedAt: hoursAgo(180),
      sortOrder: 2,
      createdAt: hoursAgo(190),
      updatedAt: hoursAgo(180),
    },
    {
      id: itemIds.ichiran,
      tripId: osakaTripId,
      name: "이치란 라멘 키트",
      estimatedPrice: 1500,
      quantity: 1,
      memo: "기내용 추천",
      imageDataUrl: DEMO_ITEM_IMAGES.ichiran,
      plannedPurchaseDates: [daysFromNow(-19)],
      giftTags: [],
      favorited: false,
      purchased: true,
      purchasedAt: hoursAgo(175),
      sortOrder: 3,
      createdAt: hoursAgo(190),
      updatedAt: hoursAgo(175),
    },
    {
      id: itemIds.pieNoMi,
      tripId: osakaTripId,
      name: "파이노미 (초코·다크)",
      estimatedPrice: 980,
      quantity: 4,
      memo: "침대에 펼쳐보니 실감…",
      imageDataUrl: DEMO_ITEM_IMAGES.pieNoMi,
      plannedPurchaseDates: [daysFromNow(-18)],
      giftTags: ["acquaintance"],
      favorited: false,
      purchased: true,
      purchasedAt: hoursAgo(160),
      sortOrder: 4,
      createdAt: hoursAgo(170),
      updatedAt: hoursAgo(160),
    },
    {
      id: itemIds.takenoko,
      tripId: osakaTripId,
      name: "타케노코노사토",
      estimatedPrice: 680,
      quantity: 3,
      memo: "",
      imageDataUrl: DEMO_ITEM_IMAGES.takenoko,
      plannedPurchaseDates: [daysFromNow(-18)],
      giftTags: ["colleague"],
      favorited: false,
      purchased: true,
      purchasedAt: hoursAgo(160),
      sortOrder: 5,
      createdAt: hoursAgo(170),
      updatedAt: hoursAgo(160),
    },
    {
      id: itemIds.patches,
      tripId: osakaTripId,
      name: "로이히츠보 파스",
      estimatedPrice: 980,
      quantity: 2,
      memo: "약국 필수",
      imageDataUrl: DEMO_ITEM_IMAGES.patches,
      plannedPurchaseDates: [daysFromNow(-18)],
      giftTags: [],
      favorited: false,
      purchased: true,
      purchasedAt: hoursAgo(158),
      sortOrder: 6,
      createdAt: hoursAgo(170),
      updatedAt: hoursAgo(158),
    },
    {
      id: itemIds.lululun,
      tripId,
      name: "루루룬 시트마스크",
      estimatedPrice: 1200,
      quantity: 3,
      memo: "마츠키요 세일",
      imageDataUrl: DEMO_ITEM_IMAGES.lululun,
      plannedPurchaseDates: [daysFromNow(14)],
      giftTags: ["friend"],
      favorited: false,
      purchased: false,
      purchasedAt: null,
      sortOrder: 1,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: itemIds.honeyOil,
      tripId,
      name: "&honey 헤어오일",
      estimatedPrice: 1980,
      quantity: 1,
      memo: "향 미쳤음",
      imageDataUrl: DEMO_ITEM_IMAGES.honeyOil,
      plannedPurchaseDates: [daysFromNow(15)],
      giftTags: [],
      favorited: false,
      purchased: false,
      purchasedAt: null,
      sortOrder: 2,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: itemIds.mascara,
      tripId,
      name: "히로인메이크 마스카라",
      estimatedPrice: 1400,
      quantity: 1,
      memo: "습한 날씨용",
      imageDataUrl: DEMO_ITEM_IMAGES.mascara,
      plannedPurchaseDates: [daysFromNow(15)],
      giftTags: [],
      favorited: false,
      purchased: false,
      purchasedAt: null,
      sortOrder: 3,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: itemIds.plush,
      tripId,
      name: "캐릭터 인형·파우치",
      estimatedPrice: 3200,
      quantity: 1,
      memo: "산리오/피크민",
      imageDataUrl: DEMO_ITEM_IMAGES.plush,
      plannedPurchaseDates: [daysFromNow(16)],
      giftTags: ["acquaintance"],
      favorited: false,
      purchased: false,
      purchasedAt: null,
      sortOrder: 4,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: itemIds.umaibo,
      tripId,
      name: "우마이보 세트",
      estimatedPrice: 600,
      quantity: 12,
      memo: "회사 간식용",
      imageDataUrl: DEMO_ITEM_IMAGES.umaibo,
      plannedPurchaseDates: [daysFromNow(16)],
      giftTags: ["colleague"],
      favorited: false,
      purchased: false,
      purchasedAt: null,
      sortOrder: 5,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: itemIds.kyusoku,
      tripId,
      name: "큐소쿠지칸 발바닥 시트",
      estimatedPrice: 880,
      quantity: 6,
      memo: "많이 걸은 날 필수",
      imageDataUrl: DEMO_ITEM_IMAGES.kyusoku,
      plannedPurchaseDates: [daysFromNow(14)],
      giftTags: [],
      favorited: false,
      purchased: true,
      purchasedAt: hoursAgo(100),
      sortOrder: 6,
      createdAt: hoursAgo(110),
      updatedAt: hoursAgo(100),
    },
    {
      id: itemIds.melano,
      tripId,
      name: "멜라노CC 미백 에센스",
      estimatedPrice: 1100,
      quantity: 1,
      memo: "마츠키요",
      imageDataUrl: DEMO_ITEM_IMAGES.melano,
      plannedPurchaseDates: [daysFromNow(14)],
      giftTags: [],
      favorited: false,
      purchased: true,
      purchasedAt: hoursAgo(98),
      sortOrder: 7,
      createdAt: hoursAgo(110),
      updatedAt: hoursAgo(98),
    },
    {
      id: itemIds.fino,
      tripId,
      name: "피노 프리미엄 헤어마스크",
      estimatedPrice: 980,
      quantity: 1,
      memo: "품절 직전 득템",
      imageDataUrl: DEMO_ITEM_IMAGES.fino,
      plannedPurchaseDates: [daysFromNow(15)],
      giftTags: ["friend"],
      favorited: false,
      purchased: true,
      purchasedAt: hoursAgo(96),
      sortOrder: 8,
      createdAt: hoursAgo(110),
      updatedAt: hoursAgo(96),
    },
  ];

  const items: ShoppingItem[] = rawItems.map((item) => ({
    ...item,
    coupangCompareStatus: "done" as const,
    coupangCompareRunAfter: null,
    coupangDeal: null,
  })) as ShoppingItem[];

  const profile: LocalProfile = {
    id: DEFAULT_PROFILE_ID,
    nickname: "트립디토",
    avatarDataUrl: DEFAULT_AVATAR_SRC,
    updatedAt: now,
  };

  // 바리에이션: ①쇼핑+코멘트 ②쇼핑+코멘트 ③코멘트만 ④쇼핑만 ⑤쇼핑+코멘트 ⑥쇼핑+코멘트 ⑦쇼핑만
  const shots: Shot[] = [
    {
      id: createId(),
      channel: "shots",
      tripId: osakaTripId,
      authorId: "demo-cream",
      authorNickname: "크림밤빵",
      authorAvatarDataUrl: null,
      destinationCountry: "일본",
      destinationCity: "오사카",
      images: [DEMO_SHOT_IMAGES[0]],
      pins: [
        {
          id: createId(),
          imageIndex: 0,
          xPct: 22,
          yPct: 35,
          text: "피카츄 도쿄바나나 찾았다!",
        },
        {
          id: createId(),
          imageIndex: 0,
          xPct: 68,
          yPct: 55,
          text: "이치란 키트는 기내용 추천",
        },
      ],
      body: "오사카·도쿄 스낵 총정리. 도쿄바나나·키트캣·이치란까지… 캐리어가 과자 창고가 됐어요.",
      shoppingItemIds: [itemIds.tokyoBanana, itemIds.kitkat, itemIds.ichiran],
      likeCount: 128,
      likedByMe: false,
      shareCount: 24,
      comments: [
        {
          id: createId(),
          authorId: "demo-user-1",
          authorNickname: "여행러버",
          text: "피카츄 도쿄바나나 부럽다 ㅠㅠ 어디서 사셨어요?",
          createdAt: hoursAgo(10),
        },
        {
          id: createId(),
          authorId: "demo-user-2",
          authorNickname: "파스수집가",
          text: "이치란 키트 진짜 맛있어요 기내에서 먹으면 힐링",
          createdAt: hoursAgo(8),
        },
        {
          id: createId(),
          authorId: "demo-cream",
          authorNickname: "크림밤빵",
          text: "돈키 + 역내 매장 루트예요! 리스트에 적어뒀어요 👆",
          createdAt: hoursAgo(6),
        },
      ],
      createdAt: hoursAgo(30),
      updatedAt: hoursAgo(30),
    },
    {
      id: createId(),
      channel: "shots",
      tripId: osakaTripId,
      authorId: "demo-chiikawa",
      authorNickname: "도쿄득템러",
      authorAvatarDataUrl: null,
      destinationCountry: "일본",
      destinationCity: "도쿄",
      images: [DEMO_SHOT_IMAGES[1]],
      pins: [
        {
          id: createId(),
          imageIndex: 0,
          xPct: 48,
          yPct: 72,
          text: "로이히츠보 필수템",
        },
      ],
      body: "침대에 펼쳐본 간식+약국 루트. 파이노미·타케노코·로이히츠보까지 한방에!",
      shoppingItemIds: [itemIds.pieNoMi, itemIds.takenoko, itemIds.patches],
      likeCount: 86,
      likedByMe: false,
      shareCount: 11,
      comments: [
        {
          id: createId(),
          authorId: "demo-user-3",
          authorNickname: "신주쿠러",
          text: "다크 파이노미가 더 맛있다는 소문 진짜예요?",
          createdAt: hoursAgo(40),
        },
        {
          id: createId(),
          authorId: "demo-user-4",
          authorNickname: "파우치홀릭",
          text: "로이히 노란 박스 보이면 무조건 쟁여요 ㅋㅋ",
          createdAt: hoursAgo(36),
        },
      ],
      createdAt: hoursAgo(55),
      updatedAt: hoursAgo(55),
    },
    {
      id: createId(),
      channel: "shots",
      tripId,
      authorId: "demo-haul",
      authorNickname: "캐리어풀",
      authorAvatarDataUrl: null,
      destinationCountry: "일본",
      destinationCity: "도쿄",
      images: [DEMO_SHOT_IMAGES[4]],
      pins: [],
      body: "키트캣·돈베이·화장품까지 섞여버린 막판 쇼핑… 리스트는 아직 정리 중 😅",
      shoppingItemIds: [],
      likeCount: 42,
      likedByMe: false,
      shareCount: 5,
      comments: [
        {
          id: createId(),
          authorId: "demo-user-5",
          authorNickname: "짐싸기달인",
          text: "캐리어 무게 몇 kg나 나왔어요? ㅋㅋ",
          createdAt: hoursAgo(50),
        },
        {
          id: createId(),
          authorId: "demo-user-1",
          authorNickname: "여행러버",
          text: "펼쳐놓은 비주얼이 힐링이네요",
          createdAt: hoursAgo(45),
        },
      ],
      createdAt: hoursAgo(72),
      updatedAt: hoursAgo(72),
    },
    {
      id: createId(),
      channel: "shots",
      tripId,
      authorId: "demo-beauty",
      authorNickname: "뷰티루트",
      authorAvatarDataUrl: null,
      destinationCountry: "일본",
      destinationCity: "도쿄",
      images: [DEMO_SHOT_IMAGES[2]],
      pins: [
        {
          id: createId(),
          imageIndex: 0,
          xPct: 30,
          yPct: 28,
          text: "&honey 향 미쳤음",
        },
        {
          id: createId(),
          imageIndex: 0,
          xPct: 72,
          yPct: 70,
          text: "루루룬 세일 때 쟁임",
        },
      ],
      body: "마츠키요 뷰티 루트 정리! 루루룬·&honey·히로인메이크까지. 쇼핑리스트에만 남겨둡니다.",
      shoppingItemIds: [itemIds.lululun, itemIds.honeyOil, itemIds.mascara],
      likeCount: 19,
      likedByMe: false,
      shareCount: 2,
      comments: [],
      createdAt: hoursAgo(5),
      updatedAt: hoursAgo(5),
    },
    {
      id: createId(),
      channel: "shots",
      tripId,
      authorId: "demo-char",
      authorNickname: "산리오덕후",
      authorAvatarDataUrl: null,
      destinationCountry: "일본",
      destinationCity: "도쿄",
      images: [DEMO_SHOT_IMAGES[3]],
      pins: [
        {
          id: createId(),
          imageIndex: 0,
          xPct: 55,
          yPct: 42,
          text: "폼폼푸린 인형 득템",
        },
      ],
      body: "산리오·피크민·우마이보까지… 캐릭터샵+돈키 콤보 추천. CDG 티도 건졌어요!",
      shoppingItemIds: [itemIds.plush, itemIds.umaibo],
      likeCount: 67,
      likedByMe: false,
      shareCount: 18,
      comments: [
        {
          id: createId(),
          authorId: "demo-user-6",
          authorNickname: "캐릭터홀릭",
          text: "하얀 대형 인형 어디 거예요? 너무 귀여워요",
          createdAt: hoursAgo(22),
        },
        {
          id: createId(),
          authorId: "demo-char",
          authorNickname: "산리오덕후",
          text: "리스트에 적어둔 매장 위주로 돌았어요! 우마이보는 회사 간식용",
          createdAt: hoursAgo(18),
        },
        {
          id: createId(),
          authorId: "demo-user-2",
          authorNickname: "파스수집가",
          text: "우마이보 색깔별로 사는 거 인정…",
          createdAt: hoursAgo(12),
        },
      ],
      createdAt: hoursAgo(40),
      updatedAt: hoursAgo(40),
    },
    {
      id: createId(),
      channel: "shots",
      tripId,
      authorId: "demo-pharma",
      authorNickname: "약국루트",
      authorAvatarDataUrl: null,
      destinationCountry: "일본",
      destinationCity: "도쿄",
      images: [DEMO_SHOT_IMAGES[6]],
      pins: [
        {
          id: createId(),
          imageIndex: 0,
          xPct: 40,
          yPct: 30,
          text: "큐소쿠지칸 쟁여두기",
        },
      ],
      body: "마츠키요 약국 루트. 큐소쿠지칸·멜라노CC·피노 헤어마스크 필수템!",
      shoppingItemIds: [itemIds.kyusoku, itemIds.melano, itemIds.fino],
      likeCount: 91,
      likedByMe: false,
      shareCount: 14,
      comments: [
        {
          id: createId(),
          authorId: "demo-user-3",
          authorNickname: "신주쿠러",
          text: "큐소쿠지칸 몇 박스나 사셨어요? 저도 많이 걸어서…",
          createdAt: hoursAgo(16),
        },
        {
          id: createId(),
          authorId: "demo-pharma",
          authorNickname: "약국루트",
          text: "6박스요 ㅋㅋ 쇼핑리스트에 수량 적어뒀어요",
          createdAt: hoursAgo(14),
        },
      ],
      createdAt: hoursAgo(20),
      updatedAt: hoursAgo(20),
    },
    {
      id: createId(),
      channel: "shots",
      tripId,
      authorId: "demo-duty",
      authorNickname: "면세득템",
      authorAvatarDataUrl: null,
      destinationCountry: "일본",
      destinationCity: "도쿄",
      images: [DEMO_SHOT_IMAGES[5]],
      pins: [],
      body: "롯데면세점 뷰티 쟁임. 에스티로더·아에스트라·달바까지… 쇼핑리스트로 정리해둘게요.",
      shoppingItemIds: [itemIds.lululun, itemIds.honeyOil],
      likeCount: 33,
      likedByMe: false,
      shareCount: 4,
      comments: [],
      createdAt: hoursAgo(12),
      updatedAt: hoursAgo(12),
    },
  ];

  setJson(storageKeys.trips, [trip, osakaTrip, taipeiTrip]);
  setJson(storageKeys.items, items);
  setJson(storageKeys.shots, shots);
  setJson(storageKeys.scraps, []);
  setJson(storageKeys.profile, profile);
  setJson(storageKeys.meta, {
    version: appConfig.storageVersion,
    seededAt: now,
    shotDemoImageVersion: SHOT_DEMO_IMAGE_VERSION,
    shotDemoContentVersion: SHOT_DEMO_CONTENT_VERSION,
  });

  return { trip, items, shots, profile };
}

const DEMO_SHOT_AUTHOR_IDS = new Set([
  "demo-cream",
  "demo-chiikawa",
  "demo-haul",
  "demo-beauty",
  "demo-char",
  "demo-pharma",
  "demo-duty",
  "demo-taipei",
]);

function isDemoOnlyFeed(shots: Shot[]) {
  if (shots.length === 0) return true;
  return shots.every((shot) => {
    if (DEMO_SHOT_AUTHOR_IDS.has(shot.authorId)) return true;
    if (shot.authorId.startsWith("demo-")) return true;
    // 구버전 시드가 로컬 프로필 ID로 올린 데모 글
    if (
      shot.authorId === DEFAULT_PROFILE_ID &&
      shot.authorNickname === "트립디토"
    ) {
      return true;
    }
    return false;
  });
}

/**
 * 때샷 피드가 비었거나 구버전 데모만 있으면 목업 5개를 채웁니다.
 * 사용자가 올린 때샷이 있으면 건드리지 않습니다.
 */
export function ensureDemoShotsSeed(): boolean {
  if (typeof window === "undefined") return false;

  const shots = getJson<Shot[]>(storageKeys.shots, []);
  const meta = getJson<Record<string, unknown>>(storageKeys.meta, {});
  const contentVersion = meta.shotDemoContentVersion;

  if (
    contentVersion === SHOT_DEMO_CONTENT_VERSION &&
    shots.length > 0
  ) {
    return false;
  }

  if (!isDemoOnlyFeed(shots)) {
    setJson(storageKeys.meta, {
      ...meta,
      shotDemoContentVersion: SHOT_DEMO_CONTENT_VERSION,
    });
    return false;
  }

  seedDemoData();
  return true;
}
