const TableResult = ({ benchmarkData, unit }) => {
    console.log('TableResult benchmarkData:', benchmarkData);

    return (
        <table className="table-auto w-11/12 m-auto mt-4 text-white">
            <thead>
                <tr>
                    <th className="px-4 py-2">Iteration</th>
                    <th className="px-4 py-2">JS</th>
                    <th className="px-4 py-2">WASM</th>
                </tr>
            </thead>
            <tbody>
                {benchmarkData.map((item, index) => (
                    <tr key={index}>
                        <td className="border px-4 py-2">{index + 1}</td>
                        <td className="border px-4 py-2">{item.js} {unit}</td>
                        <td className="border px-4 py-2">{item.wasm} {unit}</td>

                    </tr>
                ))}
            </tbody>
            <tfoot>
                {benchmarkData.length > 0 && (
                    <tr>
                        <td className="border px-4 py-2 font-bold">Average</td>
                        <>
                            <td className="border px-4 py-2 font-bold">{(benchmarkData.reduce((acc, item) => acc + parseFloat(item.js), 0) / benchmarkData.length).toFixed(2)} {unit}</td>
                            <td className="border px-4 py-2 font-bold">{(benchmarkData.reduce((acc, item) => acc + parseFloat(item.wasm), 0) / benchmarkData.length).toFixed(2)} {unit}</td>
                        </>
                    </tr>
                )}
            </tfoot>
        </table>
    )
}

export default TableResult