import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import BlurPages from './pages/BlurPages.jsx'
import { BrowserRouter, Route, Routes } from 'react-router'
import GrayscalePages from './pages/GrayscalePages.jsx'
import HomePage from './pages/HomePage.jsx'
import SepiaPages from './pages/SepiaPages.jsx'
import EdgeDetectionSobelPages from './pages/EdgeDetectionSobelPages.jsx'
import EdgeDetectionCannyPages from './pages/EdgeDetectionCannyPages.jsx'
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/blur" element={<BlurPages />} />
        <Route path="/grayscale" element={<GrayscalePages />} />
        <Route path="/sepia" element={<SepiaPages />} />
        <Route path="/edge-detection-sobel" element={<EdgeDetectionSobelPages />} />
        <Route path="/edge-detection-canny" element={<EdgeDetectionCannyPages />} />
        <Route path="*" element={<div>404 Not Found</div>} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
