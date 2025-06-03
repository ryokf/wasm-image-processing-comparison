const BackButton = () => {
    return (
        <div className="absolute top-2 left-2">
            <button
                onClick={() => window.history.back()}
                className="!bg-blue-500 text-white font-bold py-2 px-4 rounded"
            >
                Back
            </button>
        </div>
    )
}

export default BackButton