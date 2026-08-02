/**
 * Semantic text colors for the dark premium UI.
 * Use these tokens instead of hardcoded zinc/gray shades.
 *
 * Hierarchy (WCAG AA on #06060a / glass surfaces):
 * - heading   → white      (page titles)
 * - section   → zinc-100   (card / section titles)
 * - body      → zinc-200   (paragraphs, table cells)
 * - label     → zinc-400   (form labels, meta, captions)
 * - placeholder → zinc-500
 * - disabled  → zinc-600
 */

export const TEXT_HEADING = "text-white";
export const TEXT_SECTION = "text-zinc-100";
export const TEXT_BODY = "text-zinc-200";
export const TEXT_LABEL = "text-zinc-400";
export const TEXT_PLACEHOLDER = "placeholder:text-zinc-500";
export const TEXT_DISABLED = "text-zinc-600";

/** Common label styling for form fields */
export const TEXT_FIELD_LABEL = `block text-sm font-medium ${TEXT_LABEL}`;

/** Muted meta / timestamps */
export const TEXT_META = `text-sm ${TEXT_LABEL}`;
