// Loads the scoring parameters from rubric.yaml (the single source of truth) and checks them.
// Server/build-time only: client scripts receive the parameter list as JSON from the page.
import raw from './rubric.yaml?raw';
import { parse } from 'yaml';
import type { Unit } from '../lib/scores';

export interface Parameter {
  key: string;
  name: string;
  short: string;
  unit: Unit;
  description: string;
  /** score → description; scores without a description are absent */
  levels: Record<number, string>;
}

/** The subset of a parameter that client scripts need */
export type ParameterInfo = Pick<Parameter, 'key' | 'name' | 'short' | 'unit'>;

function load(text: string): Parameter[] {
  const fail = (msg: string): never => {
    throw new Error(`src/data/rubric.yaml: ${msg}`);
  };
  const doc = parse(text) as { parameters?: unknown };
  if (!Array.isArray(doc?.parameters) || doc.parameters.length === 0) fail('needs a non-empty `parameters:` list');

  const seen = new Set<string>();
  return (doc.parameters as Record<string, unknown>[]).map((p, i) => {
    const where = `parameter ${i + 1}${typeof p?.key === 'string' ? ` (${p.key})` : ''}`;
    if (typeof p.key !== 'string' || !/^[A-Za-z][A-Za-z0-9]*$/.test(p.key)) {
      fail(`${where}: \`key\` must be letters/digits starting with a letter, e.g. setupTime`);
    }
    const key = p.key as string;
    if (seen.has(key)) fail(`${where}: duplicate key "${key}"`);
    seen.add(key);
    if (typeof p.name !== 'string' || !p.name) fail(`${where}: missing \`name\``);
    const unit = (p.unit ?? 'score') as Unit;
    if (unit !== 'score' && unit !== 'usd') fail(`${where}: \`unit\` must be score or usd`);

    const levels: Record<number, string> = {};
    for (const [k, v] of Object.entries((p.levels as Record<string, unknown>) ?? {})) {
      const n = Number(k);
      if (!Number.isInteger(n) || n < 0 || n > 10) fail(`${where}: level "${k}" must be a whole number 0–10`);
      if (typeof v !== 'string') fail(`${where}: level ${k} must be text`);
      levels[n] = (v as string).trim();
    }

    return {
      key,
      name: p.name as string,
      short: typeof p.short === 'string' ? p.short : (p.name as string),
      unit,
      description: typeof p.description === 'string' ? p.description.trim() : '',
      levels,
    };
  });
}

export const PARAMETERS: Parameter[] = load(raw);

export const PARAMETER_INFO: ParameterInfo[] = PARAMETERS.map(({ key, name, short, unit }) => ({
  key,
  name,
  short,
  unit,
}));

export function getParameter(key: string): Parameter | undefined {
  return PARAMETERS.find((p) => p.key === key);
}
