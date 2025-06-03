export function gaussianBlurJS(imageData, width, height) {
    const src = imageData.data;
    const dst = new Uint8ClampedArray(src.length);

    const kernelSize = 25;
    const radius = Math.floor(kernelSize / 2);
    const sigma = 10.0;

    // Generate Gaussian kernel (1D array)
    const kernel = new Array(kernelSize * kernelSize);
    let sum = 0;

    for (let y = 0; y < kernelSize; y++) {
        for (let x = 0; x < kernelSize; x++) {
            const dx = x - radius;
            const dy = y - radius;
            const value = Math.exp(-(dx * dx + dy * dy) / (2 * sigma * sigma));
            kernel[y * kernelSize + x] = value;
            sum += value;
        }
    }

    // Normalize kernel
    for (let i = 0; i < kernel.length; i++) {
        kernel[i] /= sum;
    }

    // Apply convolution
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            let r = 0, g = 0, b = 0, a = 0;

            for (let ky = 0; ky < kernelSize; ky++) {
                for (let kx = 0; kx < kernelSize; kx++) {
                    const ix = Math.min(width - 1, Math.max(0, x + kx - radius));
                    const iy = Math.min(height - 1, Math.max(0, y + ky - radius));
                    const idx = (iy * width + ix) * 4;
                    const weight = kernel[ky * kernelSize + kx];

                    r += src[idx] * weight;
                    g += src[idx + 1] * weight;
                    b += src[idx + 2] * weight;
                    a += src[idx + 3] * weight;
                }
            }

            const outIdx = (y * width + x) * 4;
            dst[outIdx] = Math.round(r);
            dst[outIdx + 1] = Math.round(g);
            dst[outIdx + 2] = Math.round(b);
            dst[outIdx + 3] = Math.round(a);
            // dst[outIdx] = Math.min(255, Math.max(0, Math.round(r)));
            // dst[outIdx + 1] = Math.min(255, Math.max(0, Math.round(g)));
            // dst[outIdx + 2] = Math.min(255, Math.max(0, Math.round(b)));
            // dst[outIdx + 3] = Math.min(255, Math.max(0, Math.round(a)));
        }
    }

    return new ImageData(dst, width, height);
}
