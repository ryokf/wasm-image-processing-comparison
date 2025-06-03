import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import BlurPages from './pages/BlurPages.jsx'
import { BrowserRouter, Route, Routes } from 'react-router'
import GrayscalePages from './pages/GrayscalePages.jsx'
import HomePage from './pages/HomePage.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/blur" element={<BlurPages />} />
        <Route path="/grayscale" element={<GrayscalePages />} />
        <Route path="*" element={<div>404 Not Found</div>} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
