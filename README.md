# Trip Shopping

여행 전 저장한 상품 이미지로 쇼핑 리스트를 만들고, 여행 중 체크리스트로 쓰는 PoC입니다.

## 스택

- Next.js 16 (App Router) + TypeScript
- Tailwind CSS + shadcn/ui
- React Hook Form + Zod
- TanStack Query
- Local Storage (인증·DB 없음)

## 시작

```bash
npm install
npm run dev
```

| 명령 | 설명 |
|------|------|
| `npm run dev` | 개발 서버 |
| `npm run build` | 프로덕션 빌드 |
| `npm run test` | 도메인 유틸 테스트 |
| `npm run lint` | ESLint |

## 데모 시나리오

1. 홈에서 **데모 불러오기** (또는 새 여행 생성)
2. 쇼핑 리스트에서 체크박스로 구매 완료 토글
3. 진행률·남은 예산 변화 확인
4. **사진으로 추가** → 이미지 선택 → **데모 분석** → 리스트에 추가
5. 검색·필터·정렬로 목록 좁히기
6. 여행/상품 수정·삭제

데이터는 브라우저 Local Storage에만 저장됩니다.

## 주요 화면

| 경로 | 설명 |
|------|------|
| `/` | 랜딩 (로고 스플래시 → 자동 진입) |
| `/home` | 여행 목록 |
| `/map` | Google Maps 탐색 (검색·내 위치·마커·장소 상세) |
| `/trips/new` | 여행 생성 |
| `/trips/[id]` | 쇼핑 리스트 (검색·필터·예산·사진 추가) |
| `/trips/[id]/edit` | 여행 수정·삭제 |
| `/trips/[id]/items/new` | 상품 직접 추가 |
| `/trips/[id]/items/[itemId]/edit` | 상품 수정·삭제 |

## 폴더

```
features/trips
features/shopping-items
features/image-upload
features/image-analysis   # Mock AI (교체 가능)
features/budget
components/{ui,common,layout}
lib/storage
docs/plan
```

## 브랜드

- 한글명: **트립디토**
- 영문명: **Trip Ditto** (DITTO + Trip)
- 태그라인: 복잡함 없이, 여행 쇼핑
- 자산: `public/brand/` (심볼 SVG, 앱 아이콘, 파비콘)
- `/` 랜딩(로고 인터랙션) → `/home` 메인

## 디자인

화이트 배경 + 토스형 액션 블루 `#3182F6`. 회색 설명 카드 `GrayCard` 추가.  
상세 규정: [`docs/DESIGN_SYSTEM.md`](./docs/DESIGN_SYSTEM.md)

