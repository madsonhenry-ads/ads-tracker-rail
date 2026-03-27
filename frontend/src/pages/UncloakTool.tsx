import { useState } from 'react'
import { toolsApi } from '../services/api'
import { Search, Shield, ExternalLink, AlertTriangle, CheckCircle, Wifi, WifiOff, Eye, EyeOff, Smartphone, Monitor, RefreshCw, Zap, Lock, Unlock, ArrowRight } from 'lucide-react'

interface RedirectStep {
    url: string
    status: number
}

interface CloakAnalysis {
    isCloaked: boolean
    confidence: number
    signals: string[]
    pageType: 'money_page' | 'white_page' | 'unknown'
    detectedElements: {
        hasVideo: boolean
        hasForms: boolean
        hasCheckout: boolean
        hasCTA: boolean
        hasCountdown: boolean
        hasSocialProof: boolean
    }
    twrDetected: boolean
    parameters: Record<string, string>
}

interface UncloakResult {
    originalUrl: string
    finalUrl: string
    redirectChain: RedirectStep[]
    pageTitle: string
    screenshotBase64: string
    htmlLength: number
    analysis: CloakAnalysis
    proxyUsed: string | null
    timestamp: string
}

export default function UncloakTool() {
    const [url, setUrl] = useState('')
    const [useProxy, setUseProxy] = useState(true)
    const [headful, setHeadful] = useState(false)
    const [mobile, setMobile] = useState(true)
    const [loading, setLoading] = useState(false)
    const [swapping, setSwapping] = useState(false)
    const [result, setResult] = useState<UncloakResult | null>(null)
    const [error, setError] = useState('')

    const handleUncloak = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!url) return

        setLoading(true)
        setError('')
        setResult(null)

        try {
            const response = await toolsApi.uncloak(url, { useProxy, headful, mobile })
            setResult(response.data.data)
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to uncloak URL')
        } finally {
            setLoading(false)
        }
    }

    const handleSwapIp = async () => {
        setSwapping(true)
        try {
            await toolsApi.swapIp()
        } catch (err: any) {
            setError('Failed to swap proxy IP')
        } finally {
            setSwapping(false)
        }
    }

    const getPageTypeBadge = (pageType: string) => {
        switch (pageType) {
            case 'money_page':
                return (
                    <span className="px-3 py-1.5 rounded-full bg-green-500/10 text-green-400 text-sm font-bold border border-green-500/20 flex items-center gap-1.5">
                        <Unlock className="w-4 h-4" />
                        💰 Money Page Detected
                    </span>
                )
            case 'white_page':
                return (
                    <span className="px-3 py-1.5 rounded-full bg-yellow-500/10 text-yellow-400 text-sm font-bold border border-yellow-500/20 flex items-center gap-1.5">
                        <Lock className="w-4 h-4" />
                        📄 White Page (Cloaked)
                    </span>
                )
            default:
                return (
                    <span className="px-3 py-1.5 rounded-full bg-dark-700/50 text-dark-300 text-sm font-bold border border-dark-600/50 flex items-center gap-1.5">
                        ❓ Unknown
                    </span>
                )
        }
    }

    const getConfidenceColor = (confidence: number) => {
        if (confidence >= 70) return 'text-green-400 bg-green-500/10 border-green-500/20'
        if (confidence >= 40) return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20'
        return 'text-red-400 bg-red-500/10 border-red-500/20'
    }

    return (
        <div className="space-y-6">
            {/* Header Card */}
            <div className="bg-dark-800/50 backdrop-blur-xl border border-dark-700/50 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-5">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <Shield className="w-5 h-5 text-red-400" />
                        Uncloak Tool
                    </h2>
                    <button
                        onClick={handleSwapIp}
                        disabled={swapping}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border bg-dark-900/50 text-dark-400 border-dark-700 hover:text-white"
                    >
                        <RefreshCw className={`w-4 h-4 ${swapping ? 'animate-spin' : ''}`} />
                        {swapping ? 'Swapping...' : 'Swap Proxy IP'}
                    </button>
                </div>

                <p className="text-sm text-dark-400 mb-5">
                    Simula um usuário real do Facebook para revelar money pages escondidas por cloakers como TWR.
                </p>

                <form onSubmit={handleUncloak} className="space-y-4">
                    {/* URL Input */}
                    <div className="flex gap-3">
                        <div className="flex-1 relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400" />
                            <input
                                type="text"
                                value={url}
                                onChange={(e) => setUrl(e.target.value)}
                                placeholder="Cole a URL do anúncio aqui (ex: https://bit.ly/...)"
                                className="w-full bg-dark-900/50 border border-dark-700 rounded-xl py-3 pl-12 pr-4 text-white placeholder-dark-400 focus:outline-none focus:border-primary-500/50 transition-colors"
                                required
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="bg-red-600 hover:bg-red-500 text-white px-6 rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                    Uncloaking...
                                </>
                            ) : (
                                <>
                                    <Zap className="w-5 h-5" />
                                    Uncloak
                                </>
                            )}
                        </button>
                    </div>

                    {/* Options */}
                    <div className="grid grid-cols-3 gap-3">
                        <div
                            onClick={() => setUseProxy(!useProxy)}
                            className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${useProxy
                                    ? 'bg-primary-500/10 border-primary-500/20 text-primary-400'
                                    : 'bg-dark-900/30 border-dark-700/50 text-dark-400 hover:border-dark-600'
                                }`}
                        >
                            {useProxy ? <Wifi className="w-5 h-5" /> : <WifiOff className="w-5 h-5" />}
                            <div>
                                <span className="text-sm font-medium block">Proxy Residencial</span>
                                <span className="text-xs opacity-70">{useProxy ? 'Ativado' : 'Desativado'}</span>
                            </div>
                        </div>

                        <div
                            onClick={() => setHeadful(!headful)}
                            className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${headful
                                    ? 'bg-purple-500/10 border-purple-500/20 text-purple-400'
                                    : 'bg-dark-900/30 border-dark-700/50 text-dark-400 hover:border-dark-600'
                                }`}
                        >
                            {headful ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                            <div>
                                <span className="text-sm font-medium block">Headful Mode</span>
                                <span className="text-xs opacity-70">{headful ? 'Bypass manual' : 'Automático'}</span>
                            </div>
                        </div>

                        <div
                            onClick={() => setMobile(!mobile)}
                            className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${mobile
                                    ? 'bg-green-500/10 border-green-500/20 text-green-400'
                                    : 'bg-dark-900/30 border-dark-700/50 text-dark-400 hover:border-dark-600'
                                }`}
                        >
                            {mobile ? <Smartphone className="w-5 h-5" /> : <Monitor className="w-5 h-5" />}
                            <div>
                                <span className="text-sm font-medium block">{mobile ? 'Mobile' : 'Desktop'}</span>
                                <span className="text-xs opacity-70">{mobile ? 'iPhone iOS 17' : 'Windows Chrome'}</span>
                            </div>
                        </div>
                    </div>
                </form>

                {error && (
                    <div className="mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5" />
                        {error}
                    </div>
                )}
            </div>

            {/* Results */}
            {result && (
                <div className="space-y-4">
                    {/* Analysis Header */}
                    <div className="bg-dark-800/50 backdrop-blur-xl border border-dark-700/50 rounded-2xl p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                                <CheckCircle className="w-5 h-5 text-green-400" />
                                Resultado da Análise
                            </h3>
                            {getPageTypeBadge(result.analysis.pageType)}
                        </div>

                        {/* Key Metrics */}
                        <div className="grid grid-cols-4 gap-4 mb-6">
                            <div className="bg-dark-900/50 rounded-xl p-4 border border-dark-700/30">
                                <div className="text-xs text-dark-400 mb-1">Confiança</div>
                                <div className={`text-2xl font-bold px-2 py-0.5 rounded-lg inline-block ${getConfidenceColor(result.analysis.confidence)}`}>
                                    {result.analysis.confidence}%
                                </div>
                            </div>
                            <div className="bg-dark-900/50 rounded-xl p-4 border border-dark-700/30">
                                <div className="text-xs text-dark-400 mb-1">Redirects</div>
                                <div className="text-2xl font-bold text-white">{result.redirectChain.length}</div>
                            </div>
                            <div className="bg-dark-900/50 rounded-xl p-4 border border-dark-700/30">
                                <div className="text-xs text-dark-400 mb-1">HTML Size</div>
                                <div className="text-2xl font-bold text-white">{(result.htmlLength / 1024).toFixed(0)}KB</div>
                            </div>
                            <div className="bg-dark-900/50 rounded-xl p-4 border border-dark-700/30">
                                <div className="text-xs text-dark-400 mb-1">TWR</div>
                                <div className={`text-2xl font-bold ${result.analysis.twrDetected ? 'text-red-400' : 'text-dark-500'}`}>
                                    {result.analysis.twrDetected ? '⚠️ SIM' : '—'}
                                </div>
                            </div>
                        </div>

                        {/* URLs */}
                        <div className="space-y-3">
                            <div className="flex items-center gap-3 p-3 bg-dark-900/30 rounded-lg border border-dark-700/50">
                                <span className="text-xs text-dark-400 w-16 shrink-0 font-medium">Original</span>
                                <ExternalLink className="w-4 h-4 text-dark-500 shrink-0" />
                                <a href={result.originalUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-dark-300 hover:text-primary-400 break-all transition-colors">
                                    {result.originalUrl}
                                </a>
                            </div>
                            <div className="flex items-center gap-3 p-3 bg-dark-900/30 rounded-lg border border-primary-500/20">
                                <span className="text-xs text-primary-400 w-16 shrink-0 font-medium">Final</span>
                                <ExternalLink className="w-4 h-4 text-primary-400 shrink-0" />
                                <a href={result.finalUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-primary-400 hover:text-primary-300 break-all transition-colors font-medium">
                                    {result.finalUrl}
                                </a>
                            </div>
                        </div>

                        {/* Proxy info */}
                        {result.proxyUsed && (
                            <div className="mt-3 text-xs text-dark-500">
                                🌐 Proxy usado: {result.proxyUsed}
                            </div>
                        )}
                    </div>

                    {/* Signals */}
                    {result.analysis.signals.length > 0 && (
                        <div className="bg-dark-800/50 backdrop-blur-xl border border-dark-700/50 rounded-2xl p-6">
                            <h3 className="text-lg font-semibold text-white mb-4">🔍 Sinais Detectados</h3>
                            <div className="space-y-2">
                                {result.analysis.signals.map((signal, i) => (
                                    <div key={i} className="flex items-center gap-2 p-2 bg-dark-900/30 rounded-lg text-sm text-dark-300">
                                        <div className="w-2 h-2 rounded-full bg-primary-400 shrink-0" />
                                        {signal}
                                    </div>
                                ))}
                            </div>

                            {/* Detected Elements */}
                            <div className="mt-4 grid grid-cols-3 gap-2">
                                {Object.entries(result.analysis.detectedElements).map(([key, val]) => (
                                    <div key={key} className={`p-2 rounded-lg text-xs font-medium text-center ${val ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-dark-900/30 text-dark-500 border border-dark-700/30'}`}>
                                        {val ? '✅' : '❌'} {key.replace('has', '')}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Redirect Chain */}
                    {result.redirectChain.length > 0 && (
                        <div className="bg-dark-800/50 backdrop-blur-xl border border-dark-700/50 rounded-2xl p-6">
                            <h3 className="text-lg font-semibold text-white mb-4">🔗 Cadeia de Redirecionamentos</h3>
                            <div className="space-y-2">
                                {result.redirectChain.map((step, i) => (
                                    <div key={i} className="flex items-center gap-3">
                                        <div className="flex items-center gap-2 shrink-0">
                                            <span className="w-6 h-6 rounded-full bg-dark-700 flex items-center justify-center text-xs text-dark-400 font-mono">
                                                {i + 1}
                                            </span>
                                            {step.status >= 300 && step.status < 400 && (
                                                <span className="text-xs px-1.5 py-0.5 rounded bg-yellow-500/10 text-yellow-400 font-mono">
                                                    {step.status}
                                                </span>
                                            )}
                                        </div>
                                        <ArrowRight className="w-3 h-3 text-dark-600 shrink-0" />
                                        <span className="text-sm text-dark-300 break-all">{step.url}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* URL Parameters */}
                    {Object.keys(result.analysis.parameters).length > 0 && (
                        <div className="bg-dark-800/50 backdrop-blur-xl border border-dark-700/50 rounded-2xl p-6">
                            <h3 className="text-lg font-semibold text-white mb-4">🏷️ Parâmetros da URL Final</h3>
                            <div className="grid grid-cols-2 gap-2">
                                {Object.entries(result.analysis.parameters).map(([key, value]) => (
                                    <div key={key} className={`p-3 rounded-lg border ${key === 'twrclid' || key === 'tok'
                                            ? 'bg-red-500/10 border-red-500/20'
                                            : 'bg-dark-900/30 border-dark-700/30'
                                        }`}>
                                        <div className={`text-xs font-mono font-bold mb-1 ${key === 'twrclid' || key === 'tok' ? 'text-red-400' : 'text-dark-400'
                                            }`}>
                                            {key}
                                        </div>
                                        <div className="text-sm text-dark-300 break-all font-mono">{value}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Screenshot */}
                    {result.screenshotBase64 && (
                        <div className="bg-dark-800/50 backdrop-blur-xl border border-dark-700/50 rounded-2xl p-6">
                            <h3 className="text-lg font-semibold text-white mb-4">📸 Screenshot da Página Final</h3>
                            <div className="rounded-xl overflow-hidden border border-dark-700/50">
                                <img
                                    src={`data:image/png;base64,${result.screenshotBase64}`}
                                    alt="Screenshot"
                                    className="w-full"
                                />
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
