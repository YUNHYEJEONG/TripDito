# Trip status artwork v2

Status: APPROVED AND FIXED
Approved: 2026-08-20
Owner: TripDito

이 문서는 여행 상세 상태 카드의 최종 승인 이미지와 렌더링 규칙을 고정한다. 이후 작업에서는 아래 원본과 런타임 자산을 임의로 다시 그리거나 덮어쓰지 않는다.

## Canonical locations

- 생성 원본과 승인 기준본: `.codex/generated_images/trip-status/v2`
- 앱 런타임 자산: `public/trip-status/v2`
- 브라우저 승인 화면: `.codex/browser-checks/trip-status-v2-approved`
- 최신 원통형 게이지 검증 화면: `.codex/browser-checks/trip-status-reservoir-polish`

`.codex/generated_images/trip-status/v2`가 기준이다. `public/trip-status/v2`의 프레임과 마스크는 기준본과 바이트 단위로 같아야 한다. `source-*.png`는 생성 원본 보관용이며 앱에서 직접 렌더링하지 않는다.

## Approved files

| Role | File | Pixels | SHA-256 |
| --- | --- | ---: | --- |
| 출발 예정 생성 원본 | `source-packing.png` | 1536x1024 RGB | `b3dac8f4752d3a6512a3a7a05687b70e610a5c5a9551790933e626229c09084a` |
| 여행 중 생성 원본 | `source-transit.png` | 1536x1024 RGB | `2865394a5b6a1e6b40779890b9a1000a70ea6799791f44daf521ae72cfe943a8` |
| 여행 완료 생성 원본 | `source-complete.png` | 1536x1024 RGB | `3478efd4316bd5e9bbf86cafa79cddbdedf7782567a2360621ceb2d48ab516ad` |
| 출발 예정 프레임 | `packing-frame.png` | 614x480 RGBA | `40f839450f23845ed9ec231133fc56c10dc62ba85462e2d443620a0cb70ff7d8` |
| 여행 중 프레임 | `transit-frame.png` | 631x480 RGBA | `50f69a0625cc3a5fbbb602fc6307f4e7e80a988dc6db48cdea9fea5021b15c3e` |
| 여행 중 채움 마스크 | `transit-fill-mask.png` | 631x480 Gray+Alpha | `c5c75e841c0ad9f83aee3428b8dd2272f1c77e31d88e5af2b5c1e79193162e10` |
| 여행 완료 프레임 | `complete-frame.png` | 561x480 RGBA | `5621ec6ab63e827074720273d1d5c843313aa0e385a786fdf3ab4e8660486092` |
| 여행 완료 채움 마스크 | `complete-fill-mask.png` | 561x480 Gray+Alpha | `0358d762ff325a673086096791a0589f67d9ff6b5b3537c4d1c9101636e0e7b9` |

런타임 프레임과 마스크는 같은 이름의 승인 기준본과 위 SHA-256이 같아야 한다.

## Visual language

- 귀엽고 입체적인 한국 모바일 앱용 스폿 일러스트 스타일
- 둥글고 매끈한 짙은 청록 외곽선
- 외곽선보다 가는 민트색 내부선과 곡면 음영
- 옅은 민트 표면, 따뜻한 크림색 소품, 절제된 2단 음영
- 작은 곡면 하이라이트와 얕은 측면 두께
- 장난감처럼 친근한 비율과 모바일에서도 즉시 읽히는 큰 실루엣
- 투명 배경과 타이트한 알파 경계

주요 승인 색상:

- 짙은 선: `#116D5F`, `#117965`, `#166E64`
- 중간 청록: `#268974`, `#2B8978`, `#339C8C`, `#45A78F`
- 밝은 민트: `#94CCB6`, `#ACD7C9`, `#B3DDCA`, `#B0CEB7`
- 옅은 표면: `#D7EBDA`, `#E3F0E0`, `#EDF7F2`
- 크림과 구매품 포인트: `#D8CFAC`, `#BDA46F`, `#A5956B`

이미지 안에 카드 배경, 패널, 테두리, 바닥 판, 텍스트, 숫자, 퍼센트, 로고를 넣지 않는다.

## Approved status scenes

### 출발 예정

- 열린 민트 캐리어에 짐을 싸는 장면
- 접은 크림색 옷, 말아 둔 옷, 민트 파우치, 앞쪽 러기지 태그
- 액체 채움 없이 프레임만 사용

### 여행 중

- 살짝 기울어진 정면 3/4 시점의 바퀴 달린 캐리어
- 상단 손잡이, 오른쪽 러기지 태그
- 작은 구름, 점선 비행 경로, 우상단 비행기는 보조 요소
- 넓은 전면 창만 코드 기반 구매 진행 게이지로 채움

### 여행 완료

- 캐리어 위에 쇼핑백과 구매품을 차곡차곡 쌓은 장면
- 오른쪽 작은 반짝임
- 넓은 전면 창만 코드 기반 구매 진행 게이지로 채움

## Geometry lock

- `packing-frame.png`: alpha bounds `598x464+8+8`
- `transit-frame.png`: alpha bounds `611x460+10+10`
- `complete-frame.png`: alpha bounds `545x464+8+8`
- 여행 중 마스크: alpha bounds `417x251+53+133`
- 여행 완료 마스크: alpha bounds `437x194+37+218`

