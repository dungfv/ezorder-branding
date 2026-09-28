/**
 * Real document screenshots rendered by the EZ Order Printer app
 * (sample store "Northbeam Supply Co."), keyed by file name without extension.
 * Imported eagerly so `astro:assets` can optimise them at build time.
 */
import type { ImageMetadata } from 'astro';

const modules = import.meta.glob<{ default: ImageMetadata }>('../assets/docs/*.webp', {
  eager: true,
});

export const documentScreenshots: Record<string, ImageMetadata> = Object.fromEntries(
  Object.entries(modules).map(([path, mod]) => [
    path.split('/').pop()!.replace('.webp', ''),
    mod.default,
  ]),
);

export function getScreenshot(key: string): ImageMetadata {
  const image = documentScreenshots[key];
  if (!image) throw new Error(`Missing document screenshot: src/assets/docs/${key}.webp`);
  return image;
}
