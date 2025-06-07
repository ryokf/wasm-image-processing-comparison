export function sepiaJS(imageData, width, height) {
    const src = imageData.data;
    const dst = new Uint8ClampedArray(src.length);

    for (let i = 0; i < src.length; i += 4) {
        const r = src[i];
        const g = src[i + 1];
        const b = src[i + 2];

        dst[i] = Math.min(255, 0.393 * r + 0.769 * g + 0.189 * b);
        dst[i + 1] = Math.min(255, 0.349 * r + 0.686 * g + 0.168 * b);
        dst[i + 2] = Math.min(255, 0.272 * r + 0.534 * g + 0.131 * b);
        dst[i + 3] = src[i + 3]; // keep alpha
    }

    return new ImageData(dst, width, height);
}