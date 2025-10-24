import React, { useState, useEffect, useCallback } from 'react';
import type { GlobalStockNews } from '../../types';
import { fetchMockGlobalStocksNews } from '../../data/globalStocksNews';
import { RefreshCw, AlertTriangle, ExternalLink } from 'lucide-react';

const NewsItemSkeleton: React.FC = () => (
    <div className="animate-pulse space-y-1 p-2">
        <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-full"></div>
        <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-1/2"></div>
        <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-4/5"></div>
    </div>
);

const GlobalStocksNewsWidget: React.FC = () => {
    const [news, setNews] = useState<GlobalStockNews[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadNews = useCallback(async (isManualRefresh = false) => {
        if (!isManualRefresh && loading) return;
        setLoading(true);
        setError(null);
        try {
            const data = await fetchMockGlobalStocksNews();
            setNews(data);
        } catch (e: any) {
            setError(e.message || 'خطای ناشناخته در دریافت اخبار بورس جهانی.');
        } finally {
            setLoading(false);
        }
    }, [loading]);
    
    useEffect(() => {
        loadNews(false);
        const interval = setInterval(() => loadNews(false), 5 * 60 * 1000); // Auto-refresh every 5 minutes
        return () => clearInterval(interval);
    }, []);
    
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
                        <p className="font-bold text-sm">{item.headline}</p>
                        <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">{item.summary}</p>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{item.source}</div>
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

export default GlobalStocksNewsWidget;
