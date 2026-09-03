import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

const site = process.env.SITE_ORIGIN || 'https://xxreina-28.github.io';

export default defineConfig({
  output: 'static',
  site,
  integrations: [sitemap({ filter: (page) => page !== new URL('/404/', site).href })],
  trailingSlash: 'always',
  build: { format: 'directory' },
  devToolbar: { enabled: false },
});
