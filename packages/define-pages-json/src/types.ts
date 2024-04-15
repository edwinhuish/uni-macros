export * from './uniapp';

export type MaybePromise<T> = T | Promise<T>;
export type MaybeCallable<T> = T | (() => T);
