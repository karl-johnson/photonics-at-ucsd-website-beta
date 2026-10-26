// Shared by scripts/media.mjs (the converter) and src/integrations/asset-check.mjs (the build
// warning): find source video clips and tell whether each converted clip is up to date.
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join, relative } from 'node:path';

const SOURCE = /\.source\.(mp4|mov|m4v|webm|mkv|avi|gif)$/i;

/** Every `<name>.source.<video>` under src/content/, with the files it converts to. */
export function findClips(root) {
  const found = [];
  const walk = (dir) => {
    if (!existsSync(dir)) return;
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const path = join(dir, entry.name);
      if (entry.isDirectory()) walk(path);
      else if (SOURCE.test(entry.name)) {
        const base = path.replace(SOURCE, '');
        found.push({ root, source: path, output: `${base}.mp4`, poster: `${base}.poster.jpg` });
      }
    }
  };
  walk(join(root, 'src', 'content'));
  return found.sort((a, b) => a.source.localeCompare(b.source));
}

/** Fingerprint of a source clip's bytes. */
export function fingerprint(buffer) {
  return createHash('sha256').update(buffer).digest('hex').slice(0, 16);
}

/** { state: 'ok' | 'missing' | 'stale', message } for one clip. */
export function clipStatus({ root, source, output, poster }) {
  const name = relative(root, source).replaceAll('\\', '/');
  if (!existsSync(output) || !existsSync(poster)) {
    return { state: 'missing', message: `${name} has not been converted yet. Run: npm run media` };
  }
  // The fingerprint is stored as the MP4's "comment" metadata, which is plain text in the file.
  const stamped = readFileSync(output).toString('latin1').match(/source:([0-9a-f]{16})/)?.[1];
  if (stamped !== fingerprint(readFileSync(source))) {
    return { state: 'stale', message: `${name} has changed since it was converted. Run: npm run media` };
  }
  return { state: 'ok', message: `${name} is up to date` };
}
