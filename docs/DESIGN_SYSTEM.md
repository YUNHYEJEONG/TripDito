# 트립디토 디자인 시스템

**이 파일이 디자인의 기준 문서입니다.** 색·로고·간격을 바꿀 때는 이 문서와 아래 소스 파일을 함께 갱신합니다.

| 디자인 요소 | 소스 파일 (코드 기준) |
|------|------|
| 색·그림자·라운드 토큰 | `app/globals.css` (`:root` 라이트 / `.dark` 다크) |
| TS에서 쓰는 브랜드 상수 | `config/design-system.ts` |
| 브랜드 에셋 경로 | `config/app.ts` → `appConfig.brand` |
| 로고·아이콘 원본 | `D:\project\ALPHA\트립디토_로고_20260828` (원본), `public/brand/` (배포용) |

## 브랜드

| 항목 | 내용 |
|------|------|
| 한글명 | 트립디토 |
| 영문명 | TripDito |
| 의미 | DITTO + Trip — 복잡함 없이 여행 쇼핑 |
| 심볼 | 하트 체크 마크 (블루 그라데이션) |
| 로고 | 심볼 + `TripDito` 워드마크 일체형 |

### 로고 팔레트 (트립디토_로고_20260828 기준)

| 이름 | 값 | 용도 |
|------|-----|------|
| primary | `#3182F6` | 주요 액션(CTA)·링크·선택 상태 |
| secondary | `#62CBFF` | 보조 포인트·배지·하이라이트 |
| gradient | `#62CBFF → #3182F6` (135deg) | 스플래시·앱 아이콘·특별 강조 |
| black | `#191F28` | 본문 텍스트·다크 요소 |
| white | `#FFFFFF` | 배경·다크 배경 위 로고 |

- 파생 색: 소프트 블루 `#E8F3FF`(`--brand-soft`, hover/배너), 딥 블루 텍스트 `#1B64DA`(소프트 블루 위 글자)
- **오렌지/앰버 포인트는 폐기** — 경고(warning) 시맨틱 색으로만 `#FFB703`이 남아 있음
- CSS 유틸리티: `.brand-gradient`(배경), `.text-brand-gradient`(글자) — `app/globals.css`

### 브랜드 에셋 (`public/brand/`)

| 파일 | 내용 |
|------|------|
| `logo.svg` / `logo.png` | 완성 로고 (라이트 배경) |
| `logo-white.svg` / `.png` | 완성 로고 (다크 배경, 워드마크 화이트) |
| `logo-text-white.svg` | 텍스트만 화이트 (그라데이션 배경 위, 스플래시) |
| `symbol.svg` / `.png` | 하트 마크 (그라데이션) |
| `symbol-white.svg` / `.png` | 하트 마크 화이트 |
| `app-icon.png` | 앱 아이콘 1024px — 그라데이션 배경 + 화이트 마크 |
| `favicon.ico` / `.png` / `.svg` | 파비콘 (그라데이션 마크) |

- 에셋 재생성 스크립트 패턴: sharp로 SVG 원본에서 일괄 생성 (원본 SVG가 항상 기준)
- 캐시 무효화: 에셋 교체 시 `config/app.ts`·`app/layout.tsx`의 `?v=` 버전을 올린다

## 시맨틱 컬러 토큰 (라이트 기준, `app/globals.css`)

| 토큰 | 값 | 용도 |
|------|-----|------|
| `--primary` | `#3182F6` | CTA·선택 |
| `--accent` | `#E8F3FF` / 글자 `#1B64DA` | hover·소프트 강조 |
| `--highlight` | `#62CBFF` / 글자 `#191F28` | 보조 강조 버튼 |
| `--brand-soft` | `#E8F3FF` | 안내 배너 |
| `--surface-gray` | `#F2F4F6` | 회색 설명 카드(`GrayCard`) |
| `--success` / `--error` / `--warning` | `#03B26C` / `#F04452` / `#FFB703` | 상태 |
| `--chart-1~5` | `#62CBFF` `#3182F6` `#1B64DA` `#191F28` `#8B95A1` | 차트 블루 스케일 |

