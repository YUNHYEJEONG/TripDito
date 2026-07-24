# Shopping List (PoC) — 개발 계획

> 근거: [`PROJECT_REQUIREMENTS.md`](./PROJECT_REQUIREMENTS.md)  
> 상태: **PoC M0–M6 완료** — 데모 Seed / 스토리지 경고 / AI 문서 포함

---

## 1. 전체 프로젝트 분석

### 1.1 한 줄 요약

여행 전 저장한 상품 이미지로 쇼핑 리스트를 만들고, 여행 중 모바일 체크리스트로 쓰는 **Consumer 웹 PoC**.

### 1.2 문제 / 해결

| 문제 | 해결 |
|------|------|
| SNS·블로그에서 모은 상품 정보가 흩처로만 흩어짐 | 이미지 업로드 → (Mock)상품 추출 → 리스트화 |
| 여행 중 무엇을 살지·샀는지 관리가 어려움 | 여행 단위 쇼핑 리스트 + 구매 체크 + 예산 |
| PC 준비 / 모바일 현장 사용 맥락이 다름 | Mobile First 반응형, PC·모바일 UX 차별 |

### 1.3 MVP 핵심 도메인

```
Trip (여행)
  └── ShoppingItem (상품)  ← ImageUpload → (AI Mock) → 생성
```

- **Trip**: 여행 CRUD + 예산/통화 맥락
- **ShoppingItem**: 리스트의 단위 엔티티 (이미지·가격·수량·구매여부)
- **ImageAnalysis (향후 AI)**: MVP는 Mock adapter, 동일 인터페이스로 교체 가능하게 설계

### 1.4 명시적 비범위 (MVP)

로그인/회원가입, DB, 실제 AI API, GPS·지도, 커뮤니티·리뷰·공유·알림.

**데이터 영속화: Local Storage only.**

### 1.5 기술·구조 제약

| 항목 | 결정 |
|------|------|
| 프레임워크 | Next.js 16 App Router + React 19 + TS |
| UI | Tailwind + shadcn/ui (base-luma) |
| 폼/검증 | React Hook Form + Zod |
| 서버 상태 | TanStack Query (로컬 스토어 위 캐시·뮤테이션 패턴) |
| Seed | `starter-web`은 스택 참고만. **레이아웃·폴더 관례 복제 금지** |
| UX | Consumer Service — 최소 클릭, 한 손 조작, 정보 우선 디자인 |

### 1.6 설계 리스크와 대응

| 리스크 | 대응 |
|--------|------|
| Local Storage 용량·이미지 Base64 비대 | 이미지 압축/리사이즈 + 썸네일 저장 전략, 원본은 선택적 |
| AI 연동 시점 미정 | `ImageAnalysisPort` 인터페이스 + Mock 구현 분리 |
| Query + Local Storage 이중 상태 | Repository 레이어를 단일 진실 공급원으로 두고 Query는 그 위 래핑 |
| Admin형 레이아웃 유혹 | App shell을 여행 리스트 / 여행 상세(체크리스트) 두 축만으로 단순화 |

---

## 2. 프로젝트 구조 제안

### 2.1 아키텍처 원칙

1. **Feature 기반** — 도메인별 `features/*`에 타입·스키마·스토어·훅·UI를 모은다.
2. **UI 계층 분리**
   - `components/ui` — shadcn 원본
   - `components/common` — 도메인 무관 조합 (Empty, Progress, ConfirmDialog 등)
   - `components/layout` — AppShell, BottomNav, PageHeader 등 셸만
   - `features/*/components` — 도메인 전용 UI
3. **데이터 접근 단일화** — `lib/storage` + feature `repository` / `mock`  
   페이지·컴포넌트는 repository/hooks만 호출.
4. **AI 교체 지점** — `features/image-analysis`에 Port + Mock (+ 향후 Api) 어댑터.
5. **타입 우선** — Zod 스키마 → inferred type을 단일 소스로 사용.

### 2.2 런타임 데이터 흐름

```
[UI]
  → hooks (TanStack Query)
    → repository (features/*/data)
      → localStorage adapter (lib/storage)
      → image-analysis adapter (mock | future api)
```

### 2.3 라우팅 철학

