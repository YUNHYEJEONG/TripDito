import type { CSSProperties, ReactNode } from "react";
import type { Trip } from "@/features/trips/types";
import {
  getPassportStampCode,
  getPassportStampDesign,
  getPassportStampTextureSeed,
  type PassportStampShape,
} from "@/features/profile/utils/passport-stamp";
import { cn } from "@/lib/utils";

export type PassportStampSize = "preview" | "notebook";

export type PassportStampGeometry =
  | "wide"
  | "round"
  | "oval"
  | "square"
  | "tall"
  | "polygon";

export const PASSPORT_STAMP_ARTWORK_FAMILIES = [
  "japan",
  "taiwan",
  "france",
  "korea",
  "china",
  "united-states",
  "thailand",
  "vietnam",
  "australia",
  "singapore",
  "united-kingdom",
  "italy",
  "spain",
] as const;

export type PassportStampArtworkFamily =
  (typeof PASSPORT_STAMP_ARTWORK_FAMILIES)[number];

const artworkFamilySet = new Set<string>(PASSPORT_STAMP_ARTWORK_FAMILIES);

export function hasPassportStampArtwork(
  family: string,
): family is PassportStampArtworkFamily {
  return artworkFamilySet.has(family);
}

type ArtworkCopy = {
  country: string;
  city: string;
  date: string;
  code: string;
  stay: string;
};

type ArtworkProps = ArtworkCopy & {
  ink: string;
  accentInk: string;
};

const FAMILY_GEOMETRY: Readonly<
  Record<PassportStampArtworkFamily, PassportStampGeometry>
> = {
  japan: "wide",
  taiwan: "round",
  france: "wide",
  korea: "round",
  china: "square",
  "united-states": "oval",
  thailand: "oval",
  vietnam: "tall",
  australia: "round",
  singapore: "wide",
  "united-kingdom": "wide",
  italy: "polygon",
  spain: "oval",
};

export function getPassportStampArtworkGeometry(family: string) {
  return hasPassportStampArtwork(family) ? FAMILY_GEOMETRY[family] : null;
}

const VIEW_BOXES: Record<PassportStampGeometry, string> = {
  wide: "0 0 180 124",
  round: "28 0 124 124",
  oval: "4 0 172 124",
  square: "28 0 124 124",
  tall: "43 0 94 124",
  polygon: "0 0 180 124",
};

const FALLBACK_GEOMETRY: Readonly<
  Record<PassportStampShape, PassportStampGeometry>
> = {
  round: "round",
  rectangle: "wide",
  oval: "oval",
  square: "square",
  polygon: "polygon",
};

/**
 * 미리보기 도장만 고정 크기다. 여권 내지(`notebook`)는 한 장을 2×2 칸으로 나눠
 * **칸을 꽉 채우므로** 크기를 부모가 정한다 — 여기서 px을 박으면 작은 화면에서는
 * 넘치고 큰 화면에서는 종이가 텅 빈다.
 */
const PREVIEW_SIZE_CLASSES: Record<PassportStampGeometry, string> = {
  wide: "h-[55px] w-[78px] min-[360px]:h-[65px] min-[360px]:w-[92px]",
  round: "size-[64px] min-[360px]:size-[72px]",
  oval: "h-[56px] w-[80px] min-[360px]:h-[64px] min-[360px]:w-[94px]",
  square: "size-[64px] min-[360px]:size-[72px]",
  tall: "h-[68px] w-[52px] min-[360px]:h-[74px] min-[360px]:w-[57px]",
  polygon: "h-[64px] w-[72px] min-[360px]:h-[72px] min-[360px]:w-[82px]",
};

/**
 * 도장 모양별 가로/세로 비율. 내지 도장은 칸에 맞춰 크기가 정해지므로 절대 크기가
 * 아니라 **비율만** 의미가 있다. 배치 엔진이 칸 안에 들어갈 실제 폭을 이 값으로 푼다.
 */
export const PASSPORT_STAMP_PROPORTIONS = {
  wide: 130 / 92,
  round: 1,
  oval: 132 / 92,
  square: 1,
  tall: 85 / 113,
  polygon: 118 / 109,
} as const satisfies Record<PassportStampGeometry, number>;

const COUNTRY_LABELS: Readonly<Record<string, string>> = {
  japan: "JAPAN",
  taiwan: "TAIWAN",
  france: "FRANCE",
  korea: "KOREA",
  thailand: "THAILAND",
  italy: "ITALIA",
  china: "CHINA",
  "united-states": "UNITED STATES",
  vietnam: "VIETNAM",
  australia: "AUSTRALIA",
  singapore: "SINGAPORE",
  "united-kingdom": "UNITED KINGDOM",
  spain: "SPAIN",
};

const CITY_LABELS: ReadonlyArray<{ match: RegExp; label: string }> = [
  { match: /^(?:도쿄|동경|tokyo)$/i, label: "TOKYO" },
  { match: /^(?:교토|경도|kyoto)$/i, label: "KYOTO" },
  { match: /^(?:타이베이|대북|taipei)$/i, label: "TAIPEI" },
  { match: /^(?:파리|paris)$/i, label: "PARIS" },
  { match: /^(?:서울|seoul)$/i, label: "SEOUL" },
  { match: /^(?:방콕|bangkok)$/i, label: "BANGKOK" },
  { match: /^(?:로마|rome|roma)$/i, label: "ROMA" },
];

function normalizedLabel(value: string) {
  return value.normalize("NFKC").trim().replaceAll(/\s+/g, " ");
}

