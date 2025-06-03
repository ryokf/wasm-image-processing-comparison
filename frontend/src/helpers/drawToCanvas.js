export const drawToCanvas = (imageData, canvas) => {
        const ctx = canvas.getContext("2d");
        canvas.width = imageData.width;
        canvas.height = imageData.height;
        ctx.putImageData(imageData, 0, 0);
    };