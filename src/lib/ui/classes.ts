/** Shared Tailwind class strings — presentation only, no business logic. */

export const PAGE_STACK = "space-y-8 sm:space-y-10";

export const PAGE_TITLE =
  "text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-4xl";

export const PAGE_DESCRIPTION =
  "mt-2 max-w-2xl text-base leading-relaxed text-zinc-500 dark:text-zinc-400";

export const SURFACE_CARD =
  "rounded-2xl border border-zinc-200/60 bg-white/80 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_8px_24px_rgba(0,0,0,0.06)] backdrop-blur-sm dark:border-zinc-800/60 dark:bg-zinc-900/80 dark:shadow-[0_1px_3px_rgba(0,0,0,0.2),0_8px_24px_rgba(0,0,0,0.3)]";

export const SURFACE_CARD_INTERACTIVE =
  "rounded-2xl border border-zinc-200/60 bg-white/80 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_8px_24px_rgba(0,0,0,0.06)] backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-violet-200/80 hover:shadow-[0_4px_12px_rgba(124,58,237,0.08),0_16px_40px_rgba(0,0,0,0.08)] dark:border-zinc-800/60 dark:bg-zinc-900/80 dark:hover:border-violet-500/30 dark:hover:shadow-[0_4px_12px_rgba(124,58,237,0.15),0_16px_40px_rgba(0,0,0,0.4)]";

export const FILTER_PANEL = `${SURFACE_CARD} p-5 sm:p-6`;

export const FILTER_LABEL =
  "text-[11px] font-semibold tracking-wider text-zinc-400 uppercase dark:text-zinc-500";

export const FIELD_INPUT =
  "h-11 w-full rounded-xl border border-zinc-200/80 bg-white px-4 text-sm text-zinc-900 shadow-sm placeholder:text-zinc-400 outline-none transition-all focus-visible:border-violet-400 focus-visible:ring-4 focus-visible:ring-violet-500/10 disabled:cursor-not-allowed disabled:opacity-60 dark:border-zinc-700/80 dark:bg-zinc-900/90 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus-visible:border-violet-500 dark:focus-visible:ring-violet-500/20";

export const SELECT_INPUT = FIELD_INPUT;

export const BTN_PRIMARY =
  "inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-b from-violet-600 to-violet-700 px-5 text-sm font-semibold text-white shadow-[0_1px_2px_rgba(0,0,0,0.1),0_4px_12px_rgba(124,58,237,0.35)] transition-all hover:from-violet-500 hover:to-violet-600 hover:shadow-[0_1px_2px_rgba(0,0,0,0.1),0_6px_20px_rgba(124,58,237,0.45)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-violet-500/30 disabled:cursor-not-allowed disabled:opacity-60 active:scale-[0.98]";

export const BTN_SECONDARY =
  "inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-zinc-200/80 bg-white px-4 text-sm font-semibold text-zinc-700 shadow-sm transition-all hover:border-zinc-300 hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-zinc-200 disabled:cursor-not-allowed disabled:opacity-60 active:scale-[0.98] dark:border-zinc-700/80 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:border-zinc-600 dark:hover:bg-zinc-800 dark:focus-visible:ring-zinc-700/50";

export const BTN_OUTLINE =
  "inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-zinc-200/80 bg-transparent px-4 text-sm font-semibold text-zinc-700 transition-all hover:border-violet-300 hover:bg-violet-50/50 hover:text-violet-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-violet-500/10 disabled:cursor-not-allowed disabled:opacity-60 dark:border-zinc-700 dark:text-zinc-300 dark:hover:border-violet-500/40 dark:hover:bg-violet-500/10 dark:hover:text-violet-300";

export const BTN_DESTRUCTIVE =
  "inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-b from-red-500 to-red-600 px-4 text-sm font-semibold text-white shadow-[0_1px_2px_rgba(0,0,0,0.1),0_4px_12px_rgba(239,68,68,0.3)] transition-all hover:from-red-400 hover:to-red-500 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-red-500/30 disabled:cursor-not-allowed disabled:opacity-60 active:scale-[0.98]";

