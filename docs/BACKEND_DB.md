# 백엔드 DB / 스토리지 연동

## 구성
| 항목 | 값 |
|---|---|
| DB | PostgreSQL (Neon, `ap-southeast-1`) — `DATABASE_URL` |
| 드라이버 | `@neondatabase/serverless` (HTTP, 서버리스 친화) — `lib/db/client.ts` |
| 오브젝트 스토리지 | Cloudflare R2 (S3 호환) — `lib/r2/client.ts`, presigned PUT 업로드 |
| 스키마 | `db/schema.sql` (18개 테이블, 정의서 2026-08-19 기준) + `db/seed-codes.sql` (공통코드) |
| 적용 | `npm run db:migrate` (재실행 안전) |

환경변수 키 목록은 `.env.example` 참고. 실제 값은 `.env.local` / Vercel ENV 에만 둔다.

## 인증 (auth.ts)
소셜 로그인(구글·카카오·네이버)만 지원. 콜백 시 `lib/db/users.ts#upsertSocialUser` 가 정의서 p.17 흐름대로
1. `PRVDR_CD + PRVDR_ACNT_ID` 로 연결된 계정 → 로그인
2. 검증된 동일 이메일 회원 → `OAUTH_ACNT_INFO` 행 추가 (`EMAIL_MATCH`)
3. 없으면 `USER_INFO` 신규 (`SIGNUP`)

세션(JWT)에는 `USER_UUID` 만 실린다 (`session.userUuid`). 서버 코드는 `getCurrentUser()` / `requireUser()` 로 `USER_SN` 을 얻는다.

## API (모두 로그인 필요, `/api/codes/*`, `/api/coupons` 제외)
| Method | Path | 설명 |
|---|---|---|
| GET/PATCH/DELETE | `/api/me` | 프로필 조회·수정(닉네임/아바타)·탈퇴 |
| GET | `/api/me/scraps` | 내 스크랩 |
| GET/POST | `/api/me/coupons` | 받은 쿠폰 / 쿠폰 받기 `{couponId}` |
| DELETE | `/api/me/coupons/:couponId` | 받은 쿠폰 제거 |
| GET/POST | `/api/trips` | 여행 목록 / 생성 |
| GET/PUT/DELETE | `/api/trips/:tripId` | 여행 단건 |
| GET/POST | `/api/trips/:tripId/items` | 쇼핑리스트 / 품목 추가 |
| GET/PUT/DELETE | `/api/items/:itemId` | 품목 단건 |
| POST | `/api/items/:itemId/purchase` | 구매 토글 (`PRCHS_DTTM`) |
| GET/POST | `/api/shots` | 피드(`channel, sort, country, city, author, limit, offset`) / 업로드 |
| GET/PUT/DELETE | `/api/shots/:shotId` | 때샷 단건 |
| POST | `/api/shots/:shotId/like` · `/scrap` | 좋아요 / 스크랩 토글 |
| GET/POST | `/api/shots/:shotId/comments` | 댓글 목록 / 작성 `{text, parentId?}` |
| DELETE | `/api/shots/:shotId/comments/:commentId` | 댓글 삭제 (행 유지, `DEL_DTTM`) |
| POST / PUT | `/api/uploads` | ① presigned URL 발급 ② 업로드 후 첨부 등록 |
| GET | `/api/shots/:shotId/items` | 때샷 연결 쇼핑품목 + 여행 요약 (퍼가기) |
| GET | `/api/files/*` | R2 오브젝트 프록시 (공개) |
| GET | `/api/codes/:group` | 공통코드 (예: `NTN`, `CRNCY`, `GIFT_TAG`) |
| GET | `/api/coupons?country=JP` | 쿠폰 (DB 적재분 우선, 없으면 외부 파싱/폴백) |
| POST | `/api/coupons/sync` | 외부 쿠폰 → `CPN_INFO` 배치 적재 |

