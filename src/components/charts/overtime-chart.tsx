"use client"

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

interface OvertimeChartProps {
    data: { userId: string; name: string; weekendHours: number; weekdayHours: number }[]
}

export function OvertimeChart({ data }: OvertimeChartProps) {
    return (
        <ResponsiveContainer width="100%" height={400}>
            <BarChart
                data={data}
                margin={{
                    top: 20,
                    right: 30,
                    left: 20,
                    bottom: 5,
                }}
            >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="weekdayHours" stackId="a" name="Hafta İçi (Saat)" fill="#8884d8" />
                <Bar dataKey="weekendHours" stackId="a" name="Hafta Sonu (Saat)" fill="#82ca9d" />
            </BarChart>
        </ResponsiveContainer>
    )
}
