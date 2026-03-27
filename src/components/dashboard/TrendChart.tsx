import { useState } from 'react'
import {
    LineChart,
    Line,
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer
} from 'recharts'
import { format } from 'date-fns'

interface TrendChartProps {
    data: Array<{ date: string; totalAds: number }>
    title?: string
}

export default function TrendChart({ data, title }: TrendChartProps) {
    const [chartType, setChartType] = useState<'area' | 'line'>('area')

    const formattedData = data.map(item => ({
        ...item,
        dateFormatted: format(new Date(item.date), 'MMM d'),
    }))

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-dark-800 border border-dark-700 rounded-lg p-3 shadow-xl">
                    <p className="text-dark-400 text-xs mb-1">{label}</p>
                    <p className="text-white font-semibold">
                        {payload[0].value.toLocaleString()} ads
                    </p>
                </div>
            )
        }
        return null
    }

    return (
        <div className="card p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-white">{title || 'Trend Overview'}</h3>

                {/* Chart Type Toggle */}
                <div className="flex items-center gap-1 bg-dark-800 rounded-lg p-1">
                    <button
                        onClick={() => setChartType('area')}
                        className={`px-3 py-1 text-sm rounded-md transition-colors ${chartType === 'area'
                                ? 'bg-primary-500 text-white'
                                : 'text-dark-400 hover:text-white'
                            }`}
                    >
                        Area
                    </button>
                    <button
                        onClick={() => setChartType('line')}
                        className={`px-3 py-1 text-sm rounded-md transition-colors ${chartType === 'line'
                                ? 'bg-primary-500 text-white'
                                : 'text-dark-400 hover:text-white'
                            }`}
                    >
                        Line
                    </button>
                </div>
            </div>

            {/* Chart */}
            <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                    {chartType === 'area' ? (
                        <AreaChart data={formattedData}>
                            <defs>
                                <linearGradient id="colorAds" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                            <XAxis
                                dataKey="dateFormatted"
                                stroke="#64748b"
                                tick={{ fill: '#64748b', fontSize: 12 }}
                                axisLine={{ stroke: '#334155' }}
                            />
                            <YAxis
                                stroke="#64748b"
                                tick={{ fill: '#64748b', fontSize: 12 }}
                                axisLine={{ stroke: '#334155' }}
                            />
                            <Tooltip content={<CustomTooltip />} />
                            <Area
                                type="monotone"
                                dataKey="totalAds"
                                stroke="#0ea5e9"
                                strokeWidth={2}
                                fillOpacity={1}
                                fill="url(#colorAds)"
                            />
                        </AreaChart>
                    ) : (
                        <LineChart data={formattedData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                            <XAxis
                                dataKey="dateFormatted"
                                stroke="#64748b"
                                tick={{ fill: '#64748b', fontSize: 12 }}
                                axisLine={{ stroke: '#334155' }}
                            />
                            <YAxis
                                stroke="#64748b"
                                tick={{ fill: '#64748b', fontSize: 12 }}
                                axisLine={{ stroke: '#334155' }}
                            />
                            <Tooltip content={<CustomTooltip />} />
                            <Line
                                type="monotone"
                                dataKey="totalAds"
                                stroke="#0ea5e9"
                                strokeWidth={2}
                                dot={{ fill: '#0ea5e9', strokeWidth: 0, r: 4 }}
                                activeDot={{ r: 6, fill: '#0ea5e9' }}
                            />
                        </LineChart>
                    )}
                </ResponsiveContainer>
            </div>
        </div>
    )
}