### 이미지 업로드 흐름
```
POST /api/uploads {scope:"shots", files:[{name,type,size}]}
  → {attachmentId, files:[{seq,key,uploadUrl,...}]}
PUT <uploadUrl>  (브라우저가 R2 에 직접 업로드)
PUT /api/uploads {attachmentId, files:[{seq,key,originalName,extension,size}]}
  → ATCM_FILE_INFO / ATCM_FILE_DETL_INFO 등록
POST /api/shots {attachmentId, ...}
```
DB 에는 오브젝트 키만 저장한다(`FILE_PATH`). 공개 URL 은 `R2_PUBLIC_BASE_URL` 이 있을 때 `url` 필드로 내려간다.

## 앱 값 ↔ DB 코드
- 국가: 화면 한글명(`일본`) ↔ `NTN_CD`(`JP`) — `lib/db/codes.ts#resolveCode`
- 선물태그: `friend→FRIEND`, `colleague→COWORK`, `acquaintance→ACQNT`(시드에 확장 추가)
- 채널: `shots→SHOTS`, `community→COMMUNITY`
- 여행 상태: 입력이 없으면 `TZ_ID` 기준 오늘 날짜로 `PLANNED/ONGOING/DONE` 계산

## 프런트 연동
- `features/*/data/*-repository.ts` 가 모두 `/api/*` 호출로 교체됐다 (`lib/api/client.ts` 래퍼, 에러코드→한글 메시지).
- 이미지는 `lib/api/upload.ts#uploadImages` 로 R2 에 먼저 올린 뒤 `attachmentId` 로 저장한다. data URL 을 그대로 서버에 보내지 않는다.
- 로그인 상태는 next-auth `useSession` 기반(`features/auth/hooks/use-auth.ts`). 이메일 가입/로그인·로컬 계정은 제거, `/signup` 은 `/login` 으로 리다이렉트.
- 로그인 필수 페이지는 `useRequireLogin()` 으로 `/login?callbackUrl=` 이동. 목록 훅(`useTrips`, `useShots` 등)은 미로그인 시 빈 배열.
- 서버 스키마에 없는 값: 때샷 **공유 횟수**는 브라우저 localStorage 에만 보관(`trip-shopping:shots:shares`). 광고 닫기 상태도 로컬 유지.
- 추가 API: `GET /api/shots/:shotId/items`(퍼가기용 품목+여행 요약), `GET /api/shots?liked=me`, `GET /api/files/*`(R2 프록시 — 공개 URL 미설정 시 이미지 서빙).

## 개발용 로그인 (소셜 키 발급 전 임시)
- `.env.local` 에 `ENABLE_DEV_LOGIN=true`, `DEV_LOGIN_EMAIL`, `DEV_LOGIN_PASSWORD` 가 있으면 `/login` 하단에 이메일/비밀번호 폼이 나타난다.
- NextAuth `Credentials`(id `dev`) → `OAUTH_ACNT_INFO.PRVDR_CD='DEV'` 로 `USER_INFO` 에 연결. 스키마 변경 없음. 나중에 구글 키가 들어오면 같은 이메일이 `EMAIL_MATCH` 로 합쳐진다.
- **운영 배포에서는 `ENABLE_DEV_LOGIN` 을 비워라.** 비밀번호가 환경변수 한 개라 내부 테스트 전용이다.
- 테스트 데이터: `npm run db:seed:test` — 이 계정에 완료·진행중·예정 여행 3개 + 쇼핑품목을 넣는다(재실행 안전).

## 남은 일
- R2 API 토큰 발급 후 `R2_ACCESS_KEY_ID` / `R2_SECRET_ACCESS_KEY` / `R2_PUBLIC_BASE_URL` 채우기
- 소셜 로그인 클라이언트 ID/Secret 발급 (`AUTH_GOOGLE_*`, `AUTH_KAKAO_*`, `AUTH_NAVER_*`)
- `OAUTH_ACNT_INFO` 토큰 컬럼 암호화(정의서 요구) — 현재 평문 저장
