#!/usr/bin/env node
// Convert diagram masters (editable Inkscape SVGs) into web-ready SVGs.   Run: npm run diagrams
//
// Every `<name>.source.svg` under src/content/ becomes `<name>.svg` in the same folder, e.g.
//   src/content/demos/fiber-modes/diagram.source.svg → src/content/demos/fiber-modes/diagram.svg
//
// Inkscape does all the work, so the result looks exactly like the master:
//   - objects lying completely outside the page are deleted
//   - text is converted to paths (no fonts needed to display it)
//   - unused definitions are removed and the file is saved as plain SVG
// Each output starts with a comment holding a fingerprint of its master. The site's build
// (src/integrations/diagram-check.mjs) compares it and warns if a master has changed since.
//
// Options:  --force   convert every master, even unchanged ones
//           --check   only report which diagrams are out of date (no Inkscape needed)
// Inkscape is found on the PATH, in the usual install folders, or via the INKSCAPE env variable.

import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, relative, basename } from 'node:path';
import { diagramStatus, findMasters, stampFor } from './diagram-status.mjs';

const root = join(import.meta.dirname, '..');
const args = new Set(process.argv.slice(2));

if (args.has('--check')) {
  const stale = findMasters(root).filter((m) => diagramStatus(m).state !== 'ok');
  for (const m of stale) console.log(`${diagramStatus(m).message}`);
  console.log(stale.length ? `\n${stale.length} diagram(s) need converting: npm run diagrams` : 'All diagrams are up to date.');
  process.exit(0);
}

const inkscape = findInkscape();
if (!inkscape) {
  console.error(
    'Could not find Inkscape. Install it from https://inkscape.org, or set the INKSCAPE environment\n' +
      'variable to the full path of the inkscape executable (inkscape.com on Windows).',
  );
  process.exit(1);
}

const masters = findMasters(root);
if (!masters.length) console.log('No *.source.svg masters found under src/content/.');
let converted = 0;
for (const master of masters) {
  const status = diagramStatus(master);
  const name = relative(root, master.source);
  if (status.state === 'ok' && !args.has('--force')) {
    console.log(`  up to date  ${name}`);
    continue;
  }
  convert(master);
  converted++;
}
console.log(`\n${converted} converted, ${masters.length - converted} already up to date.`);

// ───────────────────────────────────────────────────────────────────────────────────────────────

function convert({ source, output }) {
  const name = relative(root, source);
  const svg = readFileSync(source, 'utf8');
  const page = pageSizePx(svg);

  // 1. Find top-level objects (inside layers) that lie entirely outside the page.
  const boxes = new Map(
    run(['--query-all', source])
      .split(/\r?\n/)
      .map((line) => line.split(','))
      .filter((f) => f.length === 5)
      .map(([id, x, y, w, h]) => [id, { x: +x, y: +y, w: +w, h: +h }]),
  );
  const topLevel = run(['--actions=select-all:no-layers;select-list', source])
    .split(/\r?\n/)
    .map((line) => line.split(' ')[0])
    .filter(Boolean);
  const eps = 0.01;
  const empty = [];
  const offPage = topLevel.filter((id) => {
    const b = boxes.get(id);
    if (!b || [b.x, b.y, b.w, b.h].some(Number.isNaN)) {
      empty.push(id); // nothing to draw (e.g. an empty text box): harmless, but no reason to keep it
      return true;
    }
    return b.x >= page.w - eps || b.y >= page.h - eps || b.x + b.w <= eps || b.y + b.h <= eps;
  });
  const outside = offPage.filter((id) => !empty.includes(id));

  // 2. Delete them, convert text to paths, export plain SVG of the page.
  const tmp = mkdtempSync(join(tmpdir(), 'diagram-'));
  const tmpOut = join(tmp, 'out.svg');
  const actions = [
    ...(offPage.length ? [`select-by-id:${offPage.join(',')}`, 'delete-selection', 'select-clear'] : []),
    'export-area-page',
    'export-plain-svg',
    'export-text-to-path',
    'export-type:svg',
    'export-overwrite',
    `export-filename:${tmpOut}`,
    'export-do',
  ];
  run(['--vacuum-defs', `--actions=${actions.join(';')}`, source]);
  if (!existsSync(tmpOut)) throw new Error(`Inkscape produced no output for ${name}`);
  let result = readFileSync(tmpOut, 'utf8');
  rmSync(tmp, { recursive: true, force: true });

  // 3. Stamp it with the master's fingerprint (a comment right after the XML declaration).
  const stamp = stampFor(svg, basename(source));
  result = result.replace(/^(<\?xml[^>]*\?>\s*)?/, (decl) => `${decl}${stamp}\n`);
  writeFileSync(output, result);

  const leftoverText = (result.match(/<text\b/g) ?? []).length;
  const kb = (n) => `${Math.round(n / 1024)} KB`;
  console.log(`  converted   ${name} → ${basename(output)}  (${kb(svg.length)} → ${kb(result.length)})`);
  if (outside.length) console.log(`              removed off-page: ${outside.join(', ')}`);
  if (empty.length) console.log(`              removed empty: ${empty.join(', ')}`);
  if (leftoverText) console.warn(`  WARNING: ${leftoverText} text element(s) remain in ${basename(output)}`);
}

/** Page size in CSS px (what --query-all reports), from the root <svg> width/height. */
function pageSizePx(svg) {
  const rootTag = svg.match(/<svg\b[^>]*>/)?.[0] ?? '';
  const toPx = (attr) => {
    const m = rootTag.match(new RegExp(`\\s${attr}="([\\d.]+)\\s*(mm|cm|in|pt|pc|px)?"`));
    if (!m) throw new Error(`master has no ${attr} attribute on its <svg>`);
    const per = { mm: 96 / 25.4, cm: 96 / 2.54, in: 96, pt: 96 / 72, pc: 16, px: 1 };
    return parseFloat(m[1]) * per[m[2] ?? 'px'];
  };
  return { w: toPx('width'), h: toPx('height') };
}

function run(cliArgs) {
  return execFileSync(inkscape, cliArgs, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], maxBuffer: 64 * 1024 * 1024 });
}

function findInkscape() {
  const candidates = [
    process.env.INKSCAPE,
    'inkscape',
    'C:\\Program Files\\Inkscape\\bin\\inkscape.com',
    'C:\\Program Files (x86)\\Inkscape\\bin\\inkscape.com',
    '/Applications/Inkscape.app/Contents/MacOS/inkscape',
  ].filter(Boolean);
  for (const c of candidates) {
    try {
      execFileSync(c, ['--version'], { stdio: 'ignore' });
      return c;
    } catch {
      // not here; try the next one
    }
  }
  return null;
}
