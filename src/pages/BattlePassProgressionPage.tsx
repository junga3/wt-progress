import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Gift, Layers3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

type StyleMode = "rebuilt" | "original";
type BattlePassProgressionPageProps = {
  styleMode: StyleMode;
  seasonDaysRemaining: number;
  elapsedSeasonDays: number;
  seasonElapsedPct: number;
};

type BattlePassBandId = "entry" | "middle" | "later" | "bonus";
type BattlePassTrack = "free" | "premium" | "ultimate";
type SavedBattlePassState = {
  battlePassLevel: number;
  battlePassTrack: BattlePassTrack;
};

const BATTLE_PASS_STORAGE_KEY = "wt-battle-pass-progression-state";
const LEVELS_PER_MAIN_BAND = 32;
const BONUS_LEVELS = 10;
const MAIN_TRACK_LEVELS = LEVELS_PER_MAIN_BAND * 3;
const TOTAL_TRACKED_LEVELS = MAIN_TRACK_LEVELS + BONUS_LEVELS;
const ENTRY_XP = 10_000;
const MIDDLE_XP = 20_000;
const LATER_XP = 25_000;
const BONUS_XP = 50_000;
const NUMBER_FORMATTER = new Intl.NumberFormat("en-US");
const LIGHT_PROGRESS_TRACK_CLASS =
  "bg-[rgba(148,163,184,0.22)] shadow-[inset_0_1px_2px_rgba(15,23,42,0.08)]";
const DEFAULT_BATTLE_PASS_STATE: SavedBattlePassState = {
  battlePassLevel: 0,
  battlePassTrack: "free",
};

const BATTLE_PASS_TRACKS = [
  {
    id: "free" as const,
    label: "Free",
    helper: "Keep the page focused on the free reward line while tracking the same level milestones.",
    rewardsSummary: "Free rewards only",
  },
  {
    id: "premium" as const,
    label: "Premium",
    helper: "Use the paid reward track view while keeping your progression tied to level milestones.",
    rewardsSummary: "Free + premium rewards",
  },
  {
    id: "ultimate" as const,
    label: "Ultimate",
    helper: "Plan around the most complete reward track without needing to manage live XP totals.",
    rewardsSummary: "Premium rewards + ultimate extras",
  },
];

const BATTLE_PASS_BANDS = [
  {
    id: "entry" as const,
    label: "Entry levels",
    range: "Levels 1 - 32",
    levels: LEVELS_PER_MAIN_BAND,
    xpPerLevel: ENTRY_XP,
    totalXp: LEVELS_PER_MAIN_BAND * ENTRY_XP,
    startCompletedLevel: 0,
  },
  {
    id: "middle" as const,
    label: "Middle levels",
    range: "Levels 33 - 64",
    levels: LEVELS_PER_MAIN_BAND,
    xpPerLevel: MIDDLE_XP,
    totalXp: LEVELS_PER_MAIN_BAND * MIDDLE_XP,
    startCompletedLevel: LEVELS_PER_MAIN_BAND,
  },
  {
    id: "later" as const,
    label: "Later levels",
    range: "Levels 65 - 96",
    levels: LEVELS_PER_MAIN_BAND,
    xpPerLevel: LATER_XP,
    totalXp: LEVELS_PER_MAIN_BAND * LATER_XP,
    startCompletedLevel: LEVELS_PER_MAIN_BAND * 2,
  },
  {
    id: "bonus" as const,
    label: "Bonus levels",
    range: "Levels 97 - 106",
    levels: BONUS_LEVELS,
    xpPerLevel: BONUS_XP,
    totalXp: BONUS_LEVELS * BONUS_XP,
    startCompletedLevel: MAIN_TRACK_LEVELS,
  },
];

const BAND_STYLES: Record<
  BattlePassBandId | "complete",
  {
    chip: string;
    soft: string;
    text: string;
    accent: string;
    panel: string;
  }