export const FILE_INPUT =
  "block w-full text-sm text-zinc-600 file:mr-4 file:rounded-xl file:border-0 file:bg-gradient-to-b file:from-violet-600 file:to-violet-700 file:px-4 file:py-2.5 file:text-sm file:font-semibold file:text-white file:shadow-sm hover:file:from-violet-500 hover:file:to-violet-600 disabled:cursor-not-allowed disabled:opacity-60 dark:text-zinc-400";

export const TABLE_WRAPPER = "overflow-x-auto";

export const TABLE_BASE = "w-full min-w-[720px] text-left text-sm";

export const TABLE_HEAD =
  "sticky top-0 z-10 border-b border-zinc-200/80 bg-zinc-50/95 text-[11px] font-semibold tracking-wider text-zinc-400 uppercase backdrop-blur-md dark:border-zinc-800/80 dark:bg-zinc-900/95 dark:text-zinc-500";

export const TABLE_HEAD_CELL = "px-5 py-4 font-semibold first:pl-6 last:pr-6 sm:px-6";

export const TABLE_BODY = "divide-y divide-zinc-100/80 dark:divide-zinc-800/60";

export const TABLE_ROW =
  "transition-colors duration-150 even:bg-zinc-50/50 hover:bg-violet-50/40 dark:even:bg-zinc-900/30 dark:hover:bg-violet-500/5";

export const TABLE_CELL = "px-5 py-4 first:pl-6 last:pr-6 sm:px-6";

export const PAGINATION_BAR =
  "flex flex-col items-center justify-between gap-4 border-t border-zinc-200/60 bg-gradient-to-b from-zinc-50/80 to-white/80 px-5 py-5 sm:flex-row sm:px-6 dark:border-zinc-800/60 dark:from-zinc-900/50 dark:to-zinc-900/80";

export const PAGINATION_BTN =
  "inline-flex h-10 items-center justify-center rounded-xl border border-zinc-200/80 bg-white px-4 text-sm font-semibold text-zinc-700 shadow-sm transition-all hover:border-violet-300 hover:bg-violet-50/50 hover:text-violet-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-violet-500/10 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:border-violet-500/40 dark:hover:bg-violet-500/10";

export const PAGINATION_BTN_DISABLED =
  "inline-flex h-10 cursor-not-allowed items-center justify-center rounded-xl border border-zinc-200/40 px-4 text-sm font-medium text-zinc-300 dark:border-zinc-800 dark:text-zinc-700";

export const ALERT_SUCCESS =
  "rounded-xl border border-emerald-200/80 bg-emerald-50/90 px-4 py-3 text-sm font-medium text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-300";

export const ALERT_ERROR =
  "rounded-xl border border-red-200/80 bg-red-50/90 px-4 py-3 text-sm font-medium text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300";

export const ALERT_WARNING =
  "rounded-xl border border-amber-200/80 bg-amber-50/90 px-4 py-3 text-sm font-medium text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-200";

export const DASHBOARD_SECTION = "space-y-10";

export const CHART_CARD = `${SURFACE_CARD} p-6 sm:p-8 min-h-[320px]`;

export const DETAIL_SECTION = `${SURFACE_CARD} p-6 sm:p-8`;

export const PAGE_LINK_BACK =
  "inline-flex items-center gap-1.5 rounded-lg text-sm font-medium text-zinc-500 transition-colors hover:text-violet-600 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-violet-500/10 dark:text-zinc-400 dark:hover:text-violet-400";

export const DASHBOARD_CARD = `${SURFACE_CARD} overflow-hidden`;

export const CARD_HEADER =
  "flex items-center justify-between border-b border-zinc-200/60 bg-gradient-to-r from-zinc-50/80 to-transparent px-6 py-5 dark:border-zinc-800/60 dark:from-zinc-900/50";

export const CARD_HEADER_LINK =
  "rounded-lg px-2.5 py-1 text-xs font-semibold text-violet-600 transition-all hover:bg-violet-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-violet-500/10 dark:text-violet-400 dark:hover:bg-violet-500/10";