프레임과 마스크는 동일한 좌표계, 동일한 `inset: 0`, 동일한 `background-size: 100% 100%`로 겹친다. 전체 이미지를 CSS로 비례 확대하거나 중앙 위치를 조정할 수 있지만 픽셀과 종횡비는 바꾸지 않는다.

## Suitcase gauge architecture

레이어 순서는 아래로 고정한다.

1. 마스크 안의 빈 창 배경
2. 코드로 생성한 단 하나의 액체 레이어와 그 액체에 붙어 움직이는 수면
3. 마스크 안의 유리 반사광
4. 승인된 프레임 PNG

- 액체는 마스크 내부에서만 보인다.
- PNG에 고정 액체를 굽지 않는다.
- 별도 직사각형 진행 바를 캐리어 위에 올리지 않는다.
- 액체 레이어는 하나만 둔다.
- 액체는 `translateY`로 아래에서 위로 이동한다. `scaleY`를 쓰지 않는다.
- 0%에서는 완전히 숨고 100%에서는 유효 내부를 채운다.
- 수면은 액체 상단에 붙어서 함께 이동한다.
- 프레임은 최상단에서 액체 가장자리와 수면을 자연스럽게 가린다.
- 여행 중 창 범위: top `27.7%`, height `52.3%`
- 여행 완료 창 범위: top `45.4%`, height `40.5%`
- 액체 색상: `#36AAA3` -> `#118682` -> `#087370`
- 수면 색상: `#48BAB2`

## Budget reservoir architecture

- 원통형 예산 게이지는 하나의 SVG 조합이다.
- 유리 외곽은 `44x132` 좌표계에서 `x=22.5` 중심축을 공유하는 대칭 시험관형으로 고정한다.
- 외곽 몸체와 이중 타원 림은 고정 민트 선색을 사용하며 여행 상태 강조색을 상속하지 않는다.
- 바닥은 하나의 연속된 U자 곡률만 사용하고 별도 진한 바닥 호나 전 높이의 edge glint를 추가하지 않는다.
- 외곽선은 `1.85`, 외부 림은 `1.8`, 내부 림은 `0.9` 굵기를 기준으로 유지한다.
- 현재 외곽 실루엣은 이전 버전보다 약 6% 더 높게 보이도록 고정하며 레이아웃 바깥의 별도 세로 막대로 높이를 보충하지 않는다.
- 유리 내부 clip path 안에 단 하나의 liquid group만 둔다.
- 액체 본체와 타원형 수면은 같은 그룹에서 함께 이동한다.
- 유리 외곽선, 이중 타원 림, 원형 반사점, 세로 반사광은 액체보다 앞에 둔다.
- 별도 물통 PNG나 별도 직사각형 바를 중복 렌더링하지 않는다.
- `data-budget-gauge-fill`은 단 하나의 액체 그룹을 가리킨다.
- 액체 색상: `#32AAA3` -> `#108682` -> `#076D6B`
- 수면 색상: `#43BBB3`
- 퍼센트 숫자는 원통 아래에 시각적으로 표시하지 않는다. 진행률은 ARIA 속성으로 유지한다.

## Motion and accessibility

- 액체 상승은 `transform`만 애니메이션한다.
- 기본 시간은 650ms에서 900ms 사이의 감속 easing을 사용한다.
- 반사광은 고정하고 수면은 상태 변경 때만 짧게 안정된다.
- `prefers-reduced-motion: reduce`에서는 이동 transition과 수면 animation을 제거한다.
- 예산 게이지의 `progressbar` 또는 `status` 역할과 ARIA 값은 유지한다.
- 캐리어의 구매 완료율 `progressbar`와 ARIA 값은 유지한다.

## Change policy

금지:

- 승인된 프레임과 마스크를 이미지 생성 도구로 다시 만들기
- SVG나 CSS 도형으로 승인 캐리어를 다시 그리기
- 임의 크롭, 배경 제거 재실행, 색상 보정, 리터칭, 샤프닝, 양자화, 손실 압축
- 프레임과 마스크를 합치거나 액체를 PNG에 굽기
- `source-*.png`에서 새 크롭을 추출해 v2를 덮어쓰기
- 프레임과 마스크를 서로 다른 비율로 확대하기

허용:

- 승인 픽셀과 종횡비를 유지한 CSS 비례 확대와 중앙 정렬
- 컨테이너와 카드 스테이지 크기 조정
- 코드 레이어의 액체 색상, 퍼센트, easing 조정
- 접근성 속성과 reduced-motion 처리 개선
- 승인 기준본을 런타임 경로에 바이트 동일 복사

새 그림이 필요하면 v2를 보존한 채 `v3` 경로에 추가하고, 사용자에게 후보를 보여 명시적으로 승인받은 뒤 매핑을 변경한다.

## Verification targets

- 390x844 일반 모바일
- 480x360 짧은 화면
- 340x640 좁고 짧은 화면
- 출발 예정, 여행 중, 여행 완료 세 상태
- 여행 중 구매 체크 전후의 캐리어 액체 상승
- 예산 원통의 단일 액체 레이어와 하단 퍼센트 미노출
