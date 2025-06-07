let wasmPtr = null;
let wasmLen = 0;

import { useRef, useState } from "react";
import Layout from "../layouts/layout";
import { drawToCanvas } from "../helpers/drawToCanvas";
import __wbg_init from "../../pkg/wasm_image_processing_comparison";
import { grayscaleJS } from "../lib/grayscale";

const GrayscalePages = () => {
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

    if (!performance.memory) {
      console.log("Browser tidak support performance.memory");
    }

    // Inisialisasi peak memory
    let peakMem = performance.memory ? performance.memory.usedJSHeapSize : 0;

    const memMonitor = setInterval(() => {
      const currentMem = performance.memory.usedJSHeapSize;
      if (currentMem > peakMem) peakMem = currentMem;
    }, 1);

    const t0 = performance.now();
    const result = grayscaleJS(original);
    const t1 = performance.now();

    const time = (t1 - t0).toFixed(2);

    drawToCanvas(result, canvasJSRef.current);
    clearInterval(memMonitor);

    const memUsedMB = performance?.memory
      ? (peakMem / 1024 / 1024).toFixed(2)
      : "N/A";

    return {
      time,
      memory: memUsedMB,
      result: result.data,
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
    const buffer = new Uint8Array(data);
    if (!wasmPtr || wasmLen !== buffer.length) {
      if (wasmPtr) {
        wasm.free(wasmPtr, wasmLen);
      }
      wasmPtr = wasm.alloc(buffer.length);
      wasmLen = buffer.length;
    }
    const wasmMemory = new Uint8Array(
      wasm.memory.buffer,
      wasmPtr,
      buffer.length
    );
    wasmMemory.set(buffer);

    // Inisialisasi peak memory
    let peakMem = performance.memory ? performance.memory.usedJSHeapSize : 0;

    // Monitor memory setiap 5ms
    const memMonitor = setInterval(() => {
      const currentMem = performance.memory.usedJSHeapSize;
      if (currentMem > peakMem) peakMem = currentMem;
    }, 5);

    const t0 = performance.now();
    wasm.grayscale(wasmPtr, width, height);
    const t1 = performance.now();

    const time = (t1 - t0).toFixed(2);

    const output = new Uint8ClampedArray(
      wasm.memory.buffer,
      wasmPtr,
      buffer.length
    );
    const outData = new ImageData(output.slice(), width, height);
    drawToCanvas(outData, canvasWasmRef.current);

    clearInterval(memMonitor);

    const peakMemMB = performance.memory
      ? (peakMem / 1024 / 1024).toFixed(2)
      : "N/A";

    return {
      time,
      memory: peakMemMB,
      result: outData.data,
    };
  };

  return (
    <Layout
      title={"Grayscale: JS vs WASM (Rust)"}
      subtitle={
        "Bandingkan performa konversi gambar ke grayscale antara JavaScript dan WebAssembly (Rust)"
      }
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

export default GrayscalePages;
