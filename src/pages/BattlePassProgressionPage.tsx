import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ChevronDown,
  ChevronRight,
  Crown,
  Gift,
  Layers3,
  PanelBottomOpen,
  Star,
  Target,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  SEASON_10_BATTLE_PASS_REWARDS,
  type Season10BattlePassReward,
} from "@/data/season10BattlePassRewards";
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
    rewardsSummary: "Free",
  },
  {
    id: "premium" as const,
    label: "Premium",
    rewardsSummary: "Free + Premium",
  },
  {
    id: "ultimate" as const,
    label: "Ultimate",
    rewardsSummary: "All Tracks",
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
    segmentTrack: string;
    segmentFill: string;
    segmentText: string;
  }
> = {
  entry: {
    chip: "border-amber-200 bg-amber-50 text-amber-700",
    soft: "bg-amber-100 text-amber-700",
    text: "text-amber-700",
    accent: "bg-amber-500",
    panel: "from-amber-100 via-orange-50 to-white",
    segmentTrack: "bg-amber-400/20",
    segmentFill: "bg-amber-400",
    segmentText: "text-amber-100",
  },
  middle: {
    chip: "border-sky-200 bg-sky-50 text-sky-700",
    soft: "bg-sky-100 text-sky-700",
    text: "text-sky-700",
    accent: "bg-sky-500",
    panel: "from-sky-100 via-cyan-50 to-white",
    segmentTrack: "bg-sky-400/20",
    segmentFill: "bg-sky-400",
    segmentText: "text-sky-100",
  },
  later: {
    chip: "border-emerald-200 bg-emerald-50 text-emerald-700",
    soft: "bg-emerald-100 text-emerald-700",
    text: "text-emerald-700",
    accent: "bg-emerald-500",
    panel: "from-emerald-100 via-green-50 to-white",
    segmentTrack: "bg-emerald-400/20",
    segmentFill: "bg-emerald-400",
    segmentText: "text-emerald-100",
  },
  bonus: {
    chip: "border-fuchsia-200 bg-fuchsia-50 text-fuchsia-700",
    soft: "bg-fuchsia-100 text-fuchsia-700",
    text: "text-fuchsia-700",
    accent: "bg-fuchsia-500",
    panel: "from-fuchsia-100 via-violet-50 to-white",
    segmentTrack: "bg-fuchsia-400/20",
    segmentFill: "bg-fuchsia-400",
    segmentText: "text-fuchsia-100",
  },
  complete: {
    chip: "border-slate-200 bg-slate-50 text-slate-700",
    soft: "bg-slate-100 text-slate-700",
    text: "text-slate-700",
    accent: "bg-slate-500",
    panel: "from-slate-100 via-white to-slate-50",
    segmentTrack: "bg-slate-400/20",
    segmentFill: "bg-slate-400",
    segmentText: "text-slate-100",
  },
};

const LEVEL_MARKS = Array.from({ length: TOTAL_TRACKED_LEVELS }, (_, index) => index + 1);
const TRACKS_VISIBLE_BY_PASS: Record<BattlePassTrack, BattlePassTrack[]> = {
  free: ["free"],
  premium: ["free", "premium"],
  ultimate: ["free", "premium", "ultimate"],
};
const REWARD_COUNT_BY_TRACK: Record<BattlePassTrack, number> = {
  free: SEASON_10_BATTLE_PASS_REWARDS.filter((reward) => reward.tier === "free")
    .length,
  premium: SEASON_10_BATTLE_PASS_REWARDS.filter(
    (reward) => reward.tier === "premium"
  ).length,
  ultimate: SEASON_10_BATTLE_PASS_REWARDS.filter(
    (reward) => reward.tier === "ultimate"
  ).length,
};
type BattlePassLevelRewards = Record<
  BattlePassTrack,
  Season10BattlePassReward | null
>;
const SEASON_10_REWARD_LOOKUP = LEVEL_MARKS.reduce((lookup, level) => {
  lookup.set(level, {
    free: null,
    premium: null,
    ultimate: null,
  });

  return lookup;
}, new Map<number, BattlePassLevelRewards>());

for (const reward of SEASON_10_BATTLE_PASS_REWARDS) {
  SEASON_10_REWARD_LOOKUP.get(reward.level)![reward.tier] = reward;
}

const BATTLE_PASS_REWARD_ROWS = [
  {
    id: "premium" as const,
    label: "Premium",
    cadence: `${formatNumber(REWARD_COUNT_BY_TRACK.premium)} rewards`,
    icon: Star,
    activeTickClass: "bg-[#ffd451] shadow-[0_0_0_1px_rgba(255,212,81,0.32),0_0_22px_rgba(255,212,81,0.34)]",
    mutedTickClass: "bg-[#8d7221] shadow-[0_0_0_1px_rgba(255,212,81,0.18)]",
    activePanelClass: "border-[#ffd451]/40 bg-[#ffd451]/16 text-[#ffe08a]",
    mutedPanelClass: "border-[#8d7221]/45 bg-[rgba(141,114,33,0.24)] text-[#d8c179]",
    textClass: "text-[#f2c94c]",
    iconClass: "text-[#f2c94c]",
  },
  {
    id: "free" as const,
    label: "Free",
    cadence: `${formatNumber(REWARD_COUNT_BY_TRACK.free)} rewards`,
    icon: Gift,
    activeTickClass: "bg-[#e9edf3] shadow-[0_0_0_1px_rgba(233,237,243,0.28),0_0_20px_rgba(233,237,243,0.22)]",
    mutedTickClass: "bg-[#76808d] shadow-[0_0_0_1px_rgba(200,208,220,0.16)]",
    activePanelClass: "border-[#d7dee9]/38 bg-[rgba(233,237,243,0.16)] text-[#f2f5fa]",
    mutedPanelClass: "border-[#76808d]/45 bg-[rgba(118,128,141,0.22)] text-[#c5ced9]",
    textClass: "text-[#e7ecf4]",
    iconClass: "text-[#e7ecf4]",
  },
  {
    id: "ultimate" as const,
    label: "Ultimate",
    cadence: `${formatNumber(REWARD_COUNT_BY_TRACK.ultimate)} rewards`,
    icon: Crown,
    activeTickClass: "bg-[#ff4568] shadow-[0_0_0_1px_rgba(255,69,104,0.28),0_0_22px_rgba(255,69,104,0.3)]",
    mutedTickClass: "bg-[#7d2435] shadow-[0_0_0_1px_rgba(255,69,104,0.16)]",
    activePanelClass: "border-[#ff4568]/38 bg-[rgba(255,69,104,0.16)] text-[#ff9aae]",
    mutedPanelClass: "border-[#7d2435]/45 bg-[rgba(125,36,53,0.24)] text-[#d98193]",
    textClass: "text-[#ff7f97]",
    iconClass: "text-[#ff7f97]",
  },
];

