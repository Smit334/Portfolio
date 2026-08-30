// @ts-check
import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://smitmalde.xyz',
  devToolbar: { enabled: false },
  trailingSlash: 'ignore',
  build: {
    inlineStylesheets: 'auto',
  },
});
