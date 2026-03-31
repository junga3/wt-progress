import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  CalendarDays,
  ChevronRight,
  RotateCcw,
  Medal,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";

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
const SEASON_START = new Date("2026-03-26T00:00:00");
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

const formatNumber = (value: number) => new Intl.NumberFormat().format(Math.max(0, Math.round(value)));
const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

function daysBetween(a: Date, b: Date) {
  const oneDay = 1000 * 60 * 60 * 24;
  return Math.max(1, Math.ceil((b.getTime() - a.getTime()) / oneDay));
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
  if (currentRank && nextRank) return `${currentRank.name} · ${nextRank.points - points} pts to ${nextRank.name}`;
  if (currentRank && !nextRank) return `${currentRank.name} · Max rank reached`;
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
  const [currentPoints, setCurrentPoints] = useState(0);
  const [inputValue, setInputValue] = useState("0");
  const [matchMode, setMatchMode] = useState<"cashout" | "quickplay" | "quickcash">("cashout");
  const [manualPoints, setManualPoints] = useState(5);
  const [history, setHistory] = useState<number[]>([]);
  const [todayEarned, setTodayEarned] = useState(0);

  const { currentRank, nextRank, tier } = useMemo(() => getRankInfo(currentPoints), [currentPoints]);

  const seasonDaysRemaining = useMemo(() => {
    const now = new Date();
    return Math.max(0, daysBetween(now, SEASON_END));
  }, []);

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
  const winsAway = Math.ceil(pointsToNext / 25);
  const remainingToday = Math.max(0, dailyPointsNeeded - todayEarned);
  const seasonElapsedPct = clamp((elapsedSeasonDays / totalSeasonDays) * 100, 0, 100);
  const isOnPace = fullCompletionPct >= seasonElapsedPct;

  function applyPoints(nextValue: number) {
    const safe = clamp(nextValue, 0, TOTAL_POINTS);
    setCurrentPoints(safe);
    setInputValue(String(safe));
  }

  function updateFromInput() {
    const parsed = Number(inputValue);
    if (Number.isNaN(parsed)) return;
    applyPoints(parsed);
  }

  function quickAdd(amount: number) {
    setHistory((prev) => [...prev, amount]);
    setTodayEarned((prev) => prev + amount);
    applyPoints(currentPoints + amount);
  }

  function undoLastAdd() {
    const last = history[history.length - 1];
    if (!last) return;
    setHistory((prev) => prev.slice(0, -1));
    setTodayEarned((prev) => Math.max(0, prev - last));
    applyPoints(currentPoints - last);
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
    <div className="min-h-screen bg-[linear-gradient(180deg,#eef4ff_0%,#f8fafc_28%,#f5f5f7_100%)] text-slate-900">
      <div className="mx-auto max-w-6xl px-4 py-8 md:px-6 lg:px-8">
        <motion.header
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="border-b border-slate-200/80 pb-8"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-sm">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">World Tour</div>
              <h1 className="mt-1 text-3xl font-semibold tracking-tight md:text-5xl">Season 10 Tracker</h1>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-3 text-sm">
            <InlineMeta label="Season" value="Mar 26 – Jul 9" />
            <InlineMeta label="Days left" value={`${seasonDaysRemaining}`} />
            <InlineMeta label="Current rank" value={currentRank?.name ?? "Unranked"} />
            <InlineMeta label="Pace" value={isOnPace ? "On pace" : "Behind"} valueClassName={isOnPace ? "text-emerald-600" : "text-amber-600"} />
          </div>
        </motion.header>

        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.04, duration: 0.35 }}
          className="py-10"
        >
          <div className={`rounded-[2rem] border bg-gradient-to-br ${tierPanel[tier as keyof typeof tierPanel]} p-6 shadow-[0_18px_50px_rgba(15,23,42,0.08)] md:p-8`}>
            <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
              <div>
                <div className="text-sm font-medium text-slate-500">Current points</div>
                <div className="mt-3 flex items-end gap-3">
                  <div className="text-6xl font-semibold tracking-tight md:text-8xl">{formatNumber(currentPoints)}</div>
                  <div className="pb-2 text-lg text-slate-500">pts</div>
                </div>
                <div className="mt-3 text-base text-slate-600">{getHeroSub(currentPoints)}</div>
              </div>

              <div className="inline-flex w-fit items-center gap-2 rounded-full border border-white/80 bg-white/80 px-4 py-2 text-sm font-medium text-slate-700 shadow-sm">
                <Medal className="h-4 w-4" />
                {currentRank?.name ?? "Unranked"}
              </div>
            </div>

            <div className="mt-8 space-y-6">
              <ProgressRow
                label={`Progress to ${nextRank?.name ?? "Emerald I"}`}
                value={`${Math.round(nextRankPct)}%`}
                progress={nextRankPct}
                footerLeft={currentRank?.name ?? "Start"}
                footerRight={nextRank?.name ?? "Max"}
              />

              <ProgressRow
                label="Completion out of 2400 points"
                value={`${formatNumber(currentPoints)} / 2,400`}
                progress={fullCompletionPct}
                footerLeft="Bronze IV"
                footerRight={`Overall ${Math.round(fullCompletionPct)}%`}
                large
              />

              <div>
                <div className="mb-2 flex items-center justify-between text-sm text-slate-500">
                  <span>Season pace</span>
                  <span>{seasonDaysRemaining} days left</span>
                </div>
                <div className="relative">
                  <Progress value={seasonElapsedPct} className="h-3 rounded-full bg-slate-200/80" />
                  <div
                    className="pointer-events-none absolute top-1/2 h-5 w-2 -translate-y-1/2 rounded-full bg-slate-900 shadow-sm"
                    style={{ left: `calc(${fullCompletionPct}% - 4px)` }}
                  />
                </div>
                <div className="mt-3 flex items-center justify-between text-sm">
                  <span className="text-slate-500">Season elapsed {Math.round(seasonElapsedPct)}%</span>
                  <span className={isOnPace ? "font-medium text-emerald-600" : "font-medium text-amber-600"}>
                    {isOnPace ? "On pace" : "Behind pace"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08, duration: 0.35 }}
          className="border-t border-slate-200/80 py-8"
        >
          <div className="mb-5 flex items-center justify-between gap-4">
            <h2 className="text-2xl font-semibold tracking-tight">Overview</h2>
            <div className="text-sm text-slate-500">Live pace snapshot</div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <SummaryBlock
              label="Daily points needed"
              value={`${dailyPointsNeeded}`}
              helper={avgPerDay >= dailyPointsNeeded ? `Averaging ${avgPerDay.toFixed(1)}/day` : `Need ${dailyPointsNeeded} per day`}
            />
            <SummaryBlock
              label="Points to next rank"
              value={`${pointsToNext}`}
              helper={nextRank ? `About ${winsAway} Cashout wins away` : "Max rank reached"}
            />
            <SummaryBlock
              label="Estimated completion"
              value={projectedCompletionDate ? formatDate(projectedCompletionDate) : "—"}
              helper={projectedCompletionDate ? (projectedCompletionDate <= SEASON_END ? "Finishes before season end" : "Pace runs past season end") : "Add points to calculate"}
            />
            <SummaryBlock
              label="Today"
              value={remainingToday === 0 ? "✓" : `+${formatNumber(todayEarned)}`}
              helper={remainingToday === 0 ? "Done for today" : `${formatNumber(remainingToday)} still needed today`}
              valueClassName={remainingToday === 0 ? "text-emerald-600" : todayEarned > 0 ? "text-slate-900" : "text-slate-500"}
            />
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12, duration: 0.35 }}
          className="border-t border-slate-200/80 py-8"
        >
          <div className="mb-6">
            <h2 className="text-2xl font-semibold tracking-tight">Update points</h2>
            <p className="mt-1 text-sm text-slate-500">Set your current total directly.</p>
          </div>

          <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
            <div className="flex flex-1 gap-3">
              <Input
                type="number"
                min={0}
                max={2400}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                className="h-12 rounded-2xl border-slate-200 bg-white text-base"
                placeholder="Enter points"
              />
              <Button onClick={updateFromInput} className="h-12 rounded-2xl bg-slate-900 px-6 text-white hover:bg-slate-800">
                Update
              </Button>
            </div>
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.16, duration: 0.35 }}
          className="border-t border-slate-200/80 py-8"
        >
          <div className="mb-6">
            <h2 className="text-2xl font-semibold tracking-tight">Add match result</h2>
            <p className="mt-1 text-sm text-slate-500">Track progress as you play with one-click point adds.</p>
          </div>

          <div className="mb-5 flex flex-wrap gap-2 rounded-[1.35rem] bg-slate-100 p-1.5">
            {[
              { id: "cashout", label: "Cashout" },
              { id: "quickplay", label: "Quickplay" },
              { id: "quickcash", label: "Quick Cash" },
                          ].map((mode) => (
              <button
                key={mode.id}
                onClick={() => setMatchMode(mode.id as typeof matchMode)}
                className={`rounded-2xl px-4 py-2.5 text-sm font-medium transition ${matchMode === mode.id ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
              >
                {mode.label}
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

          <div className="mt-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex w-full max-w-md gap-3">
              <Input
                type="number"
                min={1}
                max={100}
                value={manualPoints}
                onChange={(e) => setManualPoints(clamp(Number(e.target.value || 1), 1, 100))}
                className="h-12 rounded-2xl border-slate-200 bg-white text-base"
                placeholder="Manual points"
              />
              <Button onClick={() => quickAdd(manualPoints)} className="h-12 rounded-2xl bg-slate-900 px-6 text-white hover:bg-slate-800">
                Add
              </Button>
            </div>

            <Button variant="outline" onClick={undoLastAdd} className="h-12 rounded-2xl border-slate-200 bg-white text-slate-700">
              <RotateCcw className="mr-2 h-4 w-4" />
              Undo last add
            </Button>
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.35 }}
          className="border-t border-slate-200/80 py-8"
        >
          <div className="mb-6 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight">Rank ladder</h2>
              <p className="mt-1 text-sm text-slate-500">A full vertical view of every milestone in the season.</p>
            </div>
            <div className="hidden items-center gap-2 text-sm text-slate-500 md:flex">
              <CalendarDays className="h-4 w-4" />
              {seasonDaysRemaining} days remaining
            </div>
          </div>

          <div className="overflow-hidden rounded-[2rem] border border-slate-200/80 bg-white/80 shadow-[0_18px_50px_rgba(15,23,42,0.05)] backdrop-blur-xl">
            {RANKS.map((rank, index) => {
              const status = currentPoints >= rank.points ? "passed" : currentRank?.name === rank.name ? "current" : "future";
              return (
                <div
                  key={rank.name}
                  className={`flex items-center justify-between gap-4 px-5 py-4 ${index !== 0 ? "border-t border-slate-100" : ""} ${
                    status === "passed"
                      ? "bg-emerald-50/70"
                      : status === "current"
                        ? "bg-blue-50/80"
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
                        {status === "passed" ? "Completed" : status === "current" ? "Current target band" : `${Math.max(0, rank.points - currentPoints)} pts away`}
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
        </motion.section>
      </div>
    </div>
  );
}

function InlineMeta({
  label,
  value,
  valueClassName = "text-slate-900",
}: {
  label: string;
  value: string;
  valueClassName?: string;
}) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-4 py-2">
      <span className="text-slate-400">{label}</span>
      <span className={`font-medium ${valueClassName}`}>{value}</span>
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
}: {
  label: string;
  value: string;
  progress: number;
  footerLeft: string;
  footerRight: string;
  large?: boolean;
}) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3 text-sm text-slate-500">
        <span>{label}</span>
        <span className="font-medium text-slate-700">{value}</span>
      </div>
      <Progress value={progress} className={`${large ? "h-4" : "h-3"} rounded-full bg-slate-200/80`} />
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
