export function edgeDetectionJS(imageData, width, height, dst) {
    // export function edgeDetectionJSOptimized(imageData, width, height, dst = null) {
        const src = imageData.data;
        const output = dst ?? new Uint8ClampedArray(src.length); // re-use jika disediakan

        const gx = [-1, 0, 1, -2, 0, 2, -1, 0, 1];
        const gy = [-1, -2, -1, 0, 0, 0, 1, 2, 1];

        for (let y = 1; y < height - 1; y++) {
            for (let x = 1; x < width - 1; x++) {
                let sumX = 0, sumY = 0;

                for (let ky = -1; ky <= 1; ky++) {
                    for (let kx = -1; kx <= 1; kx++) {
                        const ix = x + kx;
                        const iy = y + ky;
                        const idx = (iy * width + ix) * 4;
                        const gray = 0.21 * src[idx] + 0.72 * src[idx + 1] + 0.07 * src[idx + 2];
                        const kIdx = (ky + 1) * 3 + (kx + 1);
                        sumX += gray * gx[kIdx];
                        sumY += gray * gy[kIdx];
                    }
                }

                const magnitude = Math.sqrt(sumX * sumX + sumY * sumY);
                const val = Math.min(255, Math.max(0, magnitude));
                const outIdx = (y * width + x) * 4;
                output[outIdx] = output[outIdx + 1] = output[outIdx + 2] = val;
                output[outIdx + 3] = 255;
            }
        }

        return new ImageData(output, width, height);
    }