function compactLabel(value: string, maxLength: number) {
  const normalized = normalizedLabel(value).toUpperCase();
  const characters = Array.from(normalized);
  return characters.length > maxLength
    ? `${characters.slice(0, maxLength - 1).join("")}·`
    : normalized;
}

function cityLabel(city: string) {
  const normalized = normalizedLabel(city);
  return (
    CITY_LABELS.find(({ match }) => match.test(normalized))?.label ??
    compactLabel(normalized, 13)
  );
}

function stampDate(dateKey: string) {
  return dateKey.replaceAll("-", ".");
}

function stayCode(startDate: string, endDate: string) {
  const start = Date.parse(`${startDate}T00:00:00Z`);
  const end = Date.parse(`${endDate}T00:00:00Z`);
  const nights = Math.max(0, Math.round((end - start) / 86_400_000));
  return nights === 0 ? "DAY TRIP" : `${nights}N ${nights + 1}D`;
}

function nextTextureValue(state: number) {
  let next = state >>> 0;
  next ^= next << 13;
  next ^= next >>> 17;
  next ^= next << 5;
  return next >>> 0;
}

function makeTextureMarks(seed: number) {
  let state = seed;
  const circles = Array.from({ length: 26 }, (_, index) => {
    state = nextTextureValue(state + index + 1);
    const cx = 11 + (state % 159);
    state = nextTextureValue(state);
    const cy = 8 + (state % 108);
    state = nextTextureValue(state);
    const radius = [0.45, 0.6, 0.8, 1, 1.25][state % 5];

    return { cx, cy, radius };
  });
  const scratches = Array.from({ length: 7 }, (_, index) => {
    state = nextTextureValue(state + index + 17);
    const x = 12 + (state % 146);
    state = nextTextureValue(state);
    const y = 10 + (state % 101);
    state = nextTextureValue(state);
    const length = 6 + (state % 14);

    return { x, y, length };
  });

  return { circles, scratches };
}

function InkTextureDefs({
  assetId,
  seed,
}: {
  assetId: string;
  seed: number;
}) {
  const marks = makeTextureMarks(seed);

  return (
    <defs>
      <filter
        id={`${assetId}-rough`}
        x="-8%"
        y="-10%"
        width="116%"
        height="120%"
        colorInterpolationFilters="sRGB"
      >
        <feTurbulence
          type="fractalNoise"
          baseFrequency="0.045 0.11"
          numOctaves={2}
          seed={(seed % 997) + 1}
          result="paperGrain"
        />
        <feDisplacementMap
          in="SourceGraphic"
          in2="paperGrain"
          scale={0.55}
          xChannelSelector="R"
          yChannelSelector="B"
        />
      </filter>
      <mask
        id={`${assetId}-dry-ink`}
        x="-5"
        y="-5"
        width="190"
        height="134"
        maskUnits="userSpaceOnUse"
      >
        <rect x="-5" y="-5" width="190" height="134" fill="white" />
        <g fill="black" opacity={0.78}>
          {marks.circles.map((mark, index) => (
            <circle
              key={`dot-${index}`}
              cx={mark.cx}
              cy={mark.cy}
              r={mark.radius}
            />
          ))}
        </g>
        <g
          fill="none"
          stroke="black"
          strokeLinecap="round"
          strokeWidth={0.75}
          opacity={0.62}
        >
          {marks.scratches.map((mark, index) => (
            <path
              key={`scratch-${index}`}
              d={`M ${mark.x} ${mark.y} l ${mark.length} -1.3`}
            />
          ))}
        </g>
      </mask>
    </defs>
  );
}

function Impression({
  assetId,
  children,
}: {
  assetId: string;
  children: ReactNode;
}) {
  return (
    <>
      <g transform="translate(1.15 0.8)" opacity={0.14}>
        {children}
      </g>
      <g
        mask={`url(#${assetId}-dry-ink)`}
        filter={`url(#${assetId}-rough)`}
      >
        {children}
      </g>
    </>
  );
}

function JapanArtwork({
  ink,
  country,
  city,
  date,
  code,
  stay,
}: ArtworkProps) {
  return (
    <g fill="none" stroke={ink}>
      <path
        d="M 22 10 H 157 L 170 23 V 101 L 158 114 H 22 L 10 102 V 23 Z"
        strokeWidth={2.7}
        strokeLinejoin="round"
        strokeDasharray="49 1.3 11 0.8 32 1.1 15 0.7"
      />
      <path
        d="M 25 15 H 154 L 165 26 V 98 L 155 109 H 25 L 15 99 V 26 Z"
        strokeWidth={0.9}
        opacity={0.68}
        strokeDasharray="6 1.1"
      />
      <g opacity={0.2} strokeWidth={1.05}>
        <circle cx={47} cy={58} r={28} />
        <circle cx={47} cy={58} r={21} strokeDasharray="2 2.7" />
        <path d="M 14 90 L 43 49 L 52 61 L 60 55 L 85 91" />
        <path d="M 29 69 L 43 49 L 52 61 L 59 55 L 73 74" />
        <path d="M 14 93 C 30 88 48 98 66 92 C 76 88 84 88 95 91" />
        <path d="M 17 99 C 35 94 49 103 67 97 C 78 93 87 94 95 97" />
      </g>
      <path d="M 99 20 V 104" strokeWidth={0.8} opacity={0.34} />
      <path
        d="M 106 91 H 162 M 106 95 H 153"
        strokeWidth={0.65}
        opacity={0.35}
      />
      <g fill={ink} stroke="none" textAnchor="middle">
        <text
          x={133}
          y={29}
          fontFamily="var(--font-mono)"
          fontSize={8.2}
          fontWeight={800}
          letterSpacing={1.25}
        >
          TRAVEL MEMORY
        </text>
        <text
          x={133}
          y={52}
          fontFamily="var(--font-sans)"
          fontSize={19}
          fontWeight={900}
          letterSpacing={1.4}
        >
          {country}
        </text>
        <text
          x={133}
          y={68}
          fontFamily="var(--font-mono)"
          fontSize={11.5}
          fontWeight={800}
          letterSpacing={1.2}
        >
          {city}
        </text>
        <text
          x={162}
          y={67}
          fontFamily="var(--font-sans)"
          fontSize={5.8}
          fontWeight={800}
          letterSpacing={0.5}
          textAnchor="end"
          opacity={0.72}
        >
          日本
        </text>
        <text
          x={133}
          y={84}
          fontFamily="var(--font-mono)"
          fontSize={9.5}
          fontWeight={800}
          letterSpacing={0.45}
        >
          {date}
        </text>
        <text
          x={133}
          y={103}
          fontFamily="var(--font-mono)"
          fontSize={6.7}
          fontWeight={700}
          letterSpacing={0.55}
        >
          {code} · {stay}
        </text>
      </g>
    </g>
  );
}

