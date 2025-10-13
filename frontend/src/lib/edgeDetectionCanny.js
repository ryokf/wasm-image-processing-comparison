/**
 * CANNY (VERSI SEDERHANA & RAMAH AWAM)
 * ------------------------------------
 * Langkah: (1) Blur ringan  (2) Gradien Sobel  (3) Penipisan (NMS)
 *         (4) Ambang dua tingkat + hysteresis  (5) Tulis peta tepi biner
 *
 * Satu-satunya pengaturan: { strength: 'low' | 'medium' | 'high' }
 * - low    : hasil lebih halus (tepi lebih sedikit), cocok untuk gambar ber-noise
 * - medium : seimbang (default)
 * - high   : lebih sensitif (lebih banyak detail)
 */

export function edgeDetectionCannySimple(imageData, width, height, opts = {}) {
    const src = imageData.data;
    const w = width | 0;
    const h = height | 0;
    const N = w * h;

    const strength = opts.strength ?? 'medium';
    const { K, norm, highFrac, lowFrac } = kernelAndThresholdForStrength(strength);
    const stroke = opts.stroke ?? 'medium'; // 'thin' | 'medium' | 'thick'

    // --- 1) RGBA -> Grayscale (Float32) ---
    const gray = new Float32Array(N);
    for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
            const i = (y * w + x) * 4;
            // 0.299R + 0.587G + 0.114B ≈ (77R + 150G + 29B) >> 8
            gray[y * w + x] = ((77 * src[i] + 150 * src[i + 1] + 29 * src[i + 2]) >> 8);
        }
    }

    // --- 2) Gaussian blur (separable, kernel sederhana) ---
    const blurred = gaussianBlurSeparable(gray, w, h, K, norm);

    // --- 3) Gradien Sobel -> magnitudo & arah kuantisasi (0/45/90/135) ---
    const { mag, dir } = sobelMagDir(blurred, w, h);

    // --- 4) Non-Maximum Suppression (NMS klasik) ---
    const nms = nonMaximumSuppression(mag, dir, w, h);

    // --- 5) Double threshold + hysteresis (pakai fraksi dari maksimum NMS) ---
    let maxVal = 0;
    for (let i = 0; i < nms.length; i++) if (nms[i] > maxVal) maxVal = nms[i];
    const high = highFrac * maxVal;
    const low = lowFrac * maxVal;

    const edgeMask = doubleThresholdAndHysteresis(nms, w, h, high, low);

    // Optional: thicken edges for visibility
    const mask = postThicken(edgeMask, w, h, stroke);

    // --- 6) Tulis kembali sebagai RGBA biner ---
    const out = new Uint8ClampedArray(src.length);
    for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
            const o = (y * w + x) * 4;
            const v = mask[y * w + x] ? 255 : 0;
            out[o] = v; out[o + 1] = v; out[o + 2] = v; out[o + 3] = 255;
        }
    }

    return new ImageData(out, w, h);
}

// Backward-compat alias:
export const edgeDetectionCannyJS = edgeDetectionCannySimple;

// ----------------- Helpers -----------------

function kernelAndThresholdForStrength(strength) {
    // Tiga preset sederhana:
    // - 'low'   : blur lebih besar (7-tap), ambang lebih tinggi -> lebih bersih, detail berkurang
    // - 'medium': blur sedang (5-tap), ambang sedang
    // - 'high'  : blur ringan (3-tap), ambang lebih rendah -> lebih sensitif
    switch (strength) {
        case 'low':
            return {
                K: [1, 6, 15, 20, 15, 6, 1], norm: 64.0,
                highFrac: 0.25, lowFrac: 0.10
            };
        case 'high':
            return {
                K: [1, 2, 1], norm: 4.0,
                highFrac: 0.15, lowFrac: 0.06
            };
        default: // 'medium'
            return {
                K: [1, 4, 6, 4, 1], norm: 16.0,
                highFrac: 0.20, lowFrac: 0.08
            };
    }
}

function gaussianBlurSeparable(src, w, h, K, norm) {
    const r = (K.length - 1) >> 1;
    const tmp = new Float32Array(w * h);
    const dst = new Float32Array(w * h);

    // Horizontal
    for (let y = 0; y < h; y++) {
        const row = y * w;
        for (let x = 0; x < w; x++) {
            let acc = 0.0;
            for (let i = -r; i <= r; i++) {
                acc += src[row + clamp(x + i, 0, w - 1)] * K[i + r];
            }
            tmp[row + x] = acc / norm;
        }
    }

    // Vertical
    for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
            let acc = 0.0;
            for (let i = -r; i <= r; i++) {
                const yy = clamp(y + i, 0, h - 1);
                acc += tmp[yy * w + x] * K[i + r];
            }
            dst[y * w + x] = acc / norm;
        }
    }
    return dst;
}

