use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub fn grayscale(ptr: *mut u8, width: u32, height: u32) {
    let len = (width * height * 4) as usize;
    let data = unsafe { std::slice::from_raw_parts_mut(ptr, len) };
    for i in (0..len).step_by(4) {
        let r = data[i] as f64;
        let g = data[i + 1] as f64;
        let b = data[i + 2] as f64;
        let y = (0.21 * r + 0.72 * g + 0.07 * b).round() as u8;
        data[i] = y;
        data[i + 1] = y;
        data[i + 2] = y;
        // Alpha (data[i + 3]) tetap
    }
}