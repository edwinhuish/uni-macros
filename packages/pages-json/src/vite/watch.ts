import type { FSWatcher, ViteDevServer } from 'vite';
import { ctx } from '../context';
import { getPagesConfigFiles, loadPagesConfig } from '../pagesJson';
import { debug } from '../utils';

let _server: ViteDevServer | undefined;

export function setupViteServer(server: ViteDevServer) {
  if (_server === server) {
    return;
  }

  _server = server;
  setupWatcher(server.watcher);
}

export async function setupWatcher(watcher: FSWatcher) {
  const configsFiles = await getPagesConfigFiles();

  watcher.add(configsFiles);

  watcher.on('add', async (file) => {
    if (!ctx.files.has(file)) {
      return;
    }

    debug.watcher(`File added: ${file}`);

    await ctx.updatePagesJSON();
  });

  watcher.on('change', async (file) => {
    if (!ctx.files.has(file)) {
      return;
    }

    debug.watcher(`File changed: ${file}`);

    await ctx.updatePagesJSON(file);
  });

  watcher.on('change', async (file) => {
    if (!configsFiles.includes(file)) {
      return;
    }
    debug.watcher(`Config source changed: ${file}`);

    await loadPagesConfig(true);

    await ctx.updatePagesJSON();
  });

  watcher.on('unlink', async (file) => {
    if (!ctx.files.has(file)) {
      return;
    }

    debug.watcher(`File removed: ${file}`);

    await ctx.updatePagesJSON();
  });
}
