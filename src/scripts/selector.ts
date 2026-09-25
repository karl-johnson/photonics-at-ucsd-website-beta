// Front page interactivity: scatter plot, axis dropdowns, hover preview, sortable list.
import { ATTRIBUTES, formatBudget, formatScore, segments, type Range } from '../data/attributes';

interface Item {
  id: string;
  href: string;
  title: string;
  subtitle: string;
  added: string;
  img: string | null;
  thumb: string | null;
  isDiagram: boolean;
  ranges: Record<string, Range>;
}

const PLOT = 538; // inner size of the 540px plot (1px border)
const U = PLOT / 11; // one score unit: 11 positions for scores 0–10
const MARK = 14; // mark thickness

interface Axis {
  ticks: { v: number; label: string }[];
  pos: (v: number) => number;
}

const scoreAxis: Axis = {
  ticks: Array.from({ length: 11 }, (_, i) => ({ v: i, label: String(i) })),
  pos: (v) => (v + 0.5) * U,
};

// Budget is dollars, not 0–10: log scale from $10 to $10k, using the same span as scores 0–10.
const budgetAxis: Axis = {
  ticks: [10, 30, 100, 300, 1000, 3000, 10000].map((v) => ({
    v,
    label: v >= 1000 ? `$${v / 1000}k` : `$${v}`,
  })),
  pos: (v) => U / 2 + ((Math.log10(Math.min(Math.max(v, 10), 10000)) - 1) / 3) * (U * 10),
};

const axisFor = (key: string) => (key === 'budget' ? budgetAxis : scoreAxis);
const labelOf = (key: string) => ATTRIBUTES.find((a) => a.key === key)?.label ?? key;
const valueOf = (item: Item, key: string, compact = false) =>
  key === 'budget' ? formatBudget(item.ranges.budget, compact) : formatScore(item.ranges[key]);

const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

const meterHtml = (r: Range, size: 'md' | 'sm') =>
  `<span class="meter meter--${size}" aria-hidden="true">${segments(r)
    .map((s) => `<span class="${s}"></span>`)
    .join('')}</span>`;

