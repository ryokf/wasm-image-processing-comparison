use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub fn edge_detection_sobel(ptr: *mut u8, width: u32, height: u32) {
    let len = (width * height * 4) as usize;
    let mem = unsafe { std::slice::from_raw_parts_mut(ptr, len) };

    // Integer Sobel kernels (3x3)
    const GX: [i32; 9] = [-1, 0, 1, -2, 0, 2, -1, 0, 1];
    const GY: [i32; 9] = [-1, -2, -1, 0, 0, 0, 1, 2, 1];

    // Threshold on squared gradient magnitude Gx^2 + Gy^2 (paper uses thresholding to avoid sqrt).
    // NOTE: Tune this value for your images; 4000 is a conservative starting point.
    const THRESHOLD_SQ: i32 = 4000;

    let mut output = vec![0u8; len];

    let w = width as usize;
    let h = height as usize;

    // Process interior pixels; borders remain 0
    for y in 1..(h - 1) {
        for x in 1..(w - 1) {
            let mut gx_sum: i32 = 0;
            let mut gy_sum: i32 = 0;

            // Convolution window 3x3
            let mut k = 0usize;
            for ky in 0..3 {
                for kx in 0..3 {
                    let ix = x + kx - 1;
                    let iy = y + ky - 1;
                    let idx = (iy * w + ix) * 4;

                    // Integer grayscale: approx 0.299R + 0.587G + 0.114B
                    // Using (77*R + 150*G + 29*B) >> 8
                    let r = mem[idx] as i32;
                    let g = mem[idx + 1] as i32;
                    let b = mem[idx + 2] as i32;
                    let gray = ((77 * r + 150 * g + 29 * b) >> 8) as i32;

                    gx_sum += gray * GX[k];
                    gy_sum += gray * GY[k];
                    k += 1;
                }
            }

            // Squared gradient magnitude (avoid sqrt)
            let mag2: i32 = gx_sum.saturating_mul(gx_sum)
                .saturating_add(gy_sum.saturating_mul(gy_sum));

            // Binary edge map per paper's thresholding approach
            let edge: u8 = if mag2 >= THRESHOLD_SQ { 255 } else { 0 };

            let out_idx = (y * w + x) * 4;
            output[out_idx] = edge;
            output[out_idx + 1] = edge;
            output[out_idx + 2] = edge;
            output[out_idx + 3] = 255;
        }
    }

    // Copy result back to the original RGBA buffer
    mem.copy_from_slice(&output);
}