// Display helpers for scores. Pure functions, safe to use in client scripts.

export type Range = { lo: number; hi: number };
export type Unit = 'score' | 'usd';

/** `7–9`, `5`, or for dollars `$250–$1000` (compact: `$250–1000`, for the list) */
export function formatValue(unit: Unit, r: Range, compact = false): string {
  if (unit === 'usd') {
    if (r.lo === r.hi) return `$${r.lo}`;
    return compact ? `$${r.lo}–${r.hi}` : `$${r.lo}–$${r.hi}`;
  }
  return r.lo === r.hi ? String(r.lo) : `${r.lo}–${r.hi}`;
}

export type SegmentState = 'on' | 'range' | 'off';

/** 10-segment range meter: 1..lo dark, lo+1..hi grey, rest empty */
export function segments(r: Range): SegmentState[] {
  return Array.from({ length: 10 }, (_, i) => (i + 1 <= r.lo ? 'on' : i + 1 <= r.hi ? 'range' : 'off'));
}
