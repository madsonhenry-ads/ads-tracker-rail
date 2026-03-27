import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Bell, RefreshCw, Search, Play } from 'lucide-react'
import { scraperApi } from '../../services/api'

export default function Header() {
    const [isRunning, setIsRunning] = useState(false)
    const queryClient = useQueryClient()

    const runScraperMutation = useMutation({
        mutationFn: () => scraperApi.runAll(),
        onMutate: () => setIsRunning(true),
        onSettled: () => {
            setTimeout(() => {
                setIsRunning(false)
                queryClient.invalidateQueries({ queryKey: ['pages'] })
                queryClient.invalidateQueries({ queryKey: ['metrics'] })
            }, 5000)
        },
    })

    return (
        <header className="h-16 bg-dark-900/50 backdrop-blur-xl border-b border-dark-800 flex items-center justify-between px-6">
            {/* Search */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-500" />
                <input
                    type="text"
                    placeholder="Search pages..."
                    className="w-80 pl-10 pr-4 py-2 bg-dark-800/50 border border-dark-700 rounded-lg text-white text-sm
                     placeholder-dark-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500/50
                     transition-all duration-200"
                />
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3">
                {/* Run Scraper Button */}
                <button
                    onClick={() => runScraperMutation.mutate()}
                    disabled={isRunning}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200
            ${isRunning
                            ? 'bg-dark-700 text-dark-400 cursor-not-allowed'
                            : 'bg-gradient-to-r from-primary-500 to-primary-600 text-white hover:from-primary-600 hover:to-primary-700 shadow-lg shadow-primary-500/25'
                        }`}
                >
                    {isRunning ? (
                        <>
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            <span>Running...</span>
                        </>
                    ) : (
                        <>
                            <Play className="w-4 h-4" />
                            <span>Run Scraper</span>
                        </>
                    )}
                </button>

                {/* Notifications */}
                <button className="relative p-2 text-dark-400 hover:text-white hover:bg-dark-800 rounded-lg transition-colors">
                    <Bell className="w-5 h-5" />
                    <span className="absolute top-1 right-1 w-2 h-2 bg-primary-500 rounded-full"></span>
                </button>

                {/* User Avatar */}
                <div className="w-9 h-9 bg-gradient-to-br from-primary-500 to-purple-600 rounded-full flex items-center justify-center text-white font-medium">
                    A
                </div>
            </div>
        </header>
    )
}