function TaiwanArtwork({
  ink,
  country,
  city,
  date,
  code,
  stay,
}: ArtworkProps) {
  return (
    <g fill="none" stroke={ink}>
      <circle
        cx={90}
        cy={62}
        r={56}
        strokeWidth={2.7}
        strokeDasharray="35 1.3 9 0.8 42 1.1"
      />
      <circle cx={90} cy={62} r={50.5} strokeWidth={0.9} opacity={0.72} />
      <circle
        cx={90}
        cy={62}
        r={46}
        strokeWidth={0.65}
        strokeDasharray="1.2 2.3"
        opacity={0.5}
      />
      <g opacity={0.26} strokeWidth={0.9}>
        <path d="M 45 70 Q 61 46 75 65 Q 87 44 101 66 Q 113 52 135 73" />
        <path d="M 48 75 Q 65 60 79 74 Q 96 57 110 75 Q 120 66 132 77" />
        <path d="M 50 81 H 130" strokeDasharray="2 2" />
      </g>
      <g transform="translate(90 25)" strokeWidth={1.15} opacity={0.88}>
        <circle r={3.3} />
        <path d="M 0 -10 C 6 -10 7 -4 3 -1 M 10 -3 C 12 3 7 7 3 4 M 6 8 C 1 12 -5 8 -4 4 M -6 8 C -12 4 -9 -2 -4 -2 M -10 -3 C -8 -9 -2 -11 0 -6" />
      </g>
      <g fill={ink} stroke="none" textAnchor="middle">
        <text
          x={90}
          y={42}
          fontFamily="var(--font-mono)"
          fontSize={7.3}
          fontWeight={800}
          letterSpacing={1.35}
        >
          TRAVEL MEMORY
        </text>
        <text
          x={90}
          y={58}
          fontFamily="var(--font-sans)"
          fontSize={14.5}
          fontWeight={900}
          letterSpacing={1.1}
        >
          {country}
        </text>
        <text
          x={90}
          y={72}
          fontFamily="var(--font-mono)"
          fontSize={10.5}
          fontWeight={800}
          letterSpacing={0.9}
        >
          {city}
        </text>
        <text
          x={90}
          y={88}
          fontFamily="var(--font-mono)"
          fontSize={8.5}
          fontWeight={800}
        >
          {date}
        </text>
        <text
          x={90}
          y={100}
          fontFamily="var(--font-mono)"
          fontSize={5.8}
          fontWeight={700}
          letterSpacing={0.3}
        >
          {code} · {stay}
        </text>
      </g>
    </g>
  );
}

function FranceArtwork({
  ink,
  accentInk,
  country,
  city,
  date,
  code,
  stay,
}: ArtworkProps) {
  return (
    <g fill="none">
      <path
        d="M 19 13 H 158 L 171 24 V 100 L 159 111 H 19 L 9 101 V 24 Z"
        stroke={ink}
        strokeWidth={2.5}
        strokeLinejoin="round"
        strokeDasharray="40 1.2 20 0.7 51 1.4"
      />
      <path
        d="M 23 18 H 155 L 166 27 V 97 L 156 106 H 22 L 14 98 V 27 Z"
        stroke={accentInk}
        strokeWidth={0.8}
        strokeDasharray="5 1.25"
        opacity={0.68}
      />
      <g stroke={accentInk} opacity={0.42}>
        <path d="M 19 96 H 79" strokeWidth={0.8} />
        <path d="M 31 91 L 52 31 L 73 91 M 40 67 H 64 M 35 79 H 69" strokeWidth={1.25} />
        <path d="M 26 91 Q 52 80 78 91" strokeWidth={1} />
        <path
          d="M 23 29 C 39 18 60 20 75 33 C 88 44 83 56 72 62"
          strokeWidth={0.8}
          strokeDasharray="2 2"
        />
        <circle cx={23} cy={29} r={2.2} />
        <circle cx={72} cy={62} r={2.2} />
      </g>
      <path d="M 86 23 V 101" stroke={ink} strokeWidth={0.7} opacity={0.35} />
      <g fill={ink} textAnchor="middle">
        <text
          x={126}
          y={31}
          fontFamily="var(--font-mono)"
          fontSize={8}
          fontWeight={800}
          letterSpacing={1.15}
        >
          TRAVEL MEMORY
        </text>
        <text
          x={126}
          y={53}
          fontFamily="var(--font-sans)"
          fontSize={17}
          fontWeight={900}
          letterSpacing={1.15}
        >
          {country}
        </text>
        <text
          x={126}
          y={69}
          fontFamily="var(--font-mono)"
          fontSize={11}
          fontWeight={800}
          letterSpacing={1}
        >
          {city}
        </text>
        <text
          x={126}
          y={86}
          fontFamily="var(--font-mono)"
          fontSize={9}
          fontWeight={800}
        >
          {date}
        </text>
        <text
          x={126}
          y={101}
          fontFamily="var(--font-mono)"
          fontSize={6.3}
          fontWeight={700}
          letterSpacing={0.35}
        >
          {code} · {stay}
        </text>
      </g>
    </g>
  );
}

