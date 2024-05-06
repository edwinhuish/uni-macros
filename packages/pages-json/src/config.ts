import type { DebugType } from './utils';
import path from 'node:path';
import process from 'node:process';
import { DTS_FILE_NAME, OUTPUT_NAME } from './constant';
import { enableDebug } from './utils';

export interface UserConfig {

  /**
   * Project's root path
   * @default resolves to the `root` value from Vite config.
   */
  root?: string;

  /**
   * pages.json dir
   * @default "src"
   */
  basePath?: string;

  /**
   * Generate TypeScript declaration for pages path
   * Accept path related to project root
   * null to disable it
   * @default basePath
   */
  dts?: string | null;

  /**
   * Paths to the directory to search for page components.
   * @default 'src/pages'
   */
  pages?: string;

  /**
   * all root directories loaded by subPackages
   * @default []
   */
  subPackages?: string[];

  /**
   * exclude page
   * @default ['node_modules', '.git', '** /__*__/ **']
   */
  exclude?: string[];

  /**
   * Scan files deep
   * @default 3
   */
  fileDeep?: number;

  /**
   * enable debug log
   * @default false
   */
  debug?: boolean | DebugType;
}

export interface ResolvedConfig extends Required<UserConfig> {
  pagesJsonFile: string;
}

let resolvedConfig: ResolvedConfig | undefined;

export function resolveConfig(useConfig: UserConfig): ResolvedConfig {
  const {
    root = process.cwd(),
    basePath = 'src',
    dts,
    pages = 'src/pages',
    subPackages = [],
    exclude = ['node_modules', '.git', '**/__*__/**'],
    fileDeep = 3,
    debug = false,
  } = useConfig;

  enableDebug(debug);

  resolvedConfig = {
    root,
    get dts() {
      return dts == null
        ? path.resolve(this.basePath, DTS_FILE_NAME)
        : path.isAbsolute(dts) ? dts : path.resolve(this.basePath, dts);
    },
    pages,
    subPackages,
    get basePath() {
      return path.resolve(this.root, basePath);
    },
    exclude,
    fileDeep,
    debug,
    get pagesJsonFile() {
      return path.join(this.basePath, OUTPUT_NAME);
    },
  };

  return resolvedConfig!;
}

export function getConfig() {
  if (!resolvedConfig) {
    return resolveConfig({});
  }

  return resolvedConfig;
}
