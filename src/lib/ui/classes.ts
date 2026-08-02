/** Shared Tailwind class strings — presentation only, no business logic.
 *  Dark premium glass language (ReactBits-inspired) for the whole product.
 */

export {
  TEXT_HEADING,
  TEXT_SECTION,
  TEXT_BODY,
  TEXT_LABEL,
  TEXT_PLACEHOLDER,
  TEXT_DISABLED,
  TEXT_FIELD_LABEL,
  TEXT_META,
} from "@/lib/ui/text";

export const PAGE_STACK = "space-y-8 sm:space-y-10";

export const PAGE_TITLE =
  "text-3xl font-semibold tracking-tight text-white sm:text-4xl";

export const PAGE_DESCRIPTION =
  "mt-2 max-w-2xl text-base leading-relaxed text-zinc-400";

export const SURFACE_CARD =
  "rounded-2xl border border-white/10 bg-white/[0.04] shadow-[0_8px_40px_rgba(0,0,0,0.35)] backdrop-blur-xl";

export const SURFACE_CARD_INTERACTIVE =
  "rounded-2xl border border-white/10 bg-white/[0.04] shadow-[0_8px_40px_rgba(0,0,0,0.35)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-violet-400/35 hover:bg-white/[0.08] hover:shadow-[0_16px_56px_rgba(124,58,237,0.22)]";

export const FILTER_PANEL = `${SURFACE_CARD} p-5 sm:p-6`;

export const FILTER_LABEL =
  "text-[11px] font-semibold tracking-wider text-zinc-400 uppercase";

export const FIELD_INPUT =
  "h-11 w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 text-sm text-white shadow-sm placeholder:text-zinc-500 outline-none transition-all duration-200 hover:border-white/20 focus-visible:border-violet-400/60 focus-visible:bg-white/[0.06] focus-visible:ring-4 focus-visible:ring-violet-500/20 disabled:cursor-not-allowed disabled:opacity-60";

export const SELECT_INPUT = `${FIELD_INPUT} bg-[#0c0c14] [color-scheme:dark]`;

export const BTN_PRIMARY =
  "inline-flex h-11 items-center justify-center gap-2 rounded-full bg-white px-5 text-sm font-semibold text-zinc-950 shadow-[0_0_0_1px_rgba(255,255,255,0.1),0_8px_32px_rgba(255,255,255,0.16)] transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_0_0_1px_rgba(255,255,255,0.2),0_12px_40px_rgba(167,139,250,0.35)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-violet-500/30 disabled:cursor-not-allowed disabled:opacity-60 active:scale-[0.98]";

export const BTN_SECONDARY =
  "inline-flex h-11 items-center justify-center gap-2 rounded-full border border-white/15 bg-white/[0.04] px-4 text-sm font-semibold text-zinc-100 backdrop-blur-md transition-all duration-300 hover:border-white/30 hover:bg-white/[0.08] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/10 disabled:cursor-not-allowed disabled:opacity-60 active:scale-[0.98]";

export const BTN_OUTLINE =
  "inline-flex h-11 items-center justify-center gap-2 rounded-full border border-white/15 bg-transparent px-4 text-sm font-semibold text-zinc-200 transition-all hover:border-violet-400/40 hover:bg-violet-500/10 hover:text-violet-200 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-violet-500/15 disabled:cursor-not-allowed disabled:opacity-60";

export const BTN_DESTRUCTIVE =
  "inline-flex h-11 items-center justify-center gap-2 rounded-full bg-gradient-to-b from-red-500 to-red-600 px-4 text-sm font-semibold text-white shadow-[0_1px_2px_rgba(0,0,0,0.1),0_4px_12px_rgba(239,68,68,0.3)] transition-all hover:from-red-400 hover:to-red-500 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-red-500/30 disabled:cursor-not-allowed disabled:opacity-60 active:scale-[0.98]";

export const FILE_INPUT =
  "block w-full text-sm text-zinc-400 file:mr-4 file:rounded-full file:border-0 file:bg-white file:px-4 file:py-2.5 file:text-sm file:font-semibold file:text-zinc-950 file:shadow-sm hover:file:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-60";

export const TABLE_WRAPPER = "overflow-x-auto";

export const TABLE_BASE = "w-full min-w-[720px] text-left text-sm";

export const TABLE_HEAD =
  "sticky top-0 z-10 border-b border-white/10 bg-[#0a0a12]/90 text-[11px] font-semibold tracking-wider text-zinc-500 uppercase backdrop-blur-md";

export const TABLE_HEAD_CELL = "px-5 py-4 font-semibold first:pl-6 last:pr-6 sm:px-6";

export const TABLE_BODY = "divide-y divide-white/[0.06]";

