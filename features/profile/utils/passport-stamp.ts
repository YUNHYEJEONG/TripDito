import type { Trip } from "@/features/trips/types";
import { withReturnTo } from "@/lib/navigation/return-to";

export type PassportStampShape =
  | "round"
  | "rectangle"
  | "oval"
  | "square"
  | "polygon";
export type PassportStampFrame = "single" | "double" | "postmark";

export type PassportStampDesign = {
  family: string;
  shape: PassportStampShape;
  frame: PassportStampFrame;
  ink: string;
  borderInk?: string;
  accentInk?: string;
  countryCode?: string;
  rotation: number;
};

type StampTarget = Pick<Trip, "country" | "city">;

const COUNTRY_STAMP_OVERRIDES: ReadonlyArray<{
  match: RegExp;
  design: PassportStampDesign;
}> = [
  {
    match: /^(?:대만|타이완|taiwan|tw)$/i,
    design: {
      family: "taiwan",
      shape: "round",
      frame: "double",
      ink: "#9d3f36",
      borderInk: "#ad493f",
      countryCode: "TW",
      rotation: -3,
    },
  },
  {
    match: /^(?:프랑스|france|fr)$/i,
    design: {
      family: "france",
      shape: "rectangle",
      frame: "double",
      ink: "#565184",
      borderInk: "#4d4c80",
      accentInk: "#315f78",
      countryCode: "FR",
      rotation: 1,
    },
  },
  {
    match: /^(?:일본|japan|jp)$/i,
    design: {
      family: "japan",
      shape: "rectangle",
      frame: "double",
      ink: "#31527c",
      borderInk: "#294a75",
      countryCode: "JP",
      rotation: -2,
    },
  },
  {
    match: /^(?:한국|대한민국|south korea|republic of korea|korea|kr)$/i,
    design: {
      family: "korea",
      shape: "round",
      frame: "double",
      ink: "#913d47",
      borderInk: "#913d47",
      accentInk: "#355b82",
      countryCode: "KR",
      rotation: -1,
    },
  },
  {
    match: /^(?:중국|china|cn)$/i,
    design: {
      family: "china",
      shape: "square",
      frame: "single",
      ink: "#8c3534",
      countryCode: "CN",
      rotation: -1,
    },
  },
  {
    match: /^(?:미국|united states|united states of america|usa|us)$/i,
    design: {
      family: "united-states",
      shape: "oval",
      frame: "double",
      ink: "#344f76",
      countryCode: "US",
      rotation: -2,
    },
  },
  {
    match: /^(?:태국|thailand|th)$/i,
    design: {
      family: "thailand",
      shape: "oval",
      frame: "single",
      ink: "#745277",
      borderInk: "#69456f",
      countryCode: "TH",
      rotation: 2,
    },
  },
  {
    match: /^(?:베트남|vietnam|vn)$/i,
    design: {
      family: "vietnam",
      shape: "rectangle",
      frame: "postmark",
      ink: "#456b52",
      countryCode: "VN",
      rotation: -1,
    },
  },
  {
    match: /^(?:호주|australia|au)$/i,
    design: {
      family: "australia",
      shape: "round",
      frame: "double",
      ink: "#39706f",
      countryCode: "AU",
      rotation: 2,
    },
  },
  {
    match: /^(?:싱가포르|singapore|sg)$/i,
    design: {
      family: "singapore",
      shape: "rectangle",
      frame: "double",
      ink: "#9a4345",
      countryCode: "SG",
      rotation: 1,
    },
  },
  {
    match: /^(?:영국|united kingdom|great britain|uk|gb)$/i,
    design: {
      family: "united-kingdom",
      shape: "rectangle",
      frame: "double",
      ink: "#514c72",
      countryCode: "GB",
      rotation: -2,
    },
  },
  {
    match: /^(?:이탈리아|italy|it)$/i,
    design: {
      family: "italy",
      shape: "polygon",
      frame: "double",
      ink: "#446c50",
      borderInk: "#396044",
      countryCode: "IT",
      rotation: 1,
    },
  },
  {
    match: /^(?:스페인|spain|es)$/i,
    design: {
      family: "spain",
      shape: "oval",
      frame: "postmark",
      ink: "#966038",
      countryCode: "ES",
      rotation: -2,
    },
  },
];

export const PASSPORT_STAMP_KNOWN_FAMILIES = [
  ...new Set(COUNTRY_STAMP_OVERRIDES.map(({ design }) => design.family)),
] as const;

const FALLBACK_STAMP_DESIGNS = [
  {
    shape: "round",
    frame: "double",
    ink: "#56673d",
    rotation: 2,
  },
  {
    shape: "rectangle",
    frame: "single",
    ink: "#76513f",
    rotation: -2,
  },
  {
    shape: "oval",
    frame: "postmark",
    ink: "#3e6870",
    rotation: 1,
  },
  {
    shape: "square",
    frame: "double",
    ink: "#6c4f71",
    rotation: -1,
  },
] as const;

function normalizeCountry(country: string) {
  return country.normalize("NFKC").trim().replaceAll(/\s+/g, " ").toLowerCase();
}

function stableHash(value: string) {
  let hash = 0;
  for (const character of value) {
    hash = (hash * 31 + (character.codePointAt(0) ?? 0)) >>> 0;
  }
  return hash;
}

/**
 * A stamp belongs to its country, never to its position in a sorted list.
 * Known destinations keep their designed identity; custom countries receive a
 * deterministic fallback that remains stable after sorting or adding trips.
 */
export function getPassportStampDesign({
  country,
  city,
}: StampTarget): PassportStampDesign {
  const normalizedCountry = normalizeCountry(country);
  const knownDesign = COUNTRY_STAMP_OVERRIDES.find(({ match }) =>
    match.test(normalizedCountry),
  )?.design;

  if (knownDesign) return knownDesign;

  const fallbackKey = normalizedCountry || city.normalize("NFKC").trim();
  const fallback =
    FALLBACK_STAMP_DESIGNS[
      stableHash(fallbackKey) % FALLBACK_STAMP_DESIGNS.length
    ];

  return {
    family: `custom-${stableHash(fallbackKey).toString(36)}`,
    countryCode: `D${(stableHash(fallbackKey) % 36).toString(36).toUpperCase()}`,
    ...fallback,
  };
}

/**
 * Produces a stable impression seed from persisted trip data. This is used by
 * the inline SVG texture, so an impression never changes after reordering and
 * never depends on Math.random(), render timing, or the browser locale.
 */
export function getPassportStampTextureSeed({
  id,
  endDate,
}: Pick<Trip, "id" | "endDate">) {
  return stableHash(`${id}|${endDate}`) || 1;
}

export function getPassportStampCode(
  trip: Pick<Trip, "id" | "country" | "city" | "endDate">,
) {
  // 실제 입국 도장의 창구/직원 일련번호 표기 (예: NO.0472)
  const serial = (getPassportStampTextureSeed(trip) % 10000)
    .toString(10)
    .padStart(4, "0");

  return `NO.${serial}`;
}

export function getPassportTripHref(
  tripId: string,
  returnTo = "/passport?view=stamps",
) {
  return withReturnTo(
    `/trips/${encodeURIComponent(tripId)}`,
    returnTo,
  );
}
