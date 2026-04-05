import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  BadgeCheck,
  CalendarDays,
  ChevronDown,
  ChevronRight,
  Moon,
  RotateCcw,
  Medal,
  Sun,
  Ticket,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { BattlePassProgressionPage } from "@/pages/BattlePassProgressionPage";
import { StatisticsBadgeProgressionPage } from "@/pages/StatisticsBadgeProgressionPage";

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
const STYLE_MODE_STORAGE_KEY = "wt-progress-style-mode";
const SEASON_DAY_TIMER_OFFSET = -1;
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

type SiteId = "world-tour" | "statistics-badges" | "battle-pass";
type StyleMode = "rebuilt" | "original";
const APP_BASE_PATH = import.meta.env.BASE_URL;

const SITE_OPTIONS = [
  {
    id: "world-tour" as const,
    icon: Medal,
    label: "World Tour progress companion",
    path: "world-tour-progress",
    title: "Track the climb.\nKeep the momentum.",
    description:
      "Log matches in one tap, see whether you are on pace, and keep your attention on the next rank instead of a spreadsheet.",
    preview: "Match logging, pace, and milestone planning",
  },
  {
    id: "statistics-badges" as const,
    icon: BadgeCheck,
    label: "Statistics Badge Progression",
    path: "statistics-badge-progression",
    title: "See every lifetime badge tier in one place.",
    description:
      "Track eliminations, revives, cash, and wins to see your current badge tier, next milestone, and progression at a glance.",
    preview: "Player card badge tracking for four lifetime stats",
  },
  {
    id: "battle-pass" as const,
    icon: Ticket,
    label: "Battle Pass Progression",
    path: "battle-pass-progression",
    title: "Track every level.\nSee the whole pass.",
    description:
      "Update your current Battle Pass level, follow the main track and bonus pages, and keep the bracket math in a cleaner level-first view.",
    preview: "Battle Pass progress, level bands, and bonus tracking",
  },
];

const formatNumber = (value: number) => new Intl.NumberFormat().format(Math.max(0, Math.round(value)));
const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

function getSiteHref(sitePath: string) {
  return `${APP_BASE_PATH}${sitePath}`;
}

function getRelativeAppPath(pathname: string) {
  const normalizedBase = APP_BASE_PATH.endsWith("/")
    ? APP_BASE_PATH.slice(0, -1)
    : APP_BASE_PATH;

  if (pathname === normalizedBase || pathname === `${normalizedBase}/`) {
    return "/";
  }

  return pathname.startsWith(normalizedBase)
    ? pathname.slice(normalizedBase.length) || "/"
    : pathname;
}

function getSiteFromPathname(pathname: string): SiteId {
  const relativePath = getRelativeAppPath(pathname);
  if (relativePath.includes("battle-pass-progression")) {
    return "battle-pass";
  }
  return relativePath.includes("statistics-badge-progression")
    ? "statistics-badges"
    : "world-tour";
}

function daysBetween(a: Date, b: Date) {
  const oneDay = 1000 * 60 * 60 * 24;
  return Math.max(1, Math.ceil((b.getTime() - a.getTime()) / oneDay));
}

