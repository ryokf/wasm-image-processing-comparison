import { useRef, useState } from "react";
import Layout from "../layouts/layout";

import { drawToCanvas } from "../helpers/drawToCanvas";
import __wbg_init from "../../pkg/wasm_image_processing_comparison";
import { grayscaleJS } from "../lib/grayscale";
import { calculatePSNR } from "../helpers/calculatePSNR";

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
        const t0 = performance.now();
        const result = grayscaleJS(original);
        const t1 = performance.now();
        drawToCanvas(result, canvasJSRef.current);
        console.log(`JS grayscale: ${ (t1 - t0).toFixed(2) } ms`);
        const psnrValue = calculatePSNR(original.data, result.data);
        console.log(`JS PSNR: ${ psnrValue.toFixed(2) } dB`);
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
      // handleProcessWasm={processWasm}
    ></Layout>
  );
};

export default GrayscalePages;
