import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  CircleDollarSign,
  Crosshair,
  HeartPulse,
  Trophy,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

type BadgeStatId = "eliminations" | "revives" | "cash" | "wins";
type BadgeTier = "Bronze" | "Silver" | "Gold" | "Platinum" | "Diamond" | "Amethyst";
type StoredBadgeInputs = Record<BadgeStatId, string>;
type StatisticsBadgeProgressionPageProps = {
  styleMode: "rebuilt" | "original";
};

const BADGE_STORAGE_KEY = "wt-statistics-badge-progression-state";
const BADGE_ART = import.meta.glob("../assets/stats/*.png", {
  eager: true,
  import: "default",
}) as Record<string, string>;

const BADGE_TIERS: BadgeTier[] = [
  "Bronze",
  "Silver",
  "Gold",
  "Platinum",
  "Diamond",
  "Amethyst",
];

const BADGE_TIER_STYLES: Record<
  BadgeTier | "Unranked",
  {
    chip: string;
    text: string;
    panel: string;
    accent: string;
    soft: string;
  }
> = {
  Unranked: {
    chip: "border-slate-200 bg-slate-50 text-slate-600",
    text: "text-slate-700",
    panel: "from-slate-100 via-white to-slate-50",
    accent: "bg-slate-400",
    soft: "bg-slate-100 text-slate-500",
  },
  Bronze: {
    chip: "border-amber-200 bg-amber-50 text-amber-700",
    text: "text-amber-700",
    panel: "from-amber-200 via-orange-50 to-white",
    accent: "bg-amber-500",
    soft: "bg-amber-100 text-amber-700",
  },
  Silver: {
    chip: "border-slate-200 bg-slate-50 text-slate-700",
    text: "text-slate-700",
    panel: "from-slate-200 via-zinc-50 to-white",
    accent: "bg-slate-400",
    soft: "bg-slate-100 text-slate-700",
  },
  Gold: {
    chip: "border-yellow-200 bg-yellow-50 text-yellow-700",
    text: "text-yellow-700",
    panel: "from-yellow-200 via-amber-50 to-white",
    accent: "bg-yellow-500",
    soft: "bg-yellow-100 text-yellow-700",
  },
  Platinum: {
    chip: "border-cyan-200 bg-cyan-50 text-cyan-700",
    text: "text-cyan-700",
    panel: "from-cyan-200 via-sky-50 to-white",
    accent: "bg-cyan-500",
    soft: "bg-cyan-100 text-cyan-700",
  },
  Diamond: {
    chip: "border-blue-200 bg-blue-50 text-blue-700",
    text: "text-blue-700",
    panel: "from-blue-200 via-indigo-50 to-white",
    accent: "bg-blue-500",
    soft: "bg-blue-100 text-blue-700",
  },
  Amethyst: {
    chip: "border-fuchsia-200 bg-fuchsia-50 text-fuchsia-700",
    text: "text-fuchsia-700",
    panel: "from-fuchsia-200 via-violet-50 to-white",
    accent: "bg-fuchsia-500",
    soft: "bg-fuchsia-100 text-fuchsia-700",
  },
};

const BADGE_ART_SERIES: Record<BadgeStatId, string> = {
  wins: "REGULAR_FIXTURE",
  eliminations: "EFFICIENT_ELIMINATOR",
  revives: "VIRTUAL_LIFESAVER",
  cash: "CASH_FLOW_MANAGER",
};

const NUMBER_FORMATTER = new Intl.NumberFormat("en-US");
const CURRENCY_FORMATTER = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

const BADGE_STATS = [
  {
    id: "wins" as const,
    gameLabel: "WINS",
    label: "Total wins",
    shortLabel: "Wins",
    icon: Trophy,
    placeholder: "0",
    thresholds: [20, 50, 300, 1_000, 2_500, 5_000],
  },
  {
    id: "eliminations" as const,
    gameLabel: "ELIMINATIONS",
    label: "Total eliminations",
    shortLabel: "Eliminations",
    icon: Crosshair,
    placeholder: "0",
    thresholds: [100, 750, 3_000, 10_000, 25_000, 50_000],
  },
  {
    id: "revives" as const,
    gameLabel: "REVIVES",
    label: "Total revives",
    shortLabel: "Revives",
    icon: HeartPulse,
    placeholder: "0",
    thresholds: [25, 150, 750, 2_500, 5_000, 10_000],
  },
  {
    id: "cash" as const,
    gameLabel: "CASH",
    label: "Total cash",
    shortLabel: "Cash",
    icon: CircleDollarSign,
    placeholder: "0",
    thresholds: [1_000_000, 5_000_000, 15_000_000, 50_000_000, 100_000_000, 250_000_000],
  },
];

