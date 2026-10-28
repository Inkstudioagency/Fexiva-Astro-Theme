// @ts-check
import { defineConfig, envField } from 'astro/config';
import { loadEnv } from 'vite';
import sitemap from '@astrojs/sitemap';

const { SITE_URL } = loadEnv(process.env.NODE_ENV ?? 'production', process.cwd(), '');
// On Vercel, fall back to the project's production domain when SITE_URL is not set.
const vercelUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL;

// Utility pages that are excluded from the sitemap (they also carry noindex).
const NOINDEX = ['/401', '/404', '/style-guide', '/instructions', '/licenses', '/changelog'];

// https://astro.build/config
export default defineConfig({
  site: SITE_URL || (vercelUrl ? `https://${vercelUrl}` : 'https://example.com'),
  // Keep the original Webflow whitespace so inline spacing renders identically.
  compressHTML: false,
  trailingSlash: 'ignore',
  integrations: [
    sitemap({
      filter: (page) => !NOINDEX.some((p) => new URL(page).pathname.replace(/\/$/, '') === p),
    }),
  ],
  env: {
    schema: {
      // Leave STRAPI_URL unset to render the bundled sample content.
      STRAPI_URL: envField.string({ context: 'server', access: 'public', optional: true }),
      STRAPI_API_TOKEN: envField.string({ context: 'server', access: 'secret', optional: true }),
      PUBLIC_FORM_ENDPOINT: envField.string({ context: 'client', access: 'public', optional: true }),
    },
  },
});
