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
] as const;

/** 데모 이미지 에셋 버전 — 올리면 기존 SVG 플레이스홀더를 실사로 교체 */
export const SHOT_DEMO_IMAGE_VERSION = 2;

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
    snack: createId(),
    vitamin: createId(),
    pouch: createId(),
    cream: createId(),
    kitkat: createId(),
    patches: createId(),
    pineapple: createId(),
    toothpaste: createId(),
  };

  const items: ShoppingItem[] = [
    {
      id: itemIds.snack,
      tripId,
      name: "돈키호테 스낵 세트",
      estimatedPrice: 1280,
      quantity: 2,
      memo: "출국장 전에 사기",
      imageDataUrl: null,
      plannedPurchaseDates: [daysFromNow(14)],
      giftTags: ["friend"],
      purchased: false,
      purchasedAt: null,
      sortOrder: 1,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: itemIds.vitamin,
      tripId,
      name: "약국 비타민",
      estimatedPrice: 980,
      quantity: 1,
      memo: "마츠모토 키요시",
      imageDataUrl: null,
      plannedPurchaseDates: [daysFromNow(14)],
      giftTags: [],
      purchased: true,
      purchasedAt: now,
      sortOrder: 2,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: itemIds.pouch,
      tripId,
      name: "캐릭터 파우치",
      estimatedPrice: 1500,
      quantity: 1,
      memo: "선물용",
      imageDataUrl: null,
      plannedPurchaseDates: [daysFromNow(15)],
      giftTags: ["acquaintance"],
      purchased: false,
      purchasedAt: null,
      sortOrder: 3,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: itemIds.cream,
      tripId,
      name: "핸드크림",
      estimatedPrice: 890,
      quantity: 2,
      memo: "",
      imageDataUrl: null,
      plannedPurchaseDates: [daysFromNow(16)],
      giftTags: ["colleague"],
      purchased: false,
      purchasedAt: null,
      sortOrder: 4,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: itemIds.kitkat,
      tripId: osakaTripId,
      name: "키트캣 모음",
      estimatedPrice: 2200,
      quantity: 3,
      memo: "도톤보리 근처",
      imageDataUrl: null,
      plannedPurchaseDates: [daysFromNow(-20)],
      giftTags: ["friend"],
      purchased: true,
      purchasedAt: hoursAgo(180),
      sortOrder: 1,
      createdAt: hoursAgo(190),
      updatedAt: hoursAgo(180),
    },
    {
      id: itemIds.patches,
      tripId: osakaTripId,
      name: "로이히츠보 파스",
      estimatedPrice: 980,
      quantity: 2,
      memo: "약국",
      imageDataUrl: null,
      plannedPurchaseDates: [daysFromNow(-19)],
      giftTags: [],
      purchased: true,
      purchasedAt: hoursAgo(175),
      sortOrder: 2,
      createdAt: hoursAgo(190),
      updatedAt: hoursAgo(175),
    },
    {
      id: itemIds.pineapple,
      tripId: taipeiTripId,
      name: "펑리수(파인애플 케이크)",
      estimatedPrice: 320,
      quantity: 4,
      memo: "디화제 추천",
      imageDataUrl: null,
      plannedPurchaseDates: [daysFromNow(-12)],
      giftTags: ["acquaintance", "colleague"],
      purchased: true,
      purchasedAt: hoursAgo(100),
      sortOrder: 1,
      createdAt: hoursAgo(110),
      updatedAt: hoursAgo(100),
    },
    {
      id: itemIds.toothpaste,
      tripId: taipeiTripId,
      name: "다리 치약",
      estimatedPrice: 180,
      quantity: 3,
      memo: "",
      imageDataUrl: null,
      plannedPurchaseDates: [daysFromNow(-11)],
      giftTags: [],
      purchased: true,
      purchasedAt: hoursAgo(98),
      sortOrder: 2,
      createdAt: hoursAgo(110),
      updatedAt: hoursAgo(98),
    },
  ];

  const profile: LocalProfile = {
    id: DEFAULT_PROFILE_ID,
    nickname: "트립디토",
    avatarDataUrl: DEFAULT_AVATAR_SRC,
    updatedAt: now,
  };

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
      images: [DEMO_SHOT_IMAGES[0], DEMO_SHOT_IMAGES[1]],
      pins: [
        {
          id: createId(),
          imageIndex: 0,
          xPct: 32,
          yPct: 40,
          text: "도톤보리 근처 돈키에서 득템!",
        },
      ],
      body: "오사카 이틀 쇼핑 결과 총정리. 키트캣이랑 로히이츠보 파스는 필수예요. 다음엔 더 큰 캐리어 가져올 예정…",
      shoppingItemIds: [itemIds.kitkat, itemIds.patches],
      likeCount: 128,
      likedByMe: false,
      shareCount: 24,
      comments: [
        {
          id: createId(),
          authorId: "demo-user-1",
          authorNickname: "여행러버",
          text: "키트캣 종류가 부럽네요 ㅠㅠ",
          createdAt: hoursAgo(10),
        },
      ],
      createdAt: hoursAgo(30),
      updatedAt: hoursAgo(30),
    },
    {
      id: createId(),
      channel: "shots",
      tripId,
      authorId: "demo-chiikawa",
      authorNickname: "도쿄득템러",
      authorAvatarDataUrl: null,
      destinationCountry: "일본",
      destinationCity: "도쿄",
      images: [DEMO_SHOT_IMAGES[2]],
      pins: [
        {
          id: createId(),
          imageIndex: 0,
          xPct: 55,
          yPct: 62,
          text: "마츠키요 비타민 가성비 최고",
        },
      ],
      body: "신주쿠 돈키 + 마츠키요 루트 추천. 스낵은 출국장보다 시내가 싸요!",
      shoppingItemIds: [itemIds.snack, itemIds.vitamin, itemIds.pouch],
      likeCount: 86,
      likedByMe: false,
      shareCount: 11,
      comments: [],
      createdAt: hoursAgo(55),
      updatedAt: hoursAgo(55),
    },
    {
      id: createId(),
      channel: "shots",
      tripId: osakaTripId,
      authorId: "demo-haul",
      authorNickname: "캐리어풀",
      authorAvatarDataUrl: null,
      destinationCountry: "일본",
      destinationCity: "오사카",
      images: [DEMO_SHOT_IMAGES[1]],
      pins: [],
      body: "침대 위에 다 펼쳐보니 실이 나요. 친구 많이 샀다…",
      shoppingItemIds: [itemIds.kitkat],
      likeCount: 42,
      likedByMe: false,
      shareCount: 5,
      comments: [],
      createdAt: hoursAgo(72),
      updatedAt: hoursAgo(72),
    },
    {
      id: createId(),
      channel: "shots",
      tripId,
      authorId: DEFAULT_PROFILE_ID,
      authorNickname: profile.nickname,
      authorAvatarDataUrl: null,
      destinationCountry: "일본",
      destinationCity: "도쿄",
      images: [DEMO_SHOT_IMAGES[3]],
      pins: [],
      body: "뷰티 루트 정리! 설화수 쿠션이랑 SNP 마스크 득템했어요.",
      shoppingItemIds: [itemIds.cream],
      likeCount: 3,
      likedByMe: false,
      shareCount: 0,
      comments: [],
      createdAt: hoursAgo(5),
      updatedAt: hoursAgo(5),
    },
    {
      id: createId(),
      channel: "shots",
      tripId: taipeiTripId,
      authorId: "demo-taipei",
      authorNickname: "타이베이간식러",
      authorAvatarDataUrl: null,
      destinationCountry: "대만",
      destinationCity: "타이베이",
      images: [DEMO_SHOT_IMAGES[4]],
      pins: [
        {
          id: createId(),
          imageIndex: 0,
          xPct: 28,
          yPct: 45,
          text: "펑리수는 여러 집 사보는 게 좋아요!",
        },
      ],
      body: "타이베이 디화제·시먼딩 쇼핑 총정리. 펑리수랑 누거트 크래커 필수.",
      shoppingItemIds: [itemIds.pineapple, itemIds.toothpaste],
      likeCount: 67,
      likedByMe: false,
      shareCount: 18,
      comments: [],
      createdAt: hoursAgo(40),
      updatedAt: hoursAgo(40),
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
  });

  return { trip, items, shots, profile };
}
