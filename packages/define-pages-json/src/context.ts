import type { UserConfig } from './config';
import type { PagesJson, PagesJsonPage, PagesJsonSubPackage, TabBarItem, TabBarItemList } from './types';
import type { TabBar } from './uniapp/tabBar';
import fs from 'node:fs';
import path from 'node:path';
import fg from 'fast-glob';
import { getConfig, resolveConfig } from './config';
import { FILE_EXTENSIONS } from './constant';
import { writeDeclaration } from './declaration';
import { File } from './file';
import { Page } from './page';
import { checkPagesJsonFile, getPagesConfig } from './pagesJson';
import { deepMerge } from './utils';
import { debug } from './utils/debug';

let lastPagesJson = '';

export class Context {
  /** Map<filepath, File> */
  files = new Map<string, File>();

  /** Map<path, Page> */
  pages = new Map<string, Page>();
  /** Map<root, Map<path, Page>> */
  subPackages = new Map<string, Map<string, Page>>();

  get config() {
    return getConfig();
  }

  init(config: UserConfig = {}) {
    resolveConfig(config);

    this.files.clear();
    this.pages.clear();
    this.subPackages.clear();
  }

  async scanFiles() {
    const files = new Map<string, File>();
    const pages = new Map<string, Page>();

    // pages
    listFiles(this.config.pages, {
      cwd: this.config.root,
      ignore: this.config.exclude,
      deep: this.config.fileDeep,
    }).forEach((p) => {
      const file = this.files.get(p) || new File(p);
      files.set(p, file);
      debug.scanFiles(`pages: ${p}`);

      const page = this.pages.get(p) || new Page(file);
      pages.set(p, page);
    });

    this.pages = pages;

    // subPackages
    const subPackages = new Map<string, Map<string, Page>>();
    for (const dir of this.config.subPackages) {
      const subPages = new Map<string, Page>();

      const root = path.basename(dir);

      listFiles(dir, {
        cwd: this.config.root,
        ignore: this.config.exclude,
        deep: this.config.fileDeep,
      }).forEach((p) => {
        const file = this.files.get(p) || new File(p);
        files.set(p, file);
        debug.scanFiles(`subPackages: ${p}`);

        const page = this.subPackages.get(root)?.get(p) || new Page(file);
        subPages.set(p, page);
      });

      subPackages.set(root, subPages);
    }

    this.subPackages = subPackages;

    this.files = files;
    return this.files;
  }

  async updatePagesJSON(filepath?: string) {
    if (filepath) {
      const page = this.getPageByPath(filepath);
      if (page && !await page.hasChanged()) {
        debug.updatePagesJSON(`The route block on page ${filepath} did not send any changes, skipping`);
        return false;
      }
    }

    checkPagesJsonFile();

    const pagesJSON = await getPagesConfig();

    await this.scanFiles();

    await this.mergePagesOptions(pagesJSON);
    await this.mergeSubPackagesOptions(pagesJSON);
    await this.mergeTabbarOptions(pagesJSON);

    const raw = JSON.stringify(pagesJSON, null, 4);

    if (lastPagesJson === raw) {
      debug.updatePagesJSON('pages json has no changed');
      return false;
    }

    fs.writeFileSync(this.config.pagesJsonFile, raw);

    if (this.config.dts) {
      writeDeclaration(pagesJSON, this.config.dts);
    }

    lastPagesJson = raw;
    return true;
  }

  private async mergePagesOptions(pagesJSON: PagesJson) {
    const options = await this.getPagesOptions();

    const { pages } = pagesJSON;

    pagesJSON.pages = uniquePagesOptions([...(pages || []), ...options]);
  }

  private async mergeSubPackagesOptions(pagesJSON: PagesJson) {
    const options = await this.getSubPackagesOptions();

    let { subPackages } = pagesJSON;

    subPackages = subPackages || [];

    subPackages.forEach((pkg) => {
      const idx = options.findIndex(p => p.root === pkg.root);
      if (idx !== -1) {
        const [found] = options.splice(idx, 1);
        pkg.pages = uniquePagesOptions([...(pkg.pages || []), ...(found.pages || [])]);
      }
    });

    pagesJSON.subPackages = [...subPackages, ...options];
  }

  private async mergeTabbarOptions(pagesJSON: PagesJson) {
    const options = await this.getTabbarOptions();

    const emptyTabbar = { list: [] } as unknown as TabBar;

    const { tabBar = emptyTabbar } = pagesJSON;

    if (!options.length) {
      return;
    }

    tabBar.list = tabBar.list || [];

    const list = tabBar.list.map((tb) => {
      if (!tb) {
        return tb;
      }

      const idx = options.findIndex(p => p.pagePath === tb.pagePath);
      if (idx === -1) {
        return tb;
      }

      const [found] = options.splice(idx, 1);
      return deepMerge(tb, found);
    });

    tabBar.list = [...list, ...options].slice(0, 5) as TabBarItemList;

    pagesJSON.tabBar = tabBar;
  }

  async getPagesOptions() {
    const options: PagesJsonPage[] = [];

    const pages = [...this.pages.values()];

    // sort home page in top
    pages.sort(page => page.type === 'home' ? -1 : 0);

    for (const page of pages) {
      const opt = await page.getPageOptions();
      options.push(opt);
    }

    return uniquePagesOptions(options);
  }

  async getSubPackagesOptions() {
    const packages = new Map<string, PagesJsonSubPackage>();

    for (const [root, map] of this.subPackages) {
      const options: PagesJsonPage[] = [];

      for (const [_, page] of map) {
        const opt = await page.getPageOptions();
        opt.path = path.relative(root, opt.path);
        options.push(opt);
      }

      const pages = uniquePagesOptions(options);

      packages.set(root, { root, pages });
    }

    return Array.from(packages, ([_, pkg]) => pkg);
  }

  async getTabbarOptions() {
    const options = new Map<string, TabBarItem & { index: number }>();

    for (const [_, page] of this.pages) {
      const opt = await page.getTabbarOptions();

      if (!opt) {
        continue;
      }

      const cached = options.get(opt.pagePath) || {} as any;
      options.set(opt.pagePath, deepMerge(cached, opt));
    }

    const tabbars: TabBarItem[] = Array.from(options, ([_, opt]) => opt)
      .sort((a, b) => a.index - b.index)
      .map((item) => {
        const { index: _, ...opt } = item;
        return opt;
      });

    return tabbars;
  }

  private getPageByPath(filepath: string) {
    const file = this.files.get(filepath);

    return file?.page;
  }
}

export const ctx = new Context();

function listFiles(dir: string, options: fg.Options = {}) {
  const { cwd, ignore = [], deep = 3, ...others } = options;
  const source = FILE_EXTENSIONS.map(ext => path.join(dir, '**', `*.${ext}`));
  const files = fg.sync(source, {
    cwd,
    ignore,
    deep,
    ...others,
    onlyFiles: true,
    dot: true,
    unique: true,
    absolute: true,
  });

  return files;
}

function uniquePagesOptions(options: PagesJsonPage[], merge = true): PagesJsonPage[] {
  const store = new Map<string, PagesJsonPage>();

  for (const opt of options) {
    const cached = store.get(opt.path) || {} as PagesJsonPage;
    if (merge) {
      store.set(opt.path, deepMerge(cached, opt));
    }
    else {
      store.set(opt.path, opt);
    }
  }

  return Array.from(store, ([_, opt]) => opt);
}
