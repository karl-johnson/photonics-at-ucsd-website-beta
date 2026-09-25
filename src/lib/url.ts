/** Prefix a root-relative path with the site's base path (needed on GitHub Pages project sites). */
export function withBase(path: string): string {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  if (!path.startsWith('/') || path.startsWith('//')) return path;
  return base + path;
}
