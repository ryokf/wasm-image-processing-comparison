import { useRef, useState } from 'react'
import BackButton from '../components/BackButton'

const Layout = ({ children, title }) => {
    const [loading, setLoading] = useState(false)
    const [file, setFile] = useState(null);
    const canvasOriginalRef = useRef(null);
    const [original, setOriginal] = useState(null);

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

    return (
        <div className={`p-4 max-w-full min-h-screen flex flex-col items-center justify-center mb-20 bg-gray-800  ${ loading ? 'pointer-events-none overflow-hidden' : '' }`}>
            <BackButton></BackButton>
            <h1 className="text-3xl my-8 text-white">{title}</h1>
            <input type="file" accept="image/*" onChange={handleUpload} className="mt-4 border border-gray-300 rounded-full text-white file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
            {children}
        </div>
    )
}

export default Layout