> = {
  entry: {
    chip: "border-amber-200 bg-amber-50 text-amber-700",
    soft: "bg-amber-100 text-amber-700",
    text: "text-amber-700",
    accent: "bg-amber-500",
    panel: "from-amber-100 via-orange-50 to-white",
  },
  middle: {
    chip: "border-sky-200 bg-sky-50 text-sky-700",
    soft: "bg-sky-100 text-sky-700",
    text: "text-sky-700",
    accent: "bg-sky-500",
    panel: "from-sky-100 via-cyan-50 to-white",
  },
  later: {
    chip: "border-emerald-200 bg-emerald-50 text-emerald-700",
    soft: "bg-emerald-100 text-emerald-700",
    text: "text-emerald-700",
    accent: "bg-emerald-500",
    panel: "from-emerald-100 via-green-50 to-white",
  },
  bonus: {
    chip: "border-fuchsia-200 bg-fuchsia-50 text-fuchsia-700",
    soft: "bg-fuchsia-100 text-fuchsia-700",
    text: "text-fuchsia-700",
    accent: "bg-fuchsia-500",
    panel: "from-fuchsia-100 via-violet-50 to-white",
  },
  complete: {
    chip: "border-slate-200 bg-slate-50 text-slate-700",
    soft: "bg-slate-100 text-slate-700",
    text: "text-slate-700",
    accent: "bg-slate-500",
    panel: "from-slate-100 via-white to-slate-50",
  },
};

function clampLevel(value: number) {
  return Math.min(TOTAL_TRACKED_LEVELS, Math.max(0, Math.round(value)));
}

function formatNumber(value: number) {
  return NUMBER_FORMATTER.format(Math.max(0, Math.round(value)));
}

function getBattlePassTrack(value: unknown): BattlePassTrack {
  return value === "premium" || value === "ultimate" ? value : "free";
}

function getSavedBattlePassState(): SavedBattlePassState {
  if (typeof window === "undefined") return DEFAULT_BATTLE_PASS_STATE;

  try {
    const saved = window.localStorage.getItem(BATTLE_PASS_STORAGE_KEY);
    if (!saved) return DEFAULT_BATTLE_PASS_STATE;

    const parsed = JSON.parse(saved);

    return {
      battlePassLevel: clampLevel(Number(parsed.battlePassLevel ?? 0)),
      battlePassTrack: getBattlePassTrack(parsed.battlePassTrack),
    };
  } catch {
    return DEFAULT_BATTLE_PASS_STATE;
  }
}

function getCurrentBand(level: number) {
  const safeLevel = clampLevel(level);

  if (safeLevel >= TOTAL_TRACKED_LEVELS) {
    return {
      id: "complete" as const,
      label: "Complete",
      subtitle: "Main pass and bonus rewards finished",
      nextCheckpoint: "All tracked levels complete",
      levelsLeftInBand: 0,
    };
  }

  if (safeLevel >= MAIN_TRACK_LEVELS) {
    return {
      id: "bonus" as const,
      label: "Bonus levels",
      subtitle: "Bonus reward levels are active",
      nextCheckpoint: `Level ${safeLevel + 1}`,
      levelsLeftInBand: TOTAL_TRACKED_LEVELS - safeLevel,
    };
  }

  if (safeLevel >= LEVELS_PER_MAIN_BAND * 2) {
    return {
      id: "later" as const,
      label: "Later levels",
      subtitle: "Later-level XP band is active",
      nextCheckpoint: `Level ${safeLevel + 1}`,
      levelsLeftInBand: MAIN_TRACK_LEVELS - safeLevel,
    };
  }

  if (safeLevel >= LEVELS_PER_MAIN_BAND) {
    return {
      id: "middle" as const,
      label: "Middle levels",
      subtitle: "Middle-level XP band is active",
      nextCheckpoint: `Level ${safeLevel + 1}`,
      levelsLeftInBand: LEVELS_PER_MAIN_BAND * 2 - safeLevel,
    };
  }

  return {
    id: "entry" as const,
    label: "Entry levels",
    subtitle: safeLevel === 0 ? "Start at level 1 and build the early track" : "Entry XP band is active",
    nextCheckpoint: `Level ${safeLevel + 1}`,
    levelsLeftInBand: LEVELS_PER_MAIN_BAND - safeLevel,
  };
}

