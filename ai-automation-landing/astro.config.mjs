// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://aichatbot.vn',

  integrations: [
    react(),
    sitemap({
      i18n: {
        defaultLocale: 'vi',
        locales: { vi: 'vi-VN' },
      },
    }),
  ],

  vite: {
    plugins: [tailwindcss()],
  },

  i18n: {
    defaultLocale: 'vi',
    locales: ['vi'],
  },

  // Trailing slash consistency (SEO: avoid duplicate URL indexing)
  trailingSlash: 'never',

  // Build output: static HTML (best for SEO)
  output: 'static',

  // Prefetch on hover (faster perceived navigation)
  prefetch: {
    prefetchAll: false,
    defaultStrategy: 'hover',
  },
});