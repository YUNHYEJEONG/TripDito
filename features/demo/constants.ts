import { appConfig } from "@/config/app";
import { storageKeys } from "@/lib/storage/keys";

/**
 * Fixture schema version. Bump this when fixture IDs or relationships change.
 * Existing non-empty browser data is never upgraded automatically.
 */
export const DEMO_DATA_VERSION = 2;

export const DEMO_STORAGE_MARKER_KEY = storageKeys.demoBootstrap;

/** Legacy v2 key, retained only so bootstrap/reset can remove stale overrides. */
export const DEMO_HOME_PREVIEW_STORAGE_KEY = `${appConfig.storagePrefix}:demo-home-preview`;

/** Local-only preview account; never use these credentials outside the fixture. */
export const DEMO_ACCOUNT_CREDENTIALS = {
  email: "preview@tripdito.local",
  password: "tripdito-demo",
  passwordHash:
    "953901d52e2788fc804fe6d03de871ebcd59b16e47f03b0e8f09a86db806b3fb",
} as const;

/** Keys owned by the application that a fixture installation writes. */
export const DEMO_MANAGED_STORAGE_KEYS = [
  DEMO_HOME_PREVIEW_STORAGE_KEY,
  storageKeys.trips,
  storageKeys.items,
  storageKeys.shots,
  storageKeys.scraps,
  storageKeys.profile,
  storageKeys.auth,
  storageKeys.accounts,
  storageKeys.receivedCoupons,
  storageKeys.activeTrip,
  storageKeys.meta,
] as const;

/**
 * Values that prove a browser already belongs to a user. `meta` is excluded:
 * an old empty schema marker must not make an otherwise cold browser look full.
 */
export const USER_DATA_STORAGE_KEYS = [
  storageKeys.trips,
  storageKeys.items,
  storageKeys.shots,
  storageKeys.scraps,
  storageKeys.profile,
  storageKeys.auth,
  storageKeys.accounts,
  storageKeys.receivedCoupons,
  storageKeys.activeTrip,
] as const;

export const demoIds = {
  trips: {
    tokyo: "demo-v1-trip-tokyo",
    osaka: "demo-v1-trip-osaka",
    taipei: "demo-v1-trip-taipei",
    paris: "demo-v1-trip-paris",
    fukuoka: "demo-v1-trip-fukuoka",
  },
  items: {
    tokyoSunscreen: "demo-v1-item-tokyo-sunscreen",
    tokyoCoffee: "demo-v1-item-tokyo-coffee",
    tokyoStationery: "demo-v1-item-tokyo-stationery",
    tokyoCamera: "demo-v1-item-tokyo-camera",
    tokyoSnacks: "demo-v1-item-tokyo-snacks",
    tokyoHandCream: "demo-v1-item-tokyo-hand-cream",
    osakaKitkat: "demo-v1-item-osaka-kitkat",
    osakaPatches: "demo-v1-item-osaka-patches",
    osakaTowel: "demo-v1-item-osaka-towel",
    osakaTea: "demo-v1-item-osaka-tea",
    osakaMascot: "demo-v1-item-osaka-mascot",
    taipeiPineappleCake: "demo-v1-item-taipei-pineapple-cake",
    taipeiTea: "demo-v1-item-taipei-tea",
    taipeiToothpaste: "demo-v1-item-taipei-toothpaste",
    taipeiNougat: "demo-v1-item-taipei-nougat",
    taipeiBag: "demo-v1-item-taipei-bag",
    parisSoap: "demo-v1-item-paris-soap",
    parisTea: "demo-v1-item-paris-tea",
    parisJam: "demo-v1-item-paris-jam",
    parisNotebook: "demo-v1-item-paris-notebook",
    parisSalt: "demo-v1-item-paris-salt",
    fukuokaMentaiko: "demo-v1-item-fukuoka-mentaiko",
    fukuokaStrawberry: "demo-v1-item-fukuoka-strawberry",
    fukuokaRamen: "demo-v1-item-fukuoka-ramen",
    fukuokaPouch: "demo-v1-item-fukuoka-pouch",
    fukuokaTea: "demo-v1-item-fukuoka-tea",
  },
  shots: {
    ownTokyo: "demo-v1-shot-own-tokyo",
    ownTaipei: "demo-v1-shot-own-taipei",
    osakaHaul: "demo-v1-shot-osaka-haul",
    tokyoDrugstore: "demo-v1-shot-tokyo-drugstore",
    taipeiSnacks: "demo-v1-shot-taipei-snacks",
    parisMarket: "demo-v1-shot-paris-market",
    tokyoCommunity: "demo-v1-shot-tokyo-community",
    osakaCommunity: "demo-v1-shot-osaka-community",
  },
  scraps: {
    osakaHaul: "demo-v1-scrap-osaka-haul",
    taipeiSnacks: "demo-v1-scrap-taipei-snacks",
    parisMarket: "demo-v1-scrap-paris-market",
  },
  profile: "local-me",
  accountEmail: DEMO_ACCOUNT_CREDENTIALS.email,
} as const;