type BattlePassRangeGroup = {
  id: string;
  label: string;
  shortLabel: string;
  description: string;
  start: number;
  end: number;
};

type BattlePassLevelRowData = {
  level: number;
  band: ReturnType<typeof getBandForLevel>;
  rewards: BattlePassLevelRewards;
};

type BattlePassRangeGroupData = BattlePassRangeGroup & {
  bandId: BattlePassBandId;
  completedLevels: number;
  progress: number;
  rewardCounts: Record<BattlePassTrack, number>;
  statusLabel: string;
  levels: BattlePassLevelRowData[];
};

const BATTLE_PASS_RANGE_GROUPS: BattlePassRangeGroup[] = [
  {
    id: "range-1-16",
    label: "Entry 1-16",
    shortLabel: "1-16",
    description: "Opening rewards",
    start: 1,
    end: 16,
  },
  {
    id: "range-17-32",
    label: "Entry 17-32",
    shortLabel: "17-32",
    description: "Closing the opening run",
    start: 17,
    end: 32,
  },
  {
    id: "range-33-48",
    label: "Middle 33-48",
    shortLabel: "33-48",
    description: "Mid-pass spotlight rewards",
    start: 33,
    end: 48,
  },
  {
    id: "range-49-64",
    label: "Middle 49-64",
    shortLabel: "49-64",
    description: "Mid-pass finishers",
    start: 49,
    end: 64,
  },
  {
    id: "range-65-80",
    label: "Later 65-80",
    shortLabel: "65-80",
    description: "Late-pass power picks",
    start: 65,
    end: 80,
  },
  {
    id: "range-81-96",
    label: "Later 81-96",
    shortLabel: "81-96",
    description: "Late-pass finish line",
    start: 81,
    end: 96,
  },
  {
    id: "range-97-106",
    label: "Bonus 97-106",
    shortLabel: "97-106",
    description: "Bonus pages",
    start: 97,
    end: 106,
  },
];

const TRACK_PRIORITY_BY_VIEW: Record<BattlePassTrack, BattlePassTrack[]> = {
  free: ["free", "premium", "ultimate"],
  premium: ["premium", "free", "ultimate"],
  ultimate: ["ultimate", "premium", "free"],
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
      subtitle: "All rewards unlocked",
      nextCheckpoint: "All tracked levels complete",
      levelsLeftInBand: 0,
    };
  }

  if (safeLevel >= MAIN_TRACK_LEVELS) {
    return {
      id: "bonus" as const,
      label: "Bonus levels",
      subtitle: "Bonus page active",
      nextCheckpoint: `Level ${safeLevel + 1}`,
      levelsLeftInBand: TOTAL_TRACKED_LEVELS - safeLevel,
    };
  }

  if (safeLevel >= LEVELS_PER_MAIN_BAND * 2) {
    return {
      id: "later" as const,
      label: "Later levels",
      subtitle: "Later levels active",
      nextCheckpoint: `Level ${safeLevel + 1}`,
      levelsLeftInBand: MAIN_TRACK_LEVELS - safeLevel,
    };
  }

  if (safeLevel >= LEVELS_PER_MAIN_BAND) {
    return {
      id: "middle" as const,
      label: "Middle levels",
      subtitle: "Mid levels active",
      nextCheckpoint: `Level ${safeLevel + 1}`,
      levelsLeftInBand: LEVELS_PER_MAIN_BAND * 2 - safeLevel,
    };
  }

  return {
    id: "entry" as const,
    label: "Entry levels",
    subtitle: safeLevel === 0 ? "Ready to start" : "Entry levels active",
    nextCheckpoint: `Level ${safeLevel + 1}`,
    levelsLeftInBand: LEVELS_PER_MAIN_BAND - safeLevel,
  };
}

function clampRewardPreviewLevel(value: number) {
  return Math.min(TOTAL_TRACKED_LEVELS, Math.max(1, Math.round(value)));
}

function getBandForLevel(level: number) {
  return (
    BATTLE_PASS_BANDS.find(
      (band) =>
        level > band.startCompletedLevel &&
        level <= band.startCompletedLevel + band.levels
    ) ?? BATTLE_PASS_BANDS[BATTLE_PASS_BANDS.length - 1]
  );
}

function getBattlePassRewardAtLevel(level: number, track: BattlePassTrack) {
  return SEASON_10_REWARD_LOOKUP.get(clampRewardPreviewLevel(level))?.[track] ?? null;
}

function isRewardHighlightedInView(
  selectedTrack: BattlePassTrack,
  rewardTrack: BattlePassTrack
) {
  return TRACKS_VISIBLE_BY_PASS[selectedTrack].includes(rewardTrack);
}

function getRewardTrackMeta(track: BattlePassTrack) {
  return BATTLE_PASS_REWARD_ROWS.find((row) => row.id === track) ?? BATTLE_PASS_REWARD_ROWS[0];
}

function getRangeGroupForLevel(level: number) {
  const safeLevel = clampRewardPreviewLevel(level);

  return (
    BATTLE_PASS_RANGE_GROUPS.find(
      (group) => safeLevel >= group.start && safeLevel <= group.end
    ) ?? BATTLE_PASS_RANGE_GROUPS[0]
  );
}

function getPrimaryRewardForLevel(
  rewards: BattlePassLevelRewards,
  selectedTrack: BattlePassTrack
) {
  for (const track of TRACK_PRIORITY_BY_VIEW[selectedTrack]) {
    const reward = rewards[track];

    if (reward) {
      return { track, reward };
    }
  }

  return null;
}

