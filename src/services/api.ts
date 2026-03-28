/// <reference types="vite/client" />
import axios from 'axios'

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || '/api',
    headers: {
        'Content-Type': 'application/json',
    },
})

// Response interceptor for error handling
api.interceptors.response.use(
    (response) => response,
    (error) => {
        console.error('API Error:', error.response?.data || error.message)
        return Promise.reject(error)
    }
)

export default api

// Types
export interface Page {
    id: string
    name: string
    facebookPageId: string
    url: string
    offerUrl?: string
    checkoutUrl?: string
    description?: string
    country?: string
    language?: string
    category?: string
    tags: string[]
    active: boolean
    lastScrapedAt?: string
    scrapingEnabled: boolean
    createdAt: string
    updatedAt: string
    snapshots?: AdSnapshot[]
    metrics?: Metric[]
}

export interface AdSnapshot {
    id: string
    pageId: string
    totalAds: number
    timestamp: string
    date: string
    collectionPeriod: string
    scrapeDuration?: number
    success: boolean
    errorMessage?: string
}

export interface Metric {
    id: string
    pageId: string
    date: string
    totalAds: number
    dailyChange?: number
    weeklyChange?: number
    monthlyChange?: number
    dailyChangePercent?: number
    weeklyChangePercent?: number
    monthlyChangePercent?: number
    movingAvg7d?: number
    movingAvg30d?: number
    trend?: string
}

export interface OverviewMetrics {
    totalPages: number
    totalActiveAds: number
    totalChange: number
    totalChangePercent: number
    pagesWithGrowth: number
    pagesWithDecline: number
    pagesStable: number
}

export interface TrendData {
    date: string
    totalAds: number
}

// API Functions
export const pagesApi = {
    getAll: () => api.get<{ success: boolean; data: Page[] }>('/pages'),
    getById: (id: string) => api.get<{ success: boolean; data: Page }>(`/pages/${id}`),
    create: (data: Partial<Page>) => api.post<{ success: boolean; data: Page }>('/pages', data),
    update: (id: string, data: Partial<Page>) => api.put<{ success: boolean; data: Page }>(`/pages/${id}`, data),
    delete: (id: string) => api.delete(`/pages/${id}`),
}

export const metricsApi = {
    getOverview: () => api.get<{ success: boolean; data: OverviewMetrics }>('/metrics'),
    getTrends: (days?: number) => api.get<{ success: boolean; data: TrendData[] }>('/metrics/trends', { params: { days } }),
    getTopPages: (limit?: number) => api.get<{ success: boolean; data: any[] }>('/metrics/top-pages', { params: { limit } }),
    getPageMetrics: (pageId: string, days?: number) => api.get<{ success: boolean; data: Metric[] }>(`/metrics/page/${pageId}`, { params: { days } }),
}

export const snapshotsApi = {
    getLatest: () => api.get<{ success: boolean; data: any[] }>('/snapshots/latest'),
    getPageSnapshots: (pageId: string, days?: number) => api.get<{ success: boolean; data: AdSnapshot[] }>(`/snapshots/page/${pageId}`, { params: { days } }),
}

export const scraperApi = {
    runAll: () => api.post('/scraper/run'),
    runPage: (pageId: string) => api.post(`/scraper/run/${pageId}`),
    getStatus: () => api.get('/scraper/status'),
    getLogs: (limit?: number) => api.get('/scraper/logs', { params: { limit } }),
}

export const toolsApi = {
    mapFunnel: (url: string, headful: boolean = false) => api.post<{ funnel: any }>('/tools/map', { url, headful }),
    getSubdomains: (domain: string) => api.post<{ subdomains: string[] }>('/tools/subdomains', { domain }),
    uncloak: (url: string, options: { useProxy?: boolean; headful?: boolean; mobile?: boolean } = {}) =>
        api.post<{ success: boolean; data: any }>('/tools/uncloak', { url, ...options }),
    swapIp: () => api.post<{ success: boolean }>('/tools/swap-ip'),
}

export const adLibraryApi = {
    getPageAds: (pageId: string, params?: { country?: string; status?: string; cursor?: string; limit?: number }) =>
        api.get<{ success: boolean; data: any }>(`/tools/ads/${pageId}`, { params }),
    getAllPageAds: (pageId: string, params?: { country?: string; status?: string }) =>
        api.get<{ success: boolean; data: any }>(`/tools/ads/${pageId}/all`, { params }),
    scrapePageAds: (pageId: string) => api.post<{ success: boolean; data: any }>('/tools/ads/scrape', { pageId }),
    transcribeVideo: (videoUrl: string) => api.post<{ success: boolean; text: string }>('/tools/ads/transcribe', { videoUrl }),
}
