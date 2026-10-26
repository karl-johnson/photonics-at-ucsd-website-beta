// Rotating phrase in the front page title ("Looking for … a weekend project?"). Every few seconds
// the current phrase slides down and fades out while the next slides in from above (CSS
// transitions on .rotator-item). The box is held at the height of the tallest phrase at the
// current width, so the page never jumps. With "reduce motion" on, the first phrase just stays.

export function initRotator(rotator: HTMLElement, intervalMs = 2600) {
  const items = [...rotator.querySelectorAll<HTMLElement>('.rotator-item')];
  if (items.length < 2) return;

  const fit = () => {
    rotator.style.height = `${Math.max(...items.map((i) => i.offsetHeight))}px`;
  };
  fit();
  new ResizeObserver(fit).observe(rotator);
  document.fonts?.ready.then(fit); // phrase widths change once the web font arrives

  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  let current = 0;
  setInterval(() => {
    if (document.hidden) return; // don't pile up changes in a background tab
    const leaving = items[current];
    current = (current + 1) % items.length;
    leaving.classList.remove('is-current');
    leaving.classList.add('is-leaving');
    items[current].classList.add('is-current');
    // Once it has slid out (the CSS transition is 450 ms), send it back to wait above, invisibly,
    // so it slides in from the top again when its turn comes round.
    setTimeout(() => leaving.classList.remove('is-leaving'), 600);
  }, intervalMs);
}
