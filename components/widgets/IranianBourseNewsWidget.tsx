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

    const loadNews = useCallback(async () => {
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
    }, []);

    useEffect(() => {
        loadNews();
    }, [loadNews]);

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

    if (loading) {
        return (
            <div className="space-y-4">
                <NewsItemSkeleton />
                <NewsItemSkeleton />
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center text-center p-4 h-48">
                <AlertTriangle className="w-8 h-8 text-red-500" />
                <p className="mt-3 text-sm text-red-500">{error}</p>
                <button onClick={loadNews} className="mt-3 text-xs flex items-center gap-2 bg-indigo-500 text-white px-3 py-1 rounded hover:bg-indigo-600">
                    <RefreshCw size={12}/>
                    تلاش مجدد
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
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
};

export default IranianBourseNewsWidget;