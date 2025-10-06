import { useState, useEffect } from 'react';
import { getBundleSize } from '../helpers/measureMemory';

const BundleAnalysis = () => {
  const [bundleSizes, setBundleSizes] = useState({
    wasm: null,
    js: null
  });

  useEffect(() => {
    // Measure bundle sizes
    Promise.all([
      getBundleSize('wasm'),
      getBundleSize('js')
    ]).then(([wasmSize, jsSize]) => {
      setBundleSizes({
        wasm: wasmSize,
        js: jsSize
      });
    });
  }, []);

  return (
    <div className="lg:my-20 lg:w-1/2 my-8 p-4 pb-10 pt-10 border rounded-lg border-white">
      <div className="mb-4 w-11/12 m-auto">
        <h3 className="text-2xl mb-2 text-white">Bundle Size Analysis</h3>
        <p className="text-sm text-gray-500">
          Perbandingan ukuran bundle antara implementasi WebAssembly dan JavaScript
        </p>
      </div>
      <div className="w-11/12 m-auto">
        <table className="w-full text-left border-collapse text-white">
          <thead>
            <tr>
              <th className="p-4 border-b border-gray-700">Implementation</th>
              <th className="p-4 border-b border-gray-700">Bundle Size</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="p-4 border-b border-gray-800">WebAssembly (Rust)</td>
              <td className="p-4 border-b border-gray-800">
                {bundleSizes.wasm ? `${bundleSizes.wasm.toFixed(2)} Bytes` : 'Calculating...'}
              </td>
            </tr>
            <tr>
              <td className="p-4 border-b border-gray-800">JavaScript</td>
              <td className="p-4 border-b border-gray-800">
                {bundleSizes.js ? `${bundleSizes.js.toFixed(2)} Bytes` : 'Calculating...'}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default BundleAnalysis;