function getNextRewardForTrack(level: number, track: BattlePassTrack) {
  for (
    let nextLevel = Math.max(1, Math.min(TOTAL_TRACKED_LEVELS, level + 1));
    nextLevel <= TOTAL_TRACKED_LEVELS;
    nextLevel += 1
  ) {
    const reward = getBattlePassRewardAtLevel(nextLevel, track);

    if (reward) {
      return {
        level: nextLevel,
        levelsAway: nextLevel - level,
        reward,
      };
    }
  }

  return null;
}

function getLevelStatus(level: number, currentLevel: number) {
  if (currentLevel > 0 && level < currentLevel) {
    return "claimed" as const;
  }

  if (currentLevel > 0 && level === currentLevel) {
    return "current" as const;
  }

  return "upcoming" as const;
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
  const [inspectedLevel, setInspectedLevel] = useState(() =>
    clampRewardPreviewLevel(initialSavedState.battlePassLevel || 1)
  );
  const [activeRangeId, setActiveRangeId] = useState(() =>
    getRangeGroupForLevel(initialSavedState.battlePassLevel || 1).id
  );
  const [isMobileDetailOpen, setIsMobileDetailOpen] = useState(false);
  const isOriginalStyle = styleMode === "original";
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
  const includedRewardTracks = TRACKS_VISIBLE_BY_PASS[battlePassTrack];
  const nextRewards = useMemo(
    () =>
      TRACK_PRIORITY_BY_VIEW[battlePassTrack].map((track) => ({
        track,
        data: getNextRewardForTrack(battlePassLevel, track),
      })),
    [battlePassLevel, battlePassTrack]
  );

  const levelRewardMap = useMemo(
    (): BattlePassLevelRowData[] =>
      LEVEL_MARKS.map((level) => ({
        level,
        band: getBandForLevel(level),
        rewards: {
          premium: getBattlePassRewardAtLevel(level, "premium"),
          free: getBattlePassRewardAtLevel(level, "free"),
          ultimate: getBattlePassRewardAtLevel(level, "ultimate"),
        },
      })),
    []
  );
  const inspectedLevelData = useMemo(
    () =>
      levelRewardMap.find((item) => item.level === inspectedLevel) ??
      levelRewardMap[0],
    [inspectedLevel, levelRewardMap]
  );
  const rangeGroups = useMemo(
    (): BattlePassRangeGroupData[] =>
      BATTLE_PASS_RANGE_GROUPS.map((group) => {
        const levels = levelRewardMap.filter(
          (item) => item.level >= group.start && item.level <= group.end
        );
        const completedLevels =
          battlePassLevel < group.start
            ? 0
            : Math.min(battlePassLevel, group.end) - group.start + 1;
        const totalLevels = group.end - group.start + 1;

        return {
          ...group,
          bandId: getBandForLevel(group.start).id,
          completedLevels,
          progress: (completedLevels / totalLevels) * 100,
          rewardCounts: {
            free: levels.filter((item) => item.rewards.free).length,
            premium: levels.filter((item) => item.rewards.premium).length,
            ultimate: levels.filter((item) => item.rewards.ultimate).length,
          },
          statusLabel:
            battlePassLevel > group.end
              ? "Complete"
              : battlePassLevel >= group.start
                ? "Active"
                : group.start > MAIN_TRACK_LEVELS && battlePassLevel < MAIN_TRACK_LEVELS
                  ? "Locked"
                  : "Up Next",
          levels,
        };
      }),
    [battlePassLevel, levelRewardMap]
  );

  function applyLevel(nextLevel: number) {
    const safeLevel = clampLevel(nextLevel);
    setSavedState((currentState) => ({ ...currentState, battlePassLevel: safeLevel }));
    setInputValue(String(safeLevel));
    setInspectedLevel(clampRewardPreviewLevel(safeLevel || 1));
    setActiveRangeId(getRangeGroupForLevel(safeLevel || 1).id);
  }

  function saveInputLevel() {
    const parsed = Number(inputValue);
    if (Number.isNaN(parsed)) return;
    applyLevel(parsed);
  }

  function focusTracker() {
    if (typeof document === "undefined") return;
    document.getElementById("battle-pass-tracker")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }

  function focusRange(rangeId: string) {
    setActiveRangeId(rangeId);

    if (typeof document === "undefined") return;
    document.getElementById(rangeId)?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }

  function inspectLevel(level: number, rangeId: string) {
    setInspectedLevel(level);
    setActiveRangeId(rangeId);

    if (typeof window !== "undefined" && window.innerWidth < 1280) {
      setIsMobileDetailOpen(true);
    }
  }

  return (
    <>
      <div className="mt-6 xl:hidden">
        <div
          className={cn(
            "sticky top-4 z-20 rounded-[1.45rem] border px-4 py-3 shadow-[0_16px_40px_rgba(15,23,42,0.08)] backdrop-blur-xl",
            isOriginalStyle
              ? "border-white/70 bg-white/92 text-slate-900"
              : "border-white/12 bg-[rgba(10,11,15,0.92)] text-[var(--tf-cream)]"
          )}
        >
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div
                className={cn(
                  "text-[0.68rem] font-semibold uppercase tracking-[0.18em]",
                  isOriginalStyle ? "text-slate-500" : "text-[var(--tf-muted)]"
                )}
              >
                Battle Pass
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <span className="text-lg font-semibold tracking-tight">
                  Level {formatNumber(battlePassLevel)}
                </span>
                <span
                  className={cn(
                    "rounded-full border px-2.5 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.18em]",
                    isOriginalStyle
                      ? "border-rose-200 bg-rose-50 text-rose-700"
                      : "border-[color:var(--tf-accent)] bg-[rgba(210,31,60,0.14)] text-[var(--tf-white)]"
                  )}
                >
                  {selectedTrack.label}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={focusTracker}
              className={cn(
                "inline-flex shrink-0 items-center gap-2 rounded-full border px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] transition",
                isOriginalStyle
                  ? "border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300 hover:bg-white"
                  : "border-white/12 bg-white/[0.04] text-[var(--tf-cream)] hover:bg-white/[0.08]"
              )}
            >
              <PanelBottomOpen className="h-4 w-4" />
              Edit
            </button>
          </div>
        </div>
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1.25fr)_minmax(22rem,0.75fr)]">
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
                  Progress
                </div>
                <div className="mt-4 flex flex-wrap items-end gap-3">
                  <div
                    className={cn(
                      "min-w-[7.5ch] whitespace-nowrap font-semibold tracking-tight leading-none tabular-nums",
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
                  "inline-flex min-w-[11rem] items-center justify-center gap-2 rounded-full border px-4 py-2 text-center text-sm font-medium shadow-sm",
                  activeBandStyles.chip
                )}
              >
                <Layers3 className="h-4 w-4" />
                {currentBand.label}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <BattlePassOverviewCard
                label="Current Band"
                value={currentBand.label}
                body={currentBand.subtitle}
                isOriginalStyle={isOriginalStyle}
              />
              <BattlePassOverviewCard
                label="Track View"
                value={selectedTrack.label}
                body={selectedTrack.rewardsSummary}
                isOriginalStyle={isOriginalStyle}
                valueClassName={isOriginalStyle ? "text-rose-700" : "text-[var(--tf-white)]"}
              />
              <BattlePassOverviewCard
                label="Next Checkpoint"
                value={currentBand.nextCheckpoint}
                body={
                  currentBand.levelsLeftInBand === 0
                    ? "Everything in this band is complete."
                    : `${formatNumber(currentBand.levelsLeftInBand)} levels left in ${currentBand.label.toLowerCase()}.`
                }
                isOriginalStyle={isOriginalStyle}
              />
              <BattlePassOverviewCard
                label="Levels Left"
                value={totalLevelsLeft === 0 ? "Complete" : `${formatNumber(totalLevelsLeft)} left`}
                body={`${formatNumber(battlePassLevel)} / ${formatNumber(TOTAL_TRACKED_LEVELS)} levels claimed`}
                isOriginalStyle={isOriginalStyle}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {nextRewards.map(({ track, data }) => (
                <BattlePassNextRewardCard
                  key={track}
                  track={track}
                  nextReward={data}
                  isOriginalStyle={isOriginalStyle}
                  isActiveView={track === battlePassTrack}
                />
              ))}
            </div>

            <div className="space-y-6">
              <BattlePassProgressRow
                label="Main Pass"
                value={`${formatNumber(mainLevelsLeft)} levels left`}
                progress={mainProgress}
                footerLeft={`${formatNumber(mainCompletedLevels)} / ${formatNumber(MAIN_TRACK_LEVELS)} levels`}
                footerRight={`${Math.round(mainProgress)}%`}
                indicatorClassName="bg-sky-500"
                trackClassName={progressTrackClass}
              />

              <BattlePassProgressRow
                label="Bonus"
                value={
                  battlePassLevel < MAIN_TRACK_LEVELS
                    ? "Unlocks at level 97"
                    : bonusLevelsLeft === 0
                      ? "Complete"
                      : `${formatNumber(bonusLevelsLeft)} levels left`
                }
                progress={bonusProgress}
                footerLeft={`${formatNumber(bonusCompletedLevels)} / ${formatNumber(BONUS_LEVELS)} bonus levels`}
                footerRight={
                  battlePassLevel < MAIN_TRACK_LEVELS
                    ? "After main pass"
                    : `${Math.round(bonusProgress)}%`
                }
                indicatorClassName="bg-fuchsia-500"
                trackClassName={progressTrackClass}
              />

              <BattlePassProgressRow
                label="Overall"
                value={totalLevelsLeft === 0 ? "Complete" : `${formatNumber(totalLevelsLeft)} levels left`}
                progress={overallProgress}
                footerLeft={`${formatNumber(battlePassLevel)} / ${formatNumber(TOTAL_TRACKED_LEVELS)} levels`}
                footerRight={`${Math.round(overallProgress)}%`}
                indicatorClassName={activeBandStyles.accent}
                trackClassName={progressTrackClass}
              />

              <BattlePassProgressRow
                label="Season"
                value={`${formatNumber(seasonDaysRemaining)} days left`}
                progress={seasonElapsedPct}
                footerLeft={`${formatNumber(elapsedSeasonDays)} days elapsed`}
                footerRight={`${Math.round(seasonElapsedPct)}%`}
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
          id="battle-pass-tracker"
          className={cn(
            "w-full min-w-0 rounded-[2.25rem] p-6 md:p-8 xl:sticky xl:top-24 xl:h-fit",
            isOriginalStyle
              ? "border border-white/70 bg-white/80 text-slate-900 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur-xl"
              : "tf-panel text-white"
          )}
        >
          <div className="flex items-start gap-4">
            <div>
              <div
                className={cn(
                  "text-sm font-semibold uppercase tracking-[0.22em]",
                  isOriginalStyle ? "text-slate-500" : "text-[var(--tf-muted)]"
                )}
              >
                Tracker
              </div>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight">
                Set level
              </h2>
            </div>
          </div>

          <div
            className={cn(
              "mt-6 w-full rounded-[1.75rem] border p-5",
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
              Track
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
            <label
              htmlFor="battle-pass-level"
              className={cn(
                "mt-5 block text-xs font-semibold uppercase tracking-[0.18em]",
                isOriginalStyle ? "text-slate-500" : "text-[var(--tf-muted)]"
              )}
            >
              Level
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
                placeholder="Level"
              />
              <Button
                onClick={saveInputLevel}
                className="tf-button-accent h-12 rounded-2xl px-6"
              >
                Save
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

            <button
              type="button"
              onClick={() => {
                if (typeof document === "undefined") return;
                document.getElementById("battle-pass-browse")?.scrollIntoView({
                  behavior: "smooth",
                  block: "start",
                });
              }}
              className={cn(
                "mt-4 inline-flex w-full items-center justify-center gap-2 rounded-[1rem] border px-4 py-3 text-sm font-semibold uppercase tracking-[0.16em] transition",
                isOriginalStyle
                  ? "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-100"
                  : "border-white/12 bg-white/[0.05] text-[var(--tf-cream)] hover:bg-white/[0.08]"
              )}
            >
              Browse rewards
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </motion.aside>
      </div>

      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.12, duration: 0.35 }}
        id="battle-pass-browse"
        className={cn(
          "mt-8 rounded-[2.25rem] p-6 md:p-8",
          isOriginalStyle
            ? "border border-white/70 bg-white/80 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur-xl"
            : "tf-panel"
        )}
      >
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <div
              className={cn(
                "text-sm font-semibold uppercase tracking-[0.22em]",
                isOriginalStyle ? "text-slate-500" : "text-[var(--tf-muted)]"
              )}
            >
              Browse Rewards
            </div>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight">
              All 106 levels, chunked for every screen
            </h2>
            <p
              className={cn(
                "mt-3 max-w-2xl text-sm leading-7",
                isOriginalStyle ? "text-slate-600" : "text-[var(--tf-muted)]"
              )}
            >
              Scan progression in compact ranges, tap any level for full reward details, and keep every track readable on both phone and desktop.
            </p>
          </div>
          <div className="flex snap-x gap-2 overflow-x-auto pb-1">
            {rangeGroups.map((range) => {
              const rangeStyles = BAND_STYLES[range.bandId];
              const isActive = activeRangeId === range.id;

              return (
                <button
                  key={range.id}
                  type="button"
                  onClick={() => focusRange(range.id)}
                  className={cn(
                    "snap-start whitespace-nowrap rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] transition",
                    isActive
                      ? isOriginalStyle
                        ? rangeStyles.chip
                        : "border-[color:var(--tf-accent)] bg-[rgba(210,31,60,0.14)] text-[var(--tf-white)]"
                      : isOriginalStyle
                        ? "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                        : "border-white/10 bg-white/[0.04] text-[var(--tf-muted)] hover:bg-white/[0.08] hover:text-[var(--tf-cream)]"
                  )}
                >
                  {range.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(22rem,0.44fr)]">
          <div className="space-y-4">
            {rangeGroups.map((range) => {
              const rangeStyles = BAND_STYLES[range.bandId];
              const isExpanded = activeRangeId === range.id;

              return (
                <section
                  key={range.id}
                  id={range.id}
                  className={cn(
                    "rounded-[1.9rem] border p-4 md:p-5",
                    isOriginalStyle
                      ? "border-slate-200 bg-white/88"
                      : "border-white/12 bg-[linear-gradient(180deg,rgba(20,21,27,0.98),rgba(10,11,15,0.96))]"
                  )}
                >
                  <button
                    type="button"
                    onClick={() => setActiveRangeId(range.id)}
                    className="flex w-full items-start justify-between gap-4 text-left"
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={cn(
                            "rounded-full border px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.18em]",
                            isOriginalStyle
                              ? rangeStyles.chip
                              : isExpanded
                                ? "border-[color:var(--tf-accent)] bg-[rgba(210,31,60,0.14)] text-[var(--tf-white)]"
                                : "border-white/10 bg-white/[0.05] text-[var(--tf-muted)]"
                          )}
                        >
                          {range.label}
                        </span>
                        <span
                          className={cn(
                            "rounded-full border px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.18em]",
                            isOriginalStyle
                              ? "border-slate-200 bg-slate-100 text-slate-600"
                              : "border-white/10 bg-black/20 text-[var(--tf-muted)]"
                          )}
                        >
                          {range.statusLabel}
                        </span>
                      </div>
                      <h3 className="mt-3 text-2xl font-semibold tracking-tight">
                        Levels {range.shortLabel}
                      </h3>
                      <p
                        className={cn(
                          "mt-2 text-sm leading-6",
                          isOriginalStyle ? "text-slate-600" : "text-[var(--tf-muted)]"
                        )}
                      >
                        {range.description}
                      </p>
                    </div>

                    <ChevronDown
                      className={cn(
                        "mt-1 h-5 w-5 shrink-0 transition-transform",
                        isExpanded ? "rotate-180" : "",
                        isOriginalStyle ? "text-slate-400" : "text-[var(--tf-muted)]"
                      )}
                    />
                  </button>

                  <div className="mt-4 grid gap-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
                    <div>
                      <Progress
                        value={range.progress}
                        indicatorClassName={rangeStyles.accent}
                        className={cn("tf-progress-track h-3 rounded-full", progressTrackClass)}
                      />
                      <div className="mt-2 flex items-center justify-between text-[0.72rem] font-semibold uppercase tracking-[0.16em] text-[var(--tf-muted)]">
                        <span>{formatNumber(range.completedLevels)} completed</span>
                        <span>{range.end - range.start + 1} total</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {BATTLE_PASS_REWARD_ROWS.map((row) => {
                        const hasReward = range.rewardCounts[row.id] > 0;

                        return (
                          <span
                            key={`${range.id}-${row.id}`}
                            className={cn(
                              "rounded-full border px-2.5 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.18em]",
                              hasReward
                                ? includedRewardTracks.includes(row.id)
                                  ? row.activePanelClass
                                  : row.mutedPanelClass
                                : isOriginalStyle
                                  ? "border-slate-200 bg-white text-slate-400"
                                  : "border-white/10 bg-black/20 text-[var(--tf-muted)]"
                            )}
                          >
                            {row.label} {range.rewardCounts[row.id]}
                          </span>
                        );
                      })}
                    </div>
                  </div>

                  <div className={cn("mt-4 space-y-2", isExpanded ? "block" : "hidden xl:block")}>
                    {range.levels.map((levelData) => {
                      const primaryReward = getPrimaryRewardForLevel(levelData.rewards, battlePassTrack);
                      const levelStatus = getLevelStatus(levelData.level, battlePassLevel);

                      return (
                        <button
                          key={levelData.level}
                          type="button"
                          onClick={() => inspectLevel(levelData.level, range.id)}
                          className={cn(
                            "group flex w-full items-center gap-4 rounded-[1.35rem] border p-4 text-left transition",
                            inspectedLevel === levelData.level
                              ? isOriginalStyle
                                ? "border-rose-200 bg-rose-50/85 shadow-[0_12px_30px_rgba(244,63,94,0.1)]"
                                : "border-[color:var(--tf-accent)] bg-[rgba(210,31,60,0.12)]"
                              : isOriginalStyle
                                ? "border-slate-200 bg-slate-50/70 hover:border-slate-300 hover:bg-white"
                                : "border-white/10 bg-white/[0.03] hover:bg-white/[0.06]"
                          )}
                        >
                          <div className="w-[4.25rem] shrink-0">
                            <div
                              className={cn(
                                "text-[0.62rem] font-semibold uppercase tracking-[0.18em]",
                                isOriginalStyle ? "text-slate-500" : "text-[var(--tf-muted)]"
                              )}
                            >
                              Level
                            </div>
                            <div
                              className={cn(
                                "mt-1 text-2xl font-semibold tracking-tight tabular-nums",
                                isOriginalStyle ? "text-slate-900" : "text-[var(--tf-cream)]"
                              )}
                            >
                              {levelData.level}
                            </div>
                          </div>

                          {primaryReward ? (
                            <img
                              src={primaryReward.reward.imageUrl}
                              alt={primaryReward.reward.name}
                              loading="lazy"
                              referrerPolicy="no-referrer"
                              className={cn(
                                "hidden h-14 w-14 shrink-0 rounded-[1rem] border object-cover sm:block",
                                isOriginalStyle ? "border-slate-200 bg-white" : "border-white/10 bg-black/20"
                              )}
                            />
                          ) : null}

                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span
                                className={cn(
                                  "rounded-full border px-2.5 py-1 text-[0.62rem] font-semibold uppercase tracking-[0.18em]",
                                  levelStatus === "current"
                                    ? isOriginalStyle
                                      ? "border-rose-200 bg-rose-50 text-rose-700"
                                      : "border-[color:var(--tf-accent)] bg-[rgba(210,31,60,0.14)] text-[var(--tf-white)]"
                                    : levelStatus === "claimed"
                                      ? isOriginalStyle
                                        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                        : "border-emerald-400/30 bg-emerald-400/10 text-emerald-200"
                                      : isOriginalStyle
                                        ? "border-slate-200 bg-white text-slate-500"
                                        : "border-white/10 bg-black/20 text-[var(--tf-muted)]"
                                )}
                              >
                                {levelStatus === "current" ? "Current" : levelStatus === "claimed" ? "Claimed" : `+${Math.max(0, levelData.level - battlePassLevel)}`}
                              </span>
                              {primaryReward ? (
                                <span
                                  className={cn(
                                    "rounded-full border px-2.5 py-1 text-[0.62rem] font-semibold uppercase tracking-[0.18em]",
                                    getRewardTrackMeta(primaryReward.track).activePanelClass
                                  )}
                                >
                                  {getRewardTrackMeta(primaryReward.track).label}
                                </span>
                              ) : null}
                            </div>

                            <div
                              className={cn(
                                "mt-2 truncate text-base font-semibold",
                                isOriginalStyle ? "text-slate-900" : "text-[var(--tf-cream)]"
                              )}
                            >
                              {primaryReward ? primaryReward.reward.name : "No reward in the current view"}
                            </div>
                            <div
                              className={cn(
                                "mt-1 truncate text-sm",
                                isOriginalStyle ? "text-slate-600" : "text-[var(--tf-muted)]"
                              )}
                            >
                              {primaryReward ? `${primaryReward.reward.rarity} · ${primaryReward.reward.type}` : "Open the level to see the full track breakdown."}
                            </div>

                            <div className="mt-3 flex flex-wrap gap-2">
                              {BATTLE_PASS_REWARD_ROWS.map((row) => {
                                const hasReward = levelData.rewards[row.id] !== null;

                                return (
                                  <span
                                    key={`${levelData.level}-${row.id}`}
                                    className={cn(
                                      "rounded-full border px-2.5 py-1 text-[0.62rem] font-semibold uppercase tracking-[0.18em]",
                                      hasReward
                                        ? includedRewardTracks.includes(row.id)
                                          ? row.activePanelClass
                                          : row.mutedPanelClass
                                        : isOriginalStyle
                                          ? "border-slate-200 bg-white text-slate-400"
                                          : "border-white/10 bg-black/20 text-[var(--tf-muted)]"
                                    )}
                                  >
                                    {row.label}
                                  </span>
                                );
                              })}
                            </div>
                          </div>

                          <ChevronRight
                            className={cn(
                              "h-5 w-5 shrink-0",
                              isOriginalStyle ? "text-slate-300" : "text-white/30"
                            )}
                          />
                        </button>
                      );
                    })}
                  </div>
                </section>
              );
            })}
          </div>

          <div className="hidden xl:block">
            <div className="sticky top-24">
              <BattlePassRewardDetailPanel
                inspectedLevelData={inspectedLevelData}
                battlePassTrack={battlePassTrack}
                currentLevel={battlePassLevel}
                isOriginalStyle={isOriginalStyle}
              />
            </div>
          </div>
        </div>
      </motion.section>

      <AnimatePresence>
        {isMobileDetailOpen ? (
          <>
            <motion.button
              type="button"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              onClick={() => setIsMobileDetailOpen(false)}
              className="fixed inset-0 z-40 bg-black/55 xl:hidden"
              aria-label="Close reward details"
            />

            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ duration: 0.22, ease: "easeOut" }}
              className="fixed inset-x-0 bottom-0 z-50 max-h-[85vh] overflow-y-auto rounded-t-[2rem] px-4 pb-4 xl:hidden"
            >
              <BattlePassRewardDetailPanel
                inspectedLevelData={inspectedLevelData}
                battlePassTrack={battlePassTrack}
                currentLevel={battlePassLevel}
                isOriginalStyle={isOriginalStyle}
                onClose={() => setIsMobileDetailOpen(false)}
              />
            </motion.div>
          </>
        ) : null}
      </AnimatePresence>
    </>
  );
}

