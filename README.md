# Trip Shopping

여행 전 저장한 상품 이미지로 쇼핑 리스트를 만들고, 여행 중 체크리스트로 쓰는 PoC입니다.

## 스택

- Next.js 16 (App Router) + TypeScript
- Tailwind CSS + shadcn/ui
- React Hook Form + Zod
- TanStack Query
- Local Storage 기반 PoC 데이터 + 이메일/선택적 OAuth 세션

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
4. **사진으로 추가** → 이미지 선택 → 상품 분석 → 결과 검토 → 리스트에 추가
5. 검색·필터·정렬로 목록 좁히기
6. 여행/상품 수정·삭제

데이터는 브라우저 Local Storage에만 저장되며 로그인 계정별로 분리됩니다.

## 운영 환경 변수

- `AUTH_SECRET`: 운영 배포에서 반드시 설정할 NextAuth 암호화 키
- `AUTH_KAKAO_ID`, `AUTH_KAKAO_SECRET`: 둘 다 있을 때만 카카오 버튼 노출
- `AUTH_NAVER_ID`, `AUTH_NAVER_SECRET`: 둘 다 있을 때만 네이버 버튼 노출
- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`: 없거나 인증 실패 시 정직한 데모 지도 사용
- `KOREAEXIM_AUTH_KEY`: 은행 고시 환율. 없으면 지원 통화에 한해 공개 환율 폴백
- 이미지 분석·쿠팡 비교 키는 아래 설정 문서 참고

`NEXT_PUBLIC_ENABLE_DEMO_DATA=true`는 명시적인 프리뷰 빌드에서만 사용하세요.
일반 운영 방문자는 자동으로 데모 계정이나 여행이 만들어지지 않습니다.

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
features/image-analysis   # Gemini/OpenAI/Lens + 정직한 파일명 초안 fallback
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

이미지 분석·쿠팡 비교 환경 설정은
[`docs/plan/IMAGE_ANALYSIS_SETUP.md`](./docs/plan/IMAGE_ANALYSIS_SETUP.md)를
참고하세요.