- Auth 그룹 없음 (MVP).
- **여행 목록**이 홈.
- **여행 상세**가 실제 작업 공간(쇼핑 리스트).
- 상품 등록/수정은 상세 내 Sheet/Dialog 또는 짧은 서브 라우트 — 모바일에서는 Sheet 우선.

---

## 3. 폴더 구조

```
trip-shopping/
├── app/
│   ├── layout.tsx                 # Root: fonts, providers, globals
│   ├── page.tsx                   # 여행 목록 (홈)
│   ├── trips/
│   │   ├── new/page.tsx           # 여행 생성
│   │   └── [tripId]/
│   │       ├── page.tsx           # 쇼핑 리스트 (메인 작업 화면)
│   │       ├── edit/page.tsx      # 여행 수정
│   │       └── items/
│   │           ├── new/page.tsx   # 수동 상품 등록 (선택)
│   │           └── [itemId]/
│   │               └── edit/page.tsx
│   ├── not-found.tsx
│   ├── error.tsx
│   └── globals.css
│
├── components/
│   ├── ui/                        # shadcn
│   ├── common/                    # EmptyState, ConfirmDialog, SearchInput,
│   │                              # ProgressBar, CurrencyText, FilterChips...
│   └── layout/                    # AppShell, PageHeader, BottomBar, FAB
│
├── features/
│   ├── trips/
│   │   ├── types.ts
│   │   ├── schema.ts              # Zod
│   │   ├── constants.ts
│   │   ├── data/
│   │   │   └── trip-repository.ts
│   │   ├── hooks/
│   │   │   ├── use-trips.ts
│   │   │   └── use-trip.ts
│   │   ├── components/
│   │   │   ├── trip-card.tsx
│   │   │   ├── trip-form.tsx
│   │   │   └── trip-list.tsx
│   │   └── utils/
│   │       └── trip-date.ts
│   │
│   ├── shopping-items/
│   │   ├── types.ts
│   │   ├── schema.ts
│   │   ├── constants.ts           # sort/filter keys
│   │   ├── data/
│   │   │   └── item-repository.ts
│   │   ├── hooks/
│   │   │   ├── use-items.ts
│   │   │   ├── use-item-mutations.ts
│   │   │   └── use-item-filters.ts
│   │   ├── components/
│   │   │   ├── item-card.tsx
│   │   │   ├── item-list.tsx
│   │   │   ├── item-form.tsx
│   │   │   ├── item-filters.tsx
│   │   │   ├── purchase-toggle.tsx
│   │   │   └── list-summary.tsx   # 진행률·예산 요약
│   │   └── utils/
│   │       ├── item-sort.ts
│   │       ├── item-filter.ts
│   │       └── budget.ts
│   │
│   ├── image-upload/
│   │   ├── types.ts
│   │   ├── schema.ts
│   │   ├── components/
│   │   │   ├── image-uploader.tsx
│   │   │   ├── camera-capture.tsx
│   │   │   └── image-preview-grid.tsx
│   │   ├── hooks/
│   │   │   └── use-image-files.ts
│   │   └── utils/
│   │       └── compress-image.ts
│   │
│   ├── image-analysis/            # AI 교체 지점
│   │   ├── types.ts
│   │   ├── port.ts                # analyzeImages(files) → ProposedItem[]
│   │   ├── mock-analyzer.ts
│   │   ├── hooks/
│   │   │   └── use-analyze-images.ts
│   │   └── components/
│   │       └── analysis-result-sheet.tsx  # Mock 결과 확인·편집 후 일괄 등록
│   │
│   └── budget/                    # 계산 로직 집중 (선택: shopping-items/utils에 둘 수도 있음)
│       ├── types.ts
│       └── utils/
│           └── calculate-budget.ts
│
├── lib/
│   ├── utils.ts                   # cn
│   ├── storage/
│   │   ├── keys.ts
│   │   ├── local-storage.ts       # get/set/remove + SSR guard
│   │   └── id.ts                  # crypto.randomUUID 등
│   └── format/
│       ├── currency.ts
│       └── date.ts
│
├── providers/
│   ├── app-providers.tsx
│   ├── query-provider.tsx
│   └── theme-provider.tsx
│
├── config/
│   ├── app.ts                     # 앱명, 기본 통화 등
│   └── currencies.ts              # MVP 지원 통화 목록
│
├── hooks/                         # 전역 훅 (media query, debounce 등)
├── public/
└── docs/
    └── plan/
        ├── PROJECT_REQUIREMENTS.md
        └── DEVELOPMENT_PLAN.md    # 본 문서
```

