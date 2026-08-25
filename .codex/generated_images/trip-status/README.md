# Trip status artwork index

여행 상세 화면에서 실제 사용하는 승인 자산만 보관한다. `public/trip-status`
파일은 아래 canonical master와 바이트 단위로 같아야 한다.

| 상태/역할 | Canonical master | Runtime path |
| --- | --- | --- |
| 출발 예정 열린 가방 | `v4/packing-flat.png` | `/trip-status/v4/packing-flat.png` |
| 예산 저금통 | `v5/piggy-cutaway.png` | `/trip-status/v5/piggy-cutaway.png` |
| 여행 중 가방 | `v5/transit-cutaway.png` | `/trip-status/v5/transit-cutaway.png` |
| 구매 물건 스프라이트 | `v5/purchase-objects.png` | `/trip-status/v5/purchase-objects.png` |
| 여행 완료 전체 구매 | `v6/final/complete-stacked.png` | `/trip-status/v6/complete-stacked.png` |
| 일반 금색 동전 | `v7/final/budget-coin-gold.png` | `/trip-status/v7/budget-coin-gold.png` |
| 여행 완료 1개 미구매 | `v7/final/complete-stacked-one-missing.png` | `/trip-status/v7/complete-stacked-one-missing.png` |

세부 스타일과 동작 계약은 각 버전의 `APPROVED_STYLE.md`를 따른다. 생성기의
`raw/`, 비교용 `candidates/`, 브라우저 캡처와 감사 산출물은 로컬 작업물이며
`.gitignore` 대상이다. 새 자산을 승인할 때만 canonical master와 runtime copy를
함께 추가하고, 런타임에서 더 이상 참조하지 않는 이미지는 두 위치에서 함께 제거한다.
