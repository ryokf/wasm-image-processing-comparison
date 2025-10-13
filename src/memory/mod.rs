use wasm_bindgen::prelude::*;
use std::cell::Cell;

thread_local! {
    static ALLOCATED_BYTES: Cell<usize> = Cell::new(0);
}

#[wasm_bindgen]
pub fn alloc(size: usize) -> *mut u8 {
    let mut buffer = Vec::with_capacity(size);
    let ptr = buffer.as_mut_ptr();
    std::mem::forget(buffer);

    ALLOCATED_BYTES.with(|bytes| {
        let current = bytes.get();
        bytes.set(current + size);
    });

    return ptr;
}

#[wasm_bindgen]
pub fn free(ptr: *mut u8, size: usize) {
    unsafe {
        let _ = Vec::from_raw_parts(ptr, 0, size);
    }
}

#[wasm_bindgen]
pub fn get_allocated_memory_mb() -> f64 {
    ALLOCATED_BYTES.with(|bytes| {
        let allocated = bytes.get();
        (allocated as f64) / (1024.0 * 1024.0)
    })
}