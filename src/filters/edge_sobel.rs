use wasm_bindgen::prelude::*;

/// Calculate percentile-based threshold from an array of values.
/// This is robust to outliers and adaptive to image content.
///
/// Algorithm matches JavaScript implementation exactly:
/// 1. Filter out zero values
/// 2. Sort in ascending order
/// 3. Return value at floor(length * percentile)
fn calculate_percentile_threshold(values: &[i32], percentile: f32) -> i32 {
    // Filter out zero values (background/flat regions)
    let mut non_zero: Vec<i32> = values
        .iter()
        .copied()
        .filter(|&v| v > 0)
        .collect();

    if non_zero.is_empty() {
        return 0; // All zeros, no edges
    }

    // Sort in ascending order (same as JavaScript)
    non_zero.sort_unstable();

    // Calculate percentile index (floor to match JavaScript)
    let index = ((non_zero.len() as f32) * percentile).floor() as usize;

    // Clamp index to valid range
    let clamped_index = index.min(non_zero.len() - 1);

    non_zero[clamped_index]
}

#[wasm_bindgen]
pub fn edge_detection_sobel(ptr: *mut u8, width: u32, height: u32) {
    let len = (width * height * 4) as usize;
    let mem = unsafe { std::slice::from_raw_parts_mut(ptr, len) };

    // Integer Sobel kernels (3x3)
    const GX: [i32; 9] = [-1, 0, 1, -2, 0, 2, -1, 0, 1];
    const GY: [i32; 9] = [-1, -2, -1, 0, 0, 0, 1, 2, 1];

    // ADAPTIVE THRESHOLD: Use 85th percentile of gradient magnitudes
    // This is robust to outliers and works well for images of any size
    const PERCENTILE: f32 = 0.85;

    let mut output = vec![0u8; len];

    let w = width as usize;
    let h = height as usize;

    // Step 1: Compute all gradient magnitudes (squared to avoid sqrt)
    let mut magnitudes: Vec<i32> = Vec::with_capacity((w - 2) * (h - 2));

    // Process interior pixels; borders remain 0
    for y in 1..h - 1 {
        for x in 1..w - 1 {
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
            let mag2: i32 = gx_sum
                .saturating_mul(gx_sum)
                .saturating_add(gy_sum.saturating_mul(gy_sum));

            magnitudes.push(mag2);
        }
    }

    // Step 2: Calculate adaptive threshold using percentile
    let threshold_sq = calculate_percentile_threshold(&magnitudes, PERCENTILE);

    // Step 3: Apply threshold to create binary edge map
    let mut mag_index = 0;
    for y in 1..h - 1 {
        for x in 1..w - 1 {
            let mag2 = magnitudes[mag_index];
            mag_index += 1;

            // Binary edge map per paper's thresholding approach
            let edge: u8 = if mag2 >= threshold_sq { 255 } else { 0 };

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
