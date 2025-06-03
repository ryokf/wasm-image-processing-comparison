import { useRef, useState } from 'react'
import BackButton from '../components/BackButton'

const Layout = ({
    children,
    title,
    subtitle,
    handleUpload,
    file,
    canvasOriginalRef,
    handleProcess,
    canvasJSRef,
}) => {

    const [loading, setLoading] = useState(false)
    const canvasWasmRef = useRef(null);

    // const handleProcess = async () => {
    //     setLoading(true);
    //     console.log("Processing...");
    //     setLoading(false);
    // }

    return (
        <div className={`p-4 max-w-full min-h-screen flex flex-col items-center justify-center mb-20 bg-gray-800  ${ loading ? 'pointer-events-none overflow-hidden' : '' }`}>
            <BackButton></BackButton>
            <div className="max-w-6xl my-8">
                <h1 className="text-3xl text-white my-2">{title}</h1>
                <p className="text-lg text-gray-400">{subtitle}</p>
            </div>
            <input type="file" accept="image/*" onChange={handleUpload} className="mt-4 border border-gray-300 rounded-full text-white min-w-xl file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
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
                        {/* <div className="text-center mt-4">
                            <h3 className="text-2xl text-white mb-2">PSNR : {psnrValue}</h3>
                        </div> */}
                        <div className="mt-4 flex gap-4">
                            {/* <button onClick={processJS} className="bg-gray-800 text-white p-2 rounded-md">Blur with JS</button>
                                    <button onClick={processWasm} className="bg-gray-800 text-white p-2 rounded-md">Blur with WASM</button> */}
                            <button onClick={() => handleProcess(canvasOriginalRef.current, canvasJSRef.current, canvasWasmRef.current)} className="bg-blue-500 hover:cursor-pointer hover:bg-blue-600 text-white p-2 rounded-md">Start Benchmark</button>
                        </div>
                        {children}
                    </>
                )
            }
        </div>
    )
}

export default Layout