function KoreaArtwork({
  ink,
  accentInk,
  country,
  city,
  date,
  code,
  stay,
}: ArtworkProps) {
  return (
    <g fill="none">
      <path
        d="M 52 20 A 56 56 0 0 1 134 96"
        stroke={ink}
        strokeWidth={2.8}
        strokeLinecap="round"
        strokeDasharray="49 1.4 31 0.9"
      />
      <path
        d="M 134 96 A 56 56 0 0 1 52 20"
        stroke={accentInk}
        strokeWidth={2.8}
        strokeLinecap="round"
        strokeDasharray="45 1 36 1.3"
      />
      <circle cx={90} cy={62} r={50.5} stroke={ink} strokeWidth={0.65} opacity={0.46} />
      <g opacity={0.24}>
        <path d="M 48 68 Q 66 44 82 66 Q 96 47 112 67 Q 124 57 134 70" stroke={ink} strokeWidth={1} />
        <path d="M 49 74 C 67 65 76 84 93 74 C 108 66 119 80 132 73" stroke={accentInk} strokeWidth={1.15} />
        <path d="M 50 80 C 66 72 79 89 95 80 C 111 71 121 84 130 80" stroke={accentInk} strokeWidth={0.75} />
      </g>
      <path d="M 78 27 A 12 12 0 0 1 102 27" stroke={ink} strokeWidth={2} opacity={0.72} />
      <g textAnchor="middle">
        <text
          x={90}
          y={42}
          fill={accentInk}
          fontFamily="var(--font-mono)"
          fontSize={7.3}
          fontWeight={800}
          letterSpacing={1.25}
        >
          TRAVEL MEMORY
        </text>
        <text
          x={90}
          y={59}
          fill={ink}
          fontFamily="var(--font-sans)"
          fontSize={15.5}
          fontWeight={900}
          letterSpacing={1.15}
        >
          {country}
        </text>
        <text
          x={90}
          y={73}
          fill={accentInk}
          fontFamily="var(--font-mono)"
          fontSize={10.5}
          fontWeight={800}
          letterSpacing={1}
        >
          {city}
        </text>
        <text
          x={90}
          y={89}
          fill={ink}
          fontFamily="var(--font-mono)"
          fontSize={8.5}
          fontWeight={800}
        >
          {date}
        </text>
        <text
          x={90}
          y={101}
          fill={accentInk}
          fontFamily="var(--font-mono)"
          fontSize={5.8}
          fontWeight={700}
        >
          {code} · {stay}
        </text>
      </g>
    </g>
  );
}

function ThailandArtwork({
  ink,
  country,
  city,
  date,
  code,
  stay,
}: ArtworkProps) {
  return (
    <g fill="none" stroke={ink}>
      <ellipse
        cx={90}
        cy={62}
        rx={81}
        ry={52}
        strokeWidth={2.6}
        strokeDasharray="51 1.2 19 0.9 42 1.4"
      />
      <ellipse cx={90} cy={62} rx={75} ry={46} strokeWidth={0.8} opacity={0.65} />
      <g opacity={0.42} strokeLinejoin="round" strokeLinecap="round">
        <path d="M 90 18 V 32" strokeWidth={1.4} />
        <path d="M 84 32 L 90 23 L 96 32" strokeWidth={1.1} />
        <path d="M 64 48 L 90 29 L 116 48 L 108 46 L 90 35 L 72 46 Z" strokeWidth={1.2} />
        <path d="M 70 49 H 110 L 105 55 H 75 Z" strokeWidth={1} />
        <path d="M 78 55 V 65 M 102 55 V 65 M 84 55 V 65 M 96 55 V 65" strokeWidth={0.75} />
      </g>
      <path d="M 31 71 H 149" strokeWidth={0.65} strokeDasharray="2 2.3" opacity={0.36} />
      <g fill={ink} stroke="none" textAnchor="middle">
        <text
          x={90}
          y={46}
          fontFamily="var(--font-mono)"
          fontSize={7.2}
          fontWeight={800}
          letterSpacing={1.3}
        >
          TRAVEL MEMORY
        </text>
        <text
          x={90}
          y={65}
          fontFamily="var(--font-sans)"
          fontSize={15.5}
          fontWeight={900}
          letterSpacing={1.1}
        >
          {country}
        </text>
        <text
          x={90}
          y={80}
          fontFamily="var(--font-mono)"
          fontSize={10.2}
          fontWeight={800}
          letterSpacing={0.85}
        >
          {city}
        </text>
        <text
          x={90}
          y={94}
          fontFamily="var(--font-mono)"
          fontSize={8.3}
          fontWeight={800}
        >
          {date}
        </text>
        <text
          x={90}
          y={105}
          fontFamily="var(--font-mono)"
          fontSize={5.7}
          fontWeight={700}
        >
          {code} · {stay}
        </text>
      </g>
    </g>
  );
}

