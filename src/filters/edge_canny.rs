use wasm_bindgen::prelude::*;

/// Backward-compatible default: equivalent to JS `edgeDetectionCannySimple(..., { strength: 'medium' })`
#[wasm_bindgen]
pub fn edge_detection_canny(ptr: *mut u8, width: u32, height: u32) {
    edge_detection_canny_strength(ptr, width, height, "medium".to_string());
}

/// Config wrapper kept for compatibility. We map the legacy `sigma` to the closest preset:
/// sigma >= 1.8 -> 'low', sigma < 1.0 -> 'high', otherwise 'medium'.
/// Note: thresholds now follow the simplified method (fractions of max NMS), ignoring `high_percentile/low_ratio`.
#[wasm_bindgen]
pub fn edge_detection_canny_cfg(
    ptr: *mut u8,
    width: u32,
    height: u32,
    _high_percentile: f32,
    _low_ratio: f32,
    sigma: f32,
) {
    let strength = if sigma >= 1.8 {
        "low"
    } else if sigma < 1.0 {
        "high"
    } else {
        "medium"
    };
    edge_detection_canny_strength(ptr, width, height, strength.to_string());
}

/// New simple API: strength in {"low","medium","high"} — mirrors JS
#[wasm_bindgen]
pub fn edge_detection_canny_strength(ptr: *mut u8, width: u32, height: u32, strength: String) {
    let len = (width * height * 4) as usize;
    let mem = unsafe { std::slice::from_raw_parts_mut(ptr, len) };

    let w = width as usize;
    let h = height as usize;
    if w < 3 || h < 3 { return; }

    // --- 1) RGBA -> grayscale (0..255 as f32)
    let mut gray: Vec<f32> = vec![0.0; w * h];
    for y in 0..h {
        for x in 0..w {
            let i = (y * w + x) * 4;
            let r = mem[i] as i32;
            let g = mem[i + 1] as i32;
            let b = mem[i + 2] as i32;
            gray[y * w + x] = ((77 * r + 150 * g + 29 * b) >> 8) as f32;
        }
    }

    // --- 2) Gaussian blur (separable) with preset kernel
    let (k, norm, high_frac, low_frac) = preset_for_strength(&strength);
    let blurred = gaussian_blur_separable_with_kernel(&gray, w, h, k, norm);

    // --- 3) Sobel -> magnitude & 4-dir quantized orientation
    let (mag, dir) = sobel_mag_dir(&blurred, w, h);

    // --- 4) Non-Maximum Suppression (classic)
    let nms = non_maximum_suppression(&mag, &dir, w, h);

    // --- 5) Thresholds as fractions of max(NMS) + hysteresis
    let mut max_v = 0.0f32;
    for &v in &nms {
        if v > max_v { max_v = v; }
    }
    let high = high_frac * max_v;
    let low  = low_frac  * max_v;

    let edges = double_threshold_and_hysteresis_abs(&nms, w, h, high, low);

    // Default stroke to match JS default ('medium')
    let mask = post_thicken_bool(&edges, w, h, "medium");

    // --- 6) Write back RGBA (binary)
    for y in 0..h {
        for x in 0..w {
            let o = (y * w + x) * 4;
            let v = if mask[y * w + x] { 255u8 } else { 0u8 };
            mem[o] = v;
            mem[o + 1] = v;
            mem[o + 2] = v;
            mem[o + 3] = 255u8;
        }
    }
}

