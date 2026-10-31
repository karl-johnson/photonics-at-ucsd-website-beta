import { defineConfig } from 'astro/config';
import { unified } from '@astrojs/markdown-remark';
import remarkDirective from 'remark-directive';
import remarkDemo from './src/plugins/remark-demo.mjs';
import rehypeDemo from './src/plugins/rehype-demo.mjs';
import assetCheck from './src/integrations/asset-check.mjs';

// Served by GitHub Pages at the custom domain's root. (Without a custom domain it would be the
// project site https://<user>.github.io/<repo>/, with `base` set to '/<repo>'.)
const site = 'https://photonicsatucsd.com';
const base = '/';

export default defineConfig({
  site,
  base,
  output: 'static',
  trailingSlash: 'always',
  // Warns if a diagram master or source video changed since `npm run diagrams` / `npm run media`.
  integrations: [assetCheck()],
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
