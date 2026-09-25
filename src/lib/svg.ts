// Prepare an SVG file (e.g. saved from Inkscape) for inlining in a page. Inline SVG text can use
// the page's web fonts (IBM Plex Sans), which an <img>-loaded SVG cannot.

const escapeAttr = (s: string) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

const ANCHOR_FRACTION: Record<string, number> = { start: 0, middle: 0.5, end: 1 };

/**
 * Inkscape saves wrapped text with SVG 2 `inline-size`: the <text> x is the start (or centre/end)
 * of a wrapping box, and each line is aligned inside it by the line's own `text-anchor`. Chrome
 * ignores `inline-size`, so centred lines end up centred on the box's left edge. Rewrite each line's
 * x to where Inkscape drew it and drop `inline-size`, so every browser renders the same thing.
 */
function flattenInlineSize(svg: string): string {
  return svg.replace(/<text\b([^>]*)>([\s\S]*?)<\/text>/g, (whole, attrs: string, body: string) => {
    const style = /style="([^"]*)"/.exec(attrs)?.[1] ?? '';
    const size = /inline-size:\s*([\d.]+)/.exec(style);
    if (!size) return whole;
    const width = parseFloat(size[1]);
    const textAnchor = /text-anchor:\s*(start|middle|end)/.exec(style)?.[1] ?? 'start';

    // Positioned tspans (with x) are the lines; anything up to the next one belongs to that line.
    const lineRe = /<tspan\b([^>]*?)\sx="(-?[\d.eE+-]+)"([^>]*)>/g;
    const lines = [...body.matchAll(lineRe)];
    let out = '';
    let last = 0;
    lines.forEach((m, i) => {
      const end = i + 1 < lines.length ? lines[i + 1].index! : body.length;
      const lineAnchor =
        /text-anchor:\s*(start|middle|end)/.exec(body.slice(m.index!, end))?.[1] ?? textAnchor;
      const x = parseFloat(m[2]);
      const boxStart = x - width * ANCHOR_FRACTION[textAnchor];
      const newX = boxStart + width * ANCHOR_FRACTION[lineAnchor];
      out += body.slice(last, m.index!) + `<tspan${m[1]} x="${+newX.toFixed(4)}"${m[3]}>`;
      last = m.index! + m[0].length;
    });
    out += body.slice(last);

    const newAttrs = attrs.replace(/inline-size:\s*[\d.]+;?/, '');
    return `<text${newAttrs}>${out}</text>`;
  });
}

export function prepareInlineSvg(raw: string, label: string, idPrefix = 'dg-'): string {
  let svg = raw
    .replace(/<\?xml[\s\S]*?\?>/g, '')
    .replace(/<!DOCTYPE[\s\S]*?>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '');

  // Editor-only metadata
  svg = svg.includes('</sodipodi:namedview>')
    ? svg.replace(/<sodipodi:namedview\b[\s\S]*?<\/sodipodi:namedview>/g, '')
    : svg.replace(/<sodipodi:namedview\b[^>]*\/>/g, '');
  svg = svg.replace(/<metadata\b[\s\S]*?<\/metadata>/g, '');
  svg = svg.replace(/\s(?:inkscape|sodipodi):[\w-]+="[^"]*"/g, '');
  svg = flattenInlineSize(svg);

  // Prefix ids so they can't collide with ids elsewhere on the page.
  svg = svg
    .replace(/\sid="([^"]+)"/g, ` id="${idPrefix}$1"`)
    .replace(/url\(#([^)]+)\)/g, `url(#${idPrefix}$1)`)
    .replace(/(\s(?:xlink:)?href)="#([^"]+)"/g, `$1="#${idPrefix}$2"`);

  // Root element: size comes from CSS (width 100%, height from the viewBox).
  svg = svg.replace(/<svg\b([^>]*)>/, (_m, attrs: string) => {
    const cleaned = attrs.replace(/\s(?:width|height)="[^"]*"/g, '');
    return `<svg${cleaned} role="img" aria-label="${escapeAttr(label)}" class="diagram-svg">`;
  });

  return svg.trim();
}