/// New API with stroke control: {"thin","medium","thick"}
#[wasm_bindgen]
pub fn edge_detection_canny_strength_stroke(ptr: *mut u8, width: u32, height: u32, strength: String, stroke: String) {
    let len = (width * height * 4) as usize;
    let mem = unsafe { std::slice::from_raw_parts_mut(ptr, len) };

    let w = width as usize;
    let h = height as usize;
    if w < 3 || h < 3 { return; }

    // 1) grayscale
    let mut gray: Vec<f32> = vec![0.0; w * h];
    for y in 0..h {
        for x in 0..w {
            let i = (y * w + x) * 4;
            let r = mem[i] as i32;
            let g = mem[i + 1] as i32;
            let b = mem[i + 2] as i32;
            gray[y * w + x] = ((77 * r + 150 * g + 29 * b) >> 8) as f32;
        }
    }

    // 2) blur (preset)
    let (k, norm, high_frac, low_frac) = preset_for_strength(&strength);
    let blurred = gaussian_blur_separable_with_kernel(&gray, w, h, k, norm);

    // 3) sobel
    let (mag, dir) = sobel_mag_dir(&blurred, w, h);

    // 4) nms
    let nms = non_maximum_suppression(&mag, &dir, w, h);

    // 5) thresholds (fractions of max) + hysteresis
    let mut max_v = 0.0f32;
    for &v in &nms { if v > max_v { max_v = v; } }
    let high = high_frac * max_v;
    let low  = low_frac  * max_v;
    let edges = double_threshold_and_hysteresis_abs(&nms, w, h, high, low);

    // 5b) optional thickening
    let mask = post_thicken_bool(&edges, w, h, &stroke);

    // 6) write back
    for y in 0..h {
        for x in 0..w {
            let o = (y * w + x) * 4;
            let v = if mask[y * w + x] { 255u8 } else { 0u8 };
            mem[o] = v;
            mem[o + 1] = v;
            mem[o + 2] = v;
            mem[o + 3] = 255u8;
        }
    }
}

// ----------------- Helpers -----------------

#[inline]
fn preset_for_strength(strength: &str) -> (&'static [f32], f32, f32, f32) {
    // Mirrors JS kernelAndThresholdForStrength()
    match strength.to_ascii_lowercase().as_str() {
        "low" => (
            &[1.0, 6.0, 15.0, 20.0, 15.0, 6.0, 1.0], // 7-tap Pascal
            64.0,
            0.25, // highFrac
            0.10, // lowFrac
        ),
        "high" => (
            &[1.0, 2.0, 1.0], // 3-tap
            4.0,
            0.15,
            0.06,
        ),
        _ => ( // "medium"
            &[1.0, 4.0, 6.0, 4.0, 1.0], // 5-tap Pascal
            16.0,
            0.20,
            0.08,
        ),
    }
}

#[inline]
fn gaussian_blur_separable_with_kernel(src: &[f32], w: usize, h: usize, k: &[f32], norm: f32) -> Vec<f32> {
    let r: isize = (k.len() as isize - 1) / 2;
    let mut tmp = vec![0.0f32; w * h];
    let mut dst = vec![0.0f32; w * h];

    // Horizontal
    for y in 0..h {
        for x in 0..w {
            let mut acc = 0.0f32;
            for i in -r..=r {
                let xx = clamp_i32(x as i32 + i as i32, 0, (w - 1) as i32) as usize;
                acc += src[y * w + xx] * k[(i + r) as usize];
            }
            tmp[y * w + x] = acc / norm;
        }
    }

    // Vertical
    for y in 0..h {
        for x in 0..w {
            let mut acc = 0.0f32;
            for i in -r..=r {
                let yy = clamp_i32(y as i32 + i as i32, 0, (h - 1) as i32) as usize;
                acc += tmp[yy * w + x] * k[(i + r) as usize];
            }
            dst[y * w + x] = acc / norm;
        }
    }
    dst
}

#[inline]
fn sobel_mag_dir(src: &[f32], w: usize, h: usize) -> (Vec<f32>, Vec<u8>) {
    const GX: [i32; 9] = [-1, 0, 1, -2, 0, 2, -1, 0, 1];
    const GY: [i32; 9] = [-1, -2, -1, 0, 0, 0, 1, 2, 1];
    let mut mag = vec![0.0f32; w * h];
    let mut dir = vec![0u8; w * h];
    for y in 1..(h - 1) {
        for x in 1..(w - 1) {
            let mut gx = 0.0f32;
            let mut gy = 0.0f32;
            let mut k = 0usize;
            for ky in 0..3 {
                for kx in 0..3 {
                    let ix = x + kx - 1;
                    let iy = y + ky - 1;
                    let v = src[iy * w + ix];
                    gx += v * (GX[k] as f32);
                    gy += v * (GY[k] as f32);
                    k += 1;
                }
            }
            let m = (gx * gx + gy * gy).sqrt();
            mag[y * w + x] = m;

            let mut angle = gy.atan2(gx).to_degrees();
            if angle < 0.0 { angle += 180.0; }
            let q = if angle < 22.5 || angle >= 157.5 { 0u8 }
                else if angle < 67.5 { 1u8 }
                else if angle < 112.5 { 2u8 }
                else { 3u8 };
            dir[y * w + x] = q;
        }
    }
    (mag, dir)
}

