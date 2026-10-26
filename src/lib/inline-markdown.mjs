// Inline Markdown (*italics*, **bold**, [links](…)) for text written in a page's frontmatter, which
// the Markdown pipeline doesn't touch: supply details (src/plugins/rehype-demo.mjs) and demo blurbs.
import { fromMarkdown } from 'mdast-util-from-markdown';
import { toHast } from 'mdast-util-to-hast';
import { toHtml } from 'hast-util-to-html';
import { visit } from 'unist-util-visit';

/** Curly quotes, like SmartyPants does for the Markdown body */
export function smartQuotes(s) {
  return s
    .replace(/(^|[\s(\[{—–-])"/g, '$1“')
    .replace(/"/g, '”')
    .replace(/(^|[\s(\[{—–-])'/g, '$1‘')
    .replace(/'/g, '’');
}

/** Inline Markdown from a frontmatter string → hast nodes (one paragraph is unwrapped). */
export function inlineMarkdown(text) {
  const hast = toHast(fromMarkdown(text ?? ''));
  visit(hast, 'text', (node) => {
    node.value = smartQuotes(node.value);
  });
  const blocks = (hast.children ?? []).filter((n) => !(n.type === 'text' && !n.value.trim()));
  if (blocks.length === 1 && blocks[0].type === 'element' && blocks[0].tagName === 'p') return blocks[0].children;
  return blocks;
}

/**
 * Inline Markdown → an HTML string, for `set:html` in a page.
 * @param base the site's base path, added to root-relative links ("/about/")
 */
export function inlineMarkdownHtml(text, base = '') {
  const root = { type: 'root', children: inlineMarkdown(text) };
  const prefix = base.replace(/\/$/, '');
  visit(root, 'element', (node) => {
    const href = node.properties?.href;
    if (prefix && typeof href === 'string' && href.startsWith('/') && !href.startsWith('//')) {
      node.properties.href = prefix + href;
    }
  });
  return toHtml(root);
}
