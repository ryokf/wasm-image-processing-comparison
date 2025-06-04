import { useEffect, useState } from 'react'
import BackButton from '../components/BackButton'
import { calculatePSNR } from '../helpers/calculatePSNR';
import Result from '../components/Result';

const Layout = ({
    children,
    title,
    subtitle,
    handleUpload,
    file,
    canvasOriginalRef,
    handleProcessJS,
    handleProcessWasm,
    canvasJSRef,
    canvasWasmRef
}) => {

    const [loading, setLoading] = useState(false)
    const [psnrValue, setPsnrValue] = useState(null);
    const [benchmarkTime, setBenchmarkTime] = useState([]);
    const [benchmarkMemory, setBenchmarkMemory] = useState([]);

    const handleProcess = async () => {
        await setLoading(true);
        for (let i = 0; i < 10; i++) {
            const wasmResult = await handleProcessWasm();
            const jsResult = handleProcessJS();
            setPsnrValue(calculatePSNR(jsResult.result, wasmResult.result).toFixed(2));
            // console.log(calculatePSNR(jsResult.result, wasmResult.result).toFixed(2));
            setBenchmarkTime(prev => [...prev, {
                js: jsResult.time,
                wasm: wasmResult.time,
            }])
            setBenchmarkMemory(prev => [...prev, {
                js: jsResult.memory,
                wasm: wasmResult.memory,
            }])
        }
        await setLoading(false);
    }

    useEffect(() => {
        console.log('Benchmark Time:', benchmarkTime);
        console.log('Benchmark Memory:', benchmarkMemory);
    }
        , [benchmarkMemory, benchmarkTime]);

    return (
        <div className={`p-4 max-w-full min-h-screen flex flex-col items-center justify-center bg-gray-800  ${ loading ? 'pointer-events-none overflow-hidden' : '' }`}>
            <BackButton></BackButton>
            <div className="max-w-6xl my-8">
                <h1 className="text-3xl text-white my-2">{title}</h1>
                <p className="text-lg text-gray-400">{subtitle}</p>
            </div>
            <input type="file" accept="image/*" onChange={handleUpload} className="mt-4 border border-gray-300 rounded-full text-white min-w-xs lg:min-w-xl file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
            {
                file && (
                    <>
                        <div className="mt-4 flex flex-col gap-4 w-full justify-center items-center">
                            <div className="max-w-md">
                                <h3 className="text-2xl text-white mb-2">Original</h3>
                                <canvas ref={canvasOriginalRef} className="w-full h-auto"></canvas>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="max-w-lg">
                                    <h3 className="text-2xl text-white mb-2">Result JS</h3>
                                    <canvas ref={canvasJSRef} className="w-full h-auto"></canvas>
                                </div>
                                <div className="max-w-lg">
                                    <h3 className="text-2xl text-white mb-2">Result WASM</h3>
                                    <canvas ref={canvasWasmRef} className="w-full h-auto"></canvas>
                                </div>
                            </div>

                        </div>
                        <div className="text-center mt-4">
                            <h3 className="text-2xl text-white mb-2">PSNR : {psnrValue}</h3>
                        </div>
                        <div className="mt-4 flex gap-4">
                            {/* <button onClick={processJS} className="bg-gray-800 text-white p-2 rounded-md">Blur with JS</button>
                                    <button onClick={processWasm} className="bg-gray-800 text-white p-2 rounded-md">Blur with WASM</button> */}
                            <button onClick={async () => await handleProcess()} className="bg-blue-500 hover:cursor-pointer hover:bg-blue-600 text-white p-2 rounded-md">{loading ? 'Processing...' : 'Start Benchmark'}</button>
                        </div>
                        {children}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 w-3/4 m-auto">
                            {
                                benchmarkMemory.length != 0 &&
                                <Result
                                    benchmarkData={benchmarkMemory}
                                    setBenchmarkData={setBenchmarkMemory}
                                    title="Benchmark Memory Usage"
                                    subtitle="This chart shows the memory usage of both JS and WASM implementations during the Gaussian Blur operation."
                                    unit="MB"
                                >
                                </Result>
                            }
                            {
                                benchmarkTime.length != 0 &&
                                <Result
                                    benchmarkData={benchmarkTime}
                                    setBenchmarkData={setBenchmarkTime}
                                    title="Benchmark Execution Time"
                                    subtitle="This chart shows the execution time of both JS and WASM implementations during the Gaussian Blur operation."
                                    unit="ms"
                                ></Result>
                            }
                        </div>
                    </>
                )
            }
        </div>
    )
}

export default Layout