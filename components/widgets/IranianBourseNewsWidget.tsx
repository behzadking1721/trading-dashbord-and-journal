import React, { useState, useEffect, useCallback } from 'react';
import { fetchMockBourseNews } from '../../data/bourseNews';
import type { BourseNews } from '../../data/bourseNews';
import { RefreshCw, AlertTriangle, Flame } from 'lucide-react';

const NewsItemSkeleton: React.FC = () => (
    <div className="space-y-2 animate-pulse">
        <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-4/5"></div>
        <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-1/2"></div>
        <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-full"></div>
        <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-2/3"></div>
    </div>
);

const IranianBourseNewsWidget: React.FC = () => {
    const [news, setNews] = useState<BourseNews[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadNews = useCallback(async (isManualRefresh = false) => {
        if (!isManualRefresh && loading) return;
        setLoading(true);
        setError(null);
        try {
            const data = await fetchMockBourseNews();
            setNews(data);
        } catch (e: any) {
            setError(e.message || 'خطای ناشناخته رخ داد.');
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
        const diffSeconds = Math.round((now.getTime() - date.getTime()) / 1000);
        const diffMinutes = Math.round(diffSeconds / 60);
        const diffHours = Math.round(diffMinutes / 60);

        if (diffSeconds < 60) return 'همین الان';
        if (diffMinutes < 60) return `${diffMinutes} دقیقه پیش`;
        if (diffHours < 24) return `${diffHours} ساعت پیش`;
        return date.toLocaleDateString('fa-IR');
    };

    const renderContent = () => {
        if (loading && news.length === 0) {
            return (
                <div className="space-y-4">
                    <NewsItemSkeleton />
                    <NewsItemSkeleton />
                </div>
            );
        }

        if (error) {
            return (
                <div className="flex flex-col items-center justify-center text-center p-4">
                    <AlertTriangle className="w-8 h-8 text-red-500" />
                    <p className="mt-3 text-sm text-red-500">{error}</p>
                </div>
            );
        }
        
        return (
            <div className="space-y-4">
                {news.map(item => (
                    <div key={item.id} className={`p-3 rounded-lg border-l-4 ${item.isImportant ? 'bg-amber-500/10 border-amber-500' : 'bg-gray-100 dark:bg-gray-700/50 border-transparent'}`}>
                        <h4 className="font-bold text-sm flex items-center gap-2">
                            {item.isImportant && <Flame size={14} className="text-amber-500" />}
                            {item.title}
                        </h4>
                        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mt-1 mb-2">
                            <span>منبع: {item.source}</span>
                            <span>{formatRelativeTime(item.publishDate)}</span>
                        </div>
                        <p className="text-sm leading-relaxed">{item.summary}</p>
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div className="h-[250px] flex flex-col">
            <div className="flex justify-end mb-2">
                <button onClick={() => loadNews(true)} className="p-1.5 text-gray-400 hover:text-indigo-500 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700" title="تازه‌سازی دستی">
                    <RefreshCw size={14} className={loading ? 'animate-spin' : ''}/>
                </button>
            </div>
            <div className="flex-grow overflow-y-auto pr-2">
                 {renderContent()}
            </div>
        </div>
    );
};

export default IranianBourseNewsWidget;