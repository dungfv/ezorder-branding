/**
 * Content collections. The blog schema is mirrored in `.pages.yml`
 * (Pages CMS) — keep both in sync when adding fields.
 *
 * CMS editors may save empty optional fields as '' or null; those are
 * normalised to "not set" so a harmless edit never breaks the build.
 */
import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const emptyToUndefined = (value: unknown) => (value === '' || value === null ? undefined : value);

const blog = defineCollection({
  // Top-level files only: post ids become URL slugs, so they must not contain "/".
  loader: glob({ pattern: '*.{md,mdx}', base: './src/content/blog' }),
  schema: ({ image }) =>
    z.object({
      title: z.string().min(1).max(120),
      description: z.string().min(1).max(220),
      pubDate: z.coerce.date(),
      updatedDate: z.preprocess(emptyToUndefined, z.coerce.date().optional()),
      author: z.preprocess(emptyToUndefined, z.string().default('EZ Order team')),
      tags: z.preprocess((value) => value ?? [], z.array(z.string().min(1))),
      // Cover images live in src/assets/uploads so astro:assets can optimise them.
      // A cover without an image (cleared in the CMS) counts as no cover.
      cover: z.preprocess(
        (value) => (value && typeof value === 'object' && (value as { src?: unknown }).src ? value : undefined),
        z.object({ src: image(), alt: z.string().min(1, 'cover.alt is required when a cover is set') }).optional(),
      ),
      draft: z.preprocess((value) => value ?? false, z.boolean()),
    }),
});

export const collections = { blog };