export function BattlePassProgressionPage({
  styleMode,
  seasonDaysRemaining,
  elapsedSeasonDays,
  seasonElapsedPct,
}: BattlePassProgressionPageProps) {
  const initialSavedState = useMemo(() => getSavedBattlePassState(), []);
  const [savedState, setSavedState] = useState<SavedBattlePassState>(initialSavedState);
  const [inputValue, setInputValue] = useState(() => String(initialSavedState.battlePassLevel));
  const isOriginalStyle = styleMode === "original";
  const bodyTextClass = isOriginalStyle ? "text-slate-600" : "text-[var(--tf-muted)]";
  const progressTrackClass = isOriginalStyle ? undefined : LIGHT_PROGRESS_TRACK_CLASS;
  const battlePassLevel = savedState.battlePassLevel;
  const battlePassTrack = savedState.battlePassTrack;

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(
      BATTLE_PASS_STORAGE_KEY,
      JSON.stringify(savedState)
    );
  }, [savedState]);

  const currentBand = useMemo(() => getCurrentBand(battlePassLevel), [battlePassLevel]);
  const selectedTrack = useMemo(
    () => BATTLE_PASS_TRACKS.find((track) => track.id === battlePassTrack) ?? BATTLE_PASS_TRACKS[0],
    [battlePassTrack]
  );
  const activeBandStyles = BAND_STYLES[currentBand.id];
  const levelHeadlineClass =
    battlePassLevel >= 100
      ? "text-[clamp(3.5rem,8vw,6rem)]"
      : "text-[clamp(4rem,10vw,7.5rem)]";
  const mainCompletedLevels = Math.min(battlePassLevel, MAIN_TRACK_LEVELS);
  const bonusCompletedLevels = Math.min(
    Math.max(0, battlePassLevel - MAIN_TRACK_LEVELS),
    BONUS_LEVELS
  );
  const mainProgress = (mainCompletedLevels / MAIN_TRACK_LEVELS) * 100;
  const bonusProgress = (bonusCompletedLevels / BONUS_LEVELS) * 100;
  const overallProgress = (battlePassLevel / TOTAL_TRACKED_LEVELS) * 100;
  const mainLevelsLeft = Math.max(0, MAIN_TRACK_LEVELS - mainCompletedLevels);
  const bonusLevelsLeft = Math.max(0, BONUS_LEVELS - bonusCompletedLevels);
  const totalLevelsLeft = Math.max(0, TOTAL_TRACKED_LEVELS - battlePassLevel);

  function applyLevel(nextLevel: number) {
    const safeLevel = clampLevel(nextLevel);
    setSavedState((currentState) => ({ ...currentState, battlePassLevel: safeLevel }));
    setInputValue(String(safeLevel));
  }

  function saveInputLevel() {
    const parsed = Number(inputValue);
    if (Number.isNaN(parsed)) return;
    applyLevel(parsed);
  }

  return (
    <>
      <div className="mt-8 grid gap-6 xl:grid-cols-[1.35fr_0.95fr]">
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.04, duration: 0.35 }}
          className={cn(
            isOriginalStyle
              ? `rounded-[2.25rem] border bg-gradient-to-br p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)] md:p-8 ${activeBandStyles.panel}`
              : "tf-panel tf-panel-accent rounded-[2.25rem] p-6 md:p-8",
            isOriginalStyle
              ? "border-white/70"
              : "bg-[radial-gradient(circle_at_top_left,rgba(210,31,60,0.18),transparent_24%),linear-gradient(180deg,rgba(18,19,24,0.96),rgba(9,10,12,0.92))]"
          )}
        >
          <div className="flex flex-col gap-8">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <div
                  className={cn(
                    "text-sm font-semibold uppercase tracking-[0.22em]",
                    isOriginalStyle ? "text-slate-500" : "text-[var(--tf-muted)]"
                  )}
                >
                  Battle Pass status
                </div>
                <div className="mt-4 flex flex-wrap items-end gap-3">
                  <div
                    className={cn(
                      "whitespace-nowrap font-semibold tracking-tight leading-none",
                      levelHeadlineClass,
                      isOriginalStyle
                        ? "text-slate-900"
                        : "text-[var(--tf-cream)] drop-shadow-[0_12px_30px_rgba(0,0,0,0.4)]"
                    )}
                  >
                    Level {formatNumber(battlePassLevel)}
                  </div>
                </div>
                <div className="mt-3 max-w-xl text-base leading-7 text-[var(--tf-muted)]">
                  {currentBand.subtitle}
                </div>
              </div>

              <div
                className={cn(
                  "inline-flex w-fit items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium shadow-sm",
                  activeBandStyles.chip
                )}
              >
                <Layers3 className="h-4 w-4" />
                {currentBand.label}
              </div>
            </div>

            <div className="space-y-6">
              <BattlePassProgressRow
                label="Main pass completion"
                value={`${formatNumber(mainLevelsLeft)} levels left`}
                progress={mainProgress}
                footerLeft={`${formatNumber(mainCompletedLevels)} / ${formatNumber(MAIN_TRACK_LEVELS)} levels`}
                footerRight={`${Math.round(mainProgress)}% complete`}
                indicatorClassName="bg-sky-500"
                trackClassName={progressTrackClass}
              />

              <BattlePassProgressRow
                label="Bonus page completion"
                value={
                  battlePassLevel < MAIN_TRACK_LEVELS
                    ? "Locked until level 97"
                    : bonusLevelsLeft === 0
                      ? "Bonus complete"
                      : `${formatNumber(bonusLevelsLeft)} levels left`
                }
                progress={bonusProgress}
                footerLeft={`${formatNumber(bonusCompletedLevels)} / ${formatNumber(BONUS_LEVELS)} bonus levels`}
                footerRight={
                  battlePassLevel < MAIN_TRACK_LEVELS
                    ? "Unlocks after main pass"
                    : `${Math.round(bonusProgress)}% complete`
                }
                indicatorClassName="bg-fuchsia-500"
                trackClassName={progressTrackClass}
              />

              <BattlePassProgressRow
                label="Overall completion"
                value={totalLevelsLeft === 0 ? "All levels done" : `${formatNumber(totalLevelsLeft)} levels left`}
                progress={overallProgress}
                footerLeft={`${formatNumber(battlePassLevel)} / ${formatNumber(TOTAL_TRACKED_LEVELS)} tracked levels`}
                footerRight={`${Math.round(overallProgress)}% complete`}
                indicatorClassName={activeBandStyles.accent}
                trackClassName={progressTrackClass}
              />

              <BattlePassProgressRow
                label="Season completion"
                value={`${formatNumber(seasonDaysRemaining)} days left`}
                progress={seasonElapsedPct}
                footerLeft={`${formatNumber(elapsedSeasonDays)} days elapsed`}
                footerRight={`${Math.round(seasonElapsedPct)}% complete`}
                indicatorClassName="bg-slate-900"
                large
                trackClassName={progressTrackClass}
              />
            </div>
          </div>
        </motion.section>

        <motion.aside
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08, duration: 0.35 }}
          className={cn(
            "rounded-[2.25rem] p-6 md:p-8",
            isOriginalStyle
              ? "border border-white/70 bg-white/80 text-slate-900 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur-xl"
              : "tf-panel text-white"
          )}
        >
          <div>
            <div
              className={cn(
                "text-sm font-semibold uppercase tracking-[0.22em]",
                isOriginalStyle ? "text-slate-500" : "text-[var(--tf-muted)]"
              )}
            >
              Level control
            </div>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight">
              Update Battle Pass level
            </h2>
            <p
              className={cn(
                "mt-3 text-sm leading-6",
                bodyTextClass
              )}
            >
              Choose your pass type, then use the level you see in game. This
              page keeps progression tied to level milestones instead of live XP
              totals.
            </p>
          </div>

          <div
            className={cn(
              "mt-6 rounded-[1.75rem] border p-5",
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
              Battle Pass type
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2">
              {BATTLE_PASS_TRACKS.map((track) => {
                const isActive = battlePassTrack === track.id;

                return (
                  <button
                    key={track.id}
                    type="button"
                    onClick={() =>
                      setSavedState((currentState) => ({
                        ...currentState,
                        battlePassTrack: track.id,
                      }))
                    }
                    className={cn(
                      "rounded-[1rem] border px-3 py-3 text-sm font-medium transition",
                      isActive
                        ? isOriginalStyle
                          ? "border-rose-200 bg-rose-50 text-rose-700 shadow-[0_12px_30px_rgba(244,63,94,0.12)]"
                          : "border-[color:var(--tf-accent)] bg-[linear-gradient(90deg,var(--tf-accent-strong),var(--tf-accent))] text-[var(--tf-white)] shadow-[0_18px_40px_rgba(210,31,60,0.24)]"
                        : isOriginalStyle
                          ? "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-100"
                          : "border-white/10 bg-white/4 text-[var(--tf-muted)] hover:bg-white/8 hover:text-[var(--tf-cream)]"
                    )}
                  >
                    {track.label}
                  </button>
                );
              })}
            </div>
            <p className={cn("mt-3 text-sm leading-6", bodyTextClass)}>
              {selectedTrack.helper}
            </p>

            <label
              htmlFor="battle-pass-level"
              className={cn(
                "mt-5 block text-xs font-semibold uppercase tracking-[0.18em]",
                isOriginalStyle ? "text-slate-500" : "text-[var(--tf-muted)]"
              )}
            >
              Current Battle Pass level
            </label>
            <div className="mt-3 flex flex-col gap-3 sm:flex-row">
              <Input
                id="battle-pass-level"
                type="number"
                min={0}
                max={TOTAL_TRACKED_LEVELS}
                value={inputValue}
                onChange={(event) => setInputValue(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    saveInputLevel();
                  }
                }}
                className="tf-input h-12 rounded-2xl text-base"
                placeholder="Enter level"
              />
              <Button
                onClick={saveInputLevel}
                className="tf-button-accent h-12 rounded-2xl px-6"
              >
                Save level
              </Button>
            </div>

            <div className="mt-4 grid grid-cols-4 gap-2">
              {[-1, 1, 5, 10].map((delta) => (
                <button
                  key={delta}
                  type="button"
                  onClick={() => applyLevel(battlePassLevel + delta)}
                  className={cn(
                    "rounded-[1rem] border px-3 py-3 text-sm font-medium transition",
                    isOriginalStyle
                      ? "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-100"
                      : "border-white/10 bg-white/4 text-[var(--tf-cream)] hover:bg-white/8"
                  )}
                >
                  {delta > 0 ? `+${delta}` : delta}
                </button>
              ))}
            </div>
          </div>

        </motion.aside>
      </div>

      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.12, duration: 0.35 }}
        className={cn(
          "mt-8 rounded-[2.25rem] p-6 md:p-8",
          isOriginalStyle
            ? "border border-white/70 bg-white/80 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur-xl"
            : "tf-panel"
        )}
      >
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div
              className={cn(
                "text-sm font-semibold uppercase tracking-[0.22em]",
                isOriginalStyle ? "text-slate-500" : "text-[var(--tf-muted)]"
              )}
            >
              Progression bands
            </div>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight">
              See how the level bands are split up
            </h2>
            <p
              className={cn(
                "mt-2 max-w-3xl text-sm leading-6",
                bodyTextClass
              )}
            >
              This mockup uses your current level to map entry, middle, later,
              and bonus progression without needing to track raw XP every day.
            </p>
          </div>

          <div className="tf-meta-pill rounded-full px-4 py-2 text-sm text-[var(--tf-cream)]">
            1,760,000 XP main pass / 500,000 XP bonus
          </div>
        </div>

        <div className="mt-8 grid gap-5 xl:grid-cols-2">
          {BATTLE_PASS_BANDS.map((band, index) => {
            const styles = BAND_STYLES[band.id];
            const completedLevels = Math.min(
              Math.max(0, battlePassLevel - band.startCompletedLevel),
              band.levels
            );
            const remainingLevels = Math.max(0, band.levels - completedLevels);
            const progress = (completedLevels / band.levels) * 100;
            const isActive =
              currentBand.id === band.id ||
              (band.id === "entry" && battlePassLevel === 0);
            const isComplete = completedLevels === band.levels;
            const statusLabel = isComplete
              ? "Complete"
              : isActive
                ? "Active"
                : completedLevels > 0
                  ? "In progress"
                  : "Up next";

            return (
              <motion.article
                key={band.id}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.14 + index * 0.03, duration: 0.3 }}
                className={cn(
                  "rounded-[2rem] p-5 md:p-6",
                  isOriginalStyle
                    ? "border border-white/70 bg-white/85 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur-xl"
                    : "tf-panel",
                  isActive
                    ? isOriginalStyle
                      ? "ring-2 ring-slate-200"
                      : "ring-2 ring-white/20"
                    : ""
                )}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div
                      className={cn(
                        "text-sm font-semibold uppercase tracking-[0.18em]",
                        isOriginalStyle ? "text-slate-500" : "text-[var(--tf-muted)]"
                      )}
                    >
                      {band.range}
                    </div>
                    <h3 className="mt-2 text-2xl font-semibold tracking-tight text-[var(--tf-cream)]">
                      {band.label}
                    </h3>
                  </div>

                  <div className={cn("rounded-full border px-3 py-1.5 text-sm font-medium", styles.chip)}>
                    {statusLabel}
                  </div>
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <BattlePassMetaCard
                    label="XP per level"
                    value={`${formatNumber(band.xpPerLevel)} XP`}
                    isOriginalStyle={isOriginalStyle}
                  />
                  <BattlePassMetaCard
                    label="Band total"
                    value={`${formatNumber(band.totalXp)} XP`}
                    isOriginalStyle={isOriginalStyle}
                  />
                </div>

                <div
                  className={cn(
                    "mt-5 rounded-[1.75rem] border bg-gradient-to-br p-5",
                    styles.panel,
                    "border-white/10"
                  )}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="text-sm font-medium text-slate-500">Progress in band</div>
                      <div className={cn("mt-2 text-3xl font-semibold tracking-tight", styles.text)}>
                        {formatNumber(completedLevels)} / {formatNumber(band.levels)}
                      </div>
                      <div className="mt-2 text-sm text-slate-600">
                        {remainingLevels === 0
                          ? "This band is finished"
                          : `${formatNumber(remainingLevels)} levels left in this band`}
                      </div>
                    </div>

                    <div className={cn("rounded-2xl px-4 py-3", styles.soft)}>
                      <Gift className="h-5 w-5" />
                    </div>
                  </div>

                  <div className="mt-5">
                    <div className="mb-2 flex items-center justify-between text-sm text-slate-500">
                      <span>Completion</span>
                      <span className="font-medium text-slate-700">
                        {Math.round(progress)}%
                      </span>
                    </div>
                    <Progress
                      value={progress}
                      indicatorClassName={styles.accent}
                      className={cn("h-3 rounded-full", progressTrackClass ?? "bg-black/18")}
                    />
                    <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
                      <span>Start</span>
                      <span>{band.range}</span>
                    </div>
                  </div>
                </div>
              </motion.article>
            );
          })}
        </div>
      </motion.section>
    </>
  );
}

function BattlePassProgressRow({
  label,
  value,
  progress,
  footerLeft,
  footerRight,
  large = false,
  indicatorClassName,
  trackClassName,
}: {
  label: string;
  value: string;
  progress: number;
  footerLeft: string;
  footerRight: string;
  large?: boolean;
  indicatorClassName?: string;
  trackClassName?: string;
}) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3 text-sm text-[var(--tf-muted)]">
        <span>{label}</span>
        <span className="font-medium text-[var(--tf-cream)]">{value}</span>
      </div>
      <Progress
        value={progress}
        indicatorClassName={indicatorClassName}
        className={cn("tf-progress-track rounded-full", large ? "h-4" : "h-3", trackClassName)}
      />
      <div className="mt-2 flex items-center justify-between text-xs text-[var(--tf-muted)]">
        <span>{footerLeft}</span>
        <span>{footerRight}</span>
      </div>
    </div>
  );
}

function BattlePassMetaCard({
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