### 3.1 폴더 규칙

| 규칙 | 설명 |
|------|------|
| `app/` | 라우트·페이지 조립만. 비즈니스 로직 최소화 |
| `features/*/data` | Local Storage CRUD의 유일한 진입점 |
| `features/*/hooks` | Query key·mutation·캐시 무효화 |
| cross-feature import | `trips` ← `shopping-items` 허용(소속), 반대 방향은 최소화 |
| AI | `image-analysis`만 외부 서비스 개념을 가짐 |

---

## 4. Feature 분리 전략

### 4.1 Feature 맵

| Feature | 책임 | 소유 데이터 |
|---------|------|-------------|
| `trips` | 여행 CRUD, 여행 카드/폼 | `Trip[]` |
| `shopping-items` | 상품 CRUD, 필터·정렬, 구매 토글, 리스트 UI | `ShoppingItem[]` |
| `image-upload` | 파일/카메라 입력, 압축, 미리보기 | (일시적 File/Blob 상태) |
| `image-analysis` | 이미지 → 제안 상품 (Mock/API) | 없음 (순수 변환) |
| `budget` | 예산 집계 순수 함수 | 없음 (파생값) |

### 4.2 경계 규칙

1. **업로드와 분석 분리**  
   - Upload는 파일을 넘기고, Analysis는 `ProposedItem[]`만 반환.  
   - 최종 저장은 `shopping-items` mutation이 담당.
2. **예산은 파생 데이터**  
   - Local Storage에 별도 저장하지 않음.  
   - `trip.budget` + `items[]`로 계산.
3. **Trip 삭제 시 Item cascade**  
   - `trip-repository.remove`가 해당 `tripId` items도 함께 삭제 (또는 트랜잭션성 helper).
4. **Query Key 네임스페이스**
   - `['trips']`, `['trips', tripId]`, `['items', tripId]`, `['items', tripId, itemId]`

### 4.3 AI 연동 준비 (구현은 Mock만)

```ts
// features/image-analysis/port.ts (개념)
export type ProposedItem = {
  name: string;
  estimatedPrice?: number;
  quantity?: number;
  memo?: string;
  sourceImageId: string;
};

export interface ImageAnalyzer {
  analyze(images: AnalyzableImage[]): Promise<ProposedItem[]>;
}
```

- MVP: `MockImageAnalyzer` — 파일명/더미 상품 풀에서 1~N개 생성.
- 이후: `ApiImageAnalyzer`로 교체, hook/UI 변경 최소화.

---

## 5. 데이터 모델 설계

### 5.1 Local Storage 스키마

| Key | Value |
|-----|--------|
| `trip-shopping:trips` | `Trip[]` |
| `trip-shopping:items` | `ShoppingItem[]` |
| `trip-shopping:meta` | `{ version: number }` (마이그레이션용) |

이미지는 item에 **data URL 또는 Object URL 대체용 base64(압축)** 로 저장.  
용량 이슈 시 후속: IndexedDB로 이미지 분리 (MVP 이후).

### 5.2 Trip

```ts
type CurrencyCode = "KRW" | "JPY" | "USD" | "EUR" | "CNY" | string;

type Trip = {
  id: string;
  name: string;           // 여행명
  country: string;        // 국가
  city: string;           // 도시
  startDate: string;      // ISO date (YYYY-MM-DD)
  endDate: string;        // ISO date
  currency: CurrencyCode;
  budget: number;         // 총 예산 (trip.currency 기준)
  createdAt: string;      // ISO datetime
  updatedAt: string;
};
```

**검증 (Zod 요지)**  
- `endDate >= startDate`  
- `name`, `country`, `city` 필수·trim  
- `budget >= 0`

### 5.3 ShoppingItem

