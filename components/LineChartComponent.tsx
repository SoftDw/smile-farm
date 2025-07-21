
import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface LineChartProps {
    data: any[];
    lines: { key: string; color: string; name: string }[];
    xAxisKey: string;
}

const LineChartComponent: React.FC<LineChartProps> = ({ data, lines, xAxisKey }) => {
    return (
        <ResponsiveContainer width="100%" height={300}>
            <LineChart
                data={data}
                margin={{
                    top: 5,
                    right: 30,
                    left: 20,
                    bottom: 5,
                }}
            >
                <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                <XAxis dataKey={xAxisKey} stroke="#555" />
                <YAxis stroke="#555" />
                <Tooltip
                    contentStyle={{
                        backgroundColor: 'rgba(255, 255, 255, 0.8)',
                        border: '1px solid #ccc',
                        borderRadius: '8px',
                    }}
                />
                <Legend />
                {lines.map(line => (
                     <Line key={line.key} type="monotone" dataKey={line.key} name={line.name} stroke={line.color} strokeWidth={2} activeDot={{ r: 8 }} />
                ))}
            </LineChart>
        </ResponsiveContainer>
    );
};

export default LineChartComponent;
