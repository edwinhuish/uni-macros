import uni from '@dcloudio/vite-plugin-uni';
import { defineConfig } from 'vite';
import VitePageJson from 'vite-plugin-define-pages-json';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    VitePageJson({
      pages: 'src/pages',
      subPackages: ['src/pages-sub'],
      debug: true,
    }),
    uni(),
  ],
});
