import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { format } from 'date-fns'
import {
    ArrowLeft,
    ExternalLink,
    RefreshCw,
    Trash2,
    Clock,
    TrendingUp,
    TrendingDown,
    Activity
} from 'lucide-react'
import { pagesApi, snapshotsApi, scraperApi } from '../services/api'
import TrendChart from '../components/dashboard/TrendChart'
import StatCard from '../components/dashboard/StatCard'

export default function PageDetails() {
    const { id } = useParams<{ id: string }>()
    const navigate = useNavigate()
    const queryClient = useQueryClient()

    // Fetch page details
    const { data: page, isLoading } = useQuery({
        queryKey: ['page', id],
        queryFn: async () => {
            const response = await pagesApi.getById(id!)
            return response.data.data
        },
        enabled: !!id
    })

    // Fetch snapshots for chart
    const { data: snapshots } = useQuery({
        queryKey: ['snapshots', id],
        queryFn: async () => {
            const response = await snapshotsApi.getPageSnapshots(id!, 30)
            return response.data.data
        },
        enabled: !!id
    })

    // Scrape mutation
    const scrapeMutation = useMutation({
        mutationFn: () => scraperApi.runPage(id!),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['page', id] })
            queryClient.invalidateQueries({ queryKey: ['snapshots', id] })
        }
    })

    // Delete mutation
    const deleteMutation = useMutation({
        mutationFn: () => pagesApi.delete(id!),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['pages'] })
            navigate('/')
        }
    })

    if (isLoading) {
        return (
            <div className="animate-pulse space-y-6">
                <div className="h-8 bg-dark-700 rounded w-1/4"></div>
                <div className="h-64 bg-dark-700 rounded"></div>
            </div>
        )
    }

    if (!page) {
        return (
            <div className="text-center py-12">
                <p className="text-dark-400">Page not found</p>
            </div>
        )
    }

    const latestSnapshot = page.snapshots?.[0]
    const latestMetric = page.metrics?.[0]

    const chartData = snapshots?.map(s => ({
        date: s.date,
        totalAds: s.totalAds
    })) || []

    return (
        <div className="space-y-6">
            {/* Back Button */}
            <button
                onClick={() => navigate('/')}
                className="flex items-center gap-2 text-dark-400 hover:text-white transition-colors"
            >
                <ArrowLeft className="w-4 h-4" />
                Back to Dashboard
            </button>

            {/* Page Header */}
            <div className="card p-6">
                <div className="flex items-start justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-white">{page.name}</h1>
                        <p className="text-dark-400 mt-1">{page.facebookPageId}</p>
                        {page.description && (
                            <p className="text-dark-500 mt-2">{page.description}</p>
                        )}

                        {/* Tags */}
                        {page.tags.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-4">
                                {page.tags.map(tag => (
                                    <span
                                        key={tag}
                                        className="px-3 py-1 text-xs bg-dark-800 text-dark-400 rounded-full"
                                    >
                                        {tag}
                                    </span>
                                ))}
                            </div>
                        )}

                        {/* Last scraped */}
                        <div className="flex items-center gap-2 mt-4 text-dark-500 text-sm">
                            <Clock className="w-4 h-4" />
                            {page.lastScrapedAt
                                ? `Last updated ${format(new Date(page.lastScrapedAt), 'PPpp')}`
                                : 'Never scraped'
                            }
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                        <a
                            href={page.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn-secondary flex items-center gap-2"
                        >
                            <ExternalLink className="w-4 h-4" />
                            View on Facebook
                        </a>

                        {page.offerUrl && (
                            <a
                                href={page.offerUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="btn-secondary flex items-center gap-2 text-primary-400 border-primary-500/30 hover:bg-primary-500/10"
                            >
                                <ExternalLink className="w-4 h-4" />
                                View Offer
                            </a>
                        )}

                        {page.checkoutUrl && (
                            <a
                                href={page.checkoutUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="btn-secondary flex items-center gap-2 text-green-400 border-green-500/30 hover:bg-green-500/10"
                            >
                                <ExternalLink className="w-4 h-4" />
                                Checkout
                            </a>
                        )}
                        <button
                            onClick={() => scrapeMutation.mutate()}
                            disabled={scrapeMutation.isPending}
                            className="btn-primary flex items-center gap-2"
                        >
                            <RefreshCw className={`w-4 h-4 ${scrapeMutation.isPending ? 'animate-spin' : ''}`} />
                            {scrapeMutation.isPending ? 'Scraping...' : 'Scrape Now'}
                        </button>
                        <button
                            onClick={() => {
                                if (confirm('Are you sure you want to delete this page?')) {
                                    deleteMutation.mutate()
                                }
                            }}
                            className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                        >
                            <Trash2 className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <StatCard
                    title="Current Active Ads"
                    value={latestSnapshot?.totalAds ?? '--'}
                    icon={<Activity className="w-6 h-6 text-primary-400" />}
                />
                <StatCard
                    title="Daily Change"
                    value={latestMetric?.dailyChange ?? '--'}
                    change={latestMetric?.dailyChangePercent}
                    changeLabel="vs yesterday"
                    trend={latestMetric?.trend as 'up' | 'down' | 'stable' | undefined}
                    icon={latestMetric?.trend === 'up'
                        ? <TrendingUp className="w-6 h-6 text-emerald-400" />
                        : <TrendingDown className="w-6 h-6 text-red-400" />
                    }
                />
                <StatCard
                    title="7-Day Average"
                    value={latestMetric?.movingAvg7d?.toFixed(0) ?? '--'}
                    icon={<Activity className="w-6 h-6 text-purple-400" />}
                />
            </div>

            {/* Trend Chart */}
            {chartData.length > 0 && (
                <TrendChart data={chartData} title="Ads History (30 Days)" />
            )}

            {/* Snapshots Table */}
            <div className="card">
                <div className="p-4 border-b border-dark-700">
                    <h3 className="text-lg font-semibold text-white">Snapshot History</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-dark-800/50">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-dark-400 uppercase">Date</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-dark-400 uppercase">Total Ads</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-dark-400 uppercase">Status</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-dark-400 uppercase">Duration</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-dark-800">
                            {page.snapshots?.slice(0, 10).map(snapshot => (
                                <tr key={snapshot.id} className="hover:bg-dark-800/30">
                                    <td className="px-4 py-3 text-sm text-white">
                                        {format(new Date(snapshot.timestamp), 'MMM d, yyyy HH:mm')}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-white font-medium">
                                        {snapshot.totalAds.toLocaleString()}
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className={`inline-flex items-center px-2 py-1 text-xs rounded-full ${snapshot.success
                                            ? 'bg-emerald-500/10 text-emerald-400'
                                            : 'bg-red-500/10 text-red-400'
                                            }`}>
                                            {snapshot.success ? 'Success' : 'Failed'}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-sm text-dark-400">
                                        {snapshot.scrapeDuration ? `${(snapshot.scrapeDuration / 1000).toFixed(1)}s` : '--'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
