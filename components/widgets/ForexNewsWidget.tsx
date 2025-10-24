import React, { useState, useEffect, useCallback } from 'react';
import type { EconomicEvent } from '../../types';
import { Flame, TrendingUp, TrendingDown, Minus, RefreshCw, AlertTriangle } from 'lucide-react';

// --- API & DATA HELPERS ---

const currencyToCountryCode: { [key: string]: string } = {
    USD: 'US', EUR: 'EU', GBP: 'GB', JPY: 'JP', CAD: 'CA', AUD: 'AU', NZD: 'NZ', CHF: 'CH', CNY: 'CN',
};

// A parser assuming the API returns times for the current year in UTC.
const parseEventTime = (dateStr: string, timeStr: string): Date => {
    const now = new Date();
    // Handle simple time formats like "10:00am", "2:30pm"
    if (!timeStr.match(/^\d{1,2}:\d{2}(am|pm)$/i)) {
        // Return a date for "All Day" or unparseable times for sorting purposes
        const fullDateStr = `${dateStr}, ${now.getFullYear()} 00:00 UTC`;
        const eventDate = new Date(fullDateStr);
        return isNaN(eventDate.getTime()) ? now : eventDate;
    }
    const fullDateStr = `${dateStr}, ${now.getFullYear()} ${timeStr} UTC`;
    const eventDate = new Date(fullDateStr);
    
    // Handle year rollover issues
    if (eventDate > now && eventDate.getMonth() - now.getMonth() > 2) {
        eventDate.setFullYear(now.getFullYear() - 1);
    }
    if (now > eventDate && now.getMonth() - eventDate.getMonth() > 2) {
         eventDate.setFullYear(now.getFullYear() + 1);
    }

    return isNaN(eventDate.getTime()) ? now : eventDate;
};


// --- MOCK DATA FOR FALLBACK ---
const generateMockData = (): EconomicEvent[] => {
    const mockApiData = [
        { country: 'USD', impact: 'High', title: 'Non-Farm Employment Change', sentiment: 'Bullish' },
        { country: 'EUR', impact: 'High', title: 'Main Refinancing Rate', sentiment: 'Bearish' },
        { country: 'GBP', impact: 'Medium', title: 'CPI y/y', sentiment: 'Neutral' },
        { country: 'USD', impact: 'High', title: 'Federal Funds Rate', sentiment: 'Neutral' },
        { country: 'JPY', impact: 'Low', title: 'Unemployment Rate', sentiment: 'Neutral' },
    ];
    return mockApiData.map((item, index) => {
        const eventTime = new Date();
        eventTime.setHours(eventTime.getHours() - (index * 2));
        return {
            id: `mock-ff-news-${index}`,
            time: eventTime,
            currency: item.country,
            countryCode: currencyToCountryCode[item.country] || item.country.toLowerCase(),
            importance: item.impact as 'High' | 'Medium' | 'Low',
            event: item.title,
            actual: 'N/A',
            forecast: 'N/A',
            previous: 'N/A',
            sentiment: item.sentiment as 'Bullish' | 'Bearish' | 'Neutral',
        };
    });
};

const FOREX_NEWS_CACHE_KEY = 'forex-news-cache';


// --- UI COMPONENTS ---

const NewsItemSkeleton: React.FC = () => (
    <div className="animate-pulse grid grid-cols-[auto,1fr,auto] items-center gap-3 text-sm p-2 rounded-md">
         <div className="w-8 h-4 bg-gray-300 dark:bg-gray-600 rounded"></div>
        <div>
            <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-4/5 mb-1"></div>
            <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-1/2"></div>
        </div>
        <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-12"></div>
    </div>
);


const ImportanceIndicator: React.FC<{ importance: 'High' | 'Medium' | 'Low' }> = ({ importance }) => {
  const styles = {
    High: { color: 'bg-red-500' },
    Medium: { color: 'bg-orange-400' },
    Low: { color: 'bg-gray-400' },
  };
  return (
    <div className="flex items-center w-8" title={`اهمیت: ${importance}`}>
      <span className={`w-2.5 h-2.5 rounded-full ${styles[importance].color}`}></span>
    </div>
  );
};

const SentimentIcon: React.FC<{ sentiment?: 'Bullish' | 'Bearish' | 'Neutral' }> = ({ sentiment }) => {
    if (!sentiment) return null;

    const sentimentMap = {
        Bullish: { icon: TrendingUp, color: 'text-green-500', label: 'صعودی' },
        Bearish: { icon: TrendingDown, color: 'text-red-500', label: 'نزولی' },
        Neutral: { icon: Minus, color: 'text-gray-500', label: 'خنثی' },
    };

    const { icon: Icon, color, label } = sentimentMap[sentiment];
    
    return (
        <span className={color} title={`تحلیل احساسات: ${label}`}>
            <Icon size={14} />
        </span>
    );
};


