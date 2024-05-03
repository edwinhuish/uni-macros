import type { File } from './file';
import type { MaybePromiseCallable, PagesJsonPage, TabBarItem } from './types';
import path from 'node:path';
import { slash } from '@antfu/utils';
import { DEFINE_PAGE } from './constant';
import { debug } from './utils';

export interface DefineTabbarOptions extends Partial<TabBarItem> {
  /**
   * 配置tabbar路径
   * @deprecated 无效，将会根据文件路径自动生成
   */
  pagePath?: string;

  /**
   * 排序，数值越小越靠前
   */
  index?: number;
};

export type PageType = 'home' | 'normal';

export interface DefinePageOptions extends Partial<PagesJsonPage> {
  /**
   * 配置页面路径
   * @deprecated 无效，将会根据文件路径自动生成
   */
  path?: string;

  /** 页面类型， */
  type?: PageType;

  /**
   * 配置 tabbar 属性
   */
  tabbar?: DefineTabbarOptions;
}

// eslint-disable-next-line unused-imports/no-unused-vars
export function definePage(options: MaybePromiseCallable<DefinePageOptions>) {
}

export class Page {
  readonly file: File;

  private _uri: string | undefined;

  /** raw copy of options */
  private rawOptions: string = '';

  /** page options in `pages.json` */
  private options: DefinePageOptions | undefined;

  type: PageType = 'normal';

  constructor(file: File) {
    this.file = file;
    file.page = this;
  }

  get uri() {
    if (!this._uri) {
      const { relativePath } = this.file;
      const p = slash(relativePath);
      this._uri = slash(p.replace(path.extname(p), ''));
    }
    return this._uri;
  }

  async getPageOptions(forceUpdate = false) {
    if (forceUpdate || !this.options) {
      await this.readOptions();
    }

    const { path: _, tabbar: __, type: pageType, ...others } = this.options!;

    const options: PagesJsonPage = {
      path: this.uri,
      ...others,
    };

    this.type = pageType || 'normal';

    return options;
  }

  async getTabbarOptions(forceUpdate = false) {
    if (forceUpdate || !this.options) {
      await this.readOptions();
    }

    const { tabbar } = this.options!;

    if (!tabbar) {
      return;
    }

    const { pagePath: _, index = 0, ...others } = tabbar;

    const options: TabBarItem & { index: number } = {
      index,
      pagePath: this.uri,
      ...others,
    };

    return options;
  }

  async hasChanged() {
    const { hasChanged } = await this.readOptions();
    return hasChanged;
  }

  async readOptions() {
    const { absolutePath } = this.file;
    try {
      const options = await this.file.getScriptSetup()?.getMacroResult<DefinePageOptions>(DEFINE_PAGE);

      this.options = options || {};

      const raw = JSON.stringify(this.options!);
      const hasChanged = this.rawOptions !== raw;
      this.rawOptions = raw;
      return {
        options: this.options,
        hasChanged,
      };
    }
    catch (err: any) {
      const msg = `Read page options fail in ${absolutePath}\n${err.message}`;
      debug.error(msg);
      throw err;
    }
  }
}
