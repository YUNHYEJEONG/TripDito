"use client";

import {
  useEffect,
  useId,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
  type ReactNode,
} from "react";
import {
  AlertCircle,
  Check,
  LoaderCircle,
} from "lucide-react";
import { CurrencyText } from "@/components/common/currency-text";
import { Input } from "@/components/ui/input";
import type { BudgetSummary } from "@/features/budget/utils/calculate-budget";
import {
  getStatusBudgetDisplayPercent,
  getStatusBudgetGauge,
  getStatusSuitcaseGauge,
  type StatusBudgetGauge,
  type StatusSuitcaseGauge,
  type TripStatusOverviewMode,
} from "@/features/trips/utils/trip-status-overview";
import { formatCurrency } from "@/lib/format/currency";
import { cn } from "@/lib/utils";
import {
  BudgetReservoirArtwork,
  TripStatusSuitcaseArtwork,
} from "./trip-status-artwork";
import styles from "./trip-status-overview.module.css";

export type TripBudgetCommit = {
  budget: number;
  budgetMode: "unknown" | "input";
};

export type TripStatusOverviewProps = {
  mode: TripStatusOverviewMode;
  summary: BudgetSummary;
  currency: string;
  budgetMode: "unknown" | "input" | undefined;
  /** Number of product rows with at least one saved gift tag. */
  giftItemCount: number;
  /** Required by idle/prep integrations. Clearing the field commits `unknown`. */
  onSaveBudget?: (next: TripBudgetCommit) => void | Promise<void>;
  budgetSavePending?: boolean;
  budgetSaveError?: string | null;
  hasPriceReview?: boolean;
  /** Increment after each saved transition that reaches full purchase completion. */
  suitcaseCelebrationNonce?: number;
  className?: string;
};

const statusVisuals = {
  idle: {
    label: "출발 예정",
    surface: "border-prep-tint bg-prep",
    badge: "bg-prep-deep",
  },
  prep: {
    label: "출발 예정",
    surface: "border-prep-tint bg-prep",
    badge: "bg-prep-deep",
  },
  live: {
    label: "여행 중",
    surface: "border-live-tint bg-live text-live-ink",
    badge: "bg-live-deep",
  },
  after: {
    label: "여행 완료",
    surface: "border-after-tint bg-after",
    badge: "bg-after-deep",
  },
} as const;

type OverviewScene = "prep" | "live" | "after";
type BudgetSaveState = "idle" | "editing" | "saving" | "saved" | "error";

const BUDGET_SAVE_DELAY_MS = 450;
const BUDGET_SAVED_LABEL_MS = 1_200;

export function TripStatusBadge({
  mode,
  className,
}: {
  mode: TripStatusOverviewMode;
  className?: string;
}) {
  const visual = statusVisuals[mode];

  return (
    <span
      data-trip-status-badge={mode}
      className={cn(
        "inline-flex h-5 shrink-0 items-center whitespace-nowrap rounded-full px-2 text-[10px] leading-none font-bold text-paper",
        visual.badge,
        className,
      )}
    >
      <span className="sr-only">여행 상태: </span>
      {visual.label}
    </span>
  );
}

export function TripStatusOverviewLoading({
  mode,
  className,
}: {
  mode: TripStatusOverviewMode;
  className?: string;
}) {
  const visual = statusVisuals[mode];
  const scene: OverviewScene = mode === "idle" ? "prep" : mode;
  const suitcase = getStatusSuitcaseGauge(mode, 0, 0);
  const hasReservoir = scene !== "after";

  return (
    <section
      data-trip-status-loading={mode}
      aria-busy="true"
      aria-label={`${visual.label} 쇼핑 현황 불러오는 중`}
      className={cn(
        "relative overflow-hidden rounded-2xl border text-ink",
        visual.surface,
        className,
        styles.shortViewportCard,
      )}
    >
      <div
        className={styles.overviewBody}
        data-has-budget-reservoir={hasReservoir ? "true" : "false"}
      >
        {hasReservoir ? (
          <div className={styles.reservoirRail} aria-hidden>
            <span
              className={cn(
                styles.loadingReservoir,
                "animate-pulse motion-reduce:animate-none",
              )}
            />
          </div>
        ) : null}
        <div
          data-trip-status-stage={scene}
          className={styles.instrumentStage}
          aria-hidden
        >
          <div className={styles.loadingInstrument}>
            <SuitcaseGauge mode={scene} gauge={suitcase} size="overview" />
          </div>
        </div>
        <div
          data-trip-status-rail={scene}
          className={styles.informationRail}
          aria-hidden
        >
          <div
            className={cn(
              styles.summaryRail,
              styles.loadingRail,
              "animate-pulse motion-reduce:animate-none",
            )}
          >
            <span className={styles.loadingRailPrimary} />
            <span className={styles.loadingRailSecondary} />
          </div>
        </div>
      </div>
    </section>
  );
}