export function initSelector() {
  const dataEl = document.getElementById('demo-data');
  if (!dataEl) return;
  const { items, defaultX, defaultY } = JSON.parse(dataEl.textContent!) as {
    items: Item[];
    defaultX: string;
    defaultY: string;
  };

  const plot = document.querySelector<HTMLElement>('.plot')!;
  const xTicks = document.querySelector<HTMLElement>('.x-ticks')!;
  const yTicks = document.querySelector<HTMLElement>('.y-ticks')!;
  const preview = document.querySelector<HTMLAnchorElement>('.preview');

  const state = { x: defaultX, y: defaultY, active: items[0]?.id ?? null };
  const geometry = new Map<string, { left: number; bottom: number; w: number; h: number }>();

  // ───────── Plot ─────────

  function renderPlot() {
    const ax = axisFor(state.x);
    const ay = axisFor(state.y);
    plot.replaceChildren();
    xTicks.replaceChildren();
    yTicks.replaceChildren();
    geometry.clear();

    for (const t of ax.ticks) {
      plot.append(el('span', 'gridline gridline--v', { left: `${Math.round(ax.pos(t.v))}px` }));
      xTicks.append(el('span', 'tick', { left: `${ax.pos(t.v) + 1}px` }, t.label));
    }
    for (const t of ay.ticks) {
      plot.append(el('span', 'gridline gridline--h', { bottom: `${Math.round(ay.pos(t.v))}px` }));
      yTicks.append(el('span', 'tick', { bottom: `${ay.pos(t.v) + 1}px` }, t.label));
    }

    for (const item of items) {
      const rx = item.ranges[state.x];
      const ry = item.ranges[state.y];
      const left = ax.pos(rx.lo) - MARK / 2;
      const bottom = ay.pos(ry.lo) - MARK / 2;
      const g = { left, bottom, w: ax.pos(rx.hi) - ax.pos(rx.lo) + MARK, h: ay.pos(ry.hi) - ay.pos(ry.lo) + MARK };
      geometry.set(item.id, g);

      const a = el('a', 'mark', {
        left: `${g.left}px`,
        bottom: `${g.bottom}px`,
        width: `${g.w}px`,
        height: `${g.h}px`,
      }) as HTMLAnchorElement;
      a.href = item.href;
      a.dataset.id = item.id;
      a.setAttribute(
        'aria-label',
        `${item.title} — ${labelOf(state.x)} ${valueOf(item, state.x)}, ${labelOf(state.y)} ${valueOf(item, state.y)}`,
      );
      a.addEventListener('mouseenter', () => setActive(item.id));
      a.addEventListener('focus', () => setActive(item.id));
      plot.append(a);
    }

    plot.append(
      el('span', 'guide guide--v'),
      el('span', 'guide guide--h'),
      el('span', 'mark-tag'),
    );
    setActive(state.active);
  }

  function setActive(id: string | null) {
    state.active = id;
    plot.querySelectorAll<HTMLElement>('.mark').forEach((m) => m.classList.toggle('is-active', m.dataset.id === id));

    const item = items.find((i) => i.id === id);
    const g = id ? geometry.get(id) : undefined;
    const gv = plot.querySelector<HTMLElement>('.guide--v')!;
    const gh = plot.querySelector<HTMLElement>('.guide--h')!;
    const tag = plot.querySelector<HTMLElement>('.mark-tag')!;
    const show = !!(item && g);
    gv.hidden = gh.hidden = tag.hidden = !show;
    if (!item || !g) return;

    Object.assign(gv.style, { left: `${g.left + g.w / 2}px`, bottom: '0px', height: `${g.bottom}px`, width: '1px' });
    Object.assign(gh.style, { left: '0px', bottom: `${g.bottom + g.h / 2}px`, width: `${g.left}px`, height: '1px' });

    tag.textContent = item.title;
    const tw = tag.offsetWidth;
    const th = tag.offsetHeight;
    let tagBottom = g.bottom + g.h + 3;
    if (tagBottom + th > PLOT) tagBottom = g.bottom - th - 3; // no room above: put it below
    const tagLeft = Math.max(0, Math.min(g.left, PLOT - tw));
    Object.assign(tag.style, { left: `${tagLeft}px`, bottom: `${tagBottom}px` });

    renderPreview(item);
  }

  // ───────── Preview panel ─────────

  function renderPreview(item: Item) {
    if (!preview) return;
    preview.href = item.href;
    preview.setAttribute('aria-label', `Open ${item.title}`);
    const media = preview.querySelector<HTMLElement>('.preview-media')!;
    media.classList.toggle('is-diagram', item.isDiagram);
    media.innerHTML = item.img ? `<img src="${esc(item.img)}" alt="">` : '';
    preview.querySelector('.preview-title')!.textContent = item.title;
    preview.querySelector('.preview-sub')!.textContent = item.subtitle;
    preview.querySelector('.preview-attrs')!.innerHTML = ATTRIBUTES.map(
      (a) => `<div class="preview-attr">
        <span class="preview-attr-label">${esc(a.label)}</span>
        <div class="preview-attr-val">
          ${a.key === 'budget' ? '<span></span>' : meterHtml(item.ranges[a.key], 'md')}
          <span class="mono">${esc(valueOf(item, a.key))}</span>
        </div>
      </div>`,
    ).join('');
  }

  // ───────── Axis dropdowns ─────────

  const dropdowns = [...document.querySelectorAll<HTMLElement>('.dd')].map((root) => {
    const which = root.dataset.axis as 'x' | 'y';
    const button = root.querySelector<HTMLButtonElement>('.dd-button')!;
    const menu = root.querySelector<HTMLElement>('.dd-menu')!;
    const label = root.querySelector<HTMLElement>('.dd-label')!;

    menu.innerHTML = ATTRIBUTES.map(
      (a) =>
        `<li role="none"><button type="button" role="option" class="dd-option" data-key="${a.key}" aria-selected="false">${esc(a.label)}</button></li>`,
    ).join('');
    const options = [...menu.querySelectorAll<HTMLButtonElement>('.dd-option')];

    function sync() {
      label.textContent = labelOf(state[which]);
      button.setAttribute('aria-label', `${which.toUpperCase()} axis: ${labelOf(state[which])}`);
      options.forEach((o) => o.setAttribute('aria-selected', String(o.dataset.key === state[which])));
    }
    function open() {
      dropdowns.forEach((d) => d !== api && d.close(false));
      menu.hidden = false;
      button.setAttribute('aria-expanded', 'true');
      (options.find((o) => o.dataset.key === state[which]) ?? options[0]).focus();
    }
    function close(focusButton = true) {
      if (menu.hidden) return;
      menu.hidden = true;
      button.setAttribute('aria-expanded', 'false');
      if (focusButton) button.focus();
    }

    button.addEventListener('click', () => (menu.hidden ? open() : close()));
    options.forEach((o) =>
      o.addEventListener('click', () => {
        state[which] = o.dataset.key!;
        sync();
        close();
        renderPlot();
      }),
    );
    menu.addEventListener('keydown', (e) => {
      const i = options.indexOf(document.activeElement as HTMLButtonElement);
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        const next = (i + (e.key === 'ArrowDown' ? 1 : -1) + options.length) % options.length;
        options[next].focus();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        close();
      } else if (e.key === 'Tab') {
        close(false);
      }
    });

    const api = { root, close, sync };
    sync();
    return api;
  });

  document.addEventListener('click', (e) => {
    dropdowns.forEach((d) => {
      if (!d.root.contains(e.target as Node)) d.close(false);
    });
  });

  // ───────── Sortable list ─────────

  const list = document.querySelector<HTMLElement>('.demo-list');
  const sortButtons = [...document.querySelectorAll<HTMLButtonElement>('.sort-btn')];
  const sort = { key: 'added', dir: -1 };

  const sortValue = (item: Item, key: string) => {
    if (key === 'added') return Date.parse(item.added);
    const r = item.ranges[key];
    return (r.lo + r.hi) / 2 + r.hi / 1e6; // midpoint, ties broken by upper end
  };

  function applySort() {
    if (!list) return;
    const rows = new Map([...list.children].map((li) => [(li as HTMLElement).dataset.id, li]));
    [...items]
      .sort(
        (a, b) =>
          sort.dir * (sortValue(a, sort.key) - sortValue(b, sort.key)) ||
          Date.parse(b.added) - Date.parse(a.added),
      )
      .forEach((item) => {
        const li = rows.get(item.id);
        if (li) list.append(li);
      });
    sortButtons.forEach((b) => {
      const on = b.dataset.sort === sort.key;
      b.setAttribute('aria-pressed', String(on));
      b.querySelector('.arrow')!.textContent = on ? (sort.dir < 0 ? '↓' : '↑') : '↕';
    });
  }

  sortButtons.forEach((b) =>
    b.addEventListener('click', () => {
      const key = b.dataset.sort!;
      if (key === sort.key) sort.dir *= -1;
      else {
        sort.key = key;
        sort.dir = key === 'budget' ? 1 : -1; // cheapest first; everything else highest/newest first
      }
      applySort();
    }),
  );

  renderPlot();
}

function el(tag: string, className: string, style: Record<string, string> = {}, text?: string) {
  const node = document.createElement(tag);
  node.className = className;
  Object.assign(node.style, style);
  if (text != null) node.textContent = text;
  return node;
}
