/* tslint:disable */
/* eslint-disable */
/**
 * Backward-compatible default: equivalent to JS `edgeDetectionCannySimple(..., { strength: 'medium' })`
 */
export function edge_detection_canny(ptr: number, width: number, height: number): void;
/**
 * Config wrapper kept for compatibility. We map the legacy `sigma` to the closest preset:
 * sigma >= 1.8 -> 'low', sigma < 1.0 -> 'high', otherwise 'medium'.
 * Note: thresholds now follow the simplified method (fractions of max NMS), ignoring `high_percentile/low_ratio`.
 */
export function edge_detection_canny_cfg(ptr: number, width: number, height: number, _high_percentile: number, _low_ratio: number, sigma: number): void;
/**
 * New simple API: strength in {"low","medium","high"} — mirrors JS
 */
export function edge_detection_canny_strength(ptr: number, width: number, height: number, strength: string): void;
/**
 * New API with stroke control: {"thin","medium","thick"}
 */
export function edge_detection_canny_strength_stroke(ptr: number, width: number, height: number, strength: string, stroke: string): void;
export function gaussian_blur(ptr: number, width: number, height: number): void;
export function edge_detection_sobel(ptr: number, width: number, height: number): void;
export function grayscale(ptr: number, width: number, height: number): void;
export function alloc(size: number): number;
export function free(ptr: number, size: number): void;
export function get_allocated_memory_mb(): number;
export function sepia(ptr: number, width: number, height: number): void;

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
  readonly memory: WebAssembly.Memory;
  readonly edge_detection_canny: (a: number, b: number, c: number) => void;
  readonly edge_detection_canny_cfg: (a: number, b: number, c: number, d: number, e: number, f: number) => void;
  readonly edge_detection_canny_strength: (a: number, b: number, c: number, d: number, e: number) => void;
  readonly edge_detection_canny_strength_stroke: (a: number, b: number, c: number, d: number, e: number, f: number, g: number) => void;
  readonly gaussian_blur: (a: number, b: number, c: number) => void;
  readonly edge_detection_sobel: (a: number, b: number, c: number) => void;
  readonly grayscale: (a: number, b: number, c: number) => void;
  readonly alloc: (a: number) => number;
  readonly free: (a: number, b: number) => void;
  readonly get_allocated_memory_mb: () => number;
  readonly sepia: (a: number, b: number, c: number) => void;
  readonly __wbindgen_export_0: WebAssembly.Table;
  readonly __wbindgen_malloc: (a: number, b: number) => number;
  readonly __wbindgen_realloc: (a: number, b: number, c: number, d: number) => number;
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
