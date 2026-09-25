import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

// A score is a single number (5) or a range ([7, 9]) on the 0–10 scale.
const scoreValue = z.number().int().min(0).max(10);
const score = z
  .union([scoreValue, z.tuple([scoreValue, scoreValue])])
  .transform((v) => (Array.isArray(v) ? { lo: v[0], hi: v[1] } : { lo: v, hi: v }))
  .refine((r) => r.lo <= r.hi, { message: 'Score range must be written [low, high]' });

// Budget in dollars: a single number (40) or a range ([250, 1000]).
const budget = z
  .union([z.number().nonnegative(), z.tuple([z.number().nonnegative(), z.number().nonnegative()])])
  .transform((v) => (Array.isArray(v) ? { lo: v[0], hi: v[1] } : { lo: v, hi: v }))
  .refine((r) => r.lo <= r.hi, { message: 'Budget range must be written [low, high]' });

export const NEED_LEVELS = [
  'required',
  'effectively-required',
  'likely-required',
  'maybe-required',
  'highly-recommended',
  'recommended',
  'optional',
] as const;

const demos = defineCollection({
  // One folder per demo: src/content/demos/<slug>/index.md
  loader: glob({
    pattern: '*/index.md',
    base: './src/content/demos',
    generateId: ({ entry }) => entry.split('/')[0],
  }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      subtitle: z.string(),
      added: z.coerce.date(),
      diagram: image().optional(),
      diagramAlt: z.string().optional(),
      thumbnail: image().optional(),
      photos: z.array(z.object({ src: image(), alt: z.string() })).default([]),
      budget,
      scores: z.object({
        tools: score,
        assembly: score,
        portability: score,
        setupTime: score,
        demoComplexity: score,
        conceptComplexity: score,
        wow: score,
      }),
      // The supplies table is built from this list by src/plugins/rehype-demo.mjs.
      supplies: z
        .array(
          z.object({
            item: z.string(),
            need: z.enum(NEED_LEVELS),
            details: z.string().default(''),
            cost: z.union([z.string(), z.array(z.string())]).optional(),
            link: z.object({ label: z.string(), url: z.string().optional() }).optional(),
          }),
        )
        .default([]),
      draft: z.boolean().default(false),
    }),
});

export const collections = { demos };
