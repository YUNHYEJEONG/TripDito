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
| `/` | 여행 목록 |
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

AI 연동 방법은 [`docs/plan/AI_INTEGRATION.md`](./docs/plan/AI_INTEGRATION.md)를 참고하세요.
