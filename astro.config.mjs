import { defineConfig } from 'astro/config';
import { unified } from '@astrojs/markdown-remark';
import remarkDirective from 'remark-directive';
import remarkDemo from './src/plugins/remark-demo.mjs';
import rehypeDemo from './src/plugins/rehype-demo.mjs';
import diagramCheck from './src/integrations/diagram-check.mjs';

// GitHub Pages project site: https://<user>.github.io/<repo>/
// If the site moves to a custom domain, set `site` to it and `base` to '/'.
const site = 'https://karl-johnson.github.io';
const base = '/photonics-at-ucsd-website-beta';

export default defineConfig({
  site,
  base,
  output: 'static',
  trailingSlash: 'always',
  // Warns if a diagram master (*.source.svg) changed since `npm run diagrams` last converted it.
  integrations: [diagramCheck()],
  image: {
    // Lets SVG diagrams be turned into small WebP thumbnails for the front page. Safe here because
    // every SVG comes from this repository (no user uploads or remote images).
    dangerouslyProcessSVG: true,
  },
  markdown: {
    processor: unified({
      remarkPlugins: [remarkDirective, remarkDemo],
      rehypePlugins: [[rehypeDemo, { base }]],
    }),
  },
});
