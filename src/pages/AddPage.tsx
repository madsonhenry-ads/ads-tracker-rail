import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Link as LinkIcon, Tag, Globe, AlertCircle, CheckCircle } from 'lucide-react'
import { pagesApi } from '../services/api'

export default function AddPage() {
    const navigate = useNavigate()
    const queryClient = useQueryClient()

    const [formData, setFormData] = useState({
        name: '',
        url: '',
        offerUrl: '',
        checkoutUrl: '',
        description: '',
        country: '',
        category: '',
        tags: ''
    })
    const [error, setError] = useState('')
    const [success, setSuccess] = useState(false)

    const createMutation = useMutation({
        mutationFn: (data: typeof formData) => {
            const tags = data.tags.split(',').map(t => t.trim()).filter(t => t)
            return pagesApi.create({
                name: data.name,
                url: data.url,
                offerUrl: data.offerUrl || undefined,
                checkoutUrl: data.checkoutUrl || undefined,
                description: data.description || undefined,
                country: data.country || undefined,
                category: data.category || undefined,
                tags
            })
        },
        onSuccess: () => {
            setSuccess(true)
            queryClient.invalidateQueries({ queryKey: ['pages'] })
            setTimeout(() => navigate('/'), 2000)
        },
        onError: (err: any) => {
            setError(err.response?.data?.error || 'Failed to create page')
        }
    })

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        setError('')

        if (!formData.name.trim()) {
            setError('Page name is required')
            return
        }
        if (!formData.url.trim()) {
            setError('Facebook Ads Library URL is required')
            return
        }

        createMutation.mutate(formData)
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData(prev => ({
            ...prev,
            [e.target.name]: e.target.value
        }))
    }

    if (success) {
        return (
            <div className="max-w-2xl mx-auto mt-20">
                <div className="card p-12 text-center">
                    <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CheckCircle className="w-8 h-8 text-emerald-400" />
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2">Page Added Successfully!</h2>
                    <p className="text-dark-400">Redirecting to dashboard...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="max-w-2xl mx-auto">
            {/* Page Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-white">Add New Page</h1>
                <p className="text-dark-400 mt-1">Add a Facebook page to start monitoring its ads</p>
            </div>

            {/* Form Card */}
            <div className="card p-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Error Message */}
                    {error && (
                        <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400">
                            <AlertCircle className="w-5 h-5 flex-shrink-0" />
                            <p className="text-sm">{error}</p>
                        </div>
                    )}

                    {/* Page Name */}
                    <div>
                        <label className="block text-sm font-medium text-dark-300 mb-2">
                            Page Name *
                        </label>
                        <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            placeholder="e.g., My Brand Page"
                            className="input"
                        />
                    </div>

                    {/* URL */}
                    <div>
                        <label className="block text-sm font-medium text-dark-300 mb-2">
                            <div className="flex items-center gap-2">
                                <LinkIcon className="w-4 h-4" />
                                Facebook Ads Library URL *
                            </div>
                        </label>
                        <input
                            type="url"
                            name="url"
                            value={formData.url}
                            onChange={handleChange}
                            placeholder="https://www.facebook.com/ads/library/?active_status=all&ad_type=all&country=ALL&view_all_page_id=123456789"
                            className="input"
                        />
                        <p className="text-xs text-dark-500 mt-2">
                            Go to Facebook Ads Library, search for the page, and copy the URL
                        </p>
                    </div>

                    {/* Offer URL */}
                    <div>
                        <label className="block text-sm font-medium text-dark-300 mb-2">
                            Offer URL
                        </label>
                        <input
                            type="url"
                            name="offerUrl"
                            value={formData.offerUrl}
                            onChange={handleChange}
                            placeholder="https://example.com/offer"
                            className="input"
                        />
                    </div>

                    {/* Checkout URL */}
                    <div>
                        <label className="block text-sm font-medium text-dark-300 mb-2">
                            Checkout URL
                        </label>
                        <input
                            type="url"
                            name="checkoutUrl"
                            value={formData.checkoutUrl}
                            onChange={handleChange}
                            placeholder="https://example.com/checkout"
                            className="input"
                        />
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-medium text-dark-300 mb-2">
                            Description
                        </label>
                        <textarea
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            rows={3}
                            placeholder="Optional notes about this page..."
                            className="input resize-none"
                        />
                    </div>

                    {/* Two Column Grid */}
                    <div className="grid grid-cols-2 gap-4">
                        {/* Country */}
                        <div>
                            <label className="block text-sm font-medium text-dark-300 mb-2">
                                <div className="flex items-center gap-2">
                                    <Globe className="w-4 h-4" />
                                    Country
                                </div>
                            </label>
                            <input
                                type="text"
                                name="country"
                                value={formData.country}
                                onChange={handleChange}
                                placeholder="e.g., US, BR"
                                className="input"
                            />
                        </div>

                        {/* Category */}
                        <div>
                            <label className="block text-sm font-medium text-dark-300 mb-2">
                                Category
                            </label>
                            <input
                                type="text"
                                name="category"
                                value={formData.category}
                                onChange={handleChange}
                                placeholder="e.g., E-commerce"
                                className="input"
                            />
                        </div>
                    </div>

                    {/* Tags */}
                    <div>
                        <label className="block text-sm font-medium text-dark-300 mb-2">
                            <div className="flex items-center gap-2">
                                <Tag className="w-4 h-4" />
                                Tags
                            </div>
                        </label>
                        <input
                            type="text"
                            name="tags"
                            value={formData.tags}
                            onChange={handleChange}
                            placeholder="lowticket, competitor, latam (comma separated)"
                            className="input"
                        />
                    </div>

                    {/* Submit Button */}
                    <div className="pt-4 border-t border-dark-700">
                        <button
                            type="submit"
                            disabled={createMutation.isPending}
                            className="w-full btn-primary flex items-center justify-center gap-2 py-3"
                        >
                            {createMutation.isPending ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                                    Adding Page...
                                </>
                            ) : (
                                <>
                                    <Plus className="w-5 h-5" />
                                    Add Page
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>

            {/* Help Section */}
            <div className="mt-6 p-4 bg-primary-500/5 border border-primary-500/20 rounded-xl">
                <h3 className="text-sm font-medium text-primary-400 mb-2">How to get the Facebook Ads Library URL</h3>
                <ol className="text-sm text-dark-400 space-y-1 list-decimal list-inside">
                    <li>Go to <a href="https://www.facebook.com/ads/library" target="_blank" rel="noopener noreferrer" className="text-primary-400 hover:underline">Facebook Ads Library</a></li>
                    <li>Search for the page you want to monitor</li>
                    <li>Click on the page name to view all their ads</li>
                    <li>Copy the complete URL from your browser</li>
                </ol>
            </div>
        </div>
    )
}
