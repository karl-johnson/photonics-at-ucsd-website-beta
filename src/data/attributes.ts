// The 8 attributes every demo is scored on. Order here = order everywhere on the site.

export type Range = { lo: number; hi: number };

export type AttributeKey =
  | 'budget'
  | 'tools'
  | 'assembly'
  | 'portability'
  | 'setupTime'
  | 'demoComplexity'
  | 'conceptComplexity'
  | 'wow';

export interface Attribute {
  key: AttributeKey;
  /** Scores table, preview panel, axis dropdowns */
  label: string;
  /** Column header in the "All demos" list */
  short: string;
  /** Tooltip / full name */
  full: string;
}

export const ATTRIBUTES: Attribute[] = [
  { key: 'budget', label: 'Budget', short: 'Budget', full: 'Budget' },
  { key: 'tools', label: 'Required tools', short: 'Tools', full: 'Required tools' },
  { key: 'assembly', label: 'Assembly complexity', short: 'Assembly', full: 'Assembly complexity' },
  { key: 'portability', label: 'Portability', short: 'Portability', full: 'Portability' },
  { key: 'setupTime', label: 'Setup time', short: 'Setup time', full: 'Setup time' },
  { key: 'demoComplexity', label: 'Demo complexity', short: 'Demo complexity', full: 'Complexity of demonstration' },
  { key: 'conceptComplexity', label: 'Concept complexity', short: 'Concept complexity', full: 'Complexity of underlying concepts' },
  { key: 'wow', label: 'WOW factor', short: 'WOW factor', full: 'WOW factor' },
];

export const SCORE_KEYS = ATTRIBUTES.filter((a) => a.key !== 'budget').map((a) => a.key) as Exclude<
  AttributeKey,
  'budget'
>[];

export function formatScore(r: Range): string {
  return r.lo === r.hi ? String(r.lo) : `${r.lo}–${r.hi}`;
}

/** `$250–$1000` (long) or `$250–1000` (compact, for the list) */
export function formatBudget(r: Range, compact = false): string {
  if (r.lo === r.hi) return `$${r.lo}`;
  return compact ? `$${r.lo}–${r.hi}` : `$${r.lo}–$${r.hi}`;
}

export type SegmentState = 'on' | 'range' | 'off';

/** 10-segment range meter: 1..lo dark, lo+1..hi grey, rest empty */
export function segments(r: Range): SegmentState[] {
  return Array.from({ length: 10 }, (_, i) => (i + 1 <= r.lo ? 'on' : i + 1 <= r.hi ? 'range' : 'off'));
}
