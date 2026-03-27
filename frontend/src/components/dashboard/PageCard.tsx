import { Link } from 'react-router-dom'
import { format } from 'date-fns'
import { ExternalLink, TrendingUp, TrendingDown, Minus, Clock } from 'lucide-react'
import type { Page } from '../../services/api'

interface PageCardProps {
    page: Page
}

export default function PageCard({ page }: PageCardProps) {
    // Guard clause for undefined page
    if (!page) {
        return null
    }

    const latestSnapshot = page.snapshots?.[0]
    const latestMetric = page.metrics?.[0]

    const getTrendColor = () => {
        if (latestMetric?.trend === 'up') return 'text-emerald-400'
        if (latestMetric?.trend === 'down') return 'text-red-400'
        return 'text-dark-400'
    }

    const getTrendIcon = () => {
        if (latestMetric?.trend === 'up') return <TrendingUp className="w-4 h-4" />
        if (latestMetric?.trend === 'down') return <TrendingDown className="w-4 h-4" />
        return <Minus className="w-4 h-4" />
    }

    const getTrendBg = () => {
        if (latestMetric?.trend === 'up') return 'from-emerald-500/20 to-emerald-500/5'
        if (latestMetric?.trend === 'down') return 'from-red-500/20 to-red-500/5'
        return 'from-dark-700/50 to-dark-800/50'
    }


    return (
        <Link
            to={`/page/${page.id}`}
            className="card group hover:border-primary-500/30 transition-all duration-300 animate-slide-up"
        >
            <div className="p-5">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                        <h3 className="font-semibold text-white group-hover:text-primary-400 transition-colors line-clamp-1">
                            {page.name}
                        </h3>
                        <p className="text-xs text-dark-500 mt-1 line-clamp-1">
                            {page.facebookPageId}
                        </p>
                    </div>
                    <a
                        href={page.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="p-2 text-dark-500 hover:text-primary-400 hover:bg-dark-800 rounded-lg transition-colors"
                    >
                        <ExternalLink className="w-4 h-4" />
                    </a>
                </div>

                {/* Stats */}
                <div className="flex items-end justify-between">
                    <div>
                        <p className="text-3xl font-bold text-white">
                            {latestSnapshot?.totalAds ?? '--'}
                        </p>
                        <p className="text-xs text-dark-500 mt-1">Active Ads</p>
                    </div>

                    {/* Trend Badge */}
                    <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r ${getTrendBg()}`}>
                        <span className={getTrendColor()}>{getTrendIcon()}</span>
                        <span className={`text-sm font-medium ${getTrendColor()}`}>
                            {latestMetric?.dailyChangePercent != null
                                ? `${latestMetric.dailyChangePercent > 0 ? '+' : ''}${latestMetric.dailyChangePercent.toFixed(1)}%`
                                : '--'
                            }
                        </span>
                    </div>
                </div>

                {/* Tags */}
                {page.tags && page.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-4">
                        {page.tags.slice(0, 3).map((tag) => (
                            <span
                                key={tag}
                                className="px-2 py-0.5 text-xs bg-dark-800 text-dark-400 rounded-md"
                            >
                                {tag}
                            </span>
                        ))}
                        {page.tags.length > 3 && (
                            <span className="px-2 py-0.5 text-xs text-dark-500">
                                +{page.tags.length - 3}
                            </span>
                        )}
                    </div>
                )}

                {/* Last Updated */}
                <div className="flex items-center gap-1.5 mt-4 pt-4 border-t border-dark-800">
                    <Clock className="w-3.5 h-3.5 text-dark-500" />
                    <span className="text-xs text-dark-500">
                        {page.lastScrapedAt
                            ? `Updated ${format(new Date(page.lastScrapedAt), 'MMM d, HH:mm')}`
                            : 'Never scraped'
                        }
                    </span>
                </div>
            </div>
        </Link>
    )
}
