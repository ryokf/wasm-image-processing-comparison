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
    // let original = unsafe { std::slice::from_raw_parts(ptr, size) };
    // let original = &*mem as &[u8];

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

#[wasm_bindgen]
pub fn grayscale(ptr: *mut u8, width: u32, height: u32) {
    //    let len = (width * height * 4) as usize;

    //     // Log jumlah byte yang akan diproses
    //     web_sys::console::log_1(&format!("Grayscale processing {} bytes", len).into());

    //     let data = unsafe { std::slice::from_raw_parts_mut(ptr, len) };
    //     for i in (0..len).step_by(4) {
    //         let r = data[i] as u32;
    //         let g = data[i + 1] as u32;
    //         let b = data[i + 2] as u32;
    //         let y = (0.21 * (r as f64) + 0.72 * (g as f64) + 0.07 * (b as f64)) as u8;
    //         data[i] = y;
    //         data[i + 1] = y;
    //         data[i + 2] = y;
    //     }

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

#[wasm_bindgen]
pub fn edge_detection(ptr: *mut u8, width: u32, height: u32) {
   let len = (width * height * 4) as usize;
    let mem = unsafe { std::slice::from_raw_parts_mut(ptr, len) };

    let gx: [i32; 9] = [-1, 0, 1, -2, 0, 2, -1, 0, 1];
    let gy: [i32; 9] = [-1, -2, -1, 0, 0, 0, 1, 2, 1];

    let mut output = vec![0u8; len];

    for y in 1..(height - 1) {
        for x in 1..(width - 1) {
            let mut sum_x = 0.0;
            let mut sum_y = 0.0;

            for ky in 0..3 {
                for kx in 0..3 {
                    let ix = (x + kx - 1) as usize;
                    let iy = (y + ky - 1) as usize;
                    let idx = (iy * width as usize + ix) * 4;
                    let gray = 0.21 * mem[idx] as f64 + 0.72 * mem[idx + 1] as f64 + 0.07 * mem[idx + 2] as f64;
                    let k = ky * 3 + kx;
                    sum_x += gray * gx[k as usize] as f64;
                    sum_y += gray * gy[k as usize] as f64;
                }
            }

            let mag = (sum_x * sum_x + sum_y * sum_y).sqrt().clamp(0.0, 255.0) as u8;
            let out_idx = ((y * width + x) * 4) as usize;
            output[out_idx] = mag;
            output[out_idx + 1] = mag;
            output[out_idx + 2] = mag;
            output[out_idx + 3] = 255;
        }
    }

    mem.copy_from_slice(&output);
}

#[wasm_bindgen]
pub fn get_allocated_memory_mb() -> f64 {
    ALLOCATED_BYTES.with(|bytes| {
        let allocated = bytes.get();
        let mb = (allocated as f64) / (1024.0 * 1024.0);
        mb
    })
}
