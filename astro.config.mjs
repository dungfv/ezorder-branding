// @ts-check
import { defineConfig, fontProviders } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

// Canonical origin. Used for canonical URLs, sitemap, RSS and Open Graph.
const SITE_URL = 'https://ezorder.io';

export default defineConfig({
  site: SITE_URL,
  output: 'static',
  // Cloudflare Pages serves `about/index.html` at `/about/`, so every URL ends with a slash.
  trailingSlash: 'always',

  // English only for now; routing is ready for more locales (no prefix for the default one).
  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
    routing: { prefixDefaultLocale: false },
  },

  integrations: [
    mdx(),
    sitemap({
      // Keep noindex pages out: 404 and the draft terms (remove '/terms/' once final).
      filter: (page) => !page.endsWith('/404/') && !page.endsWith('/terms/'),
      i18n: { defaultLocale: 'en', locales: { en: 'en' } },
    }),
  ],

  // Self-hosted variable fonts (latin subset). Astro generates @font-face rules,
  // metric-matched fallbacks (less layout shift) and preload links.
  fonts: [
    {
      provider: fontProviders.local(),
      name: 'Inter',
      cssVariable: '--font-inter',
      fallbacks: ['system-ui', 'sans-serif'],
      options: {
        variants: [
          {
            src: ['./src/assets/fonts/inter-variable-latin.woff2'],
            weight: '100 900',
            style: 'normal',
            display: 'swap',
          },
        ],
      },
    },
    {
      provider: fontProviders.local(),
      name: 'Bricolage Grotesque',
      cssVariable: '--font-bricolage',
      fallbacks: ['system-ui', 'sans-serif'],
      options: {
        variants: [
          {
            src: ['./src/assets/fonts/bricolage-grotesque-variable-latin.woff2'],
            weight: '200 800',
            style: 'normal',
            display: 'swap',
          },
        ],
      },
    },
  ],

  vite: {
    plugins: [tailwindcss()],
  },
});