function BattlePassOverviewCard({
  label,
  value,
  body,
  isOriginalStyle,
  valueClassName,
}: {
  label: string;
  value: string;
  body: string;
  isOriginalStyle: boolean;
  valueClassName?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-[1.5rem] border p-4",
        isOriginalStyle
          ? "border-slate-200 bg-white/85"
          : "border-white/10 bg-white/[0.04]"
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
          "mt-3 text-2xl font-semibold tracking-tight",
          isOriginalStyle ? "text-slate-900" : "text-[var(--tf-cream)]",
          valueClassName
        )}
      >
        {value}
      </div>
      <div
        className={cn(
          "mt-2 text-sm leading-6",
          isOriginalStyle ? "text-slate-600" : "text-[var(--tf-muted)]"
        )}
      >
        {body}
      </div>
    </div>
  );
}

function BattlePassNextRewardCard({
  track,
  nextReward,
  isOriginalStyle,
  isActiveView,
}: {
  track: BattlePassTrack;
  nextReward: ReturnType<typeof getNextRewardForTrack>;
  isOriginalStyle: boolean;
  isActiveView: boolean;
}) {
  const row = getRewardTrackMeta(track);
  const title = isActiveView ? `Next ${row.label} in view` : `Next ${row.label}`;
  const TrackIcon = row.icon;

  return (
    <div
      className={cn(
        "rounded-[1.5rem] border p-4",
        nextReward
          ? isActiveView
            ? row.activePanelClass
            : row.mutedPanelClass
          : isOriginalStyle
            ? "border-slate-200 bg-white/85 text-slate-500"
            : "border-white/10 bg-white/[0.04] text-[var(--tf-muted)]"
      )}
    >
      <div className="flex items-start gap-3">
        {nextReward ? (
          <img
            src={nextReward.reward.imageUrl}
            alt={nextReward.reward.name}
            loading="lazy"
            referrerPolicy="no-referrer"
            className={cn(
              "h-14 w-14 shrink-0 rounded-[1rem] border object-cover",
              isOriginalStyle ? "border-slate-200 bg-white" : "border-white/10 bg-black/20"
            )}
          />
        ) : (
          <div
            className={cn(
              "flex h-14 w-14 shrink-0 items-center justify-center rounded-[1rem] border",
              isOriginalStyle
                ? "border-slate-200 bg-white text-slate-400"
                : "border-white/10 bg-black/20 text-[var(--tf-muted)]"
            )}
          >
            <TrackIcon className="h-5 w-5" />
          </div>
        )}

        <div className="min-w-0 flex-1">
          <div className="text-[0.68rem] font-semibold uppercase tracking-[0.18em]">
            {title}
          </div>
          <div className="mt-2 text-base font-semibold leading-6">
            {nextReward ? nextReward.reward.name : "Complete"}
          </div>
          <div className="mt-1 text-sm">
            {nextReward
              ? `Level ${nextReward.level} · ${nextReward.reward.type}`
              : "No rewards left on this track."}
          </div>
          <div className="mt-2 text-[0.72rem] font-semibold uppercase tracking-[0.18em]">
            {nextReward ? `+${nextReward.levelsAway} levels away` : "Finished"}
          </div>
        </div>
      </div>
    </div>
  );
}

