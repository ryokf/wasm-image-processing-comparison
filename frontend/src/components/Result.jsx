import TableResult from './TableResult';
import { XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from "recharts";

const Result = ({benchmarkData, setBenchmarkData, title, subtitle, unit}) => {
    return (
        <div className="my-20 p-4 pb-20 pt-10 border rounded-lg w-full border-white">
            <div className="flex justify-between items-center mb-4 w-11/12 m-auto">
                <div className="">
                    <h3 className="text-2xl mb-2 text-white">{title}</h3>
                    <p className="text-sm text-gray-500 max-w-xl">{subtitle}</p>
                </div>
                <button className="!bg-blue-500" onClick={() => setBenchmarkData([])}>reset</button>
            </div>
            <div className="w-full h-96">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                        width={500}
                        height={300}
                        margin={{
                            top: 5,
                            right: 30,
                            left: 20,
                            bottom: 5,
                        }}
                        data={benchmarkData}
                    >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis label={{ value: "Iterasi", position: "bottom" }} domain={[1, 10]} />
                        <YAxis label={{ value: `${unit == "ms" ? "Waktu (ms)" : "Memori (MB)"}`, angle: -90, position: "left" }} domain={ unit == "ms" ? [0, 1500] : [0, 100] } />
                        <Tooltip />
                        <Legend align="right" />
                        <Line type="monotone" dataKey="js" stroke="oklch(94.5% 0.129 101.54)" activeDot={{ r: 8 }} />
                        <Line type="monotone" dataKey="wasm" stroke="oklch(67.3% 0.182 276.935)" activeDot={{ r: 8 }} />
                    </LineChart>
                </ResponsiveContainer>
            </div>
            <TableResult benchmarkData={benchmarkData} unit={unit}></TableResult>
        </div>
    )
}

export default Result