function getDaysRemaining(endDate: Date) {
  const now = new Date();
  const oneDay = 1000 * 60 * 60 * 24;
  const rawDays = Math.max(0, Math.ceil((endDate.getTime() - now.getTime()) / oneDay));
  return Math.max(0, rawDays + SEASON_DAY_TIMER_OFFSET);
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

function getSavedStyleMode(): StyleMode {
  if (typeof window === "undefined") return "rebuilt";

  const saved = window.localStorage.getItem(STYLE_MODE_STORAGE_KEY);
  return saved === "original" ? "original" : "rebuilt";
}

export default function WTProgressAppleRedesign() {
  const [activeSite, setActiveSite] = useState<SiteId>(() =>
    typeof window === "undefined"
      ? "world-tour"
      : getSiteFromPathname(window.location.pathname)
  );
  const [styleMode, setStyleMode] = useState<StyleMode>(() => getSavedStyleMode());
  const [isSiteMenuOpen, setIsSiteMenuOpen] = useState(false);
  const [currentPoints, setCurrentPoints] = useState(() => getSavedTrackerState().currentPoints);
  const [inputValue, setInputValue] = useState(() => String(getSavedTrackerState().currentPoints));
  const [matchMode, setMatchMode] = useState<"cashout" | "quickplay" | "quickcash">(() => getSavedTrackerState().matchMode);
  const [manualPoints, setManualPoints] = useState(() => getSavedTrackerState().manualPoints);
  const [history, setHistory] = useState<number[]>([]);
  const [todayEarned, setTodayEarned] = useState(() => getSavedTrackerState().todayEarned);
  const [showLadder, setShowLadder] = useState(false);
  const siteMenuRef = useRef<HTMLDivElement | null>(null);

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
  const pointsToNext = nextRank ? Math.max(0, nextRank.points - currentPoints) : 0;
  const remainingToday = Math.max(0, dailyPointsNeeded - todayEarned);
  const seasonElapsedPct = clamp((elapsedSeasonDays / totalSeasonDays) * 100, 0, 100);
  const isOnPace = fullCompletionPct >= seasonElapsedPct;
  const seasonLabel = "Mar 26 - Jul 9";
  const heroSubtitle = getHeroSub(currentPoints);
  const matchModes = [
    { id: "cashout" as const, label: "Cashout", helper: "Ranked placement" },
    { id: "quickcash" as const, label: "Quick Cash", helper: "Placement based" },
    { id: "quickplay" as const, label: "Quickplay", helper: "Short sessions" },
  ];
  const activeMode = matchModes.find((mode) => mode.id === matchMode) ?? matchModes[0];
  const activeSiteConfig =
    SITE_OPTIONS.find((site) => site.id === activeSite) ?? SITE_OPTIONS[0];
  const alternateSites = SITE_OPTIONS.filter((site) => site.id !== activeSite);
  const ActiveSiteIcon = activeSiteConfig.icon;
  const visualStyleMode: StyleMode = styleMode;
  const isOriginalStyle = visualStyleMode === "original";

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handlePopState = () => {
      setActiveSite(getSiteFromPathname(window.location.pathname));
      setIsSiteMenuOpen(false);
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const currentRelativePath = getRelativeAppPath(window.location.pathname);
    const nextPath = `/${activeSiteConfig.path}`;

    if (currentRelativePath === "/" && activeSite === "world-tour") {
      window.history.replaceState(null, "", getSiteHref(activeSiteConfig.path));
      return;
    }

    if (currentRelativePath !== nextPath) {
      window.history.replaceState(null, "", getSiteHref(activeSiteConfig.path));
    }
  }, [activeSite, activeSiteConfig.path]);

  useEffect(() => {
    if (!isSiteMenuOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (siteMenuRef.current && !siteMenuRef.current.contains(event.target as Node)) {
        setIsSiteMenuOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsSiteMenuOpen(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isSiteMenuOpen]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    window.localStorage.setItem(STYLE_MODE_STORAGE_KEY, styleMode);
    document.documentElement.dataset.styleMode = visualStyleMode;
    document.documentElement.style.colorScheme = isOriginalStyle ? "light" : "dark";
  }, [isOriginalStyle, styleMode, visualStyleMode]);

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
    <div
      data-style-mode={visualStyleMode}
      className={cn(
        "tf-app-shell relative min-h-screen overflow-hidden",
        isOriginalStyle
          ? "bg-[linear-gradient(180deg,#f3eadf_0%,#f8fafc_42%,#edf7f2_100%)] text-slate-900"
          : "bg-[#050506] text-[var(--tf-cream)]"
      )}
    >
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className={cn(
            "absolute rounded-full blur-3xl",
            isOriginalStyle
              ? "left-[-6rem] top-[-4rem] h-72 w-72 bg-amber-200/55"
              : "left-[-8rem] top-[-6rem] h-80 w-80 bg-[#ff5c1f]/18"
          )}
        />
        <div
          className={cn(
            "absolute rounded-full blur-3xl",
            isOriginalStyle
              ? "right-[-5rem] top-24 h-80 w-80 bg-emerald-200/35"
              : "right-[-6rem] top-14 h-96 w-96 bg-[#ff2d00]/14"
          )}
        />
        <div
          className={cn(
            "absolute left-1/2 -translate-x-1/2 rounded-full blur-3xl",
            isOriginalStyle
              ? "bottom-[-8rem] h-72 w-72 bg-sky-200/25"
              : "bottom-[-10rem] h-80 w-80 bg-white/6"
          )}
        />
      </div>

      <div className="relative mx-auto max-w-6xl px-4 py-8 md:px-6 lg:px-8">
        <motion.header
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className={cn(
            isOriginalStyle
              ? "rounded-[2.25rem] border border-white/70 bg-white/75 px-6 py-7 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur-xl md:px-8 md:py-8"
              : "tf-panel tf-panel-accent rounded-[2.2rem] px-6 py-7 md:px-8 md:py-8"
          )}
        >
          <div className="relative z-10">
            <div className="flex items-start justify-between gap-4">
              <div ref={siteMenuRef} className="relative inline-flex">
                <button
                  type="button"
                  onClick={() => setIsSiteMenuOpen((prev) => !prev)}
                  className="tf-route-button inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] transition hover:border-white/20 hover:bg-white/10"
                >
                  <ActiveSiteIcon
                    className={cn("h-4 w-4", isOriginalStyle ? "text-slate-900" : "text-[#ff5c1f]")}
                  />
                  {activeSiteConfig.label}
                  <ChevronDown
                    className={cn(
                      "h-4 w-4 transition-transform",
                      isSiteMenuOpen ? "rotate-180" : ""
                    )}
                  />
                </button>

                <AnimatePresence>
                  {isSiteMenuOpen ? (
                    <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.98 }}
                    transition={{ duration: 0.18 }}
                    className={cn(
                        "absolute left-0 top-[calc(100%+0.75rem)] z-30 rounded-[1.6rem] p-2",
                        isOriginalStyle
                          ? "border border-white/70 bg-white/90 shadow-[0_24px_60px_rgba(15,23,42,0.12)] backdrop-blur-xl"
                          : "tf-panel tf-panel-soft"
                      )}
                    >
                      {alternateSites.map((site) => (
                        (() => {
                          const SiteIcon = site.icon;

                          return (
                            <button
                              key={site.id}
                              type="button"
                              onClick={() => {
                                window.history.pushState(null, "", getSiteHref(site.path));
                                setActiveSite(site.id);
                                setIsSiteMenuOpen(false);
                                window.scrollTo({ top: 0, behavior: "smooth" });
                              }}
                              className={cn(
                                "tf-route-button tf-route-option inline-flex w-full items-center gap-2 whitespace-nowrap rounded-full px-4 py-2 text-left text-xs font-semibold uppercase tracking-[0.22em] transition",
                                activeSite === site.id
                                  ? isOriginalStyle
                                    ? "bg-slate-900 text-white"
                                    : "bg-[linear-gradient(90deg,#ff2d00,#ff5c1f)] text-white"
                                  : isOriginalStyle
                                    ? "text-slate-900 hover:border-slate-400 hover:bg-white"
                                    : "text-[var(--tf-cream)] hover:bg-white/6"
                              )}
                            >
                              <SiteIcon className="h-4 w-4" />
                              {site.label}
                            </button>
                          );
                        })()
                      ))}
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              </div>

              <button
                type="button"
                onClick={() =>
                  setStyleMode((prev) => (prev === "rebuilt" ? "original" : "rebuilt"))
                }
                aria-label={
                  isOriginalStyle
                    ? "Switch to dark mode"
                    : "Switch to light mode"
                }
                title={isOriginalStyle ? "Light mode" : "Dark mode"}
                className="tf-route-button inline-flex items-center gap-1 rounded-full p-1"
              >
                <span
                  className={cn(
                    "grid h-9 w-9 place-items-center rounded-full transition",
                    isOriginalStyle
                      ? "bg-white text-slate-900 shadow-sm"
                      : "text-[var(--tf-muted)]"
                  )}
                >
                  <Sun className="h-4 w-4" />
                </span>
                <span
                  className={cn(
                    "grid h-9 w-9 place-items-center rounded-full transition",
                    isOriginalStyle
                      ? "text-[var(--tf-muted)]"
                      : "bg-[linear-gradient(90deg,#ff2d00,#ff5c1f)] text-white shadow-sm"
                  )}
                >
                  <Moon className="h-4 w-4" />
                </span>
              </button>
            </div>

            <div className="mt-6 max-w-3xl">
              <div className="tf-kicker">Contestant companion</div>
              <h1 className="tf-display mt-3 max-w-4xl whitespace-pre-line text-5xl md:text-7xl">
              {activeSiteConfig.title}
              </h1>
              <p
                className={cn(
                  "mt-4 max-w-2xl text-base leading-7 md:text-lg",
                  isOriginalStyle ? "text-slate-600" : "text-[var(--tf-muted)]"
                )}
              >
                {activeSiteConfig.description}
              </p>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-3 text-sm">
            {activeSite === "world-tour" ? (
              <>
                <InlineMeta label="Season 10" value={seasonLabel} />
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
              </>
            ) : activeSite === "battle-pass" ? (
              <>
                <InlineMeta label="Season 10" value={seasonLabel} />
                <InlineMeta label="Days left" value={`${seasonDaysRemaining}`} />
                <InlineMeta label="Main track" value="96 levels" />
                <InlineMeta label="Bonus pages" value="10 levels" />
              </>
            ) : (
              <>
                <InlineMeta label="Section" value="Statistics badges" />
                <InlineMeta label="Tracked" value="4 categories" />
                <InlineMeta label="Tiers" value="Bronze to Amethyst" />
              </>
            )}
          </div>
        </motion.header>

        {activeSite === "world-tour" ? (
          <>
            <div className="mt-8 grid gap-6 xl:grid-cols-[1.35fr_0.95fr]">
          <motion.section
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.04, duration: 0.35 }}
            className={cn(
              isOriginalStyle
                ? `rounded-[2.25rem] border bg-gradient-to-br p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)] md:p-8 ${tierPanel[tier as keyof typeof tierPanel]}`
                : "tf-panel tf-panel-accent rounded-[2.25rem] p-6 md:p-8",
              isOriginalStyle
                ? ""
                : "bg-[radial-gradient(circle_at_top_left,rgba(255,92,31,0.18),transparent_24%),linear-gradient(180deg,rgba(18,19,24,0.96),rgba(9,10,12,0.92))]"
            )}
          >
            <div className="flex flex-col gap-8">
              <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <div
                    className={cn(
                      "text-sm font-semibold uppercase tracking-[0.22em]",
                      isOriginalStyle ? "text-slate-500" : "text-slate-400"
                    )}
                  >
                    World Tour status
                  </div>
                  <div className="mt-4 flex items-end gap-3">
                    <div className="text-6xl font-semibold tracking-tight md:text-8xl">
                      {formatNumber(currentPoints)}
                    </div>
                    <div className="pb-2 text-lg text-[var(--tf-muted)]">pts</div>
                  </div>
                  <div className="mt-3 max-w-xl text-base leading-7 text-[var(--tf-muted)]">
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
                  label="Goal rank completion"
                  value={`${formatNumber(pointsNeeded)} pts left`}
                  progress={fullCompletionPct}
                  footerLeft={`${formatNumber(currentPoints)} / 2,400 pts`}
                  footerRight={`${Math.round(fullCompletionPct)}% complete`}
                  indicatorClassName={tierAccent[tier as keyof typeof tierAccent]}
                />

                <ProgressRow
                  label="Season completion"
                  value={`${formatNumber(seasonDaysRemaining)} days left`}
                  progress={seasonElapsedPct}
                  footerLeft={`${formatNumber(elapsedSeasonDays)} days elapsed`}
                  footerRight={`${Math.round(seasonElapsedPct)}% complete`}
                  large
                  indicatorClassName="bg-slate-900"
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
            <div className="flex items-start justify-between gap-4">
              <div>
                <div
                  className={cn(
                    "text-sm font-semibold uppercase tracking-[0.22em]",
                    isOriginalStyle ? "text-slate-500" : "text-slate-400"
                  )}
                >
                  Mission control
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
                    ? isOriginalStyle
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-emerald-400/15 text-emerald-200"
                    : isOriginalStyle
                      ? "bg-amber-100 text-amber-700"
                      : "bg-amber-400/15 text-amber-200"
                )}
              >
                {isOnPace ? "On pace" : "Needs attention"}
              </div>
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
                    "text-sm",
                    isOriginalStyle ? "text-slate-500" : "text-[var(--tf-muted)]"
                  )}
                >
                {remainingToday === 0 ? "Today's pace target" : "Points left today"}
              </div>
              <div className="mt-3 text-5xl font-semibold tracking-tight">
                {remainingToday === 0 ? "Done" : formatNumber(remainingToday)}
              </div>
              <p
                className={cn(
                  "mt-3 max-w-sm text-sm leading-6",
                  isOriginalStyle ? "text-slate-600" : "text-[var(--tf-muted)]"
                )}
              >
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
                  isOriginalStyle={isOriginalStyle}
                />
                <OnboardingStep
                  number="2"
                  title="Tap results as you go"
                  body="Use the quick add buttons after each match so the tracker stays effortless."
                  isOriginalStyle={isOriginalStyle}
                />
                <OnboardingStep
                  number="3"
                  title="Sync if needed"
                  body="If you already have progress, use the exact total field below to catch up instantly."
                  isOriginalStyle={isOriginalStyle}
                />
              </div>
            ) : (
              <div className="mt-6 space-y-4">
                <FocusRow
                  label="Earned today"
                  value={`+${formatNumber(todayEarned)}`}
                  isOriginalStyle={isOriginalStyle}
                />
                <FocusRow
                  label="Averaging points per day"
                  value={`${avgPerDay.toFixed(1)} pts/day`}
                  valueClassName={
                    isOnPace
                      ? isOriginalStyle
                        ? "text-emerald-700"
                        : "text-emerald-300"
                      : isOriginalStyle
                        ? "text-amber-700"
                        : "text-amber-300"
                  }
                  isOriginalStyle={isOriginalStyle}
                />
              </div>
            )}
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
          <div className="mb-8 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div
                className={cn(
                  "text-sm font-semibold uppercase tracking-[0.22em]",
                  isOriginalStyle ? "text-slate-400" : "text-slate-400"
                )}
              >
                Action station
              </div>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight">
                Log progress
              </h2>
              <p className="mt-2 text-sm leading-6 text-[var(--tf-muted)] lg:max-w-none lg:whitespace-nowrap">
                Quick add after each match or save an exact total when you need
                to sync the tracker with your in-game number.
              </p>
            </div>

            <div className="tf-meta-pill rounded-full px-4 py-2 text-sm text-[var(--tf-cream)]">
              {activeMode.helper}
            </div>
          </div>

          <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
            <div
              className={cn(
                "rounded-[1.9rem] p-5",
                isOriginalStyle
                  ? "border border-slate-200/80 bg-slate-50/90"
                  : "tf-panel tf-panel-soft"
              )}
            >
              <div
                className={cn(
                  "mb-5 grid grid-cols-3 gap-2 rounded-[1.4rem] p-1.5",
                  isOriginalStyle
                    ? "bg-white shadow-sm ring-1 ring-slate-200/70"
                    : "bg-white/4 ring-1 ring-white/8"
                )}
              >
                {matchModes.map((mode) => (
                  <button
                    key={mode.id}
                    onClick={() => handleMatchModeChange(mode.id)}
                    className={cn(
                      "w-full rounded-[1.1rem] px-4 py-3 text-center text-sm font-medium transition",
                      matchMode === mode.id
                        ? isOriginalStyle
                          ? "bg-slate-900 text-white shadow-sm"
                          : "bg-[linear-gradient(90deg,#ff2d00,#ff5c1f)] text-white shadow-sm"
                        : isOriginalStyle
                          ? "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                          : "text-[var(--tf-muted)] hover:bg-white/6 hover:text-[var(--tf-cream)]"
                    )}
                  >
                    <div>{mode.label}</div>
                  </button>
                ))}
              </div>

              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {matchButtons[matchMode].map((button) => (
                  <button
                    key={`${matchMode}-${button.label}`}
                    onClick={() => quickAdd(button.points)}
                    className={cn(
                      "rounded-[1.5rem] border px-5 py-5 text-left transition hover:-translate-y-0.5 hover:shadow-md",
                      button.emphasis
                        ? isOriginalStyle
                          ? "border-slate-900 bg-slate-900 text-white"
                          : "border-[#ff5c1f] bg-[linear-gradient(135deg,#ff2d00,#ff5c1f)] text-white"
                        : isOriginalStyle
                          ? "border-slate-200 bg-white text-slate-900"
                          : "border-white/10 bg-white/4 text-[var(--tf-cream)]"
                    )}
                  >
                    <div className="text-3xl font-semibold tracking-tight">+{button.points}</div>
                    <div
                      className={cn(
                        "mt-1 text-sm",
                        button.emphasis
                          ? "text-white/80"
                          : isOriginalStyle
                            ? "text-slate-500"
                            : "text-[var(--tf-muted)]"
                      )}
                    >
                      {button.label}
                    </div>
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
                  className="tf-input h-12 rounded-2xl text-base"
                  placeholder="Manual points"
                />
                <Button onClick={() => quickAdd(manualPoints)} className="tf-button-accent h-12 rounded-2xl px-6 hover:bg-slate-800">
                  Add custom
                </Button>
                <Button variant="outline" onClick={undoLastAdd} className="tf-button-ghost h-12 rounded-2xl">
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Undo last add
                </Button>
              </div>
            </div>

            <div className="space-y-4">
              <div
                className={cn(
                  "rounded-[1.9rem] p-5",
                  isOriginalStyle
                    ? "border border-slate-200/80 bg-white"
                    : "tf-panel tf-panel-soft"
                )}
              >
                <div className="text-sm font-medium text-[var(--tf-muted)]">
                  Set exact total
                </div>
                <p className="mt-2 text-sm leading-6 text-[var(--tf-muted)]">
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
                    className="tf-input h-12 rounded-2xl text-base"
                    placeholder="Enter points"
                  />
                  <Button onClick={updateFromInput} className="tf-button-accent h-12 rounded-2xl px-6">
                    Save total
                  </Button>
                </div>
              </div>

            </div>
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.35 }}
          className={cn(
            "py-10",
            isOriginalStyle ? "border-t border-slate-200/80" : "border-t border-white/10"
          )}
        >
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight text-[var(--tf-cream)]">Rank ladder</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--tf-muted)]">
                Open the full ladder when you want the long view.
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => setShowLadder((prev) => !prev)}
              className="tf-button-ghost h-11 rounded-full px-4"
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

          <div className="mt-4 flex flex-wrap gap-3 text-sm text-[var(--tf-muted)]">
            <div className="tf-meta-pill rounded-full px-4 py-2">
              <CalendarDays className="mr-2 inline h-4 w-4" />
              {seasonDaysRemaining} days remaining
            </div>
            <div className="tf-meta-pill rounded-full px-4 py-2">
              {currentRank?.name ?? "Unranked"} right now
            </div>
            <div className="tf-meta-pill rounded-full px-4 py-2">
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
                <div className="tf-panel rounded-[2rem]">
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
                        className={`flex items-center justify-between gap-4 px-5 py-4 ${index !== 0 ? isOriginalStyle ? "border-t border-slate-100" : "border-t border-white/8" : ""} ${
                          status === "passed"
                            ? isOriginalStyle
                              ? "bg-emerald-50/70"
                              : "bg-emerald-400/12"
                            : status === "current"
                              ? tierChip[rank.tier as keyof typeof tierChip]
                              : isOriginalStyle
                                ? "bg-white/70"
                                : "bg-white/4"
                        }`}
                      >
                        <div className="flex min-w-0 items-center gap-4">
                          <div className={`h-12 w-1.5 rounded-full ${tierAccent[rank.tier as keyof typeof tierAccent]}`} />
                          <div className={`flex h-11 w-11 items-center justify-center rounded-2xl text-sm font-semibold text-white shadow-sm ${tierAccent[rank.tier as keyof typeof tierAccent]}`}>
                            {rank.short}
                          </div>
                          <div className="min-w-0">
                            <div
                              className={cn(
                                "truncate text-base font-semibold",
                                isOriginalStyle ? "text-slate-900" : "text-[var(--tf-cream)]"
                              )}
                            >
                              {rank.name}
                            </div>
                            <div
                              className={cn(
                                "mt-0.5 text-sm",
                                isOriginalStyle ? "text-slate-500" : "text-[var(--tf-muted)]"
                              )}
                            >
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
                            <div
                              className={cn(
                                "text-lg font-semibold",
                                isOriginalStyle ? "text-slate-900" : "text-[var(--tf-cream)]"
                              )}
                            >
                              {formatNumber(rank.points)}
                            </div>
                            <div
                              className={cn(
                                "text-xs uppercase tracking-[0.18em]",
                                isOriginalStyle ? "text-slate-400" : "text-[var(--tf-muted)]"
                              )}
                            >
                              Points
                            </div>
                          </div>
                          <ChevronRight
                            className={cn(
                              "h-4 w-4",
                              isOriginalStyle ? "text-slate-300" : "text-white/22"
                            )}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </motion.section>
          </>
        ) : activeSite === "statistics-badges" ? (
          <StatisticsBadgeProgressionPage styleMode={visualStyleMode} />
        ) : (
          <BattlePassProgressionPage
            styleMode={visualStyleMode}
            seasonDaysRemaining={seasonDaysRemaining}
            elapsedSeasonDays={elapsedSeasonDays}
            seasonElapsedPct={seasonElapsedPct}
          />
        )}
      </div>
    </div>
  );
}

