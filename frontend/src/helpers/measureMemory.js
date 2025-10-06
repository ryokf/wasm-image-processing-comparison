// Constants for memory measurement
const BYTES_TO_MB = 1024 * 1024;

export function getBundleSize(implementation) {
  // Get bundle size for specific implementation (wasm or js)
  return new Promise((resolve) => {
    if (implementation === 'wasm') {
      // Measure WASM bundle size
      fetch('/pkg/wasm_image_processing_comparison_bg.wasm')
        .then(response => {
          const size = parseInt(response.headers.get('content-length')) ;
          resolve(size);
        })
        .catch(() => resolve(null));
    } else {
      // Measure JS bundle size by fetching the lib files
      Promise.all([
        fetch('/src/lib/grayscale.js'),
        fetch('/src/lib/sepia.js'),
        fetch('/src/lib/blur.js'),
        fetch('/src/lib/edgeDetection.js')
      ]).then(responses => {
        const totalSize = responses.reduce((acc, response) => {
          const size = parseInt(response.headers.get('content-length')) || 0;
          return acc + size;
        }, 0);
        resolve(totalSize );
      }).catch(() => {
        // If we can't fetch the files directly, try to get the JS chunk from the build
        fetch('/assets/index-*.js')
          .then(response => {
            const size = parseInt(response.headers.get('content-length')) ;
            resolve(size);
          })
          .catch(() => resolve(null));
      });
    }
  });
}