#[inline]
fn non_maximum_suppression(mag: &[f32], dir: &[u8], w: usize, h: usize) -> Vec<f32> {
    let mut out = vec![0.0f32; w * h];
    for y in 1..(h - 1) {
        for x in 1..(w - 1) {
            let m = mag[y * w + x];
            let (m1, m2) = match dir[y * w + x] {
                0 => (mag[y * w + x - 1], mag[y * w + x + 1]),
                1 => (mag[(y - 1) * w + x + 1], mag[(y + 1) * w + x - 1]),
                2 => (mag[(y - 1) * w + x], mag[(y + 1) * w + x]),
                _ => (mag[(y - 1) * w + x - 1], mag[(y + 1) * w + x + 1]),
            };
            out[y * w + x] = if m >= m1 && m >= m2 { m } else { 0.0 };
        }
    }
    out
}

#[inline]
fn double_threshold_and_hysteresis_abs(nms: &[f32], w: usize, h: usize, high: f32, low: f32) -> Vec<bool> {
    let mut state = vec![0u8; w * h]; // 0 none, 1 weak, 2 strong
    for i in 0..(w * h) {
        let v = nms[i];
        state[i] = if v >= high { 2 } else if v >= low { 1 } else { 0 };
    }

    // Seed strong
    let mut stack: Vec<usize> = Vec::new();
    for y in 1..(h - 1) {
        for x in 1..(w - 1) {
            let i = y * w + x;
            if state[i] == 2 { stack.push(i); }
        }
    }

    // Promote connected weak
    while let Some(i) = stack.pop() {
        let x = i % w;
        let y = i / w;
        for ny in (y.saturating_sub(1))..=usize::min(y + 1, h - 1) {
            for nx in (x.saturating_sub(1))..=usize::min(x + 1, w - 1) {
                if nx == x && ny == y { continue; }
                let j = ny * w + nx;
                if state[j] == 1 { state[j] = 2; stack.push(j); }
            }
        }
    }

    state.into_iter().map(|s| s == 2).collect()
}

fn post_thicken_bool(src: &Vec<bool>, w: usize, h: usize, stroke: &str) -> Vec<bool> {
    match stroke.to_ascii_lowercase().as_str() {
        "medium" => dilate_binary_bool(src, w, h, 1, 1),
        "thick"  => dilate_binary_bool(src, w, h, 2, 1),
        _        => src.clone(), // thin
    }
}

fn dilate_binary_bool(src: &Vec<bool>, w: usize, h: usize, r: usize, iters: usize) -> Vec<bool> {
    let mut cur = src.clone();
    let mut out = vec![false; w * h];
    for _ in 0..iters {
        for y in 0..h {
            for x in 0..w {
                let mut v = false;
                let y0 = y.saturating_sub(r);
                let y1 = usize::min(y + r, h - 1);
                let x0 = x.saturating_sub(r);
                let x1 = usize::min(x + r, w - 1);
                'outer: for ny in y0..=y1 {
                    for nx in x0..=x1 {
                        if cur[ny * w + nx] { v = true; break 'outer; }
                    }
                }
                out[y * w + x] = v;
            }
        }
        std::mem::swap(&mut cur, &mut out);
    }
    cur
}

#[inline]
fn clamp_i32(v: i32, lo: i32, hi: i32) -> i32 { v.max(lo).min(hi) }