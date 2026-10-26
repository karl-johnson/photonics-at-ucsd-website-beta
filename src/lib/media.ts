// Looping video clips listed in a page's `photos:` as `{ video: ./clip.mp4, alt }`.
// `npm run media` makes clip.mp4 and clip.poster.jpg from clip.source.<ext>; this finds both.
import type { ImageMetadata } from 'astro';

// URLs of every converted clip, and every poster as an image Astro can resize.
const videos = import.meta.glob<string>(['/src/content/**/*.mp4', '!/src/content/**/*.source.*'], {
  query: '?url',
  import: 'default',
  eager: true,
});
const posters = import.meta.glob<ImageMetadata>('/src/content/**/*.poster.jpg', { import: 'default', eager: true });

export interface Clip {
  src: string;
  poster: ImageMetadata;
}

/**
 * @param entryFile the page's file, e.g. `src/content/demos/schlieren/index.md`
 * @param relPath   the clip as written in `photos:`, e.g. `./video.mp4`
 */
export function resolveClip(entryFile: string, relPath: string): Clip {
  const folder = '/' + entryFile.replaceAll('\\', '/').replace(/\/[^/]+$/, '');
  const key = `${folder}/${relPath.replace(/^\.\//, '')}`;
  const src = videos[key];
  const poster = posters[key.replace(/\.mp4$/, '.poster.jpg')];
  if (!src || !poster) {
    throw new Error(
      `${entryFile}: ${relPath} ${src ? 'has no poster' : 'not found'}. Put the original clip in that ` +
        `folder as ${relPath.replace(/^\.\//, '').replace(/\.mp4$/, '')}.source.mp4 (or .mov, .gif, …) and run: npm run media`,
    );
  }
  return { src, poster };
}
