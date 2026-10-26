// GIF-like looping videos (<video class="loop-video">): silent, play only while on screen, never
// autoplay for people who have turned on "reduce motion" (they see the poster frame), and an
// optional pause/play button (.video-toggle next to the video) that always wins.

const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
const videos = new Set<HTMLVideoElement>();
let observer: IntersectionObserver | null = null;

function shouldPlay(v: HTMLVideoElement) {
  if (v.dataset.visible !== 'true') return false;
  if (v.dataset.choice === 'paused') return false;
  if (v.dataset.choice === 'playing') return true;
  return !reduceMotion.matches;
}

function update(v: HTMLVideoElement) {
  if (shouldPlay(v)) v.play().catch(() => {}); // refused (e.g. data saver): the poster stays
  else v.pause();
}

function syncButton(v: HTMLVideoElement) {
  const button = v.parentElement?.querySelector<HTMLButtonElement>('.video-toggle');
  if (!button) return;
  const playing = !v.paused;
  button.setAttribute('aria-label', playing ? 'Pause video' : 'Play video');
  button.dataset.state = playing ? 'playing' : 'paused';
}

export function setupLoopVideo(v: HTMLVideoElement) {
  if (videos.has(v)) return;
  videos.add(v);
  v.muted = true; // browsers only autoplay silent video
  observer ??= new IntersectionObserver(
    (entries) =>
      entries.forEach((e) => {
        const video = e.target as HTMLVideoElement;
        video.dataset.visible = String(e.isIntersecting);
        update(video);
      }),
    { threshold: 0.25 },
  );
  observer.observe(v);
  v.addEventListener('play', () => syncButton(v));
  v.addEventListener('pause', () => syncButton(v));
  syncButton(v);

  v.parentElement?.querySelector<HTMLButtonElement>('.video-toggle')?.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    v.dataset.choice = v.paused ? 'playing' : 'paused';
    update(v);
  });
}

export function initLoopVideos(root: ParentNode = document) {
  root.querySelectorAll<HTMLVideoElement>('video.loop-video').forEach(setupLoopVideo);
}

reduceMotion.addEventListener('change', () => videos.forEach(update));
