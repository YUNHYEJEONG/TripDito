import type { CSSProperties } from "react";
import { getCompletedSuitcaseArtworkVariant } from "@/features/trips/utils/trip-status-overview";
import styles from "./trip-status-artwork.module.css";

export type TripStatusArtworkScene = "packing" | "transit" | "unpacking";

type TripStatusSuitcaseArtworkProps = {
  scene: TripStatusArtworkScene;
  fillPercent: number;
  activeSlots: number;
  overflowCount: number;
  purchasedCount: number;
  totalCount: number;
};

type BudgetPiggyBankArtworkProps = {
  fillPercent: number;
};

type PurchaseObjectId =
  | "gift"
  | "lavender-bag"
  | "coral-bag"
  | "parcels"
  | "travel-roll"
  | "souvenir-pouch"
  | "receipt";

const budgetCoinCount = 5;
/**
 * 내부창에 실제로 들어가는 칸 수. 내부창은 실측 84x96px이라 28~40px 물건을 2열×3단,
 * 즉 **6개**까지만 알아볼 수 있게 담을 수 있다. 7번째부터는 마지막 칸의 배지로 접는다 —
 * 억지로 더 넣으면 물건이 겹쳐 뭉개지거나 가방 밖으로 나간다.
 */
const visibleObjectSlots = 6;
const purchaseObjectIds: readonly PurchaseObjectId[] = [
  "parcels",
  "travel-roll",
  "lavender-bag",
  "coral-bag",
  "gift",
  "souvenir-pouch",
  "receipt",
];

function clampPercent(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.min(100, Math.max(0, value));
}

function getMilestoneProgress(totalProgress: number, index: number) {
  return Math.min(1, Math.max(0, totalProgress - index));
}

function getMilestoneState(progress: number) {
  if (progress <= 0) return "empty";
  if (progress >= 1) return "complete";
  return "partial";
}

function getMilestoneStyle(progress: number, offset = -7) {
  return {
    "--milestone-opacity": progress,
    "--milestone-scale": 0.72 + progress * 0.28,
    "--milestone-offset": `${(1 - progress) * offset}px`,
  } as CSSProperties;
}

function PurchaseObject({
  id,
  index,
  visible,
  overflowCount,
}: {
  id: PurchaseObjectId;
  index: number;
  visible: boolean;
  overflowCount?: number;
}) {
  return (
    <span
      className={styles.purchaseObject}
      data-purchase-object={id}
      data-purchase-object-index={index + 1}
      data-active={visible ? "true" : "false"}
      style={
        {
          "--purchase-object-opacity": visible ? 1 : 0,
          "--purchase-object-offset": visible ? "0px" : "8px",
          "--purchase-object-scale": visible ? 1 : 0.82,
        } as CSSProperties
      }
    >
      <span className={styles.purchaseObjectSprite} />
      {overflowCount && overflowCount > 0 ? (
        <span className={styles.purchaseObjectOverflow}>+{overflowCount}</span>
      ) : null}
    </span>
  );
}

export function BudgetPiggyBankArtwork({
  fillPercent,
}: BudgetPiggyBankArtworkProps) {
  const safePercent = clampPercent(fillPercent);
  const completedCoins = (safePercent / 100) * budgetCoinCount;

  return (
    <span
      className={styles.piggyArtwork}
      data-budget-gauge-artwork="piggy-bank"
      data-has-fill={safePercent > 0 ? "true" : "false"}
      aria-hidden="true"
    >
      <span className={styles.piggyScene}>
        <span className={styles.piggyFrame} />
        <span
          data-budget-gauge-fill
          data-progress-visual="coins-inside-piggy"
          className={styles.piggyCoinChamber}
        >
          {Array.from({ length: budgetCoinCount }, (_, index) => {
            const progress = getMilestoneProgress(completedCoins, index);

            return (
              <span
                key={index}
                className={styles.budgetCoin}
                data-progress-state={getMilestoneState(progress)}
                data-progress-value={progress.toFixed(3)}
                style={getMilestoneStyle(progress)}
              >
                <span className={styles.budgetCoinSprite} />
              </span>
            );
          })}
        </span>
      </span>
    </span>
  );
}

export function TripStatusSuitcaseArtwork({
  scene,
  fillPercent,
  activeSlots,
  overflowCount,
  purchasedCount,
  totalCount,
}: TripStatusSuitcaseArtworkProps) {
  const safePercent = clampPercent(fillPercent);
  const safeTotalCount = Math.max(0, Math.floor(totalCount));
  const safePurchasedCount = Math.min(
    safeTotalCount,
    Math.max(0, Math.floor(purchasedCount)),
  );
  const renderedObjectCount = Math.min(
    visibleObjectSlots,
    Math.max(safeTotalCount, safePurchasedCount),
  );
  const extraPurchasedCount = Math.max(
    0,
    safePurchasedCount - visibleObjectSlots,
  );
  const completedArtworkVariant = getCompletedSuitcaseArtworkVariant(
    safeTotalCount,
    safePurchasedCount,
  );

  return (
    <span
      className={styles.suitcaseArtwork}
      data-approved-suitcase-scene={scene}
      data-trip-suitcase-artwork="flat-cutaway"
      data-packed-count={Math.max(0, activeSlots)}
      data-overflow-count={Math.max(0, overflowCount)}
      data-purchased-count={safePurchasedCount}
      data-total-count={safeTotalCount}
      data-complete-variant={
        scene === "unpacking" ? completedArtworkVariant : undefined
      }
      data-has-fill={safePercent > 0 ? "true" : "false"}
      aria-hidden="true"
    >
      <span data-suitcase-scene-frame className={styles.suitcaseScene}>
        <span
          className={styles.suitcaseFrame}
          data-trip-complete-composite={
            scene === "unpacking" ? completedArtworkVariant : undefined
          }
        />

        {/*
          비행기와 점선 경로는 **그림에 이미 그려져 있다.** 예전에는 그 위에 SVG로 하나를
          더 얹어 비행기가 두 대로 보였다. 절개창을 흉내 낸 크림색 판도 그림의 실제 창과
          어긋나 테두리가 두 겹으로 보였으므로 함께 걷어냈다.
        */}
        {scene === "transit" ? (
          <span
            data-trip-suitcase-fill
            data-progress-visual="purchase-objects"
            className={styles.purchaseObjectLayer}
          >
            {purchaseObjectIds.slice(0, renderedObjectCount).map((id, index) => (
              <PurchaseObject
                key={id}
                id={id}
                index={index}
                visible={safePurchasedCount > index}
                overflowCount={
                  index === renderedObjectCount - 1
                    ? extraPurchasedCount
                    : undefined
                }
              />
            ))}
          </span>
        ) : null}

      </span>
    </span>
  );
}