function getSavedBadgeInputs(): StoredBadgeInputs {
  if (typeof window === "undefined") {
    return {
      eliminations: "",
      revives: "",
      cash: "",
      wins: "",
    };
  }

  try {
    const saved = window.localStorage.getItem(BADGE_STORAGE_KEY);
    if (!saved) {
      return {
        eliminations: "",
        revives: "",
        cash: "",
        wins: "",
      };
    }

    const parsed = JSON.parse(saved);
    return {
      eliminations: sanitizeNumericInput(parsed.eliminations ?? ""),
      revives: sanitizeNumericInput(parsed.revives ?? ""),
      cash: sanitizeNumericInput(parsed.cash ?? ""),
      wins: sanitizeNumericInput(parsed.wins ?? ""),
    };
  } catch {
    return {
      eliminations: "",
      revives: "",
      cash: "",
      wins: "",
    };
  }
}

function sanitizeNumericInput(value: unknown) {
  return String(value ?? "").replace(/\D/g, "");
}

function parseBadgeValue(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.max(0, parsed) : 0;
}

function formatBadgeValue(id: BadgeStatId, value: number) {
  return id === "cash" ? CURRENCY_FORMATTER.format(value) : NUMBER_FORMATTER.format(value);
}

function formatGameInputValue(value: string) {
  if (!value) return "";
  return NUMBER_FORMATTER.format(parseBadgeValue(value));
}

function getBadgeArt(statId: BadgeStatId, tier: BadgeTier | "Unranked") {
  if (tier === "Unranked") return null;

  const series = BADGE_ART_SERIES[statId];
  return BADGE_ART[`../assets/stats/Common_${series}-${tier}.png`] ?? null;
}

function getTierProgress(value: number, thresholds: number[]) {
  const currentTierIndex = thresholds.reduce(
    (highestIndex, threshold, index) => (value >= threshold ? index : highestIndex),
    -1
  );
  const currentTier = currentTierIndex >= 0 ? BADGE_TIERS[currentTierIndex] : null;
  const nextTierIndex =
    currentTierIndex + 1 < BADGE_TIERS.length ? currentTierIndex + 1 : null;
  const nextTier = nextTierIndex !== null ? BADGE_TIERS[nextTierIndex] : null;
  const lowerBound = currentTierIndex >= 0 ? thresholds[currentTierIndex] : 0;
  const upperBound = nextTierIndex !== null ? thresholds[nextTierIndex] : null;
  const progress =
    upperBound === null
      ? 100
      : Math.min(
          100,
          Math.max(0, ((value - lowerBound) / Math.max(1, upperBound - lowerBound)) * 100)
        );

  return {
    currentTier,
    nextTier,
    lowerBound,
    upperBound,
    progress,
    remaining: upperBound === null ? 0 : Math.max(0, upperBound - value),
  };
}