export const INSIGHT_TILE =
  "rounded-xl border border-zinc-200/60 bg-gradient-to-br from-zinc-50/80 to-white p-5 shadow-sm dark:border-zinc-800/60 dark:from-zinc-900/80 dark:to-zinc-900/40";

export const BTN_DANGER =
  "inline-flex h-11 w-full items-center justify-center rounded-xl border border-red-200/80 bg-red-50/50 px-4 text-sm font-semibold text-red-700 transition-all hover:border-red-300 hover:bg-red-100/80 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-red-500/20 disabled:cursor-not-allowed disabled:opacity-60 dark:border-red-900/50 dark:bg-red-950/20 dark:text-red-400 dark:hover:bg-red-950/40";

export const BTN_ACCENT =
  "inline-flex h-11 w-full items-center justify-center rounded-xl bg-gradient-to-b from-indigo-500 to-indigo-600 px-4 text-sm font-semibold text-white shadow-[0_4px_12px_rgba(99,102,241,0.35)] transition-all hover:from-indigo-400 hover:to-indigo-500 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-indigo-500/30 disabled:cursor-not-allowed disabled:opacity-60 active:scale-[0.98]";

export const ICON_BADGE =
  "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-violet-700 text-white shadow-[0_4px_12px_rgba(124,58,237,0.35)]";

export const KPI_HERO_CARD = `${SURFACE_CARD} relative overflow-hidden p-6 sm:p-8`;

export const KPI_ICON_GRADIENTS = [
  "from-violet-500 to-purple-600 shadow-violet-500/30",
  "from-blue-500 to-cyan-600 shadow-blue-500/30",
  "from-emerald-500 to-teal-600 shadow-emerald-500/30",
  "from-amber-500 to-orange-600 shadow-amber-500/30",
  "from-rose-500 to-pink-600 shadow-rose-500/30",
  "from-indigo-500 to-violet-600 shadow-indigo-500/30",
] as const;

export const TREND_UP =
  "inline-flex items-center gap-0.5 rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-bold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400";

export const TREND_DOWN =
  "inline-flex items-center gap-0.5 rounded-full bg-red-100 px-2 py-0.5 text-[11px] font-bold text-red-700 dark:bg-red-950/60 dark:text-red-400";

export const HR_SHELL_BG =
  "min-h-screen bg-[#f8f9fc] dark:bg-[#0c0c0f]";

export const HR_MAIN_BG =
  "relative flex-1 bg-[#f8f9fc] dark:bg-[#0c0c0f] before:pointer-events-none before:absolute before:inset-0 before:bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(124,58,237,0.08),transparent)] dark:before:bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(124,58,237,0.12),transparent)]";

export const CANDIDATE_SHELL_BG = HR_SHELL_BG;

export const CANDIDATE_MAIN_BG = HR_MAIN_BG;

export const FLOATING_INPUT =
  "peer h-12 w-full rounded-xl border border-zinc-200/80 bg-white/90 px-4 pt-5 pb-1 text-sm text-zinc-900 shadow-sm outline-none transition-all placeholder:text-transparent focus-visible:border-violet-400 focus-visible:ring-4 focus-visible:ring-violet-500/10 disabled:cursor-not-allowed disabled:opacity-60 dark:border-zinc-700/80 dark:bg-zinc-900/90 dark:text-zinc-100 dark:focus-visible:border-violet-500 dark:focus-visible:ring-violet-500/20";

export const FLOATING_LABEL =
  "pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-sm text-zinc-400 transition-all peer-focus:top-3 peer-focus:translate-y-0 peer-focus:text-[11px] peer-focus:font-semibold peer-focus:text-violet-500 peer-[:not(:placeholder-shown)]:top-3 peer-[:not(:placeholder-shown)]:translate-y-0 peer-[:not(:placeholder-shown)]:text-[11px] peer-[:not(:placeholder-shown)]:font-semibold dark:text-zinc-500 dark:peer-focus:text-violet-400";
