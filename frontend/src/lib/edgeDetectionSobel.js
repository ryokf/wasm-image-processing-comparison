export function edgeDetectionSobelJS(imageData, width, height, dst) {
    const src = imageData.data;
    const w = width | 0;
    const h = height | 0;

    // Prepare output. If a destination buffer is provided, clear it so borders stay fully transparent/black (R=G=B=A=0)
    const out = dst ?? new Uint8ClampedArray(src.length);
    if (dst) out.fill(0);

    // Threshold on squared magnitude, following the paper's traditional Sobel implementation (binary edge map)
    const THRESHOLD_SQ = 4000;

    // Integer luminance approximation: (77R + 150G + 29B) >> 8  ≈ 0.299R + 0.587G + 0.114B
    const grayAt = (x, y) => {
        const idx = (y * w + x) * 4;
        return ((77 * src[idx] + 150 * src[idx + 1] + 29 * src[idx + 2]) >> 8) | 0;
    };

    // Traditional Sobel as defined in the paper:
    // f1 = p3 + 2*p6 + p9;  f2 = p1 + 2*p4 + p7;  Gx = f1 - f2
    // f3 = p1 + 2*p2 + p3;  f4 = p7 + 2*p8 + p9;  Gy = f4 - f3
    // |G|^2 = Gx^2 + Gy^2  -> threshold -> binary edge (255 or 0)
    for (let y = 1; y < h - 1; y++) {
        const y0 = y - 1, y1 = y, y2 = y + 1;
        for (let x = 1; x < w - 1; x++) {
            const x0 = x - 1, x1 = x, x2 = x + 1;

            // Neighborhood (p1..p9)
            const p1 = grayAt(x0, y0);
            const p2 = grayAt(x1, y0);
            const p3 = grayAt(x2, y0);
            const p4 = grayAt(x0, y1);
            // const p5 = grayAt(x1, y1); // center not used in Sobel
            const p6 = grayAt(x2, y1);
            const p7 = grayAt(x0, y2);
            const p8 = grayAt(x1, y2);
            const p9 = grayAt(x2, y2);

            const f1 = p3 + (p6 << 1) + p9;
            const f2 = p1 + (p4 << 1) + p7;
            const f3 = p1 + (p2 << 1) + p3;
            const f4 = p7 + (p8 << 1) + p9;

            const gx = f1 - f2; // right - left (horizontal gradient)
            const gy = f4 - f3; // bottom - top (vertical gradient)

            const mag2 = gx * gx + gy * gy;
            const edge = mag2 >= THRESHOLD_SQ ? 255 : 0;

            const o = (y * w + x) * 4;
            out[o] = edge;
            out[o + 1] = edge;
            out[o + 2] = edge;
            out[o + 3] = 255; // set alpha only for interior pixels to match Rust
        }
    }

    return new ImageData(out, w, h);
}
