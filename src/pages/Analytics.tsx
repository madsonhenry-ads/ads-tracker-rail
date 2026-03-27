import { useQuery } from '@tanstack/react-query'
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell
} from 'recharts'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { metricsApi } from '../services/api'

export default function Analytics() {
    // Fetch overview
    const { data: overview } = useQuery({
        queryKey: ['metrics', 'overview'],
        queryFn: async () => {
            const response = await metricsApi.getOverview()
            return response.data.data
        }
    })

    // Fetch top pages
    const { data: topPages } = useQuery({
        queryKey: ['metrics', 'top-pages'],
        queryFn: async () => {
            const response = await metricsApi.getTopPages(10)
            return response.data.data
        }
    })

    const trendsDistribution = overview ? [
        { name: 'Growing', value: overview.pagesWithGrowth, color: '#10b981' },
        { name: 'Declining', value: overview.pagesWithDecline, color: '#ef4444' },
        { name: 'Stable', value: overview.pagesStable, color: '#64748b' },
    ] : []

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
        <div className="space-y-6">
            {/* Page Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-white">Analytics</h1>
                <p className="text-dark-400 mt-1">Deep dive into your ads data</p>
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Top Pages Bar Chart */}
                <div className="card p-6">
                    <h3 className="text-lg font-semibold text-white mb-6">Top Pages by Active Ads</h3>
                    <div className="h-80">
                        {topPages && topPages.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={topPages} layout="vertical">
                                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={true} vertical={false} />
                                    <XAxis type="number" stroke="#64748b" tick={{ fill: '#64748b', fontSize: 12 }} />
                                    <YAxis
                                        type="category"
                                        dataKey="name"
                                        stroke="#64748b"
                                        tick={{ fill: '#64748b', fontSize: 12 }}
                                        width={120}
                                    />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Bar dataKey="totalAds" fill="#0ea5e9" radius={[0, 4, 4, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex items-center justify-center text-dark-500">
                                No data available
                            </div>
                        )}
                    </div>
                </div>

                {/* Trends Distribution Pie Chart */}
                <div className="card p-6">
                    <h3 className="text-lg font-semibold text-white mb-6">Trend Distribution</h3>
                    <div className="h-80 flex items-center justify-center">
                        {overview && overview.totalPages > 0 ? (
                            <div className="flex items-center gap-8">
                                <ResponsiveContainer width={200} height={200}>
                                    <PieChart>
                                        <Pie
                                            data={trendsDistribution}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={80}
                                            dataKey="value"
                                            stroke="transparent"
                                        >
                                            {trendsDistribution.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Pie>
                                    </PieChart>
                                </ResponsiveContainer>

                                {/* Legend */}
                                <div className="space-y-4">
                                    {trendsDistribution.map((item) => (
                                        <div key={item.name} className="flex items-center gap-3">
                                            <div
                                                className="w-3 h-3 rounded-full"
                                                style={{ backgroundColor: item.color }}
                                            ></div>
                                            <span className="text-dark-300">{item.name}</span>
                                            <span className="text-white font-semibold">{item.value}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="text-dark-500">No data available</div>
                        )}
                    </div>
                </div>
            </div>

            {/* Top Pages Table */}
            <div className="card">
                <div className="p-4 border-b border-dark-700">
                    <h3 className="text-lg font-semibold text-white">Page Rankings</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-dark-800/50">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-dark-400 uppercase">Rank</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-dark-400 uppercase">Page Name</th>
                                <th className="px-4 py-3 text-right text-xs font-medium text-dark-400 uppercase">Active Ads</th>
                                <th className="px-4 py-3 text-right text-xs font-medium text-dark-400 uppercase">Daily Change</th>
                                <th className="px-4 py-3 text-right text-xs font-medium text-dark-400 uppercase">Week Change</th>
                                <th className="px-4 py-3 text-right text-xs font-medium text-dark-400 uppercase">Month Change</th>
                                <th className="px-4 py-3 text-center text-xs font-medium text-dark-400 uppercase">Trend</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-dark-800">
                            {topPages?.map((page, index) => (
                                <tr key={page.id} className="hover:bg-dark-800/30">
                                    <td className="px-4 py-3">
                                        <span className="text-dark-400 font-medium">#{index + 1}</span>
                                    </td>
                                    <td className="px-4 py-3 text-white font-medium">{page.name}</td>
                                    <td className="px-4 py-3 text-right text-white">
                                        {page.totalAds.toLocaleString()}
                                    </td>
                                    <td className={`px-4 py-3 text-right ${page.dailyChange > 0 ? 'text-emerald-400' :
                                        page.dailyChange < 0 ? 'text-red-400' : 'text-dark-400'
                                        }`}>
                                        {page.dailyChange > 0 ? '+' : ''}{page.dailyChange}
                                        {page.dailyChangePercent !== 0 && (
                                            <span className="text-xs ml-1">
                                                ({page.dailyChangePercent > 0 ? '+' : ''}{page.dailyChangePercent.toFixed(1)}%)
                                            </span>
                                        )}
                                    </td>
                                    <td className={`px-4 py-3 text-right ${page.weeklyChange > 0 ? 'text-emerald-400' :
                                        page.weeklyChange < 0 ? 'text-red-400' : 'text-dark-400'
                                        }`}>
                                        {page.weeklyChange > 0 ? '+' : ''}{page.weeklyChange}
                                        {page.weeklyChangePercent !== 0 && (
                                            <span className="text-xs ml-1">
                                                ({page.weeklyChangePercent > 0 ? '+' : ''}{page.weeklyChangePercent.toFixed(1)}%)
                                            </span>
                                        )}
                                    </td>
                                    <td className={`px-4 py-3 text-right ${page.monthlyChange > 0 ? 'text-emerald-400' :
                                        page.monthlyChange < 0 ? 'text-red-400' : 'text-dark-400'
                                        }`}>
                                        {page.monthlyChange > 0 ? '+' : ''}{page.monthlyChange}
                                        {page.monthlyChangePercent !== 0 && (
                                            <span className="text-xs ml-1">
                                                ({page.monthlyChangePercent > 0 ? '+' : ''}{page.monthlyChangePercent.toFixed(1)}%)
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex justify-center">
                                            {page.trend === 'up' && <TrendingUp className="w-5 h-5 text-emerald-400" />}
                                            {page.trend === 'down' && <TrendingDown className="w-5 h-5 text-red-400" />}
                                            {page.trend === 'stable' && <Minus className="w-5 h-5 text-dark-400" />}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {(!topPages || topPages.length === 0) && (
                                <tr>
                                    <td colSpan={7} className="px-4 py-8 text-center text-dark-500">
                                        No pages data available. Add some pages to get started.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
