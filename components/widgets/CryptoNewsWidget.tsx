import React, { useState, useEffect, useCallback } from 'react';
import type { CryptoNews } from '../../types';
import { fetchMockCryptoNews } from '../../data/cryptoNews';
import { RefreshCw, AlertTriangle, ExternalLink } from 'lucide-react';

const NewsItemSkeleton: React.FC = () => (
    <div className="animate-pulse space-y-1 p-2">
        <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-4/5"></div>
        <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-1/2"></div>
    </div>
);

const CryptoNewsWidget: React.FC = () => {
    const [news, setNews] = useState<CryptoNews[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadNews = useCallback(async (isManualRefresh = false) => {
        if (!isManualRefresh && loading) return;
        setLoading(true);
        setError(null);
        try {
            const data = await fetchMockCryptoNews();
            setNews(data);
        } catch (e: any) {
            setError(e.message || 'خطای ناشناخته در دریافت اخبار کریپتو.');
        } finally {
            setLoading(false);
        }
    }, [loading]);
    
    useEffect(() => {
        loadNews(false);
        const interval = setInterval(() => loadNews(false), 5 * 60 * 1000); // Auto-refresh every 5 minutes
        return () => clearInterval(interval);
    }, []);

    const formatRelativeTime = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMinutes = Math.round((now.getTime() - date.getTime()) / 60000);
        if (diffMinutes < 60) return `${diffMinutes} دقیقه پیش`;
        return `${Math.round(diffMinutes / 60)} ساعت پیش`;
    };

    const renderContent = () => {
        if (loading && news.length === 0) {
            return <div className="space-y-3 pr-1">{[...Array(5)].map((_, i) => <NewsItemSkeleton key={i} />)}</div>;
        }
        if (error) {
            return <div className="text-center text-sm text-red-500 p-4"><AlertTriangle className="mx-auto mb-2" />{error}</div>;
        }
        return (
            <div className="space-y-3 pr-1">
                {news.map(item => (
                    <a href={item.url} target="_blank" rel="noopener noreferrer" key={item.id} className="block p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700/50">
                        <p className="font-semibold text-sm truncate">{item.title}</p>
                        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                            <span>{item.source}</span>
                            <span>{formatRelativeTime(item.published_at)}</span>
                        </div>
                    </a>
                ))}
            </div>
        );
    };

    return (
        <div className="h-[250px] flex flex-col">
            <div className="flex justify-end mb-2">
                <button onClick={() => loadNews(true)} className="p-1.5 text-gray-400 hover:text-indigo-500 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700" title="تازه‌سازی دستی">
                    <RefreshCw size={14} className={loading ? 'animate-spin' : ''}/>
                </button>
            </div>
            <div className="flex-grow overflow-y-auto">
                {renderContent()}
            </div>
        </div>
    );
};

export default CryptoNewsWidget;