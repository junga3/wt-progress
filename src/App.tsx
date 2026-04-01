import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  CalendarDays,
  ChevronDown,
  ChevronRight,
  RotateCcw,
  Medal,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

const RANKS = [
  { name: "Bronze IV", points: 25, short: "B4", tier: "Bronze" },
  { name: "Bronze III", points: 50, short: "B3", tier: "Bronze" },
  { name: "Bronze II", points: 75, short: "B2", tier: "Bronze" },
  { name: "Bronze I", points: 100, short: "B1", tier: "Bronze" },
  { name: "Silver IV", points: 150, short: "S4", tier: "Silver" },
  { name: "Silver III", points: 200, short: "S3", tier: "Silver" },
  { name: "Silver II", points: 250, short: "S2", tier: "Silver" },
  { name: "Silver I", points: 300, short: "S1", tier: "Silver" },
  { name: "Gold IV", points: 375, short: "G4", tier: "Gold" },
  { name: "Gold III", points: 450, short: "G3", tier: "Gold" },
  { name: "Gold II", points: 525, short: "G2", tier: "Gold" },
  { name: "Gold I", points: 600, short: "G1", tier: "Gold" },
  { name: "Platinum IV", points: 700, short: "P4", tier: "Platinum" },
  { name: "Platinum III", points: 800, short: "P3", tier: "Platinum" },
  { name: "Platinum II", points: 900, short: "P2", tier: "Platinum" },
  { name: "Platinum I", points: 1000, short: "P1", tier: "Platinum" },
  { name: "Diamond IV", points: 1150, short: "D4", tier: "Diamond" },
  { name: "Diamond III", points: 1300, short: "D3", tier: "Diamond" },
  { name: "Diamond II", points: 1450, short: "D2", tier: "Diamond" },
  { name: "Diamond I", points: 1600, short: "D1", tier: "Diamond" },
  { name: "Emerald IV", points: 1800, short: "E4", tier: "Emerald" },
  { name: "Emerald III", points: 2000, short: "E3", tier: "Emerald" },
  { name: "Emerald II", points: 2200, short: "E2", tier: "Emerald" },
  { name: "Emerald I", points: 2400, short: "E1", tier: "Emerald" },
];

const TOTAL_POINTS = 2400;
const STORAGE_KEY = "wt-progress-tracker-state";
const SEASON_START = new Date("2026-03-26T00:00:00");

function getTodayStamp() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getSavedTrackerState() {
  if (typeof window === "undefined") {
    return {
      currentPoints: 0,
      todayEarned: 0,
      manualPoints: 5,
      matchMode: "cashout" as "cashout" | "quickplay" | "quickcash",
    };
  }

  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (!saved) {
      return {
        currentPoints: 0,
        todayEarned: 0,
        manualPoints: 5,
        matchMode: "cashout" as "cashout" | "quickplay" | "quickcash",
      };
    }

    const parsed = JSON.parse(saved);
    const todayStamp = getTodayStamp();
    const savedStamp = parsed.savedDate ?? "";

    return {
      currentPoints: clamp(Number(parsed.currentPoints ?? 0), 0, TOTAL_POINTS),
      todayEarned: savedStamp === todayStamp ? Math.max(0, Number(parsed.todayEarned ?? 0)) : 0,
      manualPoints: clamp(Number(parsed.manualPoints ?? 5), 1, 100),
      matchMode: ["cashout", "quickplay", "quickcash"].includes(parsed.matchMode)
        ? parsed.matchMode
        : ("cashout" as "cashout" | "quickplay" | "quickcash"),
    };
  } catch {
    return {
      currentPoints: 0,
      todayEarned: 0,
      manualPoints: 5,
      matchMode: "cashout" as "cashout" | "quickplay" | "quickcash",
    };
  }
}
const SEASON_END = new Date("2026-07-09T23:59:59");

