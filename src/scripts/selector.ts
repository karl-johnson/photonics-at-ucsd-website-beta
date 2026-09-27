// Front page interactivity: scatter plot, axis dropdowns, hover/tap preview, sortable list.
// The parameters (from src/data/rubric.yaml) arrive with the demo data, so nothing here is hard-coded.
import { formatValue, segments, type Range, type Unit } from '../lib/scores';

interface ParameterInfo {
  key: string;
  name: string;
  short: string;
  unit: Unit;
}

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

interface Axis {
  ticks: { v: number; label: string }[];
  pos: (v: number) => number;
}

/** Score axis 0–10 across a plot `size` px wide: 11 positions, one unit each. */
function scoreAxis(size: number): Axis {
  const u = size / 11;
  return {
    ticks: Array.from({ length: 11 }, (_, i) => ({ v: i, label: String(i) })),
    pos: (v) => (v + 0.5) * u,
  };
}

/** Dollar parameters (budget) aren't 0–10: log scale from $10 to $10k over the same span as scores 0–10. */
function dollarAxis(size: number): Axis {
  const u = size / 11;
  return {
    ticks: [10, 30, 100, 300, 1000, 3000, 10000].map((v) => ({
      v,
      label: v >= 1000 ? `$${v / 1000}k` : `$${v}`,
    })),
    pos: (v) => u / 2 + ((Math.log10(Math.min(Math.max(v, 10), 10000)) - 1) / 3) * (u * 10),
  };
}

const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

const meterHtml = (r: Range, size: 'md' | 'sm') =>
  `<span class="meter meter--${size}" aria-hidden="true">${segments(r)
    .map((s) => `<span class="${s}"></span>`)
    .join('')}</span>`;

