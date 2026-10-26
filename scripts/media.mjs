#!/usr/bin/env node
// Convert source video clips into small, web-ready looping videos.   Run: npm run media
//
// Every `<name>.source.<ext>` (mp4, mov, m4v, webm, mkv, avi or gif) under src/content/ becomes, in
// the same folder:
//   <name>.mp4         H.264 video, no audio, at most 960 px wide and 30 fps, ready to stream
//   <name>.poster.jpg  its first frame, shown until the video plays (and instead of it for people
//                      who have turned on "reduce motion")
// List the clip in a demo's `photos:` as `{ video: ./<name>.mp4, alt: … }`.
//
// Each output records a fingerprint of its source (in the MP4's metadata). The site's build
// (src/integrations/asset-check.mjs) compares it and warns if a source has changed since.
//
// Options:  --force   convert every clip, even unchanged ones
//           --check   only report which clips are out of date
// ffmpeg comes from the @ffmpeg-installer/ffmpeg dev dependency (installed by `npm install`); an
// ffmpeg on the PATH, or the FFMPEG environment variable, is used instead if present.

import { execFileSync, spawnSync } from 'node:child_process';
import { readFileSync, statSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join, relative, basename } from 'node:path';
import { clipStatus, findClips, fingerprint } from './media-status.mjs';

const MAX_WIDTH = 960; // 2× the largest place a clip is shown (photo slot / front page preview)
const MAX_FPS = 30;
const QUALITY = 23; // x264 CRF: lower = better quality and bigger files (18–28 is sensible)
const LONG_CLIP_SECONDS = 15;
const BIG_SOURCE_MB = 50;

const root = join(import.meta.dirname, '..');
const args = new Set(process.argv.slice(2));

if (args.has('--check')) {
  const stale = findClips(root).filter((c) => clipStatus(c).state !== 'ok');
  for (const c of stale) console.log(clipStatus(c).message);
  console.log(stale.length ? `\n${stale.length} clip(s) need converting: npm run media` : 'All clips are up to date.');
  process.exit(0);
}

const ffmpeg = findFfmpeg();
if (!ffmpeg) {
  console.error('Could not find ffmpeg. Run `npm install` (it provides one), or install ffmpeg and put it on the PATH.');
  process.exit(1);
}

const clips = findClips(root);
if (!clips.length) console.log('No *.source.<video> clips found under src/content/.');
let converted = 0;
for (const clip of clips) {
  const name = relative(root, clip.source);
  if (clipStatus(clip).state === 'ok' && !args.has('--force')) {
    console.log(`  up to date  ${name}`);
    continue;
  }
  convert(clip);
  converted++;
}
console.log(`\n${converted} converted, ${clips.length - converted} already up to date.`);

// ───────────────────────────────────────────────────────────────────────────────────────────────

function convert({ source, output, poster }) {
  const name = relative(root, source);
  const info = probe(source);
  const stamp = fingerprint(readFileSync(source));

  // 1. The video: no audio, scaled down (never up), capped frame rate, streamable (+faststart).
  const filters = [`scale='min(${MAX_WIDTH},iw)':-2:flags=lanczos`, 'format=yuv420p'];
  if (info.fps > MAX_FPS + 0.5) filters.unshift(`fps=${MAX_FPS}`);
  run([
    '-i', source,
    '-an',
    '-vf', filters.join(','),
    '-c:v', 'libx264', '-preset', 'slow', '-crf', String(QUALITY), '-profile:v', 'high',
    '-movflags', '+faststart',
    '-map_metadata', '-1',
    '-metadata', `comment=source:${stamp}`,
    output,
  ]);

  // 2. The poster: the first frame of the converted video.
  run(['-i', output, '-frames:v', '1', '-q:v', '3', poster]);

  const mb = (bytes) => `${(bytes / 1048576).toFixed(1)} MB`;
  console.log(
    `  converted   ${name} → ${basename(output)} + ${basename(poster)}  ` +
      `(${mb(statSync(source).size)} → ${mb(statSync(output).size)}, ${info.duration.toFixed(1)} s)`,
  );
  if (info.duration > LONG_CLIP_SECONDS) {
    console.warn(`  NOTE: ${basename(source)} is ${Math.round(info.duration)} s long; loops work best under ~${LONG_CLIP_SECONDS} s.`);
  }
  if (statSync(source).size > BIG_SOURCE_MB * 1048576) {
    console.warn(
      `  NOTE: ${basename(source)} is over ${BIG_SOURCE_MB} MB. Git keeps every version of it forever; ` +
        'consider trimming it first (GitHub rejects files over 100 MB).',
    );
  }
}

/** Duration and frame rate, read from ffmpeg's description of the file. */
function probe(file) {
  const { stderr } = spawnSync(ffmpeg, ['-hide_banner', '-i', file], { encoding: 'utf8' });
  const d = stderr.match(/Duration: (\d+):(\d+):([\d.]+)/);
  const fps = parseFloat(stderr.match(/Video:.*?([\d.]+) fps/)?.[1] ?? '30');
  const duration = d ? +d[1] * 3600 + +d[2] * 60 + parseFloat(d[3]) : 0;
  return { duration, fps };
}

function run(ffArgs) {
  const result = spawnSync(ffmpeg, ['-y', '-hide_banner', '-loglevel', 'error', ...ffArgs], { encoding: 'utf8' });
  if (result.status !== 0) throw new Error(`ffmpeg failed:\n${result.stderr}`);
}

function findFfmpeg() {
  const candidates = [process.env.FFMPEG, 'ffmpeg'];
  try {
    candidates.push(createRequire(import.meta.url)('@ffmpeg-installer/ffmpeg').path);
  } catch {
    // dev dependency not installed
  }
  for (const c of candidates.filter(Boolean)) {
    try {
      execFileSync(c, ['-version'], { stdio: 'ignore' });
      return c;
    } catch {
      // not here; try the next one
    }
  }
  return null;
}