```ts
type ShoppingItem = {
  id: string;
  tripId: string;
  name: string;
  imageDataUrl: string | null;  // 압축 썸네일
  estimatedPrice: number;       // 단가 예상
  quantity: number;             // >= 1
  memo: string;
  purchased: boolean;
  purchasedAt: string | null;
  sortOrder: number;            // 수동 정렬 여지 (MVP는 createdAt/가격 정렬 위주)
  createdAt: string;
  updatedAt: string;
};
```

**파생**

```ts
lineTotal = estimatedPrice * quantity
```

### 5.4 예산 집계 (파생)

```ts
type BudgetSummary = {
  tripBudget: number;
  estimatedTotal: number;      // 전 상품 lineTotal 합
  purchasedTotal: number;      // purchased === true 합
  remainingBudget: number;     // tripBudget - purchasedTotal (정책: 구매완료 기준)
  purchaseProgress: number;    // purchasedCount / totalCount (0~1)
};
```

**정책 (MVP 확정안)**  
- **남은 예산** = `trip.budget - purchasedTotal`  
- **예상 예산(리스트 헤더)** = `estimatedTotal` (아직 안 산 것 포함 전체 예상)  
- UI에 두 지표를 구분해 표기 (혼동 방지)

### 5.5 필터 / 정렬 (클라이언트)

| 필터 | 값 |
|------|-----|
| 구매상태 | `all` \| `pending` \| `purchased` |
| 검색 | `name` + `memo` 부분 일치 |

| 정렬 | 값 |
|------|-----|
| 최신순 | `createdAt_desc` (기본) |
| 가격 높은/낮은 | `price_desc` / `price_asc` |
| 이름 | `name_asc` |

### 5.6 Image Analysis I/O

```ts
type AnalyzableImage = {
  id: string;
  dataUrl: string;
  fileName?: string;
};

// → ProposedItem[] → 사용자 확인 후 ShoppingItem createMany
```

---

## 6. 페이지 구조

### 6.1 라우트 맵

| 경로 | 목적 | 주요 UX |
|------|------|---------|
| `/` | 여행 목록 | 카드 리스트, FAB/CTA「여행 추가」 |
| `/trips/new` | 여행 생성 | 풀페이지 폼 (모바일) |
| `/trips/[tripId]` | **쇼핑 리스트 메인** | 요약·검색·필터·목록·업로드 FAB |
| `/trips/[tripId]/edit` | 여행 수정 | 폼 + 삭제 |
| `/trips/[tripId]/items/new` | 수동 상품 등록 | 이미지 선택 가능 폼 |
| `/trips/[tripId]/items/[itemId]/edit` | 상품 수정 | 폼 + 삭제 |

> 업로드→분석→확인 플로우는 **라우트 대신 Sheet/Dialog**로 두는 것을 권장 (클릭 수·맥락 유지).  
> 수동 등록만 필요 시 서브 라우트 유지.

### 6.2 화면별 구성

**A. 여행 목록 `/`**
- Header: 앱 타이틀
- Body: TripCard 리스트 / EmptyState
- CTA: 새 여행
- Card 정보: 여행명, 도시·국가, 기간, 간단 진행률(옵션)

**B. 쇼핑 리스트 `/trips/[tripId]`** (MVP 핵심)
1. Sticky Header — 여행명, 뒤로가기, 편집 진입
2. Summary — 구매 진행률, 예상 총액, 남은 예산
3. Toolbar — 검색, 필터, 정렬
4. ItemList — ItemCard (이미지·이름·가격·수량·체크)
5. FAB / Bottom action — 「사진으로 추가」 (+ 수동 추가)

**C. 이미지 추가 플로우 (Sheet)**
1. 앨범 / 카메라 / 다중 선택  
2. 미리보기  
3. 「분석」(Mock)  
4. 제안 목록 수정  
5. 「리스트에 추가」

**D. 여행/상품 폼**
- RHF + Zod  
- 모바일: 큰 터치 타겟, sticky submit

### 6.3 반응형 브레이크포인트 (안)

| | Mobile | Tablet | Desktop |
|--|--------|--------|---------|
| 목록 | 1열 카드 | 2열 | 2~3열 또는 좌 목록·우 미리보기(선택) |
| 쇼핑 리스트 | 풀폭 리스트 | 동일 + 여백 | max-width 컨테이너, Summary 상단 가로 배치 |
| 폼/Sheet | 풀스크린 Sheet | Dialog/Sheet | Dialog |