export function TripStatusOverview({
  mode,
  summary,
  currency,
  budgetMode,
  giftItemCount,
  onSaveBudget,
  budgetSavePending = false,
  budgetSaveError,
  hasPriceReview = false,
  suitcaseCelebrationNonce = 0,
  className,
}: TripStatusOverviewProps) {
  const visual = statusVisuals[mode];
  const budgetGauge = getStatusBudgetGauge(mode, summary, budgetMode);
  const suitcaseGauge = getStatusSuitcaseGauge(
    mode,
    summary.totalCount,
    summary.purchasedCount,
  );
  const safeGiftCount = Number.isFinite(giftItemCount)
    ? Math.max(0, Math.floor(giftItemCount))
    : 0;

  return (
    <section
      data-trip-status-overview={mode}
      aria-labelledby={`trip-status-overview-${mode}`}
      className={cn(
        "relative overflow-hidden rounded-2xl border text-ink",
        visual.surface,
        className,
        styles.shortViewportCard,
      )}
    >
      <h2 id={`trip-status-overview-${mode}`} className="sr-only">
        {visual.label} 쇼핑 현황
      </h2>

      {mode === "idle" || mode === "prep" ? (
        <PlanningOverview
          summary={summary}
          currency={currency}
          budgetMode={budgetMode}
          budgetGauge={budgetGauge!}
          suitcaseGauge={suitcaseGauge}
          giftItemCount={safeGiftCount}
          onSaveBudget={onSaveBudget}
          budgetSavePending={budgetSavePending}
          budgetSaveError={budgetSaveError}
        />
      ) : mode === "live" ? (
        <LiveOverview
          summary={summary}
          currency={currency}
          budgetGauge={budgetGauge!}
          suitcaseGauge={suitcaseGauge}
          suitcaseCelebrationNonce={suitcaseCelebrationNonce}
        />
      ) : (
        <CompletedOverview
          summary={summary}
          currency={currency}
          suitcaseGauge={suitcaseGauge}
          hasPriceReview={hasPriceReview}
          suitcaseCelebrationNonce={suitcaseCelebrationNonce}
        />
      )}
    </section>
  );
}

function StatusOverviewFrame({
  mode,
  suitcaseGauge,
  budgetGauge,
  currency,
  suitcaseCelebrationNonce = 0,
  children,
}: {
  mode: OverviewScene;
  suitcaseGauge: StatusSuitcaseGauge;
  budgetGauge?: StatusBudgetGauge;
  currency?: string;
  suitcaseCelebrationNonce?: number;
  children: ReactNode;
}) {
  const hasReservoir = mode !== "after" && Boolean(budgetGauge && currency);

  return (
    <div
      className={styles.overviewBody}
      data-has-budget-reservoir={hasReservoir ? "true" : "false"}
    >
      {hasReservoir && budgetGauge && currency ? (
        <div className={styles.reservoirRail}>
          <ReservoirColumn mode={mode} gauge={budgetGauge} currency={currency} />
        </div>
      ) : null}
      <div data-trip-status-stage={mode} className={styles.instrumentStage}>
        <SuitcaseGauge
          mode={mode}
          gauge={suitcaseGauge}
          size="overview"
          suitcaseCelebrationNonce={suitcaseCelebrationNonce}
        />
      </div>
      <div data-trip-status-rail={mode} className={styles.informationRail}>
        {children}
      </div>
    </div>
  );
}