export function StatisticsBadgeProgressionPage({
  styleMode,
}: StatisticsBadgeProgressionPageProps) {
  const [inputs, setInputs] = useState<StoredBadgeInputs>(() => getSavedBadgeInputs());
  const isOriginalStyle = styleMode === "original";
  const bodyTextClass = isOriginalStyle ? "text-slate-600" : "text-[var(--tf-muted)]";

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(BADGE_STORAGE_KEY, JSON.stringify(inputs));
  }, [inputs]);

  const summaries = useMemo(
    () =>
      BADGE_STATS.map((stat) => {
        const value = parseBadgeValue(inputs[stat.id]);
        const progress = getTierProgress(value, stat.thresholds);
        const activeTier = progress.currentTier ?? progress.nextTier ?? "Bronze";

        return {
          ...stat,
          value,
          progress,
          activeTier,
        };
      }),
    [inputs]
  );

  return (
    <>
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.04, duration: 0.35 }}
        className={cn(
          "mt-8 rounded-[2.25rem] p-6 md:p-8",
          isOriginalStyle
            ? "border border-white/70 bg-white/85 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur-xl"
            : "tf-panel"
        )}
      >
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-2xl">
            <div className="tf-kicker">Input from game</div>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-[var(--tf-cream)]">
              Enter the totals from your player card
            </h2>
            <p className={cn("mt-3 text-sm leading-6", bodyTextClass)}>
              Type the lifetime totals you see in game. The badge cards below
              update instantly and save automatically in this browser.
            </p>
          </div>

          <div
            className={cn(
              "rounded-full border px-4 py-2 text-sm font-medium",
              isOriginalStyle
                ? "border-slate-200 bg-slate-50 text-slate-500"
                : "border-white/10 bg-white/4 text-[var(--tf-muted)]"
            )}
          >
            Saved automatically
          </div>
        </div>

        <div className="mt-6 overflow-hidden rounded-[1.9rem] border border-slate-900/90 bg-[#1d1f25] shadow-[0_20px_50px_rgba(15,23,42,0.18)]">
          {BADGE_STATS.map((stat, index) => (
            <div
              key={`game-input-${stat.id}`}
              className={cn(
                "grid items-center gap-4 px-4 py-4 md:grid-cols-[minmax(0,1fr)_minmax(180px,240px)] md:px-6",
                index !== 0 ? "border-t border-white/10" : ""
              )}
            >
              <label
                htmlFor={`game-input-${stat.id}`}
                className="text-3xl font-semibold uppercase italic leading-none tracking-[0.02em] text-white md:text-4xl"
              >
                {stat.gameLabel}
              </label>

              <Input
                id={`game-input-${stat.id}`}
                type="text"
                inputMode="numeric"
                value={formatGameInputValue(inputs[stat.id])}
                onChange={(event) =>
                  setInputs((prev) => ({
                    ...prev,
                    [stat.id]: sanitizeNumericInput(event.target.value),
                  }))
                }
                className="h-auto border-none bg-transparent px-0 py-0 text-right text-3xl font-semibold uppercase italic leading-none tracking-[0.02em] text-white shadow-none focus-visible:ring-0 md:text-4xl"
                placeholder={stat.placeholder}
              />
            </div>
          ))}
        </div>
      </motion.section>

      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08, duration: 0.35 }}
        className="mt-8 grid gap-5 lg:grid-cols-2"
      >
        {summaries.map((summary, index) => {
          const Icon = summary.icon;
          const currentTier = summary.progress.currentTier ?? "Unranked";
          const activeTierStyles = BADGE_TIER_STYLES[summary.activeTier];
          const currentTierStyles = BADGE_TIER_STYLES[currentTier];
          const nextTierStyles = BADGE_TIER_STYLES[summary.progress.nextTier ?? summary.activeTier];
          const badgeArt = getBadgeArt(summary.id, currentTier);

          return (
            <motion.article
              key={summary.id}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + index * 0.03, duration: 0.3 }}
              className={cn(
                "rounded-[2rem] p-5 md:p-6",
                isOriginalStyle
                  ? "border border-white/70 bg-white/85 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur-xl"
                  : "tf-panel"
              )}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      "flex h-12 w-12 items-center justify-center rounded-2xl",
                      activeTierStyles.soft
                    )}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <div
                      className={cn(
                        "text-sm font-semibold uppercase tracking-[0.18em]",
                        isOriginalStyle ? "text-slate-500" : "text-[var(--tf-muted)]"
                      )}
                    >
                      {summary.shortLabel}
                    </div>
                    <h3 className="mt-1 text-2xl font-semibold tracking-tight text-[var(--tf-cream)]">
                      {summary.label}
                    </h3>
                  </div>
                </div>

                <div
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-sm font-medium",
                    currentTierStyles.chip
                  )}
                >
                  {currentTier}
                </div>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <StatMetaCard
                  label="Entered total"
                  value={formatBadgeValue(summary.id, summary.value)}
                  isOriginalStyle={isOriginalStyle}
                />
                <StatMetaCard
                  label="Next unlock"
                  value={
                    summary.progress.nextTier
                      ? `${summary.progress.nextTier} in ${formatBadgeValue(
                          summary.id,
                          summary.progress.remaining
                        )}`
                      : "Top tier reached"
                  }
                  isOriginalStyle={isOriginalStyle}
                />
              </div>

              <div
                className={cn(
                  "mt-5 rounded-[1.75rem] border bg-gradient-to-br p-5",
                  activeTierStyles.panel,
                  "border-white/10"
                )}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-sm font-medium text-slate-500">Current badge</div>
                    <div className={cn("mt-2 text-3xl font-semibold tracking-tight", currentTierStyles.text)}>
                      {currentTier}
                    </div>
                    <div className="mt-2 text-sm text-slate-600">
                      {summary.progress.nextTier
                        ? `${formatBadgeValue(summary.id, summary.progress.remaining)} to ${summary.progress.nextTier}`
                        : "Top tier reached"}
                    </div>
                  </div>

                  <div className="flex flex-col items-center">
                    {badgeArt ? (
                      <img
                        src={badgeArt}
                        alt={`${summary.label} ${currentTier} badge`}
                        className="h-26 w-26 object-contain drop-shadow-[0_14px_28px_rgba(15,23,42,0.18)]"
                      />
                    ) : (
                      <div className="grid h-24 w-24 place-items-center rounded-[1.75rem] border border-dashed border-slate-300 bg-white/65 text-center shadow-sm">
                        <div>
                          <div className="text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-slate-500">
                            Badge
                          </div>
                          <div className="mt-1 text-sm font-semibold text-slate-700">
                            Locked
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-5">
                  <div className="mb-2 flex items-center justify-between text-sm text-slate-500">
                    <span>Progress to {summary.progress.nextTier ?? "Amethyst"}</span>
                    <span className="font-medium text-slate-700">
                      {Math.round(summary.progress.progress)}%
                    </span>
                  </div>
                  <Progress
                    value={summary.progress.progress}
                    indicatorClassName={nextTierStyles.accent}
                    className="h-3 rounded-full bg-black/18"
                  />
                  <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
                    <span>{formatBadgeValue(summary.id, summary.progress.lowerBound)}</span>
                    <span>
                      {summary.progress.upperBound === null
                        ? "Amethyst complete"
                        : formatBadgeValue(summary.id, summary.progress.upperBound)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                {BADGE_TIERS.map((tier) => {
                  const isCurrent = summary.progress.currentTier === tier;
                  const isUnlocked =
                    summary.progress.currentTier !== null &&
                    BADGE_TIERS.indexOf(tier) <= BADGE_TIERS.indexOf(summary.progress.currentTier);

                  return (
                    <span
                      key={`${summary.id}-${tier}`}
                      className={cn(
                        "rounded-full border px-3 py-1.5 text-xs font-medium transition",
                        BADGE_TIER_STYLES[tier].chip,
                        isCurrent
                          ? isOriginalStyle
                            ? "ring-2 ring-offset-2 ring-slate-200"
                            : "ring-2 ring-offset-2 ring-white/30"
                          : "",
                        !isUnlocked && !isCurrent ? "opacity-45" : ""
                      )}
                    >
                      {tier}
                    </span>
                  );
                })}
              </div>
            </motion.article>
          );
        })}
      </motion.section>
    </>
  );
}

function StatMetaCard({
  label,
  value,
  isOriginalStyle,
}: {
  label: string;
  value: string;
  isOriginalStyle: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-[1.35rem] border px-4 py-3",
        isOriginalStyle
          ? "border-slate-200 bg-slate-50/90"
          : "border-white/10 bg-white/4"
      )}
    >
      <div
        className={cn(
          "text-xs font-semibold uppercase tracking-[0.18em]",
          isOriginalStyle ? "text-slate-500" : "text-[var(--tf-muted)]"
        )}
      >
        {label}
      </div>
      <div
        className={cn(
          "mt-2 text-lg font-semibold tracking-tight",
          isOriginalStyle ? "text-slate-900" : "text-[var(--tf-cream)]"
        )}
      >
        {value}
      </div>
    </div>
  );
}
