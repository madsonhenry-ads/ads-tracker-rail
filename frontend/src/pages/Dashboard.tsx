import { useQuery } from '@tanstack/react-query'
import {
    Layers,
    Activity,
    TrendingUp,
    TrendingDown,
    Zap,
    Target
} from 'lucide-react'
import { pagesApi, metricsApi } from '../services/api'
import StatCard from '../components/dashboard/StatCard'
import PageCard from '../components/dashboard/PageCard'
import TrendChart from '../components/dashboard/TrendChart'

export default function Dashboard() {
    // Fetch pages
    const { data: pagesData, isLoading: pagesLoading } = useQuery({
        queryKey: ['pages'],
        queryFn: async () => {
            const response = await pagesApi.getAll()
            return response.data.data
        }
    })

    // Fetch overview metrics
    const { data: metricsData, isLoading: metricsLoading } = useQuery({
        queryKey: ['metrics', 'overview'],
        queryFn: async () => {
            const response = await metricsApi.getOverview()
            return response.data.data
        }
    })

    // Fetch trend data
    const { data: trendData } = useQuery({
        queryKey: ['metrics', 'trends'],
        queryFn: async () => {
            const response = await metricsApi.getTrends(30)
            return response.data.data
        }
    })

    const isLoading = pagesLoading || metricsLoading

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-white">Dashboard</h1>
                <p className="text-dark-400 mt-1">Monitor your Facebook Ads performance</p>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    title="Total Pages"
                    value={metricsData?.totalPages ?? '--'}
                    icon={<Layers className="w-6 h-6 text-primary-400" />}
                />
                <StatCard
                    title="Total Active Ads"
                    value={metricsData?.totalActiveAds?.toLocaleString() ?? '--'}
                    change={metricsData?.totalChangePercent}
                    changeLabel="vs yesterday"
                    trend={
                        metricsData?.totalChangePercent
                            ? metricsData.totalChangePercent > 0 ? 'up' : metricsData.totalChangePercent < 0 ? 'down' : 'stable'
                            : undefined
                    }
                    icon={<Activity className="w-6 h-6 text-purple-400" />}
                />
                <StatCard
                    title="Pages Growing"
                    value={metricsData?.pagesWithGrowth ?? '--'}
                    icon={<TrendingUp className="w-6 h-6 text-emerald-400" />}
                    trend="up"
                />
                <StatCard
                    title="Pages Declining"
                    value={metricsData?.pagesWithDecline ?? '--'}
                    icon={<TrendingDown className="w-6 h-6 text-red-400" />}
                    trend="down"
                />
            </div>

            {/* Trend Chart */}
            {trendData && trendData.length > 0 && (
                <TrendChart data={trendData} title="Total Ads Trend (30 Days)" />
            )}

            {/* Pages Grid */}
            <div>
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold text-white">Monitored Pages</h2>
                    <span className="text-sm text-dark-400">
                        {pagesData?.length ?? 0} pages
                    </span>
                </div>

                {isLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="card p-5 animate-pulse">
                                <div className="h-4 bg-dark-700 rounded w-3/4 mb-3"></div>
                                <div className="h-3 bg-dark-700 rounded w-1/2 mb-4"></div>
                                <div className="h-8 bg-dark-700 rounded w-1/3"></div>
                            </div>
                        ))}
                    </div>
                ) : pagesData && pagesData.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {pagesData.map((page) => (
                            <PageCard key={page.id} page={page} />
                        ))}
                    </div>
                ) : (
                    <div className="card p-12 text-center">
                        <div className="w-16 h-16 bg-dark-800 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Target className="w-8 h-8 text-dark-500" />
                        </div>
                        <h3 className="text-lg font-medium text-white mb-2">No pages yet</h3>
                        <p className="text-dark-400 mb-6">
                            Start monitoring by adding your first Facebook page
                        </p>
                        <a href="/add" className="btn-primary inline-flex items-center gap-2">
                            <Zap className="w-4 h-4" />
                            Add Your First Page
                        </a>
                    </div>
                )}
            </div>
        </div>
    )
}