const ForexNewsWidget: React.FC = () => {
    const [events, setEvents] = useState<EconomicEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    
    const fetchNews = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch('https://forex-factory-news-api.onrender.com/news');
            if (!response.ok) {
                // This handles HTTP errors like 404, 500
                throw new Error(`خطای سرور: ${response.statusText}`);
            }
            const data = await response.json();

            if (!Array.isArray(data)) {
                 throw new Error('فرمت پاسخ API نامعتبر است.');
            }

            const latestNews = data.slice(-5).reverse(); // Get last 5 and show newest first

            const mappedEvents = latestNews.map((item: any, index: number): EconomicEvent => {
                 const eventTime = parseEventTime(item.date, item.time);
                 return {
                    id: `ff-news-${item.title}-${index}`,
                    time: eventTime,
                    currency: item.country,
                    countryCode: currencyToCountryCode[item.country] || item.country.toLowerCase(),
                    importance: item.impact,
                    event: item.title,
                    actual: item.actual,
                    forecast: item.forecast,
                    previous: item.previous,
                    sentiment: item.sentiment,
                }
            });

            setEvents(mappedEvents);
            try {
                localStorage.setItem(FOREX_NEWS_CACHE_KEY, JSON.stringify(mappedEvents));
            } catch (cacheError) {
                console.warn("Could not write to localStorage", cacheError);
            }

        } catch (e: any) {
            // This catches network errors like "Failed to fetch" (DNS, CORS, server down)
            setError('سرویس اخبار موقتا در دسترس نیست. آخرین داده‌های موجود نمایش داده می‌شود.');
            try {
                const cachedData = localStorage.getItem(FOREX_NEWS_CACHE_KEY);
                if (cachedData) {
                    const parsedCache = JSON.parse(cachedData).map((item: any) => ({
                        ...item,
                        time: new Date(item.time) // Re-hydrate Date objects
                    }));
                    setEvents(parsedCache);
                } else {
                    // If cache is empty, use mock data
                    setEvents(generateMockData());
                }
            } catch (cacheError) {
                // If cache is corrupted or fails, use mock data
                setEvents(generateMockData());
            }

        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchNews();
    }, [fetchNews]);

    const isHighlighted = (event: EconomicEvent): boolean => {
        const isImportantCurrency = event.currency === 'USD' || event.currency === 'EUR';
        const isInterestRateNews = event.event.toLowerCase().includes('interest rate') || event.event.toLowerCase().includes('rate') || event.event.toLowerCase().includes('نرخ بهره');
        return isImportantCurrency || isInterestRateNews;
    };


    const renderContent = () => {
        if (loading) {
             return (
                <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                    {[...Array(5)].map((_, i) => <NewsItemSkeleton key={i} />)}
                </div>
            );
        }
        
        return (
            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                {events.length > 0 ? events.map(item => (
                    <div 
                        key={item.id} 
                        className={`grid grid-cols-[auto,1fr,auto] items-center gap-3 text-sm p-2 rounded-md transition-colors hover:bg-gray-100 dark:hover:bg-gray-700/50 ${isHighlighted(item) ? 'border-l-4 border-indigo-500 bg-indigo-500/10' : ''}`}
                    >
                        <ImportanceIndicator importance={item.importance} />
                        <div>
                            <p className="font-semibold truncate flex items-center gap-2">
                                <SentimentIcon sentiment={item.sentiment} />
                                <img src={`https://flagcdn.com/w20/${item.countryCode.toLowerCase()}.png`} alt={item.countryCode} className="w-5 h-auto rounded-sm" />
                                {item.event}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                {item.currency} | {item.time.toLocaleTimeString('fa-IR', { timeZone: 'Asia/Tehran', hour: '2-digit', minute: '2-digit' })}
                            </p>
                        </div>
                        <div className="flex items-center gap-3 flex-shrink-0 text-gray-500 dark:text-gray-400 text-xs font-mono">
                           <span>{item.actual}</span>
                        </div>
                    </div>
                )) : <p className="text-center text-sm text-gray-500 py-4">خبری برای نمایش وجود ندارد.</p>}
            </div>
        )
    };

    return (
        <div>
            {error && !loading && (
                 <div className="flex items-center gap-3 p-2 mb-3 text-xs text-amber-800 dark:text-amber-200 bg-amber-400/20 rounded-md">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                    <div className="flex-grow">
                        <p>{error}</p>
                    </div>
                     <button onClick={fetchNews} className="p-1 rounded-full hover:bg-black/10">
                        <RefreshCw size={12}/>
                    </button>
                </div>
            )}
            {renderContent()}
        </div>
    );
};

export default ForexNewsWidget;