function ItalyArtwork({
  ink,
  country,
  city,
  date,
  code,
  stay,
}: ArtworkProps) {
  return (
    <g fill="none" stroke={ink}>
      <path
        d="M 31 113 L 14 96 V 43 L 29 27 Q 50 10 90 10 Q 130 10 151 27 L 166 43 V 96 L 149 113 Z"
        strokeWidth={2.6}
        strokeLinejoin="round"
        strokeDasharray="43 1.2 18 0.8 38 1.3"
      />
      <path
        d="M 34 107 L 20 93 V 46 L 33 32 Q 52 16 90 16 Q 128 16 147 32 L 160 46 V 93 L 146 107 Z"
        strokeWidth={0.8}
        opacity={0.67}
      />
      <g opacity={0.3} strokeWidth={0.95}>
        <path d="M 28 92 V 57 Q 28 33 52 33 Q 76 33 76 57 V 92" />
        <path d="M 34 92 V 58 Q 34 40 52 40 Q 70 40 70 58 V 92" />
        <path d="M 39 58 H 65 M 35 69 H 69 M 33 81 H 71" />
        <path d="M 42 58 V 92 M 52 58 V 92 M 62 58 V 92" />
      </g>
      <path d="M 82 27 V 99" strokeWidth={0.7} opacity={0.34} />
      <g fill={ink} stroke="none" textAnchor="middle">
        <text
          x={122}
          y={34}
          fontFamily="var(--font-mono)"
          fontSize={7.4}
          fontWeight={800}
          letterSpacing={1.15}
        >
          TRAVEL MEMORY
        </text>
        <text
          x={122}
          y={55}
          fontFamily="var(--font-sans)"
          fontSize={16}
          fontWeight={900}
          letterSpacing={1.1}
        >
          {country}
        </text>
        <text
          x={122}
          y={71}
          fontFamily="var(--font-mono)"
          fontSize={10.5}
          fontWeight={800}
          letterSpacing={0.9}
        >
          {city}
        </text>
        <text
          x={122}
          y={88}
          fontFamily="var(--font-mono)"
          fontSize={8.6}
          fontWeight={800}
        >
          {date}
        </text>
        <text
          x={122}
          y={101}
          fontFamily="var(--font-mono)"
          fontSize={5.6}
          fontWeight={700}
        >
          {code} · {stay}
        </text>
      </g>
    </g>
  );
}

function StampCopyBlock({
  ink,
  country,
  city,
  date,
  code,
  stay,
  x,
  top,
  countrySize = 14,
}: ArtworkProps & {
  x: number;
  top: number;
  countrySize?: number;
}) {
  return (
    <g fill={ink} stroke="none" textAnchor="middle">
      <text
        x={x}
        y={top}
        fontFamily="var(--font-mono)"
        fontSize={7.1}
        fontWeight={800}
        letterSpacing={1.05}
      >
        TRAVEL MEMORY
      </text>
      <text
        x={x}
        y={top + 19}
        fontFamily="var(--font-sans)"
        fontSize={countrySize}
        fontWeight={900}
        letterSpacing={0.9}
      >
        {country}
      </text>
      <text
        x={x}
        y={top + 34}
        fontFamily="var(--font-mono)"
        fontSize={9.6}
        fontWeight={800}
        letterSpacing={0.7}
      >
        {city}
      </text>
      <text
        x={x}
        y={top + 49}
        fontFamily="var(--font-mono)"
        fontSize={8.2}
        fontWeight={800}
      >
        {date}
      </text>
      <text
        x={x}
        y={top + 61}
        fontFamily="var(--font-mono)"
        fontSize={5.5}
        fontWeight={700}
        letterSpacing={0.2}
      >
        {code} · {stay}
      </text>
    </g>
  );
}

function ChinaArtwork(props: ArtworkProps) {
  const { ink } = props;

  return (
    <g fill="none" stroke={ink}>
      <path
        d="M 38 8 H 142 L 148 14 V 110 L 142 116 H 38 L 32 110 V 14 Z"
        strokeWidth={2.8}
        strokeLinejoin="round"
        strokeDasharray="31 1.1 13 0.8 38 1.4"
      />
      <path
        d="M 41 14 H 139 L 142 17 V 107 L 139 110 H 41 L 38 107 V 17 Z"
        strokeWidth={0.85}
        opacity={0.68}
      />
      <g opacity={0.28} strokeLinecap="round">
        <path
          d="M 50 31 C 52 23 61 22 65 28 C 68 19 83 19 86 29 C 94 25 101 30 99 37 H 50 C 45 37 45 32 50 31 Z"
          strokeWidth={1.2}
        />
        <path
          d="M 82 40 C 85 33 94 33 98 39 C 102 31 114 34 115 43 C 123 41 128 46 126 52 H 81 C 76 51 77 43 82 40 Z"
          strokeWidth={0.9}
        />
        <path d="M 44 101 Q 64 88 84 101 Q 105 87 136 101" strokeWidth={1.1} />
      </g>
      <path d="M 47 42 H 133" strokeWidth={0.65} strokeDasharray="2 2" opacity={0.35} />
      <StampCopyBlock {...props} x={90} top={45} countrySize={15} />
    </g>
  );
}

