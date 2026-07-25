import type { ShotSort } from "./schema";

export const MAX_SHOT_IMAGES = 10;

export const SHOT_SORT_OPTIONS: { value: ShotSort; label: string }[] = [
  { value: "newest", label: "최신순" },
  { value: "likes", label: "좋아요순" },
];

export const POPULAR_DESTINATIONS = [
  { city: "시드니", country: "호주" },
  { city: "뉴욕", country: "미국" },
  { city: "바르셀로나", country: "스페인" },
  { city: "오사카", country: "일본" },
  { city: "파리", country: "프랑스" },
  { city: "나트랑", country: "베트남" },
  { city: "삿포로", country: "일본" },
  { city: "상하이", country: "중국" },
  { city: "로마", country: "이탈리아" },
  { city: "LA", country: "미국" },
  { city: "발리", country: "인도네시아" },
  { city: "리스본", country: "포르투갈" },
  { city: "싱가포르", country: "싱가포르" },
  { city: "오키나와", country: "일본" },
  { city: "괌", country: "미국" },
  { city: "도쿄", country: "일본" },
] as const;