function InlineMeta({
  label,
  value,
  valueClassName = "text-[var(--tf-cream)]",
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
        "tf-meta-pill inline-flex items-center gap-2 rounded-full px-4 py-2",
        className
      )}
    >
      <span className="text-[var(--tf-muted)]">{label}</span>
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
      <div className="mb-2 flex items-center justify-between gap-3 text-sm text-[var(--tf-muted)]">
        <span>{label}</span>
        <span className="font-medium text-[var(--tf-cream)]">{value}</span>
      </div>
      <Progress
        value={progress}
        indicatorClassName={indicatorClassName}
        className={cn("tf-progress-track rounded-full", large ? "h-4" : "h-3")}
      />
      <div className="mt-2 flex items-center justify-between text-xs text-[var(--tf-muted)]">
        <span>{footerLeft}</span>
        <span>{footerRight}</span>
      </div>
    </div>
  );
}

function FocusRow({
  label,
  value,
  valueClassName = "text-[var(--tf-cream)]",
  isOriginalStyle,
}: {
  label: string;
  value: string;
  valueClassName?: string;
  isOriginalStyle: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-4 rounded-[1.35rem] border px-4 py-3",
        isOriginalStyle
          ? "border-slate-200 bg-slate-50/90"
          : "border-white/10 bg-white/4"
      )}
    >
      <span className={cn("text-sm", isOriginalStyle ? "text-slate-500" : "text-[var(--tf-muted)]")}>
        {label}
      </span>
      <span className={cn("text-sm font-medium", valueClassName)}>{value}</span>
    </div>
  );
}

function OnboardingStep({
  number,
  title,
  body,
  isOriginalStyle,
}: {
  number: string;
  title: string;
  body: string;
  isOriginalStyle: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-[1.4rem] border px-4 py-4",
        isOriginalStyle
          ? "border-slate-200 bg-slate-50/90"
          : "border-white/10 bg-white/4"
      )}
    >
      <div
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white",
          isOriginalStyle ? "bg-slate-500" : "bg-white/15"
        )}
      >
        {number}
      </div>
      <div>
        <div className={cn("text-sm font-medium", isOriginalStyle ? "text-slate-900" : "text-[var(--tf-cream)]")}>
          {title}
        </div>
        <div className={cn("mt-1 text-sm leading-6", isOriginalStyle ? "text-slate-600" : "text-[var(--tf-muted)]")}>
          {body}
        </div>
      </div>
    </div>
  );
}