const tierPanel = {
  Bronze: "from-amber-100 via-orange-50 to-white border-amber-200/70",
  Silver: "from-slate-100 via-zinc-50 to-white border-slate-200/70",
  Gold: "from-yellow-100 via-amber-50 to-white border-yellow-200/70",
  Platinum: "from-cyan-100 via-sky-50 to-white border-cyan-200/70",
  Diamond: "from-blue-100 via-indigo-50 to-white border-blue-200/70",
  Emerald: "from-emerald-100 via-green-50 to-white border-emerald-200/70",
  Unranked: "from-white via-slate-50 to-white border-slate-200/70",
};

const tierAccent = {
  Bronze: "bg-amber-500",
  Silver: "bg-slate-400",
  Gold: "bg-yellow-500",
  Platinum: "bg-cyan-500",
  Diamond: "bg-blue-500",
  Emerald: "bg-emerald-500",
  Unranked: "bg-slate-300",
};

const tierText = {
  Bronze: "text-amber-700",
  Silver: "text-slate-600",
  Gold: "text-yellow-700",
  Platinum: "text-cyan-700",
  Diamond: "text-blue-700",
  Emerald: "text-emerald-700",
  Unranked: "text-slate-600",
};

const tierChip = {
  Bronze: "border-amber-200 bg-amber-50/90",
  Silver: "border-slate-200 bg-slate-50/90",
  Gold: "border-yellow-200 bg-yellow-50/90",
  Platinum: "border-cyan-200 bg-cyan-50/90",
  Diamond: "border-blue-200 bg-blue-50/90",
  Emerald: "border-emerald-200 bg-emerald-50/90",
  Unranked: "border-slate-200 bg-slate-50/90",
};

const formatNumber = (value: number) => new Intl.NumberFormat().format(Math.max(0, Math.round(value)));
const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

function daysBetween(a: Date, b: Date) {
  const oneDay = 1000 * 60 * 60 * 24;
  return Math.max(1, Math.ceil((b.getTime() - a.getTime()) / oneDay));
}

function getDaysRemaining(endDate: Date) {
  const now = new Date();
  const oneDay = 1000 * 60 * 60 * 24;
  return Math.max(0, Math.ceil((endDate.getTime() - now.getTime()) / oneDay));
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(date);
}

function getRankInfo(points: number) {
  const achieved = [...RANKS].filter((rank) => points >= rank.points);
  const currentRank = achieved.length ? achieved[achieved.length - 1] : null;
  const nextRank = RANKS.find((rank) => points < rank.points) ?? null;
  return {
    currentRank,
    nextRank,
    tier: currentRank?.tier ?? "Unranked",
  };
}

function getHeroSub(points: number) {
  const { currentRank, nextRank } = getRankInfo(points);
  if (!currentRank && nextRank) return `${nextRank.points - points} pts to ${nextRank.name}`;
  if (currentRank && nextRank) return `${currentRank.name} - ${nextRank.points - points} pts to ${nextRank.name}`;
  if (currentRank && !nextRank) return `${currentRank.name} - Max rank reached`;
  return "Start earning points to enter Bronze IV";
}

function getNextRankProgress(points: number) {
  const { currentRank, nextRank } = getRankInfo(points);
  if (!nextRank) return 100;
  const base = currentRank?.points ?? 0;
  const range = nextRank.points - base;
  return clamp(((points - base) / range) * 100, 0, 100);
}

function getProjectedCompletionDate(points: number) {
  const today = new Date();
  const elapsedDays = Math.max(1, daysBetween(SEASON_START, today));
  const avgPerDay = points / elapsedDays;
  if (avgPerDay <= 0) return null;
  const daysNeeded = Math.ceil((TOTAL_POINTS - points) / avgPerDay);
  return addDays(today, Math.max(0, daysNeeded));
}