function BattlePassRewardDetailPanel({
  inspectedLevelData,
  battlePassTrack,
  currentLevel,
  isOriginalStyle,
  onClose,
}: {
  inspectedLevelData: BattlePassLevelRowData;
  battlePassTrack: BattlePassTrack;
  currentLevel: number;
  isOriginalStyle: boolean;
  onClose?: () => void;
}) {
  const levelStatus = getLevelStatus(inspectedLevelData.level, currentLevel);
  const primaryReward = getPrimaryRewardForLevel(
    inspectedLevelData.rewards,
    battlePassTrack
  );
  const bandStyles = BAND_STYLES[inspectedLevelData.band.id];

  return (
    <div
      className={cn(
        "rounded-[1.9rem] border p-5 md:p-6",
        isOriginalStyle
          ? "border-slate-200 bg-white/95 shadow-[0_20px_50px_rgba(15,23,42,0.08)]"
          : "border-white/12 bg-[linear-gradient(180deg,rgba(18,19,25,0.98),rgba(10,11,15,0.98))] shadow-[0_26px_60px_rgba(0,0,0,0.34)]"
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <div
            className={cn(
              "text-xs font-semibold uppercase tracking-[0.18em]",
              isOriginalStyle ? "text-slate-500" : "text-[var(--tf-muted)]"
            )}
          >
            Level Focus
          </div>
          <h3 className="mt-2 text-3xl font-semibold tracking-tight">
            Level {formatNumber(inspectedLevelData.level)}
          </h3>
        </div>

        {onClose ? (
          <button
            type="button"
            onClick={onClose}
            className={cn(
              "inline-flex items-center justify-center rounded-full border p-2 transition",
              isOriginalStyle
                ? "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                : "border-white/10 bg-white/[0.05] text-[var(--tf-muted)] hover:bg-white/[0.08] hover:text-[var(--tf-cream)]"
            )}
            aria-label="Close reward details"
          >
            <X className="h-4 w-4" />
          </button>
        ) : null}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <span
          className={cn(
            "rounded-full border px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.18em]",
            isOriginalStyle ? bandStyles.chip : "border-white/10 bg-white/[0.05] text-[var(--tf-cream)]"
          )}
        >
          {inspectedLevelData.band.label}
        </span>
        <span
          className={cn(
            "rounded-full border px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.18em]",
            levelStatus === "current"
              ? isOriginalStyle
                ? "border-rose-200 bg-rose-50 text-rose-700"
                : "border-[color:var(--tf-accent)] bg-[rgba(210,31,60,0.14)] text-[var(--tf-white)]"
              : levelStatus === "claimed"
                ? isOriginalStyle
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                  : "border-emerald-400/30 bg-emerald-400/10 text-emerald-200"
                : isOriginalStyle
                  ? "border-slate-200 bg-slate-100 text-slate-600"
                  : "border-white/10 bg-black/20 text-[var(--tf-muted)]"
          )}
        >
          {levelStatus === "current"
            ? "Current level"
            : levelStatus === "claimed"
              ? "Claimed"
              : `${Math.max(0, inspectedLevelData.level - currentLevel)} levels away`}
        </span>
      </div>

      <div
        className={cn(
          "mt-5 rounded-[1.5rem] border p-4",
          isOriginalStyle
            ? "border-slate-200 bg-slate-50/90"
            : "border-white/10 bg-white/[0.04]"
        )}
      >
        {primaryReward ? (
          <div className="flex items-start gap-4">
            <img
              src={primaryReward.reward.imageUrl}
              alt={primaryReward.reward.name}
              loading="lazy"
              referrerPolicy="no-referrer"
              className={cn(
                "h-[4.75rem] w-[4.75rem] shrink-0 rounded-[1rem] border object-cover",
                isOriginalStyle ? "border-slate-200 bg-white" : "border-white/10 bg-black/20"
              )}
            />
            <div className="min-w-0">
              <div
                className={cn(
                  "inline-flex rounded-full border px-2.5 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.18em]",
                  getRewardTrackMeta(primaryReward.track).activePanelClass
                )}
              >
                {getRewardTrackMeta(primaryReward.track).label}
              </div>
              <div className="mt-3 text-xl font-semibold leading-7">
                {primaryReward.reward.name}
              </div>
              <div
                className={cn(
                  "mt-1 text-[0.72rem] font-semibold uppercase tracking-[0.18em]",
                  isOriginalStyle ? "text-slate-500" : "text-[var(--tf-muted)]"
                )}
              >
                {primaryReward.reward.rarity} · {primaryReward.reward.type}
              </div>
              <div
                className={cn(
                  "mt-3 text-sm leading-6",
                  isOriginalStyle ? "text-slate-600" : "text-[var(--tf-muted)]"
                )}
              >
                {primaryReward.reward.description}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-start gap-4">
            <div
              className={cn(
                "flex h-[4.75rem] w-[4.75rem] shrink-0 items-center justify-center rounded-[1rem] border",
                isOriginalStyle
                  ? "border-slate-200 bg-white text-slate-400"
                  : "border-white/10 bg-black/20 text-[var(--tf-muted)]"
              )}
            >
              <Target className="h-6 w-6" />
            </div>
            <div>
              <div className="text-xl font-semibold leading-7">
                No highlighted reward on this level
              </div>
              <div
                className={cn(
                  "mt-3 text-sm leading-6",
                  isOriginalStyle ? "text-slate-600" : "text-[var(--tf-muted)]"
                )}
              >
                This level has no reward in the current view. The track cards below still show every tier attached to this level.
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="mt-5 space-y-3">
        {BATTLE_PASS_REWARD_ROWS.map((row) => {
          const Icon = row.icon;
          const reward = inspectedLevelData.rewards[row.id];
          const hasReward = reward !== null;
          const isHighlighted = isRewardHighlightedInView(
            battlePassTrack,
            row.id
          );
          const cardClass = !hasReward
            ? isOriginalStyle
              ? "border-slate-200 bg-slate-50/90 text-slate-500"
              : "border-white/10 bg-white/4 text-[var(--tf-muted)]"
            : isHighlighted
              ? row.activePanelClass
              : row.mutedPanelClass;
          const iconShellClass = !hasReward
            ? isOriginalStyle
              ? "border-slate-200 bg-white text-slate-400"
              : "border-white/10 bg-black/20 text-[var(--tf-muted)]"
            : isHighlighted
              ? row.activePanelClass
              : row.mutedPanelClass;

          return (
            <div
              key={row.id}
              className={cn(
                "flex items-start gap-4 rounded-[1.35rem] border p-4",
                cardClass
              )}
            >
              {reward ? (
                <img
                  src={reward.imageUrl}
                  alt={reward.name}
                  loading="lazy"
                  referrerPolicy="no-referrer"
                  className={cn(
                    "h-16 w-16 shrink-0 rounded-[1rem] border object-cover",
                    isOriginalStyle
                      ? "border-slate-200 bg-white"
                      : "border-white/10 bg-black/20"
                  )}
                />
              ) : (
                <div
                  className={cn(
                    "flex size-11 shrink-0 items-center justify-center rounded-[1rem] border",
                    iconShellClass
                  )}
                >
                  <Icon
                    className={cn(
                      "h-5 w-5",
                      hasReward ? row.iconClass : undefined
                    )}
                  />
                </div>
              )}

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <div className="text-sm font-semibold uppercase tracking-[0.12em]">
                    {row.label}
                  </div>
                  {reward ? (
                    <div
                      className={cn(
                        "rounded-full border px-2.5 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.18em]",
                        isHighlighted ? row.activePanelClass : row.mutedPanelClass
                      )}
                    >
                      {reward.rarity}
                    </div>
                  ) : null}
                </div>
                <div className="mt-2 text-base font-semibold leading-6">
                  {reward ? reward.name : `No ${row.label.toLowerCase()} reward`}
                </div>
                <div
                  className={cn(
                    "mt-1 text-[0.7rem] font-semibold uppercase tracking-[0.18em]",
                    isOriginalStyle ? "text-slate-500" : "text-[var(--tf-muted)]"
                  )}
                >
                  {reward ? reward.type : "No unlock"}
                </div>
                <div className="mt-2 text-sm leading-6">
                  {reward
                    ? reward.description
                    : `No ${row.label.toLowerCase()} reward at this level.`}
                </div>
              </div>

              <div
                className={cn(
                  "rounded-full border px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.18em]",
                  !hasReward
                    ? isOriginalStyle
                      ? "border-slate-200 bg-white text-slate-500"
                      : "border-white/10 bg-black/20 text-[var(--tf-muted)]"
                    : isHighlighted
                      ? row.activePanelClass
                      : row.mutedPanelClass
                )}
              >
                {hasReward ? "Reward" : "None"}
              </div>
            </div>
          );
        })}
      </div>
    </div>
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
        <span className="min-w-[10.5rem] text-right font-medium tabular-nums text-[var(--tf-cream)]">
          {value}
        </span>
      </div>
      <Progress
        value={progress}
        indicatorClassName={indicatorClassName}
        className={cn("tf-progress-track rounded-full", large ? "h-4" : "h-3", trackClassName)}
      />
      <div className="mt-2 flex items-center justify-between text-xs text-[var(--tf-muted)]">
        <span className="tabular-nums">{footerLeft}</span>
        <span className="min-w-[6rem] text-right tabular-nums">{footerRight}</span>
      </div>
    </div>
  );
}

