// Shared by scripts/diagrams.mjs (the converter) and src/integrations/diagram-check.mjs (the build
// warning): find diagram masters and tell whether each converted diagram is up to date.
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join, relative } from 'node:path';

const SOURCE_SUFFIX = '.source.svg';

/** Every `<name>.source.svg` under src/content/, with the `<name>.svg` it converts to. */
export function findMasters(root) {
  const found = [];
  const walk = (dir) => {
    if (!existsSync(dir)) return;
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const path = join(dir, entry.name);
      if (entry.isDirectory()) walk(path);
      else if (entry.name.endsWith(SOURCE_SUFFIX)) {
        found.push({ root, source: path, output: path.slice(0, -SOURCE_SUFFIX.length) + '.svg' });
      }
    }
  };
  walk(join(root, 'src', 'content'));
  return found.sort((a, b) => a.source.localeCompare(b.source));
}

/** Fingerprint of a master. Line endings are ignored, since git may change them per machine. */
export function fingerprint(text) {
  return createHash('sha256').update(text.replace(/\r\n/g, '\n')).digest('hex').slice(0, 16);
}

/** The comment written at the top of each converted diagram. */
export function stampFor(sourceText, sourceName) {
  return `<!-- Generated from ${sourceName} by "npm run diagrams". Edit that file, not this one. source:${fingerprint(sourceText)} -->`;
}

/** { state: 'ok' | 'missing' | 'stale', message } for one master. */
export function diagramStatus({ root, source, output }) {
  const name = relative(root, source).replaceAll('\\', '/');
  if (!existsSync(output)) {
    return { state: 'missing', message: `${name} has not been converted yet. Run: npm run diagrams` };
  }
  const stamped = readFileSync(output, 'utf8').match(/source:([0-9a-f]{16})/)?.[1];
  if (stamped !== fingerprint(readFileSync(source, 'utf8'))) {
    return { state: 'stale', message: `${name} has changed since it was converted. Run: npm run diagrams` };
  }
  return { state: 'ok', message: `${name} is up to date` };
}