function UnitedStatesArtwork(props: ArtworkProps) {
  const { ink } = props;

  return (
    <g fill="none" stroke={ink}>
      <ellipse
        cx={90}
        cy={62}
        rx={81}
        ry={52}
        strokeWidth={2.7}
        strokeDasharray="42 1.3 24 0.8 39 1.1"
      />
      <ellipse cx={90} cy={62} rx={75} ry={46} strokeWidth={0.8} opacity={0.65} />
      <g opacity={0.3} strokeLinecap="round" strokeLinejoin="round">
        <path d="M 26 51 Q 46 28 76 42 L 62 47 L 78 52 L 59 54 L 76 63 Q 46 61 26 51 Z" strokeWidth={1.1} />
        <path d="M 154 51 Q 134 28 104 42 L 118 47 L 102 52 L 121 54 L 104 63 Q 134 61 154 51 Z" strokeWidth={1.1} />
        <path d="M 90 25 L 93 34 L 103 34 L 95 40 L 98 49 L 90 43 L 82 49 L 85 40 L 77 34 L 87 34 Z" strokeWidth={0.9} />
      </g>
      <path d="M 24 68 H 156" strokeWidth={0.65} strokeDasharray="3 2" opacity={0.34} />
      <StampCopyBlock {...props} x={90} top={48} countrySize={12.5} />
    </g>
  );
}

function VietnamArtwork(props: ArtworkProps) {
  const { ink } = props;

  return (
    <g fill="none" stroke={ink}>
      <path
        d="M 54 8 H 126 L 132 15 V 109 L 126 116 H 54 L 48 109 V 15 Z"
        strokeWidth={2.6}
        strokeLinejoin="round"
        strokeDasharray="29 1.1 18 0.8 35 1.3"
      />
      <path d="M 55 14 H 125 V 110 H 55 Z" strokeWidth={0.8} strokeDasharray="4 1.2" opacity={0.65} />
      <g opacity={0.34} strokeLinecap="round" strokeLinejoin="round">
        <path d="M 90 18 C 86 25 85 31 90 37 C 95 31 94 25 90 18 Z" strokeWidth={1} />
        <path d="M 89 37 C 76 32 69 38 70 46 C 80 48 87 45 90 38 C 93 45 100 48 110 46 C 111 38 104 32 91 37" strokeWidth={1} />
        <path d="M 71 49 Q 90 56 109 49 M 76 53 Q 90 59 104 53" strokeWidth={0.75} />
      </g>
      <path d="M 57 58 H 123" strokeWidth={0.7} strokeDasharray="2 2" opacity={0.36} />
      <StampCopyBlock {...props} x={90} top={46} countrySize={12.5} />
    </g>
  );
}

function AustraliaArtwork(props: ArtworkProps) {
  const { ink } = props;

  return (
    <g fill="none" stroke={ink}>
      <circle
        cx={90}
        cy={62}
        r={56}
        strokeWidth={2.7}
        strokeDasharray="37 1.2 19 0.8 44 1.4"
      />
      <circle cx={90} cy={62} r={50.5} strokeWidth={0.8} opacity={0.66} />
      <g fill={ink} stroke="none" opacity={0.34}>
        <path d="M 58 23 L 60 29 L 66 30 L 61 34 L 63 40 L 58 36 L 53 40 L 55 34 L 50 30 L 56 29 Z" />
        <circle cx={122} cy={31} r={2.1} />
        <circle cx={129} cy={42} r={1.7} />
        <circle cx={118} cy={47} r={1.8} />
        <circle cx={130} cy={57} r={1.5} />
      </g>
      <g opacity={0.3} strokeWidth={0.9}>
        <path d="M 44 75 C 56 68 66 82 78 75 C 91 67 103 82 116 75 C 124 70 131 75 136 78" />
        <path d="M 45 82 C 58 75 67 89 80 82 C 93 74 105 89 118 82 C 126 77 132 81 135 84" />
      </g>
      <StampCopyBlock {...props} x={90} top={40} countrySize={12} />
    </g>
  );
}

function SingaporeArtwork(props: ArtworkProps) {
  const { ink } = props;

  return (
    <g fill="none" stroke={ink}>
      <path
        d="M 19 11 H 159 L 171 24 V 100 L 159 113 H 19 L 9 101 V 23 Z"
        strokeWidth={2.7}
        strokeLinejoin="round"
        strokeDasharray="45 1.2 17 0.8 47 1.3"
      />
      <path d="M 23 17 H 156 L 165 27 V 97 L 156 107 H 23 L 15 98 V 27 Z" strokeWidth={0.8} opacity={0.67} />
      <g opacity={0.32} strokeLinecap="round" strokeLinejoin="round">
        <path d="M 25 92 H 78 M 31 92 V 66 H 39 V 92 M 44 92 V 55 H 53 V 92 M 58 92 V 70 H 67 V 92" strokeWidth={1} />
        <path d="M 31 66 L 35 58 L 39 66 M 44 55 L 48.5 45 L 53 55 M 58 70 L 62.5 62 L 67 70" strokeWidth={0.9} />
        <path d="M 34 36 C 39 26 51 26 56 36 C 51 39 46 38 45 33 C 44 40 39 42 34 36 Z" strokeWidth={0.9} />
      </g>
      <path d="M 84 21 V 102" strokeWidth={0.7} opacity={0.34} />
      <StampCopyBlock {...props} x={127} top={30} countrySize={11.5} />
    </g>
  );
}