PC는 **준비·편집**이 편하도록 넓은 폼·그리드, 모바일은 **체크·촬영**이 엄지 영역에 오도록 FAB/BottomBar.

---

## 7. 컴포넌트 구조

### 7.1 Layout

| 컴포넌트 | 역할 |
|----------|------|
| `AppShell` | min-h-screen, safe-area, 배경 |
| `PageHeader` | 뒤로가기, 타이틀, actions |
| `BottomBar` | 모바일 주요 액션 (선택) |
| `FloatingActionButton` | 이미지 추가 등 |

### 7.2 Common

| 컴포넌트 | 역할 |
|----------|------|
| `EmptyState` | 여행/상품 없음 |
| `ConfirmDialog` | 삭제 확인 |
| `SearchInput` | 디바운스 검색 |
| `FilterChips` | 구매상태 필터 |
| `SortSelect` | 정렬 |
| `ProgressBar` / `ProgressRing` | 구매 진행률 |
| `CurrencyText` | 통화 포맷 |
| `DateRangeText` | 기간 표시 |
| `LoadingBlock` | 스켈레톤/스피너 |

### 7.3 Feature UI (요약)

**trips:** `TripList`, `TripCard`, `TripForm`  
**shopping-items:** `ItemList`, `ItemCard`, `ItemForm`, `ListSummary`, `PurchaseToggle`, `ItemToolbar`  
**image-upload:** `ImageUploader`, `CameraCapture`, `ImagePreviewGrid`  
**image-analysis:** `AnalysisResultSheet`, `ProposedItemRow`

### 7.4 shadcn 우선 도입 후보

`button`, `input`, `label`, `textarea`, `select`, `dialog`, `sheet`, `dropdown-menu`, `checkbox`, `badge`, `progress`, `separator`, `sonner`(toast), `card`(필요 시 — 카드가 interaction 컨테이너일 때만)

디자인 원칙: **불필요한 카드·장식 지양**, 리스트·타이포·여백으로 계층.

---

## 8. 개발 순서

의존성 낮은 기반 → 도메인 → UX 폴리시 순.

```
Phase 0  기반 정리
Phase 1  Trip CRUD + Storage
Phase 2  Shopping Item CRUD + List UX
Phase 3  Budget / Progress
Phase 4  Image Upload + Mock Analysis
Phase 5  검색·필터·정렬 + 반응형 폴리시
Phase 6  PoC 마감 (빈 상태·에러·성능·문서)
```

각 Phase는 아래 Milestone 완료 기준을 만족해야 다음으로 진행.

---

## 9. TODO 목록

### Phase 0 — 기반

- [x] `config/app.ts`, `config/currencies.ts`
- [x] `lib/storage` (SSR-safe get/set, schema version)
- [x] `lib/format` (currency, date)
- [x] 필요한 shadcn 컴포넌트 추가
- [x] `AppShell` / `PageHeader` 최소 셸
- [x] 기존 플레이스홀더 페이지를 라우트 골격으로 교체 (빈 UI)

### Phase 1 — 여행

- [x] Trip Zod schema + types
- [x] `trip-repository` (list/create/update/remove + cascade 훅 준비)
- [x] `useTrips` / `useTrip` / mutations
- [x] `/` 여행 목록 + Empty
- [x] `/trips/new`, `/trips/[tripId]/edit`
- [x] 여행 삭제 Confirm

### Phase 2 — 상품

- [x] ShoppingItem schema + types
- [x] `item-repository`
- [x] Item hooks + mutations (CRUD, toggle purchased)
- [x] `/trips/[tripId]` 리스트 + ItemCard
- [x] 수동 등록/수정 페이지 또는 Sheet
- [x] 상품 삭제 Confirm

### Phase 3 — 예산

- [x] `calculate-budget` 유틸 + 단위 테스트(가벼운 순수함수 검증)
- [x] `ListSummary` (진행률·예상·구매완료·남은예산)
- [x] 구매 토글 시 Summary 즉시 반영

### Phase 4 — 이미지 & Mock AI

