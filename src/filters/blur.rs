use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub fn gaussian_blur(ptr: *mut u8, width: u32, height: u32) {
    let size = (width * height * 4) as usize;
    let mem = unsafe { std::slice::from_raw_parts_mut(ptr, size) };

    let kernel_size = 25;
    let radius = kernel_size / 2;
    let sigma = 10.0;

    let mut kernel = vec![0.0; kernel_size * kernel_size];
    let mut sum = 0.0;

    // Generate gaussian kernel
    for y in 0..kernel_size {
        for x in 0..kernel_size {
            let dx = ((x as i32) - (radius as i32)) as f64;
            let dy = ((y as i32) - (radius as i32)) as f64;
            let value = (-(dx * dx + dy * dy) / (2.0 * sigma * sigma)).exp();
            kernel[y * kernel_size + x] = value;
            sum += value;
        }
    }
    for v in kernel.iter_mut() {
        *v /= sum;
    }

    let original = mem.to_vec(); // make a copy to read from

    for y in 0..height {
        for x in 0..width {
            let mut r = 0.0;
            let mut g = 0.0;
            let mut b = 0.0;
            let mut a = 0.0;

            for ky in 0..kernel_size {
                for kx in 0..kernel_size {
                    let ix = ((x as i32) + (kx as i32) - (radius as i32)).clamp(
                        0,
                        (width - 1) as i32
                    ) as u32;
                    let iy = ((y as i32) + (ky as i32) - (radius as i32)).clamp(
                        0,
                        (height - 1) as i32
                    ) as u32;

                    let idx = ((iy * width + ix) * 4) as usize;
                    let weight = kernel[ky * kernel_size + kx];

                    r += (original[idx] as f64) * weight;
                    g += (original[idx + 1] as f64) * weight;
                    b += (original[idx + 2] as f64) * weight;
                    a += (original[idx + 3] as f64) * weight;
                }
            }

            let out_idx = ((y * width + x) * 4) as usize;
            mem[out_idx] = r.round().clamp(0.0, 255.0) as u8;
            mem[out_idx + 1] = g.round().clamp(0.0, 255.0) as u8;
            mem[out_idx + 2] = b.round().clamp(0.0, 255.0) as u8;
            mem[out_idx + 3] = a.round().clamp(0.0, 255.0) as u8;
        }
    }
}