function sobelMagDir(src, w, h) {
    const mag = new Float32Array(w * h);
    const dir = new Uint8Array(w * h); // 0:0°, 1:45°, 2:90°, 3:135°
    for (let y = 1; y < h - 1; y++) {
        for (let x = 1; x < w - 1; x++) {
            const p1 = src[(y - 1) * w + (x - 1)];
            const p2 = src[(y - 1) * w + x];
            const p3 = src[(y - 1) * w + (x + 1)];
            const p4 = src[y * w + (x - 1)];
            const p6 = src[y * w + (x + 1)];
            const p7 = src[(y + 1) * w + (x - 1)];
            const p8 = src[(y + 1) * w + x];
            const p9 = src[(y + 1) * w + (x + 1)];

            // Sobel 3x3
            const gx = (p3 + 2 * p6 + p9) - (p1 + 2 * p4 + p7);
            const gy = (p7 + 2 * p8 + p9) - (p1 + 2 * p2 + p3);

            const m = Math.hypot(gx, gy);
            mag[y * w + x] = m;

            // Kuantisasi arah ke 4 kelas
            let angle = Math.atan2(gy, gx) * 180 / Math.PI;
            if (angle < 0) angle += 180;
            let q;
            if (angle < 22.5 || angle >= 157.5) q = 0;
            else if (angle < 67.5) q = 1;
            else if (angle < 112.5) q = 2;
            else q = 3;
            dir[y * w + x] = q;
        }
    }
    return { mag, dir };
}

function nonMaximumSuppression(mag, dir, w, h) {
    const out = new Float32Array(w * h);
    for (let y = 1; y < h - 1; y++) {
        for (let x = 1; x < w - 1; x++) {
            const m = mag[y * w + x];
            let m1, m2;
            switch (dir[y * w + x]) {
                case 0: m1 = mag[y * w + (x - 1)]; m2 = mag[y * w + (x + 1)]; break;
                case 1: m1 = mag[(y - 1) * w + (x + 1)]; m2 = mag[(y + 1) * w + (x - 1)]; break;
                case 2: m1 = mag[(y - 1) * w + x]; m2 = mag[(y + 1) * w + x]; break;
                default: m1 = mag[(y - 1) * w + (x - 1)]; m2 = mag[(y + 1) * w + (x + 1)];
            }
            out[y * w + x] = (m >= m1 && m >= m2) ? m : 0;
        }
    }
    return out;
}

function doubleThresholdAndHysteresis(nms, w, h, high, low) {
    const state = new Uint8Array(w * h); // 0 none, 1 weak, 2 strong
    for (let i = 0; i < nms.length; i++) {
        const v = nms[i];
        state[i] = v >= high ? 2 : (v >= low ? 1 : 0);
    }

    // Seed: semua piksel strong
    const stack = [];
    for (let y = 1; y < h - 1; y++) {
        for (let x = 1; x < w - 1; x++) {
            const i = y * w + x;
            if (state[i] === 2) stack.push(i);
        }
    }

    // Flood-fill: promosikan weak yang bertetangga dengan strong
    while (stack.length) {
        const i = stack.pop();
        const x = i % w;
        const y = (i / w) | 0;
        for (let ny = Math.max(0, y - 1); ny <= Math.min(h - 1, y + 1); ny++) {
            for (let nx = Math.max(0, x - 1); nx <= Math.min(w - 1, x + 1); nx++) {
                if (nx === x && ny === y) continue;
                const j = ny * w + nx;
                if (state[j] === 1) { state[j] = 2; stack.push(j); }
            }
        }
    }

    // Binerkan hasil
    const edges = new Uint8Array(w * h);
    for (let i = 0; i < edges.length; i++) edges[i] = state[i] === 2 ? 1 : 0;
    return edges;
}

function postThicken(mask, w, h, stroke) {
    switch (stroke) {
        case 'medium': return dilateBinary(mask, w, h, 1, 1); // ~3x3
        case 'thick':  return dilateBinary(mask, w, h, 2, 1); // ~5x5
        default:       return mask; // 'thin'
    }
}

// Binary dilation: if any neighbor within radius r is 1, set 1
function dilateBinary(src, w, h, r = 1, iters = 1) {
    let cur = src;
    let out = new Uint8Array(w * h);
    for (let it = 0; it < iters; it++) {
        for (let y = 0; y < h; y++) {
            for (let x = 0; x < w; x++) {
                let v = 0;
                for (let ny = Math.max(0, y - r); ny <= Math.min(h - 1, y + r); ny++) {
                    const row = ny * w;
                    for (let nx = Math.max(0, x - r); nx <= Math.min(w - 1, x + r); nx++) {
                        if (cur[row + nx]) { v = 1; break; }
                    }
                    if (v) break;
                }
                out[y * w + x] = v;
            }
        }
        // swap buffers
        const tmp = cur; cur = out; out = tmp;
    }
    return cur;
}

function clamp(v, lo, hi) { return v < lo ? lo : (v > hi ? hi : v); }
