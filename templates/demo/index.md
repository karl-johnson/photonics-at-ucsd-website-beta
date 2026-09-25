---
# ── Copy this folder to src/content/demos/<your-demo-name>/ ──
# The folder name becomes the page address: /demos/<your-demo-name>/
# Use lowercase words separated by dashes, e.g. michelson-interferometer.

title: Your Demo Title
subtitle: One sentence that makes someone want to see this demo.
added: 2026-01-31 # YYYY-MM-DD, used for "most recent" sorting

# Images live in this same folder. All of these are optional.
# diagram: ./diagram.svg        # shown full width at the top of the page. SVG (e.g. from Inkscape)
#                               # is best: it's placed directly in the page, so its text uses the
#                               # site's IBM Plex Sans. PNG/JPG also work.
# diagramAlt: Describe the diagram for screen readers.
# thumbnail: ./thumb.jpg        # front page image (defaults to the first photo, then the diagram)
# photos:                       # up to two are shown beside the diagram
#   - { src: ./photo-1.jpg, alt: What the photo shows }
#   - { src: ./photo-2.jpg, alt: What the photo shows }

# Budget in dollars: one number (40) or a range ([250, 1000]).
budget: [50, 100]

# Scores are 0–10: one number (5) or a range ([7, 9]).
scores:
  tools: 3              # Required tools
  assembly: [4, 5]      # Assembly complexity
  portability: 7
  setupTime: 3
  demoComplexity: 4     # Complexity of demonstration
  conceptComplexity: 5  # Complexity of underlying concepts
  wow: 8                # WOW factor

# Shown as a table under the "## Supplies" heading.
# need: required | effectively-required | likely-required | maybe-required |
#       highly-recommended | recommended | optional
# details can use Markdown links and *emphasis*. cost can be one line or a list of lines.
supplies:
  - item: Example part
    need: required
    details: What it is and why you need it. See [somewhere](https://example.com).
    cost: $20
    link: { label: Amazon, url: https://example.com }
  - item: Another part
    need: recommended
    details: Nice to have.
    cost: ["$5 used", "$15 new"]
    link: { label: DIY }   # no url → shown as plain text

# draft: true   # uncomment to hide this demo from the site while you work on it
---

## Supplies

<!-- The table comes from `supplies` above. Anything written here appears above it. -->

## Alignment

1. Numbered lists become numbered steps.
2. Use **bold** for emphasis and [links](#presentation-ideas) as usual.

:::note[A short title for the note]
- A boxed note. Everything up to the closing `:::` goes inside it.
:::

## Presentation ideas

### The effect

A `###` heading starts a row: the heading on the left, the text below it on the right.

### Audience

Who this works best for.

## Subtle tidbits

### A topic

`L ≤ 2R` `another formula`

A line of only `code` right after a `###` heading becomes formula chips. Cite sources like this [ref](https://example.com).

## Opportunities for improvement

- Bullet lists work as usual.
