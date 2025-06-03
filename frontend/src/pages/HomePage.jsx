import { Link } from "react-router"

function HomePage() {

    return (
        <>
            <div className='flex flex-col items-center justify-center h-screen w-screen bg-gray-800'>
                <h1 className='text-4xl font-bold mb-4 text-white'>Welcome to Image Processing App</h1>
                <p className='text-lg text-gray-300'>Choose an image processing task from the menu.</p>
                <div className='mt-8 text-gray-300'>
                    <Link to="/grayscale" className='bg-green-500 !text-white px-4 py-2 rounded-md hover:bg-green-600 ml-4'>Grayscale</Link>
                    <Link to="/sepia" className='bg-yellow-500 !text-white px-4 py-2 rounded-md hover:bg-yellow-600 ml-4'>Sepia</Link>
                    <Link to="/blur" className='bg-blue-500 !text-white px-4 py-2 rounded-md hover:bg-blue-600 ml-4'>Gaussian Blur</Link>
                    <Link to="/edge-detection" className='bg-red-500 !text-white px-4 py-2 rounded-md hover:bg-red-600 ml-4'>Edge Detection</Link>
                </div>
                <div className='mt-8 text-center max-w-xl'>
                    <p className='text-sm text-gray-500'>Created by Ryo Khrisna Fitriawan</p>
                    <p className='text-sm text-gray-500'>This project is part of my research to demonstrate the performance difference between JavaScript and WebAssembly for image processing tasks</p>
                </div>
            </div>
        </>
    )
}

export default HomePage
