import { useState, useMemo } from 'react'
import { adLibraryApi } from '../services/api'
import { Search, Globe, ExternalLink, AlertTriangle, Cloud, Download, Clock, Copy, FileText, Filter, ChevronDown, Check, Loader2 } from 'lucide-react'


interface AdVersion {
    id: string
    startDate?: string
    platforms?: string[]
    thumbnailUrl?: string
    linkUrl?: string
    detailsUrl?: string
    page_name?: string
    ad_snapshot_url?: string
    creative_body?: string
}

type SortOption = 'recent' | 'oldest' | 'impressions' | 'duplicates'

export default function AdLibraryViewer() {
    const [pageId, setPageId] = useState('')
    const [country, setCountry] = useState('US')
    const [loading, setLoading] = useState(false)
    const [scrapping, setScrapping] = useState(false)
    const [ads, setAds] = useState<AdVersion[]>([])
    const [error, setError] = useState('')
    const [totalFound, setTotalFound] = useState(0)
    const [method, setMethod] = useState<'api' | 'scraper'>('api')
    const [activeTab, setActiveTab] = useState<'ads' | 'insights'>('ads')
    const [insights, setInsights] = useState<{ topUrls: { url: string; count: number }[]; oldestDates: string[] } | null>(null)
    
    // Novas funcionalidades
    const [sortBy, setSortBy] = useState<SortOption>('recent')
    const [transcribingId, setTranscribingId] = useState<string | null>(null)
    const [transcriptionResult, setTranscriptionResult] = useState<{id: string, text: string} | null>(null)
    const [copiedId, setCopiedId] = useState<string | null>(null)

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!pageId) return

        setLoading(true)
        setError('')
        setAds([])
        setTotalFound(0)
        setInsights(null)
        setMethod('api')
        setActiveTab('ads')

        try {
            const response = await adLibraryApi.getAllPageAds(pageId, { country })

            if (!response.data || !response.data.data) {
                throw new Error('Invalid API response structure')
            }

            const result = response.data.data
            setTotalFound(result.totalAds)

            const mappedAds: AdVersion[] = result.ads.map((ad: any) => ({
                id: ad.id,
                startDate: ad.ad_delivery_start_time,
                platforms: ad.publisher_platforms,
                detailsUrl: `https://www.facebook.com/ads/library/?id=${ad.id}`,
                page_name: result.pageName,
                ad_snapshot_url: ad.ad_snapshot_url,
                creative_body: ad.ad_creative_bodies?.[0] || '',
                thumbnailUrl: undefined // Clear invalid thumbnail
            }))

            setAds(mappedAds)
        } catch (err: any) {
            console.error('API Error:', err)
            const errorMsg = err.response?.data?.error || err.message || 'Unknown API Error'
            setError(`API Error: ${errorMsg}`)
            alert(`API Error: ${errorMsg}`)
        } finally {
            setLoading(false)
        }
    }

    const handleScrape = async () => {
        if (!pageId) return

        setScrapping(true)
        setError('')
        setAds([])
        setTotalFound(0)
        setInsights(null)
        setMethod('scraper')
        setActiveTab('ads')

        try {
            const response = await adLibraryApi.scrapePageAds(pageId)
            const result = response.data.data
            setTotalFound(result.totalAdsFound)

            setAds(result.ads.map((ad: any) => ({
                id: ad.id,
                startDate: ad.ad_delivery_start_time,
                thumbnailUrl: ad.thumbnail_url,
                ad_snapshot_url: ad.ad_snapshot_url,
                detailsUrl: ad.ad_snapshot_url,
                creative_body: '', // Scraper might not extract this easily in bulk
            })))

            if (result.insights) {
                setInsights(result.insights)
            }
        } catch (err: any) {
            const errorMsg = err.response?.data?.error || err.message || 'Scraper Failed'
            setError(errorMsg)
            alert(`Scraper Error: ${errorMsg}`)
        } finally {
            setScrapping(false)
        }
    }

    const handleTranscribe = async (ad: AdVersion) => {
        if (!ad.ad_snapshot_url) {
            alert('Snapshot URL não disponível para transcrição.')
            return
        }

        setTranscribingId(ad.id)
        setTranscriptionResult(null)

        try {
            // Em uma implementação real, o backend extrairia o mp4 do snapshot_url.
            // Aqui passamos o snapshot_url e o backend faz a mágica.
            const response = await adLibraryApi.transcribeVideo(ad.ad_snapshot_url)
            if (response.data.success) {
                setTranscriptionResult({ id: ad.id, text: response.data.text })
            }
        } catch (err: any) {
            alert(`Erro na transcrição: ${err.response?.data?.error || err.message}`)
        } finally {
            setTranscribingId(null)
        }
    }

    const handleCopy = (id: string, text: string) => {
        navigator.clipboard.writeText(text)
        setCopiedId(id)
        setTimeout(() => setCopiedId(null), 2000)
    }

    const getDaysActive = (dateStr?: string) => {
        if (!dateStr) return null;
        const start = new Date(dateStr);
        if (isNaN(start.getTime())) return null;
        const now = new Date();
        const diffTime = Math.abs(now.getTime() - start.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    }

    // Lógica Avançada de Ordenação
    const sortedAds = useMemo(() => {
        const sorted = [...ads]
        if (sortBy === 'recent') {
            return sorted.sort((a, b) => new Date(b.startDate || 0).getTime() - new Date(a.startDate || 0).getTime())
        }
        if (sortBy === 'oldest') {
            return sorted.sort((a, b) => new Date(a.startDate || 0).getTime() - new Date(b.startDate || 0).getTime())
        }
        // Para 'impressions' e 'duplicates', precisaríamos de dados extras do backend. 
        // Por enquanto, usaremos a ordem padrão ou uma estimativa.
        return sorted
    }, [ads, sortBy])

    return (
        <div className="space-y-6">
            <div className="bg-dark-800/50 backdrop-blur-xl border border-dark-700/50 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <Globe className="w-5 h-5 text-blue-400" />
                        Meta Ad Library Intelligence
                    </h2>
                </div>

                <div className="flex gap-4 items-end">
                    <div className="flex-1 space-y-2">
                        <label className="text-sm font-medium text-dark-300">Facebook Page ID</label>
                        <div className="relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400" />
                            <input
                                type="text"
                                value={pageId}
                                onChange={(e) => setPageId(e.target.value)}
                                placeholder="Ex: 123456789 (ID da Fanpage)"
                                className="w-full bg-dark-900/50 border border-dark-700 rounded-xl py-3 pl-12 pr-4 text-white placeholder-dark-400 focus:outline-none focus:border-blue-500/50 transition-colors"
                            />
                        </div>
                    </div>

                    <div className="w-32 space-y-2">
                        <label className="text-sm font-medium text-dark-300">Country</label>
                        <select
                            title="Select Country"
                            aria-label="Select Country"
                            value={country}
                            onChange={(e) => setCountry(e.target.value)}
                            className="w-full bg-dark-900/50 border border-dark-700 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-blue-500/50 transition-colors appearance-none cursor-pointer"
                        >
                            <option value="US">🇺🇸 US</option>
                            <option value="BR">🇧🇷 BR</option>
                            <option value="ALL">🌍 ALL</option>
                            <option value="CA">🇨🇦 CA</option>
                            <option value="GB">🇬🇧 UK</option>
                            <option value="AU">🇦🇺 AU</option>
                        </select>
                    </div>

                    <button
                        onClick={handleSearch}
                        disabled={loading || scrapping}
                        className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-xl font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
                    >
                        {loading ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            <Cloud className="w-5 h-5" />
                        )}
                        Use API
                    </button>

                    <button
                        onClick={handleScrape}
                        disabled={loading || scrapping}
                        className="bg-purple-600 hover:bg-purple-500 text-white px-6 py-3 rounded-xl font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
                    >
                        {scrapping ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            <Download className="w-5 h-5" />
                        )}
                        Deep Scrape
                    </button>
                </div>

                {error && (
                    <div className="mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5" />
                        {error}
                    </div>
                )}
            </div>

            {totalFound > 0 && (
                <div className="bg-dark-800/50 backdrop-blur-xl border border-dark-700/50 rounded-2xl p-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
                        <h3 className="text-lg font-semibold text-white">
                            {totalFound} Anúncios Ativos
                            <span className="ml-2 text-sm font-normal text-dark-400">({method === 'api' ? 'Via API Oficinal' : 'Via Scraper Pro'})</span>
                        </h3>

                        <div className="flex flex-wrap items-center gap-3">
                            {/* Novo Sistema de Filtros */}
                            <div className="relative group">
                                <div className="flex items-center gap-2 bg-dark-900/50 px-4 py-2 rounded-xl border border-dark-700/50 text-dark-300 text-sm hover:border-blue-500/50 transition-all cursor-pointer">
                                    <Filter className="w-4 h-4" />
                                    <span>Ordenar por: {
                                        sortBy === 'recent' ? 'Recentes' : 
                                        sortBy === 'oldest' ? 'Mais Antigos' : 
                                        sortBy === 'impressions' ? 'Impressões' : 'Mais Duplicados'
                                    }</span>
                                    <ChevronDown className="w-4 h-4" />
                                </div>
                                <div className="absolute right-0 top-full mt-2 w-48 bg-dark-800 border border-dark-700 rounded-xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 overflow-hidden">
                                    <button onClick={() => setSortBy('recent')} className="w-full text-left px-4 py-3 text-sm text-dark-300 hover:bg-dark-700 hover:text-white transition-colors">Recentes</button>
                                    <button onClick={() => setSortBy('oldest')} className="w-full text-left px-4 py-3 text-sm text-dark-300 hover:bg-dark-700 hover:text-white transition-colors font-bold text-blue-400 border-l-2 border-blue-400">Mais Antigos (Validados)</button>
                                    <button onClick={() => setSortBy('impressions')} className="w-full text-left px-4 py-3 text-sm text-dark-300 hover:bg-dark-700 hover:text-white transition-colors">Mais Impressões</button>
                                    <button onClick={() => setSortBy('duplicates')} className="w-full text-left px-4 py-3 text-sm text-dark-300 hover:bg-dark-700 hover:text-white transition-colors">Mais Duplicados (Escala)</button>
                                </div>
                            </div>

                            <div className="flex bg-dark-900/50 p-1 rounded-xl border border-dark-700/50">
                                <button
                                    onClick={() => setActiveTab('ads')}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'ads'
                                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                                        : 'text-dark-400 hover:text-white hover:bg-dark-800'
                                        }`}
                                >
                                    Anúncios
                                </button>
                                <button
                                    onClick={() => setActiveTab('insights')}
                                    disabled={method === 'api'}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'insights'
                                        ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/20'
                                        : 'text-dark-400 hover:text-white hover:bg-dark-800 disabled:opacity-30 disabled:hover:bg-transparent'
                                        }`}
                                >
                                    Insights {method === 'api' && '(Scraper only)'}
                                </button>
                            </div>
                        </div>
                    </div>

                    {activeTab === 'ads' ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {sortedAds.map((ad) => {
                                const daysActive = getDaysActive(ad.startDate);
                                const isTranscribing = transcribingId === ad.id;
                                const hasTranscript = transcriptionResult?.id === ad.id;

                                return (
                                    <div key={ad.id} className="bg-dark-900/50 border border-dark-700/30 rounded-2xl p-4 hover:border-dark-600 transition-all group flex flex-col">
                                        <div className="flex justify-between items-start mb-3">
                                            <div>
                                                <div className="text-xs text-dark-400 font-mono mb-1">ID: {ad.id}</div>
                                                {ad.startDate && (
                                                    <div className="flex flex-col gap-0.5">
                                                        <div className="text-xs text-green-400 flex items-center gap-1">
                                                            <Clock className="w-3 h-3" />
                                                            Início: {ad.startDate}
                                                        </div>
                                                        {daysActive !== null && (
                                                            <div className={`text-xs font-semibold ml-4 ${daysActive > 30 ? 'text-yellow-400' : 'text-blue-400'}`}>
                                                                Ativo há {daysActive} dias {daysActive > 30 && '🔥 (VALIDADO)'}
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => window.open(ad.ad_snapshot_url, '_blank')}
                                                    className="p-2 bg-dark-800 rounded-lg text-dark-400 hover:text-white transition-colors"
                                                    title="Ver na Ad Library"
                                                >
                                                    <ExternalLink className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>

                                        <div className="aspect-video bg-dark-950 rounded-xl mb-4 overflow-hidden border border-dark-800 relative group-hover:border-blue-500/30 transition-colors">
                                            {ad.thumbnailUrl ? (
                                                <img src={ad.thumbnailUrl} alt="Ad Thumbnail" className="w-full h-full object-cover" />
                                            ) : ad.ad_snapshot_url ? (
                                                <iframe
                                                    src={ad.ad_snapshot_url}
                                                    className="w-full h-full border-none pointer-events-none"
                                                    title={`Ad Preview ${ad.id}`}
                                                    sandbox="allow-same-origin allow-scripts"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-dark-600">
                                                    Sem Prévia
                                                </div>
                                            )}
                                            
                                            {/* Badge de Plataforma */}
                                            <div className="absolute bottom-2 right-2 flex gap-1">
                                                {ad.platforms?.map(p => (
                                                    <span key={p} className="bg-dark-900/80 backdrop-blur-md text-[10px] px-2 py-0.5 rounded-md text-white border border-dark-700 truncate max-w-[60px]">
                                                        {p.toUpperCase()}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Texto do Anúncio (Copy) */}
                                        {ad.creative_body && (
                                            <div className="mb-4 bg-dark-800/50 rounded-xl p-3 border border-dark-700/50">
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="text-[10px] uppercase tracking-wider text-dark-400 font-bold">Copy do Anúncio</span>
                                                    <button 
                                                        onClick={() => handleCopy(ad.id, ad.creative_body || '')}
                                                        className="text-dark-400 hover:text-blue-400 transition-colors flex items-center gap-1 text-[10px]"
                                                    >
                                                        {copiedId === ad.id ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                                                        {copiedId === ad.id ? 'Copiado' : 'Copiar Copy'}
                                                    </button>
                                                </div>
                                                <p className="text-xs text-dark-200 line-clamp-3 italic">"{ad.creative_body}"</p>
                                            </div>
                                        )}

                                        {/* Resultado da Transcrição (se houver) */}
                                        {hasTranscript && (
                                            <div className="mb-4 bg-blue-600/10 rounded-xl p-3 border border-blue-500/30 animate-in fade-in slide-in-from-top-2">
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="text-[10px] uppercase tracking-wider text-blue-400 font-bold">Transcrição do Vídeo (IA)</span>
                                                    <button 
                                                        onClick={() => handleCopy(`${ad.id}-tr`, transcriptionResult.text)}
                                                        className="text-blue-400 hover:text-white transition-colors flex items-center gap-1 text-[10px]"
                                                    >
                                                        {copiedId === `${ad.id}-tr` ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                                                        Copiar Texto
                                                    </button>
                                                </div>
                                                <p className="text-xs text-blue-100 italic leading-relaxed">"{transcriptionResult.text}"</p>
                                            </div>
                                        )}

                                        <div className="grid grid-cols-2 gap-2 mt-auto">
                                            <button
                                                onClick={() => handleTranscribe(ad)}
                                                disabled={isTranscribing}
                                                className="py-2.5 bg-purple-600/10 hover:bg-purple-600 text-purple-400 hover:text-white border border-purple-600/20 rounded-xl flex items-center justify-center gap-2 transition-all font-medium text-xs disabled:opacity-50"
                                            >
                                                {isTranscribing ? (
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                ) : (
                                                    <FileText className="w-4 h-4" />
                                                )}
                                                {isTranscribing ? 'Transcrevendo...' : 'Transcrever Áudio'}
                                            </button>
                                            
                                            <button
                                                onClick={() => window.open(ad.ad_snapshot_url, '_blank')}
                                                className="py-2.5 bg-green-600/10 hover:bg-green-600 text-green-400 hover:text-white border border-green-600/20 rounded-xl flex items-center justify-center gap-2 transition-all font-medium text-xs"
                                            >
                                                <Download className="w-4 h-4" />
                                                Baixar Criativo
                                            </button>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <div className="bg-dark-900/50 border border-dark-700/30 rounded-2xl p-6">
                                <h4 className="text-white font-bold mb-4 flex items-center gap-2">
                                    <Globe className="w-5 h-5 text-blue-400" />
                                    URLs de Oferta (Destinos)
                                </h4>
                                <div className="space-y-3">
                                    {insights?.topUrls.map((item, i) => (
                                        <div key={i} className="flex items-center justify-between p-3 bg-dark-800/50 rounded-xl border border-dark-700/50 group hover:border-blue-500/30 transition-all">
                                            <div className="flex-1 min-w-0 pr-4">
                                                <div className="text-sm text-white truncate font-medium">{item.url}</div>
                                                <div className="text-xs text-dark-400 mt-1">Presente em {item.count} anúncios</div>
                                            </div>
                                            <button
                                                onClick={() => window.open(item.url, '_blank')}
                                                className="p-2 text-dark-400 hover:text-blue-400 transition-colors"
                                                title="Abrir URL"
                                                aria-label="Abrir URL"
                                            >
                                                <ExternalLink className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}
                                    {(!insights || insights.topUrls.length === 0) && (
                                        <div className="text-center py-8 text-dark-500 italic">
                                            Nenhuma URL extraída desta página.
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="bg-dark-900/50 border border-dark-700/30 rounded-2xl p-6">
                                <h4 className="text-white font-bold mb-4 flex items-center gap-2">
                                    <Clock className="w-5 h-5 text-purple-400" />
                                    Anúncios Mais Antigos Ativos
                                </h4>
                                <div className="space-y-3">
                                    {insights?.oldestDates.map((date, i) => (
                                        <div key={i} className="flex items-center gap-3 p-3 bg-dark-800/50 rounded-xl border border-dark-700/50">
                                            <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-400 font-bold text-sm">
                                                {i + 1}
                                            </div>
                                            <div className="text-sm text-white">{date}</div>
                                        </div>
                                    ))}
                                    {(!insights || insights.oldestDates.length === 0) && (
                                        <div className="text-center py-8 text-dark-500 italic">
                                            Nenhuma data extraída desta página.
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