export const TABLE_ROW =
  "transition-colors duration-200 even:bg-white/[0.02] hover:bg-violet-500/[0.08]";

export const TABLE_CELL = "px-5 py-4 text-zinc-300 first:pl-6 last:pr-6 sm:px-6";

export const PAGINATION_BAR =
  "flex flex-col items-center justify-between gap-4 border-t border-white/10 bg-white/[0.02] px-5 py-5 sm:flex-row sm:px-6";

export const PAGINATION_BTN =
  "inline-flex h-10 items-center justify-center rounded-full border border-white/15 bg-white/[0.04] px-4 text-sm font-semibold text-zinc-200 transition-all hover:border-violet-400/40 hover:bg-violet-500/10 hover:text-violet-200 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-violet-500/15";

export const PAGINATION_BTN_DISABLED =
  "inline-flex h-10 cursor-not-allowed items-center justify-center rounded-full border border-white/10 px-4 text-sm font-medium text-zinc-200";

export const ALERT_SUCCESS =
  "rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-sm font-medium text-emerald-300";

export const ALERT_ERROR =
  "rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm font-medium text-red-300";

export const ALERT_WARNING =
  "rounded-xl border border-amber-400/30 bg-amber-500/10 px-4 py-3 text-sm font-medium text-amber-200";

export const DASHBOARD_SECTION = "space-y-10";

export const CHART_CARD = `${SURFACE_CARD} p-6 sm:p-8 min-h-[320px]`;

export const DETAIL_SECTION = `${SURFACE_CARD} p-6 sm:p-8`;

export const PAGE_LINK_BACK =
  "inline-flex items-center gap-1.5 rounded-lg text-sm font-medium text-zinc-400 transition-colors hover:text-violet-300 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-violet-500/15";

export const DASHBOARD_CARD = `${SURFACE_CARD} overflow-hidden`;

export const CARD_HEADER =
  "flex items-center justify-between border-b border-white/10 bg-white/[0.03] px-6 py-5";

export const CARD_HEADER_LINK =
  "rounded-lg px-2.5 py-1 text-xs font-semibold text-violet-300 transition-all hover:bg-violet-500/10 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-violet-500/15";

export const INSIGHT_TILE =
  "rounded-xl border border-white/10 bg-gradient-to-br from-white/[0.06] to-white/[0.02] p-5 shadow-[0_8px_32px_rgba(0,0,0,0.25)]";

export const BTN_DANGER =
  "inline-flex h-11 w-full items-center justify-center rounded-full border border-red-400/30 bg-red-500/10 px-4 text-sm font-semibold text-red-300 transition-all hover:border-red-400/50 hover:bg-red-500/20 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-red-500/20 disabled:cursor-not-allowed disabled:opacity-60";

export const BTN_ACCENT =
  "inline-flex h-11 w-full items-center justify-center rounded-full bg-gradient-to-b from-indigo-500 to-violet-600 px-4 text-sm font-semibold text-white shadow-[0_4px_12px_rgba(99,102,241,0.35)] transition-all hover:from-indigo-400 hover:to-violet-500 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-indigo-500/30 disabled:cursor-not-allowed disabled:opacity-60 active:scale-[0.98]";

export const ICON_BADGE =
  "flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 text-white shadow-[0_0_28px_rgba(139,92,246,0.4)]";

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
  "inline-flex items-center gap-0.5 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[11px] font-bold text-emerald-300";

export const TREND_DOWN =
  "inline-flex items-center gap-0.5 rounded-full bg-red-500/15 px-2 py-0.5 text-[11px] font-bold text-red-300";

/** Shells are transparent so PremiumShell atmosphere shows through. */
export const HR_SHELL_BG = "relative min-h-screen bg-transparent text-zinc-100";

export const HR_MAIN_BG = "relative flex-1 bg-transparent";

export const CANDIDATE_SHELL_BG = HR_SHELL_BG;

export const CANDIDATE_MAIN_BG = HR_MAIN_BG;

export const FLOATING_INPUT =
  "peer h-12 w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 pt-5 pb-1 text-sm text-white outline-none transition-all placeholder:text-transparent focus-visible:border-violet-400/60 focus-visible:ring-4 focus-visible:ring-violet-500/20 disabled:cursor-not-allowed disabled:opacity-60";

export const FLOATING_LABEL =
  "pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-sm text-zinc-500 transition-all peer-focus:top-3 peer-focus:translate-y-0 peer-focus:text-[11px] peer-focus:font-semibold peer-focus:text-violet-300 peer-[:not(:placeholder-shown)]:top-3 peer-[:not(:placeholder-shown)]:translate-y-0 peer-[:not(:placeholder-shown)]:text-[11px] peer-[:not(:placeholder-shown)]:font-semibold";
