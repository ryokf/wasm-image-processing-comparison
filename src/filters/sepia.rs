use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub fn sepia(ptr: *mut u8, width: u32, height: u32) {
    let len = (width * height * 4) as usize;
    let data = unsafe { std::slice::from_raw_parts_mut(ptr, len) };

    for i in (0..len).step_by(4) {
        let r = data[i] as f64;
        let g = data[i + 1] as f64;
        let b = data[i + 2] as f64;

        let tr = (0.393 * r + 0.769 * g + 0.189 * b).min(255.0);
        let tg = (0.349 * r + 0.686 * g + 0.168 * b).min(255.0);
        let tb = (0.272 * r + 0.534 * g + 0.131 * b).min(255.0);

        data[i] = tr as u8;
        data[i + 1] = tg as u8;
        data[i + 2] = tb as u8;
        // Alpha tetap
    }
}