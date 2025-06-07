import { useRef, useState } from 'react'
import Layout from '../layouts/layout'
import { gaussianBlurJS } from '../lib/blur';
import { drawToCanvas } from '../helpers/drawToCanvas';
import __wbg_init from '../../pkg/wasm_image_processing_comparison';

const BlurPages = () => {
    const [file, setFile] = useState(null);
    const [original, setOriginal] = useState(null);
    const canvasOriginalRef = useRef(null);
    const canvasJSRef = useRef(null);
    const canvasWasmRef = useRef(null);

    const handleUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setFile(file);
        const img = new Image();
        img.src = URL.createObjectURL(file);
        img.onload = () => {
            const canvas = canvasOriginalRef.current;
            const ctx = canvas.getContext("2d");
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);
            const imageData = ctx.getImageData(0, 0, img.width, img.height);
            setOriginal(imageData);
        };
    };

    const processJS = () => {
        if (!original) return;
        const { width, height } = original;

        if (!performance.memory) {
            console.log("Browser tidak support performance.memory");
        }

        // Inisialisasi peak memory
        let peakMem = performance.memory ? performance.memory.usedJSHeapSize : 0;

        // Monitor memory setiap 5ms
        const memMonitor = setInterval(() => {
            const currentMem = performance.memory.usedJSHeapSize;
            if (currentMem > peakMem) peakMem = currentMem;
        }, 5);

        const start = performance.now();
        const result = gaussianBlurJS(original, width, height);
        const end = performance.now();

        // const psnr = calculatePSNR(original.data, result.data);
        const time = (end - start).toFixed(2);

        drawToCanvas(result, canvasJSRef.current);
        clearInterval(memMonitor);

        const peakMemMB = performance.memory
            ? (peakMem / 1024 / 1024).toFixed(2)
            : "N/A";

        console.log(`JS Blur Time: ${ time } ms`);
        console.log(`JS Peak Memory: ${ peakMemMB } MB`);

        return {
            time,
            // psnr: psnr.toFixed(2),
            result: result.data,
            memory: peakMemMB,
            size: `${ width } x ${ height }`,
        };
    };

    const processWasm = async () => {
        if (!original) return;
        let wasm;
        try {
            wasm = await __wbg_init();
        } catch (error) {
            console.error("Failed to initialize wasm:", error);
            return;
        }
        const { width, height, data } = original;
        const size = width * height * 4;

        // Check if WASM memory is enough
        const requiredBytes = size;
        const currentBytes = wasm.memory.buffer.byteLength;
        if (requiredBytes > currentBytes) {
            const pagesNeeded = Math.ceil((requiredBytes - currentBytes) / 65536);
            console.log(`Growing memory by ${ pagesNeeded } pages`);
            wasm.memory.grow(pagesNeeded);
        }

        // Inisialisasi peak memory
        let peakMem = performance.memory ? performance.memory.usedJSHeapSize : 0;

        // Monitor memory setiap 5ms
        const memMonitor = setInterval(() => {
            const currentMem = performance.memory.usedJSHeapSize;
            if (currentMem > peakMem) peakMem = currentMem;
        }, 5);

        const ptr = wasm.alloc(size);
        const wasmMemory = new Uint8Array(wasm.memory.buffer, ptr, size);
        wasmMemory.set(data);

        const start = performance.now();
        wasm.gaussian_blur(ptr, width, height);
        const end = performance.now();
        // setLog((prev) => prev + `WASM Blur: ${ (end - start).toFixed(2) } ms\n`);

        clearInterval(memMonitor);

        const peakMemMB = performance.memory
            ? (peakMem / 1024 / 1024).toFixed(2)
            : "N/A";

        const resultArray = new Uint8ClampedArray(wasm.memory.buffer, ptr, size);
        const result = new ImageData(resultArray, width, height);
        const time = (end - start).toFixed(2);
        // const psnrValue = calculatePSNR(original.data, result.data);

        drawToCanvas(result, canvasWasmRef.current);

        console.log(`WASM Blur Time: ${ time } ms`);
        console.log(`WASM Peak Memory: ${ peakMemMB } MB`);

        return {
            time: time,
            result: result.data,
            memory: peakMemMB,
            size: `${ width } x ${ height }`
        };
    };

    return (
        <Layout
            title={"Gaussian Blur: JS vs WASM (Rust)"}
            subtitle={"Compare the performance of Gaussian Blur implemented in JavaScript and WebAssembly. This page allows you to test the speed and efficiency of both implementations on various image sizes."}
            handleUpload={handleUpload}
            file={file}
            canvasOriginalRef={canvasOriginalRef}
            canvasJSRef={canvasJSRef}
            canvasWasmRef={canvasWasmRef}
            handleProcessJS={processJS}
            handleProcessWasm={processWasm}
        >
        </Layout>
    )
}

export default BlurPages