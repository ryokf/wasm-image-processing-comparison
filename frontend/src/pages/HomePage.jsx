function HomePage() {

  return (
    <>
      <div className='flex flex-col items-center justify-center h-screen w-screen bg-gray-800'>
        <h1 className='text-4xl font-bold mb-4 text-white'>Welcome to Image Processing HomePage</h1>
        <p className='text-lg text-gray-300'>Choose an image processing task from the menu.</p>
        <div className='mt-8 text-gray-300'>
          <a href="/blur" className='bg-blue-500 !text-white px-4 py-2 rounded-md hover:bg-blue-600'>Gaussian Blur</a>
          <a href="/grayscale" className='bg-green-500 !text-white px-4 py-2 rounded-md hover:bg-green-600 ml-4'>Grayscale</a>
        </div>
        <div className='mt-8'>
          <p className='text-sm text-gray-500'>Created by Ryo Khrisna Fitriawan</p>
          <p className='text-sm text-gray-500'>Image Processing with JS and WASM</p>
        </div>
      </div>
    </>
  )
}

export default HomePage
