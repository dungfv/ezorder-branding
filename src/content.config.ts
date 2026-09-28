/**
 * Content collections. The blog schema is mirrored in `.pages.yml`
 * (Pages CMS) — keep both in sync when adding fields.
 */
import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const blog = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/blog' }),
  schema: ({ image }) =>
    z.object({
      title: z.string().max(120),
      description: z.string().max(220),
      pubDate: z.coerce.date(),
      updatedDate: z.coerce.date().optional(),
      author: z.string().default('EZ Order team'),
      tags: z.array(z.string()).default([]),
      // Cover images live in src/assets/uploads so astro:assets can optimise them.
      cover: z
        .object({
          src: image(),
          alt: z.string(),
        })
        .optional(),
      draft: z.boolean().default(false),
    }),
});

export const collections = { blog };