export default function WTProgressAppleRedesign() {
  const [currentPoints, setCurrentPoints] = useState(() => getSavedTrackerState().currentPoints);
  const [inputValue, setInputValue] = useState(() => String(getSavedTrackerState().currentPoints));
  const [matchMode, setMatchMode] = useState<"cashout" | "quickplay" | "quickcash">(() => getSavedTrackerState().matchMode);
  const [manualPoints, setManualPoints] = useState(() => getSavedTrackerState().manualPoints);
  const [history, setHistory] = useState<number[]>([]);
  const [todayEarned, setTodayEarned] = useState(() => getSavedTrackerState().todayEarned);
  const [showLadder, setShowLadder] = useState(false);

  const { currentRank, nextRank, tier } = useMemo(() => getRankInfo(currentPoints), [currentPoints]);

  const seasonDaysRemaining = useMemo(() => getDaysRemaining(SEASON_END), []);

  const elapsedSeasonDays = useMemo(() => {
    const now = new Date();
    return Math.max(1, daysBetween(SEASON_START, now));
  }, []);

  const totalSeasonDays = useMemo(() => Math.max(1, daysBetween(SEASON_START, SEASON_END)), []);
  const avgPerDay = currentPoints / elapsedSeasonDays;
  const pointsNeeded = Math.max(0, TOTAL_POINTS - currentPoints);
  const dailyPointsNeeded = seasonDaysRemaining > 0 ? Math.ceil(pointsNeeded / seasonDaysRemaining) : pointsNeeded;
  const fullCompletionPct = clamp((currentPoints / TOTAL_POINTS) * 100, 0, 100);
  const nextRankPct = getNextRankProgress(currentPoints);
  const projectedCompletionDate = getProjectedCompletionDate(currentPoints);
  const pointsToNext = nextRank ? Math.max(0, nextRank.points - currentPoints) : 0;
  const winsAway = nextRank ? Math.ceil(pointsToNext / 25) : 0;
  const remainingToday = Math.max(0, dailyPointsNeeded - todayEarned);
  const seasonElapsedPct = clamp((elapsedSeasonDays / totalSeasonDays) * 100, 0, 100);
  const isOnPace = fullCompletionPct >= seasonElapsedPct;
  const pacePointsTarget = Math.round((seasonElapsedPct / 100) * TOTAL_POINTS);
  const pacePointsGap = currentPoints - pacePointsTarget;
  const seasonLabel = "Mar 26 - Jul 9";
  const paceGapLabel =
    pacePointsGap === 0
      ? "Right on pace"
      : pacePointsGap > 0
        ? `${formatNumber(pacePointsGap)} pts ahead`
        : `${formatNumber(Math.abs(pacePointsGap))} pts behind`;
  const heroSubtitle = getHeroSub(currentPoints);
  const matchModes = [
    { id: "cashout" as const, label: "Cashout", helper: "Big point swings" },
    { id: "quickplay" as const, label: "Quickplay", helper: "Short sessions" },
    { id: "quickcash" as const, label: "Quick Cash", helper: "Placement based" },
  ];
  const activeMode = matchModes.find((mode) => mode.id === matchMode) ?? matchModes[0];
  const winsAwayLabel = nextRank
    ? `${winsAway} Cashout ${winsAway === 1 ? "win" : "wins"} away`
    : "Every milestone cleared";

  function persistTrackerState(next: {
    currentPoints: number;
    todayEarned: number;
    manualPoints: number;
    matchMode: "cashout" | "quickplay" | "quickcash";
  }) {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        ...next,
        savedDate: getTodayStamp(),
      })
    );
  }

  function applyPoints(nextValue: number, nextTodayEarned = todayEarned) {
    const safe = clamp(nextValue, 0, TOTAL_POINTS);
    setCurrentPoints(safe);
    setInputValue(String(safe));
    persistTrackerState({
      currentPoints: safe,
      todayEarned: nextTodayEarned,
      manualPoints,
      matchMode,
    });
  }

  function updateFromInput() {
    const parsed = Number(inputValue);
    if (Number.isNaN(parsed)) return;
    applyPoints(parsed);
  }

  function quickAdd(amount: number) {
    const nextTodayEarned = todayEarned + amount;
    setHistory((prev) => [...prev, amount]);
    setTodayEarned(nextTodayEarned);
    applyPoints(currentPoints + amount, nextTodayEarned);
  }

  function undoLastAdd() {
    const last = history[history.length - 1];
    if (!last) return;
    const nextTodayEarned = Math.max(0, todayEarned - last);
    setHistory((prev) => prev.slice(0, -1));
    setTodayEarned(nextTodayEarned);
    applyPoints(currentPoints - last, nextTodayEarned);
  }

  function handleMatchModeChange(mode: "cashout" | "quickplay" | "quickcash") {
    setMatchMode(mode);
    persistTrackerState({
      currentPoints,
      todayEarned,
      manualPoints,
      matchMode: mode,
    });
  }

  function handleManualPointsChange(rawValue: string) {
    const safe = clamp(Number(rawValue || 1), 1, 100);
    setManualPoints(safe);
    persistTrackerState({
      currentPoints,
      todayEarned,
      manualPoints: safe,
      matchMode,
    });
  }

  const matchButtons = {
    cashout: [
      { label: "Win", points: 25, emphasis: true },
      { label: "Lose Final", points: 14 },
      { label: "R2 KO", points: 6 },
      { label: "R1 KO", points: 2 },
    ],
    quickplay: [
      { label: "Win", points: 4, emphasis: true },
      { label: "Loss", points: 2 },
    ],
    quickcash: [
      { label: "1st Place", points: 6, emphasis: true },
      { label: "2nd Place", points: 4 },
      { label: "3rd Place", points: 2 },
    ],
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[linear-gradient(180deg,#f3eadf_0%,#f8fafc_42%,#edf7f2_100%)] text-slate-900">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-[-6rem] top-[-4rem] h-72 w-72 rounded-full bg-amber-200/55 blur-3xl" />
        <div className="absolute right-[-5rem] top-24 h-80 w-80 rounded-full bg-emerald-200/35 blur-3xl" />
        <div className="absolute bottom-[-8rem] left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-sky-200/25 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-6xl px-4 py-8 md:px-6 lg:px-8">
        <motion.header
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="rounded-[2.25rem] border border-white/70 bg-white/75 px-6 py-7 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur-xl md:px-8 md:py-8"
        >
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
              <Sparkles className="h-4 w-4" />
              World Tour progress companion
            </div>
            <h1 className="mt-6 text-4xl font-semibold tracking-tight md:text-6xl">
              Track the climb. Keep the momentum.
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600 md:text-lg">
              Log matches in one tap, see whether you are on pace, and keep your
              attention on the next rank instead of a spreadsheet.
            </p>
          </div>


          <div className="mt-6 flex flex-wrap gap-3 text-sm">
            <InlineMeta label="Season" value={seasonLabel} />
            <InlineMeta label="Days left" value={`${seasonDaysRemaining}`} />
            <InlineMeta
              label="Current rank"
              value={currentRank?.name ?? "Unranked"}
              valueClassName={tierText[(currentRank?.tier ?? "Unranked") as keyof typeof tierText]}
              className={tierChip[(currentRank?.tier ?? "Unranked") as keyof typeof tierChip]}
            />
            <InlineMeta
              label="Goal rank"
              value="Emerald I"
              valueClassName={tierText.Emerald}
              className={tierChip.Emerald}
            />
          </div>
        </motion.header>

        <div className="mt-8 grid gap-6 xl:grid-cols-[1.35fr_0.95fr]">
          <motion.section
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.04, duration: 0.35 }}
            className={`rounded-[2.25rem] border bg-gradient-to-br ${tierPanel[tier as keyof typeof tierPanel]} p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)] md:p-8`}
          >
            <div className="flex flex-col gap-8">
              <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <div className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-500">
                    Current progress
                  </div>
                  <div className="mt-4 flex items-end gap-3">
                    <div className="text-6xl font-semibold tracking-tight md:text-8xl">
                      {formatNumber(currentPoints)}
                    </div>
                    <div className="pb-2 text-lg text-slate-500">pts</div>
                  </div>
                  <div className="mt-3 max-w-xl text-base leading-7 text-slate-600">
                    {heroSubtitle}
                  </div>
                </div>

                <div
                  className={cn(
                    "inline-flex w-fit items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium shadow-sm",
                    tierChip[tier as keyof typeof tierChip],
                    tierText[tier as keyof typeof tierText]
                  )}
                >
                  <Medal className="h-4 w-4" />
                  {currentRank?.name ?? "Unranked"}
                </div>
              </div>

              <div className="space-y-6">
                <ProgressRow
                  label={nextRank ? `Next milestone: ${nextRank.name}` : "Emerald I complete"}
                  value={nextRank ? `${formatNumber(pointsToNext)} pts left` : "Goal reached"}
                  progress={nextRankPct}
                  footerLeft={currentRank?.name ?? "Start"}
                  footerRight={nextRank?.name ?? "Max rank"}
                  indicatorClassName={tierAccent[tier as keyof typeof tierAccent]}
                />

                <ProgressRow
                  label="Season completion"
                  value={`${formatNumber(currentPoints)} / 2,400`}
                  progress={fullCompletionPct}
                  footerLeft="Starting line"
                  footerRight={`Overall ${Math.round(fullCompletionPct)}%`}
                  large
                  indicatorClassName="bg-slate-900"
                />
              </div>

              <div className="grid gap-3 md:grid-cols-3">
                <SummaryBlock
                  label="Daily pace"
                  value={formatNumber(dailyPointsNeeded)}
                  helper={
                    avgPerDay >= dailyPointsNeeded
                      ? `Averaging ${avgPerDay.toFixed(1)}/day`
                      : `${formatNumber(remainingToday)} left today`
                  }
                />
                <SummaryBlock
                  label="Next unlock"
                  value={nextRank?.short ?? "E1"}
                  helper={winsAwayLabel}
                />
                <SummaryBlock
                  label="Projected finish"
                  value={projectedCompletionDate ? formatDate(projectedCompletionDate) : "Waiting"}
                  helper={
                    projectedCompletionDate
                      ? projectedCompletionDate <= SEASON_END
                        ? "Before season end"
                        : "Past season end"
                      : "Log points to forecast"
                  }
                />
              </div>
            </div>
          </motion.section>

          <motion.aside
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08, duration: 0.35 }}
            className="rounded-[2.25rem] border border-slate-900/10 bg-slate-950 p-6 text-white shadow-[0_24px_70px_rgba(15,23,42,0.24)] md:p-8"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-400">
                  Today's focus
                </div>
                <h2 className="mt-3 text-3xl font-semibold tracking-tight">
                  {currentPoints === 0
                    ? "Start the run"
                    : remainingToday === 0
                      ? "Pace secured"
                      : "Stay on pace today"}
                </h2>
              </div>

              <div
                className={cn(
                  "rounded-full px-3 py-1 text-sm font-medium",
                  isOnPace
                    ? "bg-emerald-400/15 text-emerald-200"
                    : "bg-amber-400/15 text-amber-200"
                )}
              >
                {isOnPace ? "On pace" : "Needs attention"}
              </div>
            </div>

            <div className="mt-6 rounded-[1.75rem] border border-white/10 bg-white/5 p-5">
              <div className="text-sm text-slate-300">
                {remainingToday === 0 ? "Today's pace target" : "Points left today"}
              </div>
              <div className="mt-3 text-5xl font-semibold tracking-tight">
                {remainingToday === 0 ? "Done" : formatNumber(remainingToday)}
              </div>
              <p className="mt-3 max-w-sm text-sm leading-6 text-slate-300">
                {remainingToday === 0
                  ? "You already banked enough points today to match your current season pace."
                  : `Earn ${formatNumber(remainingToday)} more points today to keep this pace sustainable.`}
              </p>
            </div>

            {currentPoints === 0 ? (
              <div className="mt-6 space-y-3">
                <OnboardingStep
                  number="1"
                  title="Pick a playlist"
                  body="Choose Cashout, Quickplay, or Quick Cash before you start logging."
                />
                <OnboardingStep
                  number="2"
                  title="Tap results as you go"
                  body="Use the quick add buttons after each match so the tracker stays effortless."
                />
                <OnboardingStep
                  number="3"
                  title="Sync if needed"
                  body="If you already have progress, use the exact total field below to catch up instantly."
                />
              </div>
            ) : (
              <div className="mt-6 space-y-4">
                <FocusRow label="Earned today" value={`+${formatNumber(todayEarned)}`} />
                <FocusRow
                  label="Season pace"
                  value={paceGapLabel}
                  valueClassName={isOnPace ? "text-emerald-200" : "text-amber-200"}
                />
                <FocusRow
                  label="Projected finish"
                  value={projectedCompletionDate ? formatDate(projectedCompletionDate) : "Waiting"}
                />
              </div>
            )}
          </motion.aside>
        </div>

        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12, duration: 0.35 }}
          className="mt-10 rounded-[2.25rem] border border-white/70 bg-white/80 p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur-xl md:p-8"
        >
          <div className="mb-8 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-400">
                Primary action
              </div>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight">
                Log progress
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                Quick add after each match or save an exact total when you need
                to sync the tracker with your in-game number.
              </p>
            </div>

            <div className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-600">
              {activeMode.helper}
            </div>
          </div>

          <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
            <div className="rounded-[1.9rem] border border-slate-200/80 bg-slate-50/90 p-5">
              <div className="mb-5 flex flex-wrap gap-2 rounded-[1.4rem] bg-white p-1.5 shadow-sm ring-1 ring-slate-200/70">
                {matchModes.map((mode) => (
                  <button
                    key={mode.id}
                    onClick={() => handleMatchModeChange(mode.id)}
                    className={cn(
                      "rounded-[1.1rem] px-4 py-3 text-left text-sm font-medium transition",
                      matchMode === mode.id
                        ? "bg-slate-900 text-white shadow-sm"
                        : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                    )}
                  >
                    <div>{mode.label}</div>
                    <div
                      className={cn(
                        "mt-1 text-xs",
                        matchMode === mode.id ? "text-white/70" : "text-slate-400"
                      )}
                    >
                      {mode.helper}
                    </div>
                  </button>
                ))}
              </div>

              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {matchButtons[matchMode].map((button) => (
                  <button
                    key={`${matchMode}-${button.label}`}
                    onClick={() => quickAdd(button.points)}
                    className={`rounded-[1.5rem] border px-5 py-5 text-left transition hover:-translate-y-0.5 hover:shadow-md ${button.emphasis ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 bg-white text-slate-900"}`}
                  >
                    <div className="text-3xl font-semibold tracking-tight">+{button.points}</div>
                    <div className={`mt-1 text-sm ${button.emphasis ? "text-white/80" : "text-slate-500"}`}>{button.label}</div>
                  </button>
                ))}
              </div>

              <div className="mt-6 grid gap-3 md:grid-cols-[minmax(0,1fr)_auto_auto]">
                <Input
                  type="number"
                  min={1}
                  max={100}
                  value={manualPoints}
                  onChange={(e) => handleManualPointsChange(e.target.value)}
                  className="h-12 rounded-2xl border-slate-200 bg-white text-base"
                  placeholder="Manual points"
                />
                <Button onClick={() => quickAdd(manualPoints)} className="h-12 rounded-2xl bg-slate-900 px-6 text-white hover:bg-slate-800">
                  Add custom
                </Button>
                <Button variant="outline" onClick={undoLastAdd} className="h-12 rounded-2xl border-slate-200 bg-white text-slate-700">
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Undo last add
                </Button>
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-[1.9rem] border border-slate-200/80 bg-white p-5 shadow-sm">
                <div className="text-sm font-medium text-slate-500">
                  Set exact total
                </div>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  {currentPoints === 0
                    ? "Use this if you already have progress and want to catch the tracker up instantly."
                    : "Use this if the quick add buttons ever drift from your in-game total."}
                </p>

                <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                  <Input
                    type="number"
                    min={0}
                    max={2400}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        updateFromInput();
                      }
                    }}
                    className="h-12 rounded-2xl border-slate-200 bg-white text-base"
                    placeholder="Enter points"
                  />
                  <Button onClick={updateFromInput} className="h-12 rounded-2xl bg-slate-900 px-6 text-white hover:bg-slate-800">
                    Save total
                  </Button>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <SummaryBlock
                  label="Earned today"
                  value={`+${formatNumber(todayEarned)}`}
                  helper={
                    remainingToday === 0
                      ? "Today's pace target is covered"
                      : `${formatNumber(remainingToday)} still needed`
                  }
                />
                <SummaryBlock
                  label="Next rank runway"
                  value={nextRank ? `${formatNumber(pointsToNext)} pts` : "Goal hit"}
                  helper={nextRank ? winsAwayLabel : "No more milestones left"}
                />
              </div>

              <div className="rounded-[1.9rem] border border-dashed border-slate-300 bg-slate-50/70 p-5">
                <div className="text-sm font-medium text-slate-600">
                  Why both inputs?
                </div>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Quick add is fastest during a session. Exact total is best for
                  correcting drift or jumping in mid-season.
                </p>
              </div>
            </div>
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.35 }}
          className="border-t border-slate-200/60 py-10"
        >
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight">Rank ladder</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                Open the full ladder when you want the long view. It stays tucked
                away by default so the main screen keeps its focus.
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => setShowLadder((prev) => !prev)}
              className="h-11 rounded-full border-slate-200 bg-white px-4 text-slate-700 hover:bg-slate-50"
            >
              {showLadder ? "Hide ladder" : "Show ladder"}
              <ChevronDown
                className={cn(
                  "ml-2 h-4 w-4 transition-transform",
                  showLadder ? "rotate-180" : ""
                )}
              />
            </Button>
          </div>

          <div className="mt-4 flex flex-wrap gap-3 text-sm text-slate-500">
            <div className="rounded-full border border-slate-200 bg-white/80 px-4 py-2">
              <CalendarDays className="mr-2 inline h-4 w-4" />
              {seasonDaysRemaining} days remaining
            </div>
            <div className="rounded-full border border-slate-200 bg-white/80 px-4 py-2">
              {currentRank?.name ?? "Unranked"} right now
            </div>
            <div className="rounded-full border border-slate-200 bg-white/80 px-4 py-2">
              {formatNumber(pointsNeeded)} pts to goal
            </div>
          </div>

          <AnimatePresence initial={false}>
            {showLadder ? (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.25 }}
                className="overflow-hidden"
              >
                <div className="mt-6 overflow-hidden rounded-[2rem] border border-slate-200/80 bg-white/85 shadow-[0_20px_60px_rgba(15,23,42,0.06)] backdrop-blur-xl">
                  {RANKS.map((rank, index) => {
                    const status =
                      currentRank?.name === rank.name
                        ? "current"
                        : currentPoints >= rank.points
                          ? "passed"
                          : "future";

                    return (
                      <div
                        key={rank.name}
                        className={`flex items-center justify-between gap-4 px-5 py-4 ${index !== 0 ? "border-t border-slate-100" : ""} ${
                          status === "passed"
                            ? "bg-emerald-50/70"
                            : status === "current"
                              ? tierChip[rank.tier as keyof typeof tierChip]
                              : "bg-white/70"
                        }`}
                      >
                        <div className="flex min-w-0 items-center gap-4">
                          <div className={`h-12 w-1.5 rounded-full ${tierAccent[rank.tier as keyof typeof tierAccent]}`} />
                          <div className={`flex h-11 w-11 items-center justify-center rounded-2xl text-sm font-semibold text-white shadow-sm ${tierAccent[rank.tier as keyof typeof tierAccent]}`}>
                            {rank.short}
                          </div>
                          <div className="min-w-0">
                            <div className="truncate text-base font-semibold text-slate-900">{rank.name}</div>
                            <div className="mt-0.5 text-sm text-slate-500">
                              {status === "passed"
                                ? "Reached"
                                : status === "current"
                                  ? "Current rank"
                                  : `${Math.max(0, rank.points - currentPoints)} pts away`}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 text-right">
                          <div>
                            <div className="text-lg font-semibold text-slate-900">{formatNumber(rank.points)}</div>
                            <div className="text-xs uppercase tracking-[0.18em] text-slate-400">Points</div>
                          </div>
                          <ChevronRight className="h-4 w-4 text-slate-300" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </motion.section>
      </div>
    </div>
  );
}

function InlineMeta({
  label,
  value,
  valueClassName = "text-slate-900",
  className,
}: {
  label: string;
  value: string;
  valueClassName?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-4 py-2",
        className
      )}
    >
      <span className="text-slate-400">{label}</span>
      <span className={cn("font-medium", valueClassName)}>{value}</span>
    </div>
  );
}

