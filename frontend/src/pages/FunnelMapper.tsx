import { useState } from 'react'
import { toolsApi } from '../services/api'
import { Search, Globe, Shield, ExternalLink, ChevronDown, CheckCircle, AlertTriangle, BookOpen } from 'lucide-react'
import CloakingResearchGuide from '../components/dashboard/CloakingResearchGuide'

interface FunnelNode {
    url: string
    title: string
    redirectUrl?: string
    externalLinks?: string[]
    children: FunnelNode[]
}

export default function FunnelMapper() {
    const [url, setUrl] = useState('')
    const [headful, setHeadful] = useState(false)
    const [showGuide, setShowGuide] = useState(false)
    const [loading, setLoading] = useState(false)
    const [result, setResult] = useState<FunnelNode | null>(null)
    const [error, setError] = useState('')

    const handleMap = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!url) return

        setLoading(true)
        setError('')
        setResult(null)

        try {
            const response = await toolsApi.mapFunnel(url, headful)
            setResult(response.data.funnel)
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to map funnel')
        } finally {
            setLoading(false)
        }
    }

    const renderNode = (node: FunnelNode, depth = 0) => {
        return (
            <div key={node.url} className="ml-4 border-l-2 border-dark-700 pl-4 py-2">
                <div className="flex flex-col gap-2">
                    <div className="flex items-start gap-2">
                        {node.children.length > 0 ? (
                            <ChevronDown className="w-4 h-4 text-primary-400 mt-1" />
                        ) : (
                            <div className="w-4" />
                        )}
                        <div className="flex-1">
                            <div className="flex items-center gap-2">
                                <span className="font-medium text-white">{node.title || 'No Title'}</span>
                                {node.redirectUrl && (
                                    <span className="px-2 py-0.5 text-xs bg-red-500/20 text-red-400 border border-red-500/20 rounded-full flex items-center gap-1">
                                        <Shield className="w-3 h-3" />
                                        Redirected
                                    </span>
                                )}
                            </div>
                            <div className="text-sm text-dark-400 break-all">{node.url}</div>

                            {node.redirectUrl && (
                                <div className="mt-2 p-3 bg-red-900/10 border border-red-500/20 rounded-lg">
                                    <div className="text-xs text-red-400 font-medium mb-1">Final Destination (Black Page):</div>
                                    <a
                                        href={node.redirectUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-2 text-primary-400 hover:text-primary-300 break-all transition-colors"
                                    >
                                        <ExternalLink className="w-4 h-4" />
                                        {node.redirectUrl}
                                    </a>
                                </div>
                            )}
                        </div>
                    </div>

                    {node.externalLinks && node.externalLinks.length > 0 && (
                        <div className="ml-6 mt-1">
                            <div className="text-xs text-dark-500 font-medium mb-1">External Links ({node.externalLinks.length}):</div>
                            <div className="grid grid-cols-1 gap-1">
                                {node.externalLinks.slice(0, 5).map((link, i) => (
                                    <a
                                        key={i}
                                        href={link}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-xs text-dark-400 hover:text-primary-400 truncate block"
                                    >
                                        {link}
                                    </a>
                                ))}
                                {node.externalLinks.length > 5 && (
                                    <div className="text-xs text-dark-600 italic">...and {node.externalLinks.length - 5} more</div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {node.children.length > 0 && (
                    <div className="mt-2">
                        {node.children.map(child => renderNode(child, depth + 1))}
                    </div>
                )}
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="bg-dark-800/50 backdrop-blur-xl border border-dark-700/50 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <Globe className="w-5 h-5 text-primary-500" />
                        Funnel Mapper & Cloak Bypass
                    </h2>
                    <button
                        onClick={() => setShowGuide(!showGuide)}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border ${showGuide
                                ? 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                                : 'bg-dark-900/50 text-dark-400 border-dark-700 hover:text-white'
                            }`}
                    >
                        <BookOpen className="w-4 h-4" />
                        {showGuide ? 'Hide Research/Guide' : 'Show Research Workflow'}
                    </button>
                </div>

                {showGuide && (
                    <div className="mb-6 animate-in slide-in-from-top-4 fade-in duration-300">
                        <CloakingResearchGuide />
                    </div>
                )}

                <form onSubmit={handleMap} className="space-y-4">
                    <div className="flex gap-4">
                        <div className="flex-1 relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400" />
                            <input
                                type="url"
                                value={url}
                                onChange={(e) => setUrl(e.target.value)}
                                placeholder="Enter Ad URL (e.g. https://bit.ly/...)"
                                className="w-full bg-dark-900/50 border border-dark-700 rounded-xl py-3 pl-12 pr-4 text-white placeholder-dark-400 focus:outline-none focus:border-primary-500/50 transition-colors"
                                required
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="bg-primary-600 hover:bg-primary-500 text-white px-6 rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                    Mapping...
                                </>
                            ) : (
                                <>
                                    <Search className="w-5 h-5" />
                                    Map Funnel
                                </>
                            )}
                        </button>
                    </div>

                    <div className="flex items-center gap-3 p-3 bg-dark-900/30 rounded-lg border border-dark-700/50">
                        <input
                            type="checkbox"
                            id="headful"
                            checked={headful}
                            onChange={(e) => setHeadful(e.target.checked)}
                            className="w-5 h-5 rounded border-dark-600 bg-dark-800 text-primary-500 focus:ring-offset-dark-900"
                        />
                        <label htmlFor="headful" className="cursor-pointer select-none">
                            <span className="text-white font-medium">Headful Mode (Manual Bypass)</span>
                            <p className="text-xs text-dark-400 mt-0.5">
                                Opens a browser window. You accept the "Humanity Check" or wait for the video to verify, then the mapper takes over.
                            </p>
                        </label>
                    </div>
                </form>

                {error && (
                    <div className="mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5" />
                        {error}
                    </div>
                )}
            </div>

            {result && (
                <div className="bg-dark-800/50 backdrop-blur-xl border border-dark-700/50 rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-semibold text-white">Funnel Structure</h3>
                        <div className="px-3 py-1 rounded-full bg-green-500/10 text-green-400 text-xs font-medium border border-green-500/20 flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" />
                            Mapping Complete
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        {renderNode(result)}
                    </div>
                </div>
            )}
        </div>
    )
}
