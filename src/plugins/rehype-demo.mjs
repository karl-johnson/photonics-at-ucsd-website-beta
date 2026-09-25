// HTML-level layout for demo pages. Turns plain rendered Markdown into the design's blocks:
//   ## Heading             → numbered <section> (01, 02, …) with the ink rule
//   ### Topic              → row: bold title (+ formula chips) on the left, text on the right
//   `a` `b` right after ###→ formula chips under the row title
//   1. 2. 3.               → steps with square numbers (class "steps", styled in CSS)
//   ## Supplies            → the supplies table from the `supplies:` frontmatter list is added
// It also prefixes root-relative links and images with the site's base path.
import { h } from 'hastscript';
import { toString } from 'hast-util-to-string';
import { visit } from 'unist-util-visit';
import GithubSlugger from 'github-slugger';
import { fromMarkdown } from 'mdast-util-from-markdown';
import { toHast } from 'mdast-util-to-hast';

const NEED_LABELS = {
  required: 'Required',
  'effectively-required': 'Effectively required',
  'likely-required': 'Likely required',
  'maybe-required': 'May be required',
  'highly-recommended': 'Highly recommended',
  recommended: 'Recommended',
  optional: 'Optional',
};

const isElement = (node, tag) => node?.type === 'element' && (!tag || node.tagName === tag);
const isBlank = (node) => node.type === 'text' && !node.value.trim();

/** Curly quotes, like SmartyPants does for the Markdown body */
function smartQuotes(s) {
  return s
    .replace(/(^|[\s(\[{—–-])"/g, '$1“')
    .replace(/"/g, '”')
    .replace(/(^|[\s(\[{—–-])'/g, '$1‘')
    .replace(/'/g, '’');
}

/** Inline Markdown (links, emphasis) from a frontmatter string → hast children */
function inlineMarkdown(text) {
  const hast = toHast(fromMarkdown(text ?? ''));
  visit(hast, 'text', (node) => {
    node.value = smartQuotes(node.value);
  });
  const blocks = (hast.children ?? []).filter((n) => !isBlank(n));
  if (blocks.length === 1 && isElement(blocks[0], 'p')) return blocks[0].children;
  return blocks;
}

function suppliesTable(supplies) {
  const head = h('thead', [
    h('tr', [
      h('th.col-item', 'Item'),
      h('th', 'Details'),
      h('th.col-cost', 'Approx. cost'),
      h('th.col-link', 'Example'),
    ]),
  ]);
  const rows = supplies.map((s) => {
    const cost = Array.isArray(s.cost) ? s.cost : s.cost ? [s.cost] : [];
    const costCell = cost.flatMap((line, i) => (i ? [h('br'), line] : [line]));
    const link = s.link
      ? s.link.url
        ? h('a', { href: s.link.url }, s.link.label)
        : h('span.muted', s.link.label)
      : '';
    return h('tr', [
      h('td', [
        h('div.supply-item', [
          h('span.supply-name', s.item),
          h(`span.tag.tag--${s.need}`, NEED_LABELS[s.need] ?? s.need),
        ]),
      ]),
      h('td.supply-details', inlineMarkdown(s.details)),
      h('td.supply-cost', costCell),
      h('td', [link]),
    ]);
  });
  return h('div.supplies-wrap', [h('table.supplies', [head, h('tbody', rows)])]);
}

/** Group `### Topic` + following content into rows inside one section body */
function groupRows(children) {
  const out = [];
  let rows = null;
  let row = null;
  for (let i = 0; i < children.length; i++) {
    const node = children[i];
    if (isElement(node, 'h3')) {
      if (!rows) {
        rows = h('div.rows', []);
        out.push(rows);
      }
      const rowHead = h('div.row-head', [node]);
      // Formula chips: the next block is a paragraph made only of `code` spans.
      let j = i + 1;
      while (j < children.length && isBlank(children[j])) j++;
      const next = children[j];
      if (
        isElement(next, 'p') &&
        next.children.some((c) => isElement(c, 'code')) &&
        next.children.every((c) => isElement(c, 'code') || isBlank(c))
      ) {
        rowHead.children.push(
          h(
            'div.chips',
            next.children.filter((c) => isElement(c, 'code')).map((c) => h('span.chip', toString(c))),
          ),
        );
        i = j;
      }
      row = h('div.row', [rowHead, h('div.row-body', [])]);
      rows.children.push(row);
      continue;
    }
    if (row) row.children[1].children.push(node);
    else out.push(node);
  }
  return out;
}

export default function rehypeDemo(options = {}) {
  const base = (options.base ?? '').replace(/\/$/, '');

  return (tree, file) => {
    const frontmatter = file.data?.astro?.frontmatter ?? {};
    const supplies = Array.isArray(frontmatter.supplies) ? frontmatter.supplies : [];
    const slugger = new GithubSlugger();

    // 1. Split the document at each h2 into sections.
    const intro = [];
    const sections = [];
    for (const node of tree.children) {
      if (isElement(node, 'h2')) {
        sections.push({ heading: node, body: [] });
      } else if (sections.length) {
        sections.at(-1).body.push(node);
      } else if (!isBlank(node)) {
        intro.push(node);
      }
    }

    // 2. Supplies table goes at the end of the "Supplies" section (created first if missing).
    if (supplies.length) {
      let target = sections.find((s) => toString(s.heading).trim().toLowerCase() === 'supplies');
      if (!target) {
        target = { heading: h('h2', 'Supplies'), body: [] };
        sections.unshift(target);
      }
      target.body.push(suppliesTable(supplies));
    }

    // 3. Build the numbered section markup.
    tree.children = [
      ...intro,
      ...sections.map((s, i) => {
        const id = slugger.slug(toString(s.heading));
        s.heading.properties = { ...s.heading.properties, id };
        const num = String(i + 1).padStart(2, '0');
        return h('section.doc-section', { 'aria-labelledby': id }, [
          h('div.section-head', [h('span.section-num', num), s.heading]),
          h('div.section-body', groupRows(s.body.filter((n) => !isBlank(n)))),
        ]);
      }),
    ];

    // 4. Steps, base-path links.
    visit(tree, 'element', (node, _index, parent) => {
      if (node.tagName === 'ol' && isElement(parent) && hasClass(parent, ['section-body', 'row-body'])) {
        addClass(node, 'steps');
      }
      for (const attr of ['href', 'src']) {
        const v = node.properties?.[attr];
        if (typeof v === 'string' && v.startsWith('/') && !v.startsWith('//') && base && !v.startsWith(base + '/')) {
          node.properties[attr] = base + v;
        }
      }
    });
  };
}

function classList(node) {
  const c = node.properties?.className;
  return Array.isArray(c) ? c : typeof c === 'string' ? c.split(/\s+/) : [];
}
function hasClass(node, names) {
  return classList(node).some((c) => names.includes(c));
}
function addClass(node, name) {
  node.properties = { ...node.properties, className: [...classList(node), name] };
}
