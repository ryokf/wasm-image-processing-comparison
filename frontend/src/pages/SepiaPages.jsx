import { useRef, useState } from "react";
import Layout from "../layouts/layout";
import { drawToCanvas } from "../helpers/drawToCanvas";
import __wbg_init from "../../pkg/wasm_image_processing_comparison";
import { sepiaJS } from "../lib/sepia";

const SepiaPages = () => {
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

        const t0 = performance.now();
        const result = sepiaJS(original, width, height);
        const t1 = performance.now();
        drawToCanvas(result, canvasJSRef.current);

        clearInterval(memMonitor);

        const peakMemMB = performance.memory
            ? (peakMem / 1024 / 1024).toFixed(2)
            : "N/A";

        const time = (t1 - t0).toFixed(2);
        return { time, result: result.data, memory: peakMemMB };
    };

    const processWasm = async () => {
        if (!original) return;
        let wasm;
        try {
            wasm = await __wbg_init();
        } catch (err) {
            console.error("WASM init failed", err);
            return;
        }
        const { width, height, data } = original;

        let peakMem = performance.memory ? performance.memory.usedJSHeapSize : 0;

        // Monitor memory setiap 5ms
        const memMonitor = setInterval(() => {
            const currentMem = performance.memory.usedJSHeapSize;
            if (currentMem > peakMem) peakMem = currentMem;
        }, 5);

        const buffer = new Uint8Array(data);
        const ptr = wasm.alloc(buffer.length);
        const wasmMemory = new Uint8Array(wasm.memory.buffer, ptr, buffer.length);
        wasmMemory.set(buffer);
        const t0 = performance.now();
        wasm.sepia(ptr, width, height);
        const t1 = performance.now();
        const output = new Uint8ClampedArray(
            wasm.memory.buffer,
            ptr,
            buffer.length
        );
        const outData = new ImageData(output.slice(), width, height);
        drawToCanvas(outData, canvasWasmRef.current);

        clearInterval(memMonitor);

        const peakMemMB = performance.memory
            ? (peakMem / 1024 / 1024).toFixed(2)
            : "N/A";

        const time = (t1 - t0).toFixed(2);
        return { time, result: outData.data, memory: peakMemMB };
    };

    return (
        <Layout
            title="Sepia Filter: JS vs WASM"
            subtitle="Compare sepia filter performance between JavaScript and WebAssembly (Rust)"
            handleUpload={handleUpload}
            file={file}
            canvasOriginalRef={canvasOriginalRef}
            canvasJSRef={canvasJSRef}
            canvasWasmRef={canvasWasmRef}
            handleProcessJS={processJS}
            handleProcessWasm={processWasm}
        ></Layout>
    );
};

export default SepiaPages;
