import { useState } from 'react'
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query'
import { Bell, RefreshCw, Search, Play, Menu, X } from 'lucide-react'
import { scraperApi } from '../../services/api'
import { useSearchStore } from '../../store/useSearchStore'

interface HeaderProps {
    onMenuClick: () => void
}

export default function Header({ onMenuClick }: HeaderProps) {
    const queryClient = useQueryClient()
    const [isSearchOpen, setIsSearchOpen] = useState(false)
    const { searchTerm, setSearchTerm } = useSearchStore()

    const { data: statusRes } = useQuery({
        queryKey: ['scraperStatus'],
        queryFn: () => scraperApi.getStatus(),
        refetchInterval: 5000,
    })

    const isServerRunning = statusRes?.data?.data?.isRunning || false;

    const runScraperMutation = useMutation({
        mutationFn: () => scraperApi.runAll(),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['scraperStatus'] })
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ['pages'] })
            queryClient.invalidateQueries({ queryKey: ['metrics'] })
        }
    })

    const isRunning = runScraperMutation.isPending || isServerRunning;

    return (
        <header className="h-16 bg-dark-900/50 backdrop-blur-xl border-b border-dark-800 flex items-center justify-between px-4 md:px-6 sticky top-0 z-30">
            <div className="flex items-center gap-4">
                {/* Mobile Menu Toggle */}
                <button
                    onClick={onMenuClick}
                    aria-label="Open menu"
                    className="p-2 text-dark-400 hover:text-white hover:bg-dark-800 rounded-lg lg:hidden transition-colors"
                >
                    <Menu className="w-6 h-6" />
                </button>

                {/* Search - Desktop and Mobile Toggle */}
                <div className="relative flex items-center">
                    {/* Desktop Search */}
                    <div className="hidden md:block relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-500" />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Search pages, categories, tags..."
                            className="w-64 lg:w-80 pl-10 pr-4 py-2 bg-dark-800/50 border border-dark-700 rounded-lg text-white text-sm
                             placeholder-dark-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500/50
                             transition-all duration-200"
                        />
                    </div>

                    {/* Mobile Search Toggle */}
                    <button 
                        onClick={() => setIsSearchOpen(!isSearchOpen)}
                        aria-label="Toggle search"
                        className="p-2 text-dark-400 hover:text-white hover:bg-dark-800 rounded-lg md:hidden transition-colors"
                    >
                        <Search className="w-5 h-5" />
                    </button>

                    {/* Mobile Search Overlay */}
                    {isSearchOpen && (
                        <div className="absolute left-0 top-0 w-[calc(100vw-2rem)] md:hidden p-2 bg-dark-900 border border-dark-700 rounded-lg shadow-2xl z-50 flex items-center gap-2 animate-in fade-in slide-in-from-top-1">
                            <Search className="w-4 h-4 text-dark-500 ml-2" />
                            <input
                                autoFocus
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Search..."
                                className="flex-1 bg-transparent border-none text-white text-sm focus:ring-0 p-1"
                            />
                            <button 
                                onClick={() => {
                                    setIsSearchOpen(false)
                                    setSearchTerm('')
                                }} 
                                aria-label="Close search"
                                className="p-1 text-dark-500 hover:text-white"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 md:gap-3">
                {/* Run Scraper Button */}
                <button
                    onClick={() => runScraperMutation.mutate()}
                    disabled={isRunning}
                    className={`flex items-center gap-2 px-3 md:px-4 py-2 rounded-lg font-medium text-xs md:text-sm transition-all duration-200
            ${isRunning
                            ? 'bg-dark-700 text-dark-400 cursor-not-allowed'
                            : 'bg-gradient-to-r from-primary-500 to-primary-600 text-white hover:from-primary-600 hover:to-primary-700 shadow-lg shadow-primary-500/25'
                        }`}
                >
                    <RefreshCw className={`w-4 h-4 ${isRunning ? 'animate-spin' : ''}`} />
                    <span className="hidden sm:inline">{isRunning ? 'Running...' : 'Run Scraper'}</span>
                </button>

                {/* Notifications */}
                <button 
                    aria-label="View notifications"
                    className="relative p-2 text-dark-400 hover:text-white hover:bg-dark-800 rounded-lg transition-colors"
                >
                    <Bell className="w-5 h-5" />
                    <span className="absolute top-1 right-1 w-2 h-2 bg-primary-500 rounded-full"></span>
                </button>

                {/* User Avatar */}
                <div className="w-8 h-8 md:w-9 md:h-9 bg-gradient-to-br from-primary-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xs md:text-sm font-medium">
                    A
                </div>
            </div>
        </header>
    )
}