다크 모드 값은 `app/globals.css`의 `.dark` 블록 참조 (기조 동일, 명도만 조정).

## 여권(passport) 화면 전용 팔레트

여권은 실물 여권의 느낌을 내는 **독립 팔레트**를 사용한다 (`--passport-*`, `app/globals.css`).
네이비 표지 `#102E4E` + 골드 포일 `#D8BD76` + 보안용지 톤 종이색. 앱 공통 토큰과 섞지 않는다.

## 현재 적용된 방향

| 항목 | 내용 |
|------|------|
| 느낌 | 화이트 배경, 토스/오늘의집형 밀도, 세련됨 |
| 브랜드 컬러 | 로고 블루 `#3182F6` + 스카이 `#62CBFF` |
| 특별 강조 | 로고 그라데이션 (스플래시·앱 아이콘) |
| 회색 카드 | `GrayCard` (`#F2F4F6`) — 설명/안내용 |
| 흰 카드 | 기존 `Card` 유지 |

## 레이아웃 간격 (공통)

| 토큰 | 값 | 사용처 |
|------|-----|--------|
| 카드 스택 간격 | **12px** (`gap-3`, 기존 24px의 절반) | 홈 등 세로로 쌓인 섹션/카드 |

- 컴포넌트: `CardStack` (`components/layout/card-stack.tsx`)
- 설정: `designSystem.layout.cardStackGap` / `cardStackGapClass`
- 규칙: 홈·요약 대문처럼 **카드/섹션을 세로로 나열할 때** `CardStack`을 쓰고, 임의로 `gap-6` 등을 쓰지 않습니다.

## 폼 컨트롤 라운드 (공통)

| 토큰 | 값 | 사용처 |
|------|-----|--------|
| 컨트롤 라운드 | **8px** (`rounded-lg`) | Input, Textarea, Select, Button |

- 설정: `designSystem.radius.control` / `controlClass`
- 규칙: 입력란·셀렉트·버튼은 **약한 라운드**를 씁니다. `rounded-xl`(12px)처럼 더 둥글게 만들지 않습니다.
- 구현: `components/ui/input.tsx`, `textarea.tsx`, `select.tsx`, `button.tsx`

### 입력란 + 액션 버튼 조합

| 항목 | 규칙 |
|------|------|
| 레이아웃 | `FieldActionRow` (`items-center`, `gap-2`) |
| 입력 | `Input` `variant="field"` — `h-10` + `rounded-lg` |
| 버튼 | `Button` `size="fieldAction"` — `h-10` + `rounded-lg` |

- 입력란과 옆 물리 버튼은 **같은 높이·같은 둥글기·세로 중앙**을 맞춥니다.
- 예: 회원가입 이메일+중복검사, 프로필 닉네임+저장

## 반응형 (대중적 구간)

| 구간 | 너비 | 콘텐츠 최대폭 |
|------|------|----------------|
| 모바일 | 320 ~ 767px | 480px |
| 태블릿 | 768 ~ 1023px | 720px |
| 데스크톱 | 1024px+ | 960px |

## 다음에 디자인 요청할 때 이렇게 말하면 됩니다

```
1. 느낌: (예: 더 밝게 / 그라데이션 포인트를 더 많이)
2. 바꿀 화면: (예: 홈만 / 쇼핑 리스트 / 전체)
3. 참고: (앱 이름 또는 캡처)
4. 꼭 지킬 것 / 싫어하는 것
```

## 색을 바꿀 때 체크리스트

1. `app/globals.css` — `:root`와 `.dark` 두 블록 모두
2. `config/design-system.ts` — `brand` 상수
3. 이 문서의 팔레트 표
4. 하드코딩 hex 검색: `grep -rn "#3182F6\|#62CBFF" features components app`
