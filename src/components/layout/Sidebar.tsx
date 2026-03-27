import { Link, useLocation } from 'react-router-dom'
import {
    LayoutDashboard,
    Plus,
    BarChart3,
    Facebook,
    TrendingUp,
    Globe,
    Shield,
    Search
} from 'lucide-react'

const navigation = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Add Page', href: '/add', icon: Plus },
    { name: 'Analytics', href: '/analytics', icon: BarChart3 },
    { name: 'Funnel Mapper', href: '/funnel', icon: Globe },
    { name: 'Uncloak Tool', href: '/uncloak', icon: Shield },
    { name: 'Ad Library', href: '/library', icon: Search },
]

export default function Sidebar() {
    const location = useLocation()

    return (
        <aside className="fixed left-0 top-0 h-screen w-64 bg-dark-900/80 backdrop-blur-xl border-r border-dark-800 z-50">
            {/* Logo */}
            <div className="p-6 border-b border-dark-800">
                <Link to="/" className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-primary-500/25">
                        <Facebook className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h1 className="font-bold text-white">Ads Tracker</h1>
                        <p className="text-xs text-dark-400">Facebook Ads Library</p>
                    </div>
                </Link>
            </div>

            {/* Navigation */}
            <nav className="p-4 space-y-2">
                {navigation.map((item) => {
                    const isActive = location.pathname === item.href
                    return (
                        <Link
                            key={item.name}
                            to={item.href}
                            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group
                ${isActive
                                    ? 'bg-gradient-to-r from-primary-500/20 to-purple-500/10 text-primary-400 border border-primary-500/20'
                                    : 'text-dark-400 hover:text-white hover:bg-dark-800/50'
                                }`}
                        >
                            <item.icon className={`w-5 h-5 ${isActive ? 'text-primary-400' : 'group-hover:text-primary-400'}`} />
                            <span className="font-medium">{item.name}</span>
                        </Link>
                    )
                })}
            </nav>

            {/* Stats Preview */}
            <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-dark-800">
                <div className="bg-gradient-to-br from-dark-800/50 to-dark-900/50 rounded-xl p-4 border border-dark-700/50">
                    <div className="flex items-center gap-2 text-dark-400 mb-2">
                        <TrendingUp className="w-4 h-4" />
                        <span className="text-xs font-medium">Quick Stats</span>
                    </div>
                    <div className="text-2xl font-bold gradient-text">--</div>
                    <p className="text-xs text-dark-500 mt-1">Total Active Ads</p>
                </div>
            </div>
        </aside>
    )
}