export function initSelector() {
  const dataEl = document.getElementById('demo-data');
  if (!dataEl) return;
  const { items, parameters, defaultX, defaultY } = JSON.parse(dataEl.textContent!) as {
    items: Item[];
    parameters: ParameterInfo[];
    defaultX: string;
    defaultY: string;
  };

  const paramOf = (key: string) => parameters.find((p) => p.key === key)!;
  const labelOf = (key: string) => paramOf(key)?.name ?? key;
  const valueOf = (item: Item, key: string, compact = false) =>
    formatValue(paramOf(key).unit, item.ranges[key], compact);

  const plot = document.querySelector<HTMLElement>('.plot')!;
  const xTicks = document.querySelector<HTMLElement>('.x-ticks')!;
  const yTicks = document.querySelector<HTMLElement>('.y-ticks')!;
  const preview = document.querySelector<HTMLAnchorElement>('.preview');

  const state = { x: defaultX, y: defaultY, active: items[0]?.id ?? null };
  const geometry = new Map<string, { left: number; bottom: number; w: number; h: number }>();
  let plotSize = 0; // inner width of the plot in px; the plot is square and resizes with the page

  // ───────── Plot ─────────

  function renderPlot() {
    plotSize = plot.clientWidth;
    const axisFor = (key: string) => (paramOf(key).unit === 'usd' ? dollarAxis : scoreAxis)(plotSize);
    const ax = axisFor(state.x);
    const ay = axisFor(state.y);
    const mark = plotSize < 400 ? 12 : 14; // mark thickness
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
      const g = {
        left: ax.pos(rx.lo) - mark / 2,
        bottom: ay.pos(ry.lo) - mark / 2,
        w: ax.pos(rx.hi) - ax.pos(rx.lo) + mark,
        h: ay.pos(ry.hi) - ay.pos(ry.lo) + mark,
      };
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

      // Mouse: hovering previews, clicking opens. Touch/pen: the first tap previews, a second tap opens.
      let tapWasActive = true;
      a.addEventListener('pointerenter', (e) => {
        if (e.pointerType === 'mouse') setActive(item.id);
      });
      a.addEventListener('pointerdown', (e) => {
        tapWasActive = e.pointerType === 'mouse' || state.active === item.id;
      });
      a.addEventListener('click', (e) => {
        if (!tapWasActive) {
          e.preventDefault();
          setActive(item.id);
        }
        tapWasActive = true;
      });
      a.addEventListener('focus', () => setActive(item.id));
      plot.append(a);
    }

    plot.append(el('span', 'guide guide--v'), el('span', 'guide guide--h'), el('span', 'mark-tag'));
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
    if (tagBottom + th > plotSize) tagBottom = g.bottom - th - 3; // no room above: put it below
    const tagLeft = Math.max(0, Math.min(g.left, plotSize - tw));
    Object.assign(tag.style, { left: `${tagLeft}px`, bottom: `${tagBottom}px` });

    renderPreview(item);
  }

  // Re-draw when the plot changes size (window resize, rotating a phone).
  new ResizeObserver(() => {
    if (plot.clientWidth !== plotSize) renderPlot();
  }).observe(plot);

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
    // On phones only the two plotted parameters are shown (.is-plotted); see global.css.
    preview.querySelector('.preview-attrs')!.innerHTML = parameters
      .map(
        (p) => `<div class="preview-attr${p.key === state.x || p.key === state.y ? ' is-plotted' : ''}" data-key="${esc(p.key)}">
        <span class="preview-attr-label">${esc(p.name)}</span>
        <div class="preview-attr-val">
          ${p.unit === 'usd' ? '<span></span>' : meterHtml(item.ranges[p.key], 'md')}
          <span class="mono">${esc(valueOf(item, p.key))}</span>
        </div>
      </div>`,
      )
      .join('');
  }

  // ───────── Axis dropdowns ─────────
  // Each axis has two pickers: the desktop ones on the plot's axes and the phone ones above the
  // plot (.dd--bar). CSS shows one set; both stay in sync.

  const dropdowns = [...document.querySelectorAll<HTMLElement>('.dd')].map((root) => {
    const which = root.dataset.axis as 'x' | 'y';
    const button = root.querySelector<HTMLButtonElement>('.dd-button')!;
    const menu = root.querySelector<HTMLElement>('.dd-menu')!;
    const label = root.querySelector<HTMLElement>('.dd-label')!;

    menu.innerHTML = parameters
      .map(
        (p) =>
          `<li role="none"><button type="button" role="option" class="dd-option" data-key="${esc(p.key)}" aria-selected="false">${esc(p.name)}</button></li>`,
      )
      .join('');
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
        dropdowns.forEach((d) => d.sync());
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
    return api;
  });
  dropdowns.forEach((d) => d.sync());

  document.addEventListener('click', (e) => {
    dropdowns.forEach((d) => {
      if (!d.root.contains(e.target as Node)) d.close(false);
    });
  });

  // ───────── Sortable list ─────────
  // Wide screens sort by clicking column headers; narrower ones use the sort menu and direction
  // button (.sort-bar), and each row shows only the sorted value (.is-sorted).

  const list = document.querySelector<HTMLElement>('.demo-list');
  const sortButtons = [...document.querySelectorAll<HTMLButtonElement>('.sort-btn')];
  const sortSelect = document.querySelector<HTMLSelectElement>('#sort-select');
  const sortDir = document.querySelector<HTMLButtonElement>('.sort-dir');
  const sort = { key: 'added', dir: -1 };

  const isDollars = (key: string) => key !== 'added' && paramOf(key).unit === 'usd';
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
    list.querySelectorAll<HTMLElement>('.demo-cell, .demo-date').forEach((c) => {
      c.classList.toggle('is-sorted', (c.dataset.key ?? 'added') === sort.key);
    });
    if (sortSelect) sortSelect.value = sort.key;
    if (sortDir) {
      sortDir.textContent = sort.dir < 0 ? '↓' : '↑';
      const label =
        sort.key === 'added'
          ? sort.dir < 0 ? 'Newest first' : 'Oldest first'
          : isDollars(sort.key)
            ? sort.dir < 0 ? 'Most expensive first' : 'Cheapest first'
            : sort.dir < 0 ? 'Highest first' : 'Lowest first';
      sortDir.setAttribute('aria-label', label);
    }
  }

  function sortBy(key: string) {
    if (key === sort.key) sort.dir *= -1;
    else {
      sort.key = key;
      // Dollar amounts cheapest first; scores and dates highest/newest first.
      sort.dir = isDollars(key) ? 1 : -1;
    }
    applySort();
  }

  sortButtons.forEach((b) => b.addEventListener('click', () => sortBy(b.dataset.sort!)));
  sortSelect?.addEventListener('change', () => sortBy(sortSelect.value));
  sortDir?.addEventListener('click', () => {
    sort.dir *= -1;
    applySort();
  });

  renderPlot();
}

function el(tag: string, className: string, style: Record<string, string> = {}, text?: string) {
  const node = document.createElement(tag);
  node.className = className;
  Object.assign(node.style, style);
  if (text != null) node.textContent = text;
  return node;
}