function PlanningOverview({
  summary,
  currency,
  budgetMode,
  budgetGauge,
  suitcaseGauge,
  giftItemCount,
  onSaveBudget,
  budgetSavePending,
  budgetSaveError,
}: {
  summary: BudgetSummary;
  currency: string;
  budgetMode: "unknown" | "input" | undefined;
  budgetGauge: StatusBudgetGauge;
  suitcaseGauge: StatusSuitcaseGauge;
  giftItemCount: number;
  onSaveBudget?: (next: TripBudgetCommit) => void | Promise<void>;
  budgetSavePending: boolean;
  budgetSaveError?: string | null;
}) {
  return (
    <PlanningStatusRail
      summary={summary}
      currency={currency}
      budgetMode={budgetMode}
      gauge={budgetGauge}
      suitcaseGauge={suitcaseGauge}
      giftItemCount={giftItemCount}
      onSaveBudget={onSaveBudget}
      pending={budgetSavePending}
      externalError={budgetSaveError}
    />
  );
}

function LiveOverview({
  summary,
  currency,
  budgetGauge,
  suitcaseGauge,
  suitcaseCelebrationNonce,
}: {
  summary: BudgetSummary;
  currency: string;
  budgetGauge: StatusBudgetGauge;
  suitcaseGauge: StatusSuitcaseGauge;
  suitcaseCelebrationNonce: number;
}) {
  return (
    <StatusOverviewFrame
      mode="live"
      suitcaseGauge={suitcaseGauge}
      budgetGauge={budgetGauge}
      currency={currency}
      suitcaseCelebrationNonce={suitcaseCelebrationNonce}
    >
      <div className={styles.summaryRail}>
        <Metric label="남은 예산" emphasis="live" align="left" priority="primary">
          {getLiveBudgetValue(budgetGauge, currency)}
        </Metric>
        <Metric label="구매 완료" emphasis="live" align="right" priority="secondary">
          {summary.purchasedCount}/{summary.totalCount}개
        </Metric>
      </div>
    </StatusOverviewFrame>
  );
}

function CompletedOverview({
  summary,
  currency,
  suitcaseGauge,
  hasPriceReview,
  suitcaseCelebrationNonce,
}: {
  summary: BudgetSummary;
  currency: string;
  suitcaseGauge: StatusSuitcaseGauge;
  hasPriceReview: boolean;
  suitcaseCelebrationNonce: number;
}) {
  return (
    <StatusOverviewFrame
      mode="after"
      suitcaseGauge={suitcaseGauge}
      suitcaseCelebrationNonce={suitcaseCelebrationNonce}
    >
      <div className={cn(styles.summaryRail, styles.completedRail)}>
        <Metric label="구매한 상품" emphasis="after" align="left" priority="primary">
          {summary.purchasedCount}개
        </Metric>
        <Metric
          label={
            <span className="inline-flex items-center justify-end gap-1">
              기록 금액
              {hasPriceReview ? (
                <>
                  <AlertCircle className="size-3.5 text-danger-text" aria-hidden />
                  <span className="sr-only">가격 확인 필요</span>
                </>
              ) : null}
            </span>
          }
          emphasis="after"
          align="right"
          priority="secondary"
        >
          <CurrencyText amount={summary.purchasedTotal} currency={currency} />
        </Metric>
      </div>
    </StatusOverviewFrame>
  );
}

type ParsedBudgetDraft = {
  commit: TripBudgetCommit;
  key: string;
};

function getBudgetCommitKey(commit: TripBudgetCommit) {
  return commit.budgetMode === "unknown" ? "unknown" : `input:${commit.budget}`;
}

function parseBudgetDraft(draft: string): ParsedBudgetDraft | null {
  const normalized = draft.trim().replaceAll(",", "");
  if (normalized === "") {
    const commit = { budget: 0, budgetMode: "unknown" } as const;
    return { commit, key: getBudgetCommitKey(commit) };
  }
  if (!/^(?:\d+|\d*\.\d+)$/.test(normalized)) return null;

  const budget = Number(normalized);
  if (!Number.isFinite(budget) || budget < 0) return null;
  const commit = { budget, budgetMode: "input" } as const;
  return { commit, key: getBudgetCommitKey(commit) };
}

