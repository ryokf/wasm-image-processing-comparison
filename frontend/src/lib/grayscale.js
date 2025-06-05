export function grayscaleJS(imageData) {
    const data = new Uint8ClampedArray(imageData.data);
    for (let i = 0; i < data.length; i += 4) {
        const r = data[i], g = data[i + 1], b = data[i + 2];
        const y = 0.21 * r + 0.72 * g + 0.07 * b;
        data[i] = data[i + 1] = data[i + 2] = y;
    }
    return new ImageData(data, imageData.width, imageData.height);
}