- [x] 이미지 압축 유틸 (max edge / quality)
- [x] `ImageUploader` (multi) + `CameraCapture` (input capture)
- [x] `ImageAnalyzer` port + `MockImageAnalyzer`
- [x] `useAnalyzeImages`
- [x] Analysis 결과 확인 Sheet → `createMany` items
- [x] 업로드 실패/빈 파일 UX

### Phase 5 — 리스트 고도화 & 반응형

- [x] 검색 (name/memo)
- [x] 필터 (all/pending/purchased)
- [x] 정렬
- [x] Mobile FAB / sticky summary 조정
- [x] Tablet·Desktop 레이아웃 점검
- [x] 터치 타겟·한 손 영역 점검

### Phase 6 — PoC 마감

- [x] not-found / error 경계
- [x] Local Storage 용량 경고(대략)
- [x] Seed mock trips/items (데모용 옵션)
- [x] README 사용 시나리오 업데이트
- [x] `npm run build` / lint 통과
- [x] AI 연동 시 교체 포인트 문서화 (`docs/plan` 또는 짧은 ARCHITECTURE note)

---

## 10. 단계별 완료 기준 (Milestone)

### M0 — Foundation Ready

- Providers·경로 alias·storage 헬퍼 동작
- 빈 AppShell로 `/` 렌더
- `npm run build` 성공  
**완료 시:** 도메인 코드 추가 가능한 골격

### M1 — Trip Management Done

- 여행 생성·수정·삭제·목록
- 새로고침 후에도 Local Storage로 유지
- 필수 필드 검증 메시지 표시  
**완료 시:** 여행 없이 상품 화면 진입 불가(잘못된 id → not-found)

### M2 — Shopping List Core Done

- 특정 여행에서 상품 CRUD + 구매 체크
- 카드에 이미지(없을 때 placeholder)·가격·수량·메모
- 여행 삭제 시 상품도 삭제  
**완료 시:** 체크리스트로 쓸 수 있는 최소 수직 슬라이스

### M3 — Budget Visible

- Summary에 예상 총액 / 구매 완료 금액 / 남은 예산 / 진행률
- 수치 정책이 UI 카피와 일치  
**완료 시:** 예산 의사결정에 필요한 숫자 제공

### M4 — Image-to-Items Path Done

- 다중 이미지·카메라 입력
- Mock 분석 → 확인 → 리스트 반영
- Analyzer 인터페이스가 Mock에만 의존 (API 호출 없음)  
**완료 시:** 요구사항「이미지 등록」MVP 충족 + AI 교체 준비

### M5 — List UX Done

- 검색·필터·정렬 동작
- Mobile / Tablet / Desktop에서 핵심 플로우(목록→상세→체크→사진추가) 사용 가능  
**완료 시:** Consumer UX 기준 충족으로 데모 가능

### M6 — PoC Ship

- 빈 상태·에러·삭제 확인 등 기본 polish
- 문서·빌드  greenery  
**완료 시:** 이해관계자 데모 가능한 PoC 종료

---

## 11. 구현 시 유의 (계획 메모)

1. **기능보다 UX** — CRUD 완성도보다 체크·업로드 동선을 먼저 부드럽게.
2. **starter-web 레이아웃 비복제** — Sidebar/Dashboard 패턴 사용하지 않음.
3. **Mock AI는 티나게** — UI에 「데모 분석」 정도의 카피로 기대치 조절(선택).
4. **이미지 저장은 압축 필수** — PoC라도 모바일 실기기에서 스토리지 폭주 방지.
5. **테스트 범위** — MVP는 budget·filter·sort 순수 함수 중심. E2E는 선택.

---

## 12. 검토 요청 사항

계획 승인 전 확인이 필요한 결정:

1. **상품 등록 UX**: 서브 라우트 vs Sheet 중심 — 본 계획은 **이미지 플로우=Sheet, 수동=라우트(또는 Sheet)** 혼합.
2. **남은 예산 정의**: `budget - purchasedTotal` 확정 여부 (미구매 예상을 빼는 방식과 다름).
3. **지원 통화 목록** MVP 범위.
4. **데모용 Seed 데이터** 포함 여부.

---

**다음 단계(선택):** 실기기 UX 피드백, IndexedDB 이미지 분리, 실제 AI Route Handler 연동.