function getExternalBudgetState(
  budget: number,
  budgetMode: "unknown" | "input" | undefined,
) {
  const known =
    budgetMode === "input" || (budgetMode === undefined && budget > 0);
  const safeBudget = Number.isFinite(budget) ? Math.max(0, budget) : 0;
  const commit: TripBudgetCommit = known
    ? { budget: safeBudget, budgetMode: "input" }
    : { budget: 0, budgetMode: "unknown" };

  return {
    draft: known ? String(safeBudget) : "",
    key: getBudgetCommitKey(commit),
  };
}

function PlanningStatusRail({
  summary,
  currency,
  budgetMode,
  gauge,
  suitcaseGauge,
  giftItemCount,
  onSaveBudget,
  pending,
  externalError,
}: {
  summary: BudgetSummary;
  currency: string;
  budgetMode: "unknown" | "input" | undefined;
  gauge: StatusBudgetGauge;
  suitcaseGauge: StatusSuitcaseGauge;
  giftItemCount: number;
  onSaveBudget?: (next: TripBudgetCommit) => void | Promise<void>;
  pending: boolean;
  externalError?: string | null;
}) {
  const messageId = useId();
  const statusId = `${messageId}-status`;
  const external = getExternalBudgetState(summary.tripBudget, budgetMode);
  const [draft, setDraft] = useState(external.draft);
  const [saveState, setSaveState] = useState<BudgetSaveState>("idle");
  const [localError, setLocalError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const draftRef = useRef(external.draft);
  const previousExternalKeyRef = useRef(external.key);
  const lastSavedKeyRef = useRef(external.key);
  const debounceTimerRef = useRef<number | null>(null);
  const savedLabelTimerRef = useRef<number | null>(null);
  const savingRef = useRef(false);
  const queuedCommitRef = useRef<ParsedBudgetDraft | null>(null);
  const mountedRef = useRef(true);
  const onSaveBudgetRef = useRef(onSaveBudget);

  useEffect(() => {
    onSaveBudgetRef.current = onSaveBudget;
  }, [onSaveBudget]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (debounceTimerRef.current !== null) {
        window.clearTimeout(debounceTimerRef.current);
      }
      if (savedLabelTimerRef.current !== null) {
        window.clearTimeout(savedLabelTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const previousExternalKey = previousExternalKeyRef.current;
    if (external.key === previousExternalKey) return;

    previousExternalKeyRef.current = external.key;
    lastSavedKeyRef.current = external.key;
    const currentDraft = parseBudgetDraft(draftRef.current);

    if (
      currentDraft === null ||
      currentDraft.key === previousExternalKey ||
      currentDraft.key === external.key
    ) {
      draftRef.current = external.draft;
      setDraft(external.draft);
      setLocalError(null);
    }
  }, [external.draft, external.key]);

  async function runSave(next: ParsedBudgetDraft) {
    const saveBudget = onSaveBudgetRef.current;
    if (!saveBudget) return;

    savingRef.current = true;
    if (mountedRef.current) {
      setSaveState("saving");
      setLocalError(null);
    }

    try {
      await saveBudget(next.commit);
      lastSavedKeyRef.current = next.key;
      const current = parseBudgetDraft(draftRef.current);
      if (mountedRef.current && current?.key === next.key) {
        setSaveState("saved");
        if (savedLabelTimerRef.current !== null) {
          window.clearTimeout(savedLabelTimerRef.current);
        }
        savedLabelTimerRef.current = window.setTimeout(() => {
          if (mountedRef.current) setSaveState("idle");
          savedLabelTimerRef.current = null;
        }, BUDGET_SAVED_LABEL_MS);
      }
    } catch {
      const current = parseBudgetDraft(draftRef.current);
      if (mountedRef.current && current?.key === next.key) {
        setSaveState("error");
        setLocalError("예산을 저장하지 못했어요. 잠시 후 다시 입력해 주세요.");
      }
    } finally {
      savingRef.current = false;
      const queued = queuedCommitRef.current;
      queuedCommitRef.current = null;
      if (queued && queued.key !== lastSavedKeyRef.current) {
        void runSave(queued);
      }
    }
  }

  function enqueueSave(next: ParsedBudgetDraft) {
    if (!onSaveBudgetRef.current || next.key === lastSavedKeyRef.current) {
      if (mountedRef.current && !savingRef.current) setSaveState("idle");
      return;
    }
    if (savingRef.current) {
      queuedCommitRef.current = next;
      if (mountedRef.current) setSaveState("saving");
      return;
    }
    void runSave(next);
  }

  function clearDebounce() {
    if (debounceTimerRef.current !== null) {
      window.clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
  }

  function validateAndSave(nextDraft: string, immediate: boolean) {
    clearDebounce();
    const parsed = parseBudgetDraft(nextDraft);
    if (!parsed) {
      const showError = () => {
        if (!mountedRef.current || draftRef.current !== nextDraft) return;
        setSaveState("error");
        setLocalError("0 이상의 숫자로 예산을 입력해 주세요.");
      };
      if (immediate) showError();
      else debounceTimerRef.current = window.setTimeout(showError, BUDGET_SAVE_DELAY_MS);
      return;
    }

    if (parsed.key === lastSavedKeyRef.current && !savingRef.current) {
      setSaveState("idle");
      return;
    }

    const save = () => {
      debounceTimerRef.current = null;
      if (draftRef.current === nextDraft) enqueueSave(parsed);
    };
    if (immediate) save();
    else debounceTimerRef.current = window.setTimeout(save, BUDGET_SAVE_DELAY_MS);
  }

  function changeBudget(event: ChangeEvent<HTMLInputElement>) {
    const nextDraft = event.target.value;
    draftRef.current = nextDraft;
    setDraft(nextDraft);
    setLocalError(null);
    setSaveState("editing");
    validateAndSave(nextDraft, false);
  }

  function flushBudget(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    validateAndSave(draftRef.current, true);
  }

  const parsedDraft = parseBudgetDraft(draft);
  const previewGauge = parsedDraft
    ? getStatusBudgetGauge(
        "prep",
        { ...summary, tripBudget: parsedDraft.commit.budget },
        parsedDraft.commit.budgetMode,
      )!
    : gauge;
  const error = localError ?? (saveState === "editing" ? null : externalError);
  const saving = saveState === "saving" || pending;
  const statusText = error
    ? error
    : saving
      ? "예산 저장 중"
      : saveState === "saved"
        ? "예산 저장됨"
        : "";

  return (
    <StatusOverviewFrame
      mode="prep"
      suitcaseGauge={suitcaseGauge}
      budgetGauge={previewGauge}
      currency={currency}
    >
      <form
        className={styles.planningRail}
        data-budget-autosave-state={error ? "error" : saving ? "saving" : saveState}
        onSubmit={flushBudget}
        noValidate
      >
        <div className={styles.planningBudgetDetails}>
          <label className={styles.budgetInputLabel} htmlFor={`${messageId}-input`}>
            <span>예산</span>
            <span className={styles.saveStateIcon} aria-hidden>
              {saving ? (
                <LoaderCircle className="size-3.5 animate-spin motion-reduce:animate-none" />
              ) : saveState === "saved" ? (
                <Check className="size-3.5" />
              ) : error ? (
                <AlertCircle className="size-3.5 text-danger-text" />
              ) : null}
            </span>
          </label>
          <div className={styles.budgetInputWrap}>
            <Input
              ref={inputRef}
              id={`${messageId}-input`}
              type="text"
              inputMode="decimal"
              autoComplete="off"
              value={draft}
              onChange={changeBudget}
              onBlur={() => flushBudget()}
              placeholder="미설정"
              aria-label={`여행 예산, ${currency}`}
              aria-describedby={cn(statusId, error && messageId)}
              aria-invalid={Boolean(error)}
              disabled={!onSaveBudget}
              variant="field"
              className={styles.budgetInput}
            />
            <span className={styles.currencySuffix} aria-hidden>
              {currency}
            </span>
          </div>
        </div>
        <Metric
          label="총 예상 비용"
          emphasis="prep"
          align="right"
          priority="secondary"
        >
          <CurrencyText amount={summary.estimatedTotal} currency={currency} />
        </Metric>
        <Metric label="담은 선물" emphasis="prep" align="right" priority="secondary">
          {giftItemCount}개
        </Metric>
        <p
          id={messageId}
          role="alert"
          aria-hidden={!error}
          data-budget-error-visible={error ? "true" : "false"}
          className={styles.budgetError}
        >
          {error ?? "\u00a0"}
        </p>
        <span id={statusId} className="sr-only" role="status" aria-live="polite">
          {statusText}
        </span>
      </form>
    </StatusOverviewFrame>
  );
}

function getLiveBudgetValue(gauge: StatusBudgetGauge, currency: string) {
  if (gauge.remainingAmount === null) return "미설정";
  if (gauge.remainingAmount < 0) {
    return (
      <span className="text-danger-text">
        초과 <CurrencyText amount={Math.abs(gauge.remainingAmount)} currency={currency} />
      </span>
    );
  }
  return <CurrencyText amount={gauge.remainingAmount} currency={currency} />;
}

function ReservoirColumn({
  mode,
  gauge,
  currency,
}: {
  mode: "prep" | "live";
  gauge: StatusBudgetGauge;
  currency: string;
}) {
  return (
    <div className={styles.reservoirColumn}>
      <BudgetReservoir mode={mode} gauge={gauge} currency={currency} />
    </div>
  );
}

function BudgetReservoir({
  mode,
  gauge,
  currency,
}: {
  mode: "prep" | "live";
  gauge: StatusBudgetGauge;
  currency: string;
}) {
  const isPlanned = mode === "prep";
  const displayPercent = isPlanned
    ? getStatusBudgetDisplayPercent(gauge)
    : Math.round(gauge.visualPercent);
  const ariaText = getBudgetGaugeAriaText(mode, gauge, currency);
  const progressProps =
    gauge.rawPercent !== null
      ? {
          role: "progressbar" as const,
          "aria-label": isPlanned ? "총 예상 비용 대비 예산" : "남은 예산",
          "aria-valuemin": 0,
          "aria-valuemax": 100,
          "aria-valuenow": displayPercent,
          "aria-valuetext": ariaText,
        }
      : {
          role: "status" as const,
          "aria-label": ariaText,
        };

  return (
    <div
      data-budget-gauge={mode}
      className={cn(styles.budgetReservoir, styles[`${mode}Reservoir`])}
      {...progressProps}
    >
      <BudgetReservoirArtwork fillPercent={displayPercent} />
    </div>
  );
}

function getBudgetGaugeAriaText(
  mode: "prep" | "live",
  gauge: StatusBudgetGauge,
  currency: string,
) {
  if (gauge.budgetAmount === null) return "예산이 설정되지 않았어요";
  const budget = formatCurrency(gauge.budgetAmount, currency);

  if (mode === "prep") {
    const estimate = formatCurrency(gauge.comparisonAmount, currency);
    if (gauge.rawPercent === null) {
      return `예산 ${budget}, 총 예상 비용 없음`;
    }

    const percent = getStatusBudgetDisplayPercent(gauge);
    if (gauge.remainingAmount !== null && gauge.remainingAmount < 0) {
      return `예산 ${budget}, 총 예상 비용 ${estimate}, 예산 ${percent}퍼센트 충족, ${formatCurrency(Math.abs(gauge.remainingAmount), currency)} 부족`;
    }
    if (gauge.remainingAmount !== null && gauge.remainingAmount > 0) {
      return `예산 ${budget}, 총 예상 비용 ${estimate}, 예산 100퍼센트 충족, ${formatCurrency(gauge.remainingAmount, currency)} 여유`;
    }
    return `예산 ${budget}, 총 예상 비용 ${estimate}, 예산 100퍼센트 충족`;
  }

  const spent = formatCurrency(gauge.comparisonAmount, currency);
  if (gauge.remainingAmount === null) return `예산 ${budget}, 사용 금액 ${spent}`;
  if (gauge.remainingAmount < 0) {
    return `예산 ${budget}, 사용 금액 ${spent}, ${formatCurrency(Math.abs(gauge.remainingAmount), currency)} 초과`;
  }
  return `예산 ${budget}, 사용 금액 ${spent}, ${formatCurrency(gauge.remainingAmount, currency)} 남음`;
}


const suitcaseConfettiPieces = [0, 1, 2, 3, 4, 5, 6, 7, 8] as const;

function SuitcaseGauge({
  mode,
  gauge,
  size,
  suitcaseCelebrationNonce = 0,
}: {
  mode: OverviewScene;
  gauge: StatusSuitcaseGauge;
  size: "compact" | "large" | "overview";
  suitcaseCelebrationNonce?: number;
}) {
  const isCollection = gauge.kind === "collection";
  const scene = mode === "prep" ? "packing" : mode === "live" ? "transit" : "unpacking";
  const celebrationNonce =
    Number.isSafeInteger(suitcaseCelebrationNonce) && suitcaseCelebrationNonce > 0
      ? suitcaseCelebrationNonce
      : 0;
  const [initialCelebrationNonce] = useState(celebrationNonce);
  const isComplete =
    !isCollection &&
    gauge.totalCount > 0 &&
    gauge.purchasedCount === gauge.totalCount;
  const hasCelebrationSignal = celebrationNonce > initialCelebrationNonce;
  const isCelebrating = isComplete && hasCelebrationSignal;
  const accentClass =
    mode === "prep"
      ? "text-prep-deep"
      : mode === "live"
        ? "text-live-deep"
        : "text-after-deep";
  const ariaProps = isCollection
    ? {
        role: "status" as const,
        "aria-label":
          gauge.totalCount === 0
            ? "쇼핑리스트가 비어 있어요"
            : `쇼핑리스트에 상품 ${gauge.totalCount}개를 담았어요`,
      }
    : gauge.rawPercent === null
      ? {
          role: "status" as const,
          "aria-label": "저장한 상품이 없어 구매 완료율을 계산할 수 없어요",
        }
      : {
          role: "progressbar" as const,
          "aria-label": "구매 완료율",
          "aria-valuemin": 0,
          "aria-valuemax": 100,
          "aria-valuenow": Math.round(gauge.rawPercent),
          "aria-valuetext": isComplete
            ? `전체 상품 ${gauge.totalCount}개 모두 구매 완료`
            : `전체 상품 ${gauge.totalCount}개 중 ${gauge.purchasedCount}개 구매 완료`,
        };

  return (
    <div
      data-trip-suitcase-gauge={gauge.kind}
      data-suitcase-size={size}
      data-suitcase-scene={scene}
      data-trip-suitcase-celebrating={isCelebrating ? "true" : "false"}
      data-trip-suitcase-celebration-nonce={
        isCelebrating ? celebrationNonce : undefined
      }
      className={cn("relative shrink-0", styles.suitcaseGauge)}
      aria-live="polite"
      aria-atomic="true"
      {...ariaProps}
    >
      <div
        key={hasCelebrationSignal ? `celebration-${celebrationNonce}` : "steady"}
        aria-hidden
        className={styles.suitcaseCanvas}
      >
        <div
          key={isCollection ? `packing-${gauge.totalCount}` : "purchase-progress"}
          className={cn(
            styles.suitcaseArtwork,
            isCollection && styles.packingRefresh,
            hasCelebrationSignal && styles.suitcaseJump,
          )}
        >
          <TripStatusSuitcaseArtwork
            scene={scene}
            fillPercent={gauge.visualPercent}
            activeSlots={gauge.activeSlots}
            overflowCount={gauge.overflowCount}
            purchasedCount={gauge.purchasedCount}
          />
        </div>
        {hasCelebrationSignal ? (
          <span className={cn(styles.confettiBurst, accentClass)}>
            {suitcaseConfettiPieces.map((piece) => (
              <span key={piece} className={styles.confettiPiece} />
            ))}
          </span>
        ) : null}
      </div>
    </div>
  );
}

function Metric({
  label,
  emphasis,
  align,
  priority,
  children,
}: {
  label: ReactNode;
  emphasis: OverviewScene;
  align: "left" | "right";
  priority: "primary" | "secondary";
  children: ReactNode;
}) {
  return (
    <dl
      className={cn(
        styles.metric,
        priority === "primary" ? styles.primaryMetric : styles.secondaryMetric,
        align === "right" ? "text-right" : "text-left",
      )}
    >
      <dt
        className={cn(
          styles.metricLabel,
          emphasis === "prep" && "text-ink-2",
          emphasis === "live" && "text-live-sub",
          emphasis === "after" && "text-after-ink-2",
        )}
      >
        {label}
      </dt>
      <dd
        className={cn(
          styles.metricValue,
          emphasis === "prep" && "text-prep-deep",
          emphasis === "live" && "text-live-ink",
          emphasis === "after" && "text-after-deep",
        )}
      >
        {children}
      </dd>
    </dl>
  );
}
