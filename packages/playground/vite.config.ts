import uni from '@dcloudio/vite-plugin-uni';
import VitePageJson from '@uni-helper/vite-plugin-define-pages-json';
import { defineConfig } from 'vite';

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