function UnitedKingdomArtwork(props: ArtworkProps) {
  const { ink } = props;

  return (
    <g fill="none" stroke={ink}>
      <path
        d="M 16 14 H 164 L 171 22 V 102 L 163 110 H 17 L 9 102 V 22 Z"
        strokeWidth={2.6}
        strokeLinejoin="round"
        strokeDasharray="53 1.2 13 0.8 41 1.3"
      />
      <path d="M 21 20 H 159 L 165 26 V 97 L 159 104 H 21 L 15 97 V 26 Z" strokeWidth={0.8} strokeDasharray="5 1.3" opacity={0.66} />
      <g opacity={0.34} strokeLinecap="round" strokeLinejoin="round">
        <path d="M 29 51 L 38 35 L 48 49 L 58 33 L 68 49 L 77 35 L 84 51 Z" strokeWidth={1.2} />
        <path d="M 30 54 Q 57 61 83 54 L 79 67 Q 57 73 35 67 Z" strokeWidth={0.9} />
        <path d="M 28 88 C 39 80 49 84 58 76 C 67 69 76 70 84 64" strokeWidth={1} strokeDasharray="2 2" />
        <circle cx={28} cy={88} r={2} />
        <circle cx={84} cy={64} r={2} />
      </g>
      <path d="M 90 22 V 102" strokeWidth={0.7} opacity={0.33} />
      <StampCopyBlock {...props} x={130} top={30} countrySize={8} />
    </g>
  );
}

function SpainArtwork(props: ArtworkProps) {
  const { ink } = props;

  return (
    <g fill="none" stroke={ink}>
      <ellipse
        cx={90}
        cy={62}
        rx={81}
        ry={52}
        strokeWidth={2.7}
        strokeDasharray="48 1.2 18 0.8 43 1.4"
      />
      <ellipse cx={90} cy={62} rx={75} ry={46} strokeWidth={0.8} opacity={0.65} />
      <g opacity={0.34} strokeLinecap="round" strokeLinejoin="round">
        <circle cx={48} cy={35} r={10} strokeWidth={1} />
        <path d="M 48 18 V 13 M 48 57 V 52 M 31 35 H 26 M 70 35 H 65 M 36 23 L 32 19 M 60 47 L 64 51 M 60 23 L 64 19 M 36 47 L 32 51" strokeWidth={0.9} />
        <path d="M 27 93 V 65 Q 27 48 46 48 Q 65 48 65 65 V 93" strokeWidth={1.1} />
        <path d="M 34 93 V 66 Q 34 56 46 56 Q 58 56 58 66 V 93" strokeWidth={0.8} />
      </g>
      <path d="M 73 23 V 101" strokeWidth={0.7} opacity={0.33} />
      <StampCopyBlock {...props} x={119} top={31} countrySize={14} />
    </g>
  );
}

export function getPassportStampGenericMotifVariant(family: string) {
  let hash = 0;
  for (const character of family) {
    hash = (hash * 33 + (character.codePointAt(0) ?? 0)) >>> 0;
  }
  return hash % 4;
}

function GenericMotif({
  ink,
  variant,
  x,
  y,
}: {
  ink: string;
  variant: number;
  x: number;
  y: number;
}) {
  if (variant === 1) {
    return (
      <g transform={`translate(${x} ${y})`} fill="none" stroke={ink} opacity={0.28}>
        <path d="M -24 13 C -14 -15 6 -21 23 -8" strokeWidth={1} strokeDasharray="2 2" />
        <circle cx={-24} cy={13} r={2.4} strokeWidth={1} />
        <circle cx={23} cy={-8} r={2.4} strokeWidth={1} />
        <path d="M 18 -12 L 29 -8 L 19 -3 L 21 -8 Z" strokeWidth={0.9} strokeLinejoin="round" />
      </g>
    );
  }

  if (variant === 2) {
    return (
      <g transform={`translate(${x} ${y})`} fill="none" stroke={ink} opacity={0.28}>
        <path d="M -30 10 L -16 -9 L -7 1 L 3 -13 L 18 9 L 28 3" strokeWidth={1.1} strokeLinejoin="round" />
        <path d="M -31 15 C -19 8 -10 20 2 14 C 13 8 21 19 31 13" strokeWidth={0.9} />
        <path d="M -29 20 C -17 14 -9 25 3 19 C 14 13 22 24 29 19" strokeWidth={0.7} />
      </g>
    );
  }

  if (variant === 3) {
    return (
      <g transform={`translate(${x} ${y})`} fill={ink} stroke={ink} opacity={0.27}>
        <circle cx={-22} cy={-8} r={2} />
        <circle cx={-8} cy={8} r={1.6} />
        <circle cx={8} cy={-5} r={2.2} />
        <circle cx={24} cy={10} r={1.8} />
        <path d="M -22 -8 L -8 8 L 8 -5 L 24 10" fill="none" strokeWidth={0.8} strokeDasharray="2 2" />
        <path d="M 1 -22 L 3 -16 L 9 -15 L 4 -11 L 6 -5 L 1 -9 L -4 -5 L -2 -11 L -7 -15 L -1 -16 Z" stroke="none" />
      </g>
    );
  }

  return (
    <g transform={`translate(${x} ${y})`} fill="none" stroke={ink} opacity={0.29}>
      <circle r={27} strokeWidth={0.9} />
      <circle r={20} strokeWidth={0.65} strokeDasharray="2 2" />
      <path d="M 0 -23 L 5 -6 L 21 0 L 5 6 L 0 23 L -5 6 L -21 0 L -5 -6 Z" strokeWidth={1.05} />
      <circle r={3} strokeWidth={0.9} />
    </g>
  );
}

