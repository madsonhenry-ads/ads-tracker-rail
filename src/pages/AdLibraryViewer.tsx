import { useState } from 'react'
import { adLibraryApi } from '../services/api'
import { Search, Globe, ExternalLink, AlertTriangle, Cloud, Download, Clock } from 'lucide-react'


interface AdVersion {
    id: string
    startDate?: string
    platforms?: string[]
    thumbnailUrl?: string
    linkUrl?: string
    detailsUrl?: string
    page_name?: string
    ad_snapshot_url?: string
}

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

    const getDaysActive = (dateStr?: string) => {
        if (!dateStr) return null;
        const start = new Date(dateStr);
        if (isNaN(start.getTime())) return null;
        const now = new Date();
        const diffTime = Math.abs(now.getTime() - start.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    }

    return (
        <div className="space-y-6">
            <div className="bg-dark-800/50 backdrop-blur-xl border border-dark-700/50 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <Globe className="w-5 h-5 text-blue-400" />
                        Meta Ad Library Viewer
                    </h2>
                </div>

                <div className="flex gap-4 items-end">
                    <div className="flex-1 space-y-2">
                        <label className="text-sm font-medium text-dark-300">Page ID</label>
                        <div className="relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400" />
                            <input
                                type="text"
                                value={pageId}
                                onChange={(e) => setPageId(e.target.value)}
                                placeholder="Enter Facebook Page ID"
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
                            <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                        ) : (
                            <Cloud className="w-5 h-5" />
                        )}
                        Use API (Fast)
                    </button>

                    <button
                        onClick={handleScrape}
                        disabled={loading || scrapping}
                        className="bg-purple-600 hover:bg-purple-500 text-white px-6 py-3 rounded-xl font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
                    >
                        {scrapping ? (
                            <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                        ) : (
                            <Download className="w-5 h-5" />
                        )}
                        Scrape (Deep)
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
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-semibold text-white">
                            Found {totalFound} Active Ads
                            <span className="ml-2 text-sm font-normal text-dark-400">using {method === 'api' ? 'Official API' : 'Scraper'}</span>
                        </h3>

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

                    {activeTab === 'ads' ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {ads.map((ad) => {
                                const daysActive = getDaysActive(ad.startDate);
                                return (
                                    <div key={ad.id} className="bg-dark-900/50 border border-dark-700/30 rounded-xl p-4 hover:border-dark-600 transition-all group">
                                        <div className="flex justify-between items-start mb-3">
                                            <div>
                                                <div className="text-xs text-dark-400 font-mono mb-1">ID: {ad.id}</div>
                                                {ad.startDate && (
                                                    <div className="flex flex-col gap-0.5">
                                                        <div className="text-xs text-green-400 flex items-center gap-1">
                                                            <Clock className="w-3 h-3" />
                                                            Started: {ad.startDate}
                                                        </div>
                                                        {daysActive !== null && (
                                                            <div className="text-xs text-blue-400 font-medium ml-4">
                                                                Active for {daysActive} days
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => window.open(ad.ad_snapshot_url, '_blank')}
                                                    className="text-dark-500 hover:text-white transition-colors"
                                                    title="Open on Facebook"
                                                >
                                                    <ExternalLink className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>

                                        <div className="aspect-video bg-dark-950 rounded-lg mb-3 overflow-hidden border border-dark-800 relative group-hover:border-dark-600 transition-colors">
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
                                                    No Preview
                                                </div>
                                            )}
                                        </div>

                                        <button
                                            onClick={() => window.open(ad.ad_snapshot_url, '_blank')}
                                            className="w-full py-2 bg-green-600/10 hover:bg-green-600 text-green-400 hover:text-white border border-green-600/20 rounded-lg flex items-center justify-center gap-2 transition-all font-medium text-sm"
                                        >
                                            <Download className="w-4 h-4" />
                                            Baixar Criativo
                                        </button>
                                    </div>
                                )
                            })}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <div className="bg-dark-900/50 border border-dark-700/30 rounded-2xl p-6">
                                <h4 className="text-white font-bold mb-4 flex items-center gap-2">
                                    <Globe className="w-5 h-5 text-blue-400" />
                                    Top Targeted URLs
                                </h4>
                                <div className="space-y-3">
                                    {insights?.topUrls.map((item, i) => (
                                        <div key={i} className="flex items-center justify-between p-3 bg-dark-800/50 rounded-xl border border-dark-700/50 group hover:border-blue-500/30 transition-all">
                                            <div className="flex-1 min-w-0 pr-4">
                                                <div className="text-sm text-white truncate font-medium">{item.url}</div>
                                                <div className="text-xs text-dark-400 mt-1">Found in {item.count} ads</div>
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
                                            No URLs extracted from this page.
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="bg-dark-900/50 border border-dark-700/30 rounded-2xl p-6">
                                <h4 className="text-white font-bold mb-4 flex items-center gap-2">
                                    <Clock className="w-5 h-5 text-purple-400" />
                                    Oldest Active Creatives
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
                                            No dates extracted from this page.
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
