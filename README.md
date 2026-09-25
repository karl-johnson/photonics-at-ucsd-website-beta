# Photonics Society at UC San Diego — Optical Demos

Documentation site for the optical demos built by the Photonics Society at UC San Diego. Built with [Astro](https://astro.build), hosted on GitHub Pages, and deployed automatically on every push to `main`.

## Adding or editing a demo

Each demo is one folder in `src/content/demos/`:

```
src/content/demos/
  fabry-perot-mode-filter/
    index.md      ← all of the demo's text, scores and supplies
    setup.png     ← images used by index.md
```

To add a demo:

1. Copy `templates/demo/` to `src/content/demos/<your-demo-name>/`. The folder name becomes the address: `/demos/<your-demo-name>/`.
2. Fill in `index.md`. The template explains each field.
3. Put any images in the same folder and refer to them as `./my-image.jpg`.

The home page's plot and list update automatically.

### The top of the file (between the `---` lines)

This part holds the structured info: title, subtitle, date added, budget, the seven 0–10 scores, images, and the supplies list. Scores can be a single number (`5`) or a range (`[7, 9]`).

If something is wrong, such as a score of 12, a misspelled `need`, or a missing image, the build stops. The error names the file and the field, for example `scores.wow: Too big: expected number to be <=10`.

### The rest of the file (Markdown)

Write ordinary Markdown. The page layout comes from a few conventions:

| You write | The page shows |
|---|---|
| `## Heading` | A numbered section, also added to the "Contents" sidebar. Name, add or remove sections freely. |
| `## Supplies` | The supplies table (from `supplies:` at the top). |
| `1.` `2.` `3.` list | Steps with square numbers. |
| `:::note[Title]` … `:::` | A boxed note. |
| `### Topic` then paragraphs | A row: the title on the left, the text on the right. |
| A line of only `` `code` `` right after a `###` | Formula chips under the row title. |
| `[ref](https://…)` | A small `[ref]` citation link. |
| `**bold**`, `*italic*`, `[links](…)`, `- bullets` | As usual. |

Links to other pages on this site should start with `/` (e.g. `/resources/`). The site's base path is added automatically.

## Development

```bash
npm install
npm run dev       # http://localhost:4321/photonics-at-ucsd-website-beta/
npm run build     # outputs to dist/
npm run preview   # serve the built site
```

If you change the Markdown plugins in `src/plugins/`, stop the dev server and delete `.astro/` and `node_modules/.astro/` first. Astro caches rendered Markdown, so without this you will keep seeing the old output.

### Where things are

| Path | What |
|---|---|
| `src/content.config.ts` | Demo schema: the allowed fields at the top of each `index.md` |
| `src/data/attributes.ts` | The 8 attributes (names, order, formatting) |
| `src/plugins/remark-demo.mjs`, `rehype-demo.mjs` | Turn the Markdown conventions above into the page layout |
| `src/pages/index.astro`, `src/scripts/selector.ts` | Demo Selector (plot, preview, sortable list) |
| `src/pages/demos/[slug].astro` | Demo page template |
| `src/styles/global.css` | Design tokens and all styles |
| `templates/demo/` | Starting point for a new demo |

## Deployment

`.github/workflows/deploy.yml` builds and deploys to GitHub Pages on every push to `main`. One-time setup: in the repository settings under **Pages**, set **Source** to **GitHub Actions**. If the repository name or domain changes, update `site` and `base` in `astro.config.mjs`.

## License

Source code: MIT (see `LICENSE`).
