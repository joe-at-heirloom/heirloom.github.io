// heirloomapp.io: rendered ahead of time (every page is HTML for search
// engines), interactive where it helps (finders, zoom), and served by a
// Cloudflare Worker with static assets (wrangler.jsonc).
import { defineConfig } from 'astro/config';
import preact from '@astrojs/preact';

export default defineConfig({
  site: 'https://heirloomapp.io',
  trailingSlash: 'ignore',
  build: { format: 'preserve' },
  integrations: [preact()],
  prefetch: { prefetchAll: true, defaultStrategy: 'viewport' },
});
