/* tslint:disable */
/* eslint-disable */
export function alloc(size: number): number;
export function free(ptr: number, size: number): void;
export function gaussian_blur(ptr: number, width: number, height: number): void;
export function grayscale(ptr: number, width: number, height: number): void;
export function edge_detection(ptr: number, width: number, height: number): void;
export function get_allocated_memory_mb(): number;

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
  readonly memory: WebAssembly.Memory;
  readonly alloc: (a: number) => number;
  readonly free: (a: number, b: number) => void;
  readonly gaussian_blur: (a: number, b: number, c: number) => void;
  readonly grayscale: (a: number, b: number, c: number) => void;
  readonly edge_detection: (a: number, b: number, c: number) => void;
  readonly get_allocated_memory_mb: () => number;
  readonly __wbindgen_export_0: WebAssembly.Table;
  readonly __wbindgen_start: () => void;
}

export type SyncInitInput = BufferSource | WebAssembly.Module;
/**
* Instantiates the given `module`, which can either be bytes or
* a precompiled `WebAssembly.Module`.
*
* @param {{ module: SyncInitInput }} module - Passing `SyncInitInput` directly is deprecated.
*
* @returns {InitOutput}
*/
export function initSync(module: { module: SyncInitInput } | SyncInitInput): InitOutput;

/**
* If `module_or_path` is {RequestInfo} or {URL}, makes a request and
* for everything else, calls `WebAssembly.instantiate` directly.
*
* @param {{ module_or_path: InitInput | Promise<InitInput> }} module_or_path - Passing `InitInput` directly is deprecated.
*
* @returns {Promise<InitOutput>}
*/
export default function __wbg_init (module_or_path?: { module_or_path: InitInput | Promise<InitInput> } | InitInput | Promise<InitInput>): Promise<InitOutput>;