function ProgressRow({
  label,
  value,
  progress,
  footerLeft,
  footerRight,
  large = false,
  indicatorClassName,
}: {
  label: string;
  value: string;
  progress: number;
  footerLeft: string;
  footerRight: string;
  large?: boolean;
  indicatorClassName?: string;
}) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3 text-sm text-slate-500">
        <span>{label}</span>
        <span className="font-medium text-slate-700">{value}</span>
      </div>
      <Progress
        value={progress}
        indicatorClassName={indicatorClassName}
        className={`${large ? "h-4" : "h-3"} rounded-full bg-white/80 shadow-inner`}
      />
      <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
        <span>{footerLeft}</span>
        <span>{footerRight}</span>
      </div>
    </div>
  );
}

function SummaryBlock({
  label,
  value,
  helper,
  valueClassName = "text-slate-900",
}: {
  label: string;
  value: string;
  helper: string;
  valueClassName?: string;
}) {
  return (
    <div className="rounded-[1.6rem] border border-slate-200/80 bg-white/85 p-5 shadow-sm">
      <div className="text-sm font-medium text-slate-500">{label}</div>
      <div className={`mt-3 text-3xl font-semibold tracking-tight ${valueClassName}`}>{value}</div>
      <div className="mt-2 text-sm leading-6 text-slate-500">{helper}</div>
    </div>
  );
}

function FocusRow({
  label,
  value,
  valueClassName = "text-white",
}: {
  label: string;
  value: string;
  valueClassName?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-[1.35rem] border border-white/10 bg-white/5 px-4 py-3">
      <span className="text-sm text-slate-300">{label}</span>
      <span className={cn("text-sm font-medium", valueClassName)}>{value}</span>
    </div>
  );
}

function OnboardingStep({
  number,
  title,
  body,
}: {
  number: string;
  title: string;
  body: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-[1.4rem] border border-white/10 bg-white/5 px-4 py-4">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/10 text-sm font-semibold text-white">
        {number}
      </div>
      <div>
        <div className="text-sm font-medium text-white">{title}</div>
        <div className="mt-1 text-sm leading-6 text-slate-300">{body}</div>
      </div>
    </div>
  );
}
