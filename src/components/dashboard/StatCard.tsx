import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface StatCardProps {
    title: string
    value: string | number
    change?: number
    changeLabel?: string
    icon: React.ReactNode
    trend?: 'up' | 'down' | 'stable'
}

export default function StatCard({ title, value, change, changeLabel, icon, trend }: StatCardProps) {
    const getTrendColor = () => {
        if (trend === 'up') return 'text-emerald-400'
        if (trend === 'down') return 'text-red-400'
        return 'text-dark-400'
    }

    const getTrendIcon = () => {
        if (trend === 'up') return <TrendingUp className="w-4 h-4" />
        if (trend === 'down') return <TrendingDown className="w-4 h-4" />
        return <Minus className="w-4 h-4" />
    }

    return (
        <div className="stat-card animate-fade-in">
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-dark-400 text-sm font-medium">{title}</p>
                    <p className="text-3xl font-bold text-white mt-2">{value}</p>

                    {change !== undefined && (
                        <div className={`flex items-center gap-1 mt-2 ${getTrendColor()}`}>
                            {getTrendIcon()}
                            <span className="text-sm font-medium">
                                {change > 0 ? '+' : ''}{change}%
                            </span>
                            {changeLabel && (
                                <span className="text-dark-500 text-sm ml-1">{changeLabel}</span>
                            )}
                        </div>
                    )}
                </div>

                <div className="w-12 h-12 bg-gradient-to-br from-primary-500/20 to-purple-500/10 rounded-xl flex items-center justify-center">
                    {icon}
                </div>
            </div>
        </div>
    )
}
