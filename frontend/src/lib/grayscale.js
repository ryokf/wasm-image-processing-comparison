export function grayscaleJS(imageData) {
    const data = imageData.data; // No copy
    for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const y = 0.21 * r + 0.72 * g + 0.07 * b;
        const val = Math.round(y);
        data[i] = data[i + 1] = data[i + 2] = val;
    }
    return imageData;
}