function GenericArtwork({
  geometry,
  variant,
  ...props
}: ArtworkProps & {
  geometry: PassportStampGeometry;
  variant: number;
}) {
  const { ink } = props;
  const splitLayout = geometry === "wide" || geometry === "polygon";

  return (
    <g fill="none" stroke={ink}>
      {geometry === "round" ? (
        <>
          <circle cx={90} cy={62} r={56} strokeWidth={2.5} strokeDasharray="39 1.2 26 0.8 42 1.3" />
          <circle cx={90} cy={62} r={50} strokeWidth={0.8} strokeDasharray="4 1.3" opacity={0.62} />
        </>
      ) : geometry === "oval" ? (
        <>
          <ellipse cx={90} cy={62} rx={81} ry={52} strokeWidth={2.5} strokeDasharray="44 1.2 19 0.8 47 1.3" />
          <ellipse cx={90} cy={62} rx={75} ry={46} strokeWidth={0.8} strokeDasharray="4 1.3" opacity={0.62} />
        </>
      ) : geometry === "square" ? (
        <>
          <path d="M 37 8 H 143 L 148 13 V 111 L 143 116 H 37 L 32 111 V 13 Z" strokeWidth={2.5} strokeLinejoin="round" strokeDasharray="34 1.2 19 0.8 41 1.3" />
          <path d="M 39 14 H 141 V 110 H 39 Z" strokeWidth={0.8} strokeDasharray="4 1.3" opacity={0.62} />
        </>
      ) : geometry === "polygon" ? (
        <>
          <path d="M 31 113 L 13 95 V 43 L 30 25 H 150 L 167 43 V 95 L 149 113 Z" strokeWidth={2.5} strokeLinejoin="round" strokeDasharray="39 1.2 22 0.8 44 1.3" />
          <path d="M 34 107 L 20 93 V 46 L 33 32 H 147 L 160 46 V 93 L 146 107 Z" strokeWidth={0.8} strokeDasharray="4 1.3" opacity={0.62} />
        </>
      ) : (
        <>
          <path d="M 18 12 H 162 L 172 24 V 100 L 161 112 H 19 L 8 100 V 24 Z" strokeWidth={2.5} strokeLinejoin="round" strokeDasharray="37 1.1 22 0.8 45 1.4" />
          <path d="M 23 18 H 157 L 166 27 V 97 L 157 106 H 23 L 14 97 V 27 Z" strokeWidth={0.8} strokeDasharray="4 1.3" opacity={0.62} />
        </>
      )}
      <GenericMotif
        ink={ink}
        variant={variant}
        x={splitLayout ? 50 : 90}
        y={splitLayout ? 61 : 31}
      />
      {splitLayout ? (
        <path d="M 84 21 V 103" strokeWidth={0.65} opacity={0.32} />
      ) : null}
      <StampCopyBlock
        {...props}
        x={splitLayout ? 128 : 90}
        top={splitLayout ? 30 : 42}
        countrySize={splitLayout ? 13 : 11.5}
      />
    </g>
  );
}

type ArtworkRenderer = (props: ArtworkProps) => ReactNode;

const ARTWORK_RENDERERS: Readonly<
  Record<PassportStampArtworkFamily, ArtworkRenderer>
> = {
  japan: JapanArtwork,
  taiwan: TaiwanArtwork,
  france: FranceArtwork,
  korea: KoreaArtwork,
  china: ChinaArtwork,
  "united-states": UnitedStatesArtwork,
  thailand: ThailandArtwork,
  vietnam: VietnamArtwork,
  australia: AustraliaArtwork,
  singapore: SingaporeArtwork,
  "united-kingdom": UnitedKingdomArtwork,
  italy: ItalyArtwork,
  spain: SpainArtwork,
};

function renderArtwork(
  family: string,
  props: ArtworkProps,
  fallbackGeometry: PassportStampGeometry,
) {
  if (!hasPassportStampArtwork(family)) {
    return (
      <GenericArtwork
        {...props}
        geometry={fallbackGeometry}
        variant={getPassportStampGenericMotifVariant(family)}
      />
    );
  }

  const Artwork = ARTWORK_RENDERERS[family];
  return <Artwork {...props} />;
}

export function PassportStampArtwork({
  trip,
  size,
}: {
  trip: Trip;
  size: PassportStampSize;
}) {
  const design = getPassportStampDesign(trip);
  const seed = getPassportStampTextureSeed(trip);
  const geometry =
    getPassportStampArtworkGeometry(design.family) ??
    FALLBACK_GEOMETRY[design.shape];
  const safeFamily = design.family.replaceAll(/[^a-z0-9-]/gi, "-");
  const assetId = `passport-${safeFamily}-${seed.toString(36)}-${size}`;
  const copy: ArtworkCopy = {
    country:
      COUNTRY_LABELS[design.family] ?? compactLabel(trip.country, 15),
    city: cityLabel(trip.city),
    date: stampDate(trip.endDate),
    code: getPassportStampCode(trip),
    stay: stayCode(trip.startDate, trip.endDate),
  };
  const artwork = renderArtwork(
    design.family,
    {
      ...copy,
      ink: design.ink,
      accentInk: design.accentInk ?? design.borderInk ?? design.ink,
    },
    geometry,
  );
  const style: CSSProperties = {
    color: design.ink,
    rotate: `${design.rotation}deg`,
  };

  return (
    <span
      aria-hidden="true"
      data-stamp-country={trip.country}
      data-stamp-family={design.family}
      data-stamp-shape={design.shape}
      data-stamp-size={size}
      data-stamp-artwork={`${design.family}-travel-memory`}
      className={cn(
        "relative block shrink-0 select-none opacity-[0.91] mix-blend-multiply",
        size === "notebook" ? "size-full" : PREVIEW_SIZE_CLASSES[geometry],
      )}
      style={style}
    >
      <svg
        viewBox={VIEW_BOXES[geometry]}
        className="size-full overflow-visible"
        fill="none"
        focusable="false"
        role="presentation"
        shapeRendering="geometricPrecision"
      >
        <InkTextureDefs assetId={assetId} seed={seed} />
        <Impression assetId={assetId}>{artwork}</Impression>
      </svg>
    </span>
  );
}
