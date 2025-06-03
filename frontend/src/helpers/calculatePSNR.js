export function calculatePSNR(original, processed) {
    // const originalData = original.data;
    // const processedData = processed.data;

    if (original.length !== processed.length) {
        throw new Error("Ukuran gambar tidak sama!");
    }

    let mse = 0;
    for (let i = 0; i < original.length; i++) {
        const diff = original[i] - processed[i];
        mse += diff * diff;
    }
    mse /= original.length;

    // if (mse === 0) return Infinity; // gambar identik

    const MAX_I = 255;
    const psnr = 10 * Math.log10((MAX_I * MAX_I) / mse);
    return psnr;
}
