import React, { useState, useEffect, useMemo, useCallback } from 'react';
import type { MarketEvent } from '../../types';
import { RefreshCw, Search, AlertTriangle, ChevronDown } from 'lucide-react';

const REFRESH_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

interface FinancialCalendarTabProps {
    market: string;
    fetchData: () => Promise<MarketEvent[]>;
    color: string;
    viewMode: 'compact' | 'expanded';
}

const IMPACT_LEVELS: MarketEvent['impact'][] = ['High', 'Medium', 'Low'];

const tabColorClasses: { [key: string]: { border: string, text: string, bg: string, ring: string } } = {
    blue: { border: 'border-blue-500', text: 'text-blue-500', bg: 'bg-blue-500', ring: 'focus:ring-blue-500' },
    orange: { border: 'border-orange-500', text: 'text-orange-500', bg: 'bg-orange-500', ring: 'focus:ring-orange-500' },
    green: { border: 'border-green-500', text: 'text-green-500', bg: 'bg-green-500', ring: 'focus:ring-green-500' },
    gray: { border: 'border-gray-500', text: 'text-gray-500', bg: 'bg-gray-500', ring: 'focus:ring-gray-500' },
};

const SkeletonLoader: React.FC = () => (
    <div className="animate-pulse space-y-3">
        {[...Array(5)].map((_, i) => (
            <div key={i} className="h-28 bg-gray-200 dark:bg-gray-700/50 rounded-xl"></div>
        ))}
    </div>
);

const Countdown: React.FC<{ targetDate: string }> = ({ targetDate }) => {
    const [now, setNow] = useState(new Date());
    const target = useMemo(() => new Date(targetDate), [targetDate]);

    useEffect(() => {
        const timer = setInterval(() => setNow(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const diff = target.getTime() - now.getTime();
    if (diff <= 0) return <span className="text-sm text-gray-400 dark:text-gray-500 font-semibold">منتشر شد</span>;

    const hours = String(Math.floor(diff / 3600000)).padStart(2, '0');
    const minutes = String(Math.floor((diff / 60000) % 60)).padStart(2, '0');
    const seconds = String(Math.floor((diff / 1000) % 60)).padStart(2, '0');
    
    const isUrgent = diff < 10 * 60 * 1000; // Under 10 minutes

    return (
        <div className={`text-center transition-colors ${isUrgent ? 'text-red-500 animate-pulse' : ''}`}>
            <p className="font-mono text-xl tabular-nums font-bold">{`${hours}:${minutes}:${seconds}`}</p>
            <p className="text-[10px] text-gray-500 -mt-1">باقیمانده</p>
        </div>
    );
};

const EventCard: React.FC<{ event: MarketEvent }> = ({ event }) => {
    const impactStyles = {
        High: { border: 'border-red-500', bg: 'bg-red-500/5 dark:bg-red-500/10' },
        Medium: { border: 'border-orange-400', bg: 'bg-orange-400/5 dark:bg-orange-400/10' },
        Low: { border: 'border-gray-400', bg: 'bg-gray-400/5 dark:bg-gray-400/10' },
    };
    const style = impactStyles[event.impact];

    return (
        <div className={`flex items-stretch p-4 rounded-xl border-l-4 ${style.border} ${style.bg} glass-card`}>
            <div className="w-[20%] flex flex-col items-center justify-center border-r border-gray-200 dark:border-gray-700 pr-4">
                <p className="font-bold text-lg">{new Date(event.time).toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">{new Date(event.time).toLocaleDateString('fa-IR', { weekday: 'long' })}</p>
                <div className="flex items-center gap-2 mt-3">
                    {event.countryCode !== 'CRYPTO' && event.countryCode !== 'OPEC' && 
                        <img src={`https://flagcdn.com/w20/${event.countryCode.toLowerCase()}.png`} alt={event.countryCode} className="w-5 h-auto rounded-sm" />
                    }
                    <span className="font-semibold text-sm">{event.currency}</span>
                </div>
            </div>

            <div className="w-[55%] flex flex-col justify-center px-4">
                <h3 className="font-bold text-base mb-3">{event.event}</h3>
                <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono">
                    <div>
                        <p className="text-gray-500 dark:text-gray-400">واقعی</p>
                        <p className="font-semibold text-sm text-indigo-500">{event.actual ?? '-'}</p>
                    </div>
                    <div>
                        <p className="text-gray-500 dark:text-gray-400">پیش‌بینی</p>
                        <p className="font-semibold text-sm">{event.forecast ?? '-'}</p>
                    </div>
                    <div>
                        <p className="text-gray-500 dark:text-gray-400">قبلی</p>
                        <p className="font-semibold text-sm">{event.previous ?? '-'}</p>
                    </div>
                </div>
            </div>
            <div className="w-[25%] flex items-center justify-center">
                <Countdown targetDate={event.time} />
            </div>
        </div>
    );
};


const FinancialCalendarTab: React.FC<FinancialCalendarTabProps> = ({ market, fetchData, color }) => {
    const [events, setEvents] = useState<MarketEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [countdown, setCountdown] = useState(REFRESH_INTERVAL_MS);
    const [filters, setFilters] = useState({ search: '', impact: [] as MarketEvent['impact'][], country: '' });
    const [countries, setCountries] = useState<string[]>([]);

    const colors = tabColorClasses[color] || tabColorClasses.gray;

    const loadData = useCallback(async (isManual = false) => {
        if (!isManual && loading) return;
        setLoading(true);
        setError(null);
        try {
            const data = await fetchData();
            setEvents(data); // Already sorted in the fetch function
            const uniqueCountries = [...new Set(data.map(e => e.countryCode).filter(c => c !== 'CRYPTO' && c !== 'OPEC'))].sort();
            setCountries(uniqueCountries);
        } catch (e: any) {
            setError(e.message || `خطا در دریافت اطلاعات بازار ${market}.`);
        } finally {
            setLoading(false);
            setCountdown(REFRESH_INTERVAL_MS);
        }
    }, [fetchData, market, loading]);

    useEffect(() => {
        loadData(true);
    }, [fetchData]);

    useEffect(() => {
        const autoRefreshTimer = setInterval(() => loadData(false), REFRESH_INTERVAL_MS);
        const countdownTimer = setInterval(() => {
            setCountdown(prev => (prev > 0 ? prev - 1000 : 0));
        }, 1000);
        return () => {
            clearInterval(autoRefreshTimer);
            clearInterval(countdownTimer);
        };
    }, [loadData]);

    const filteredEvents = useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        return events.filter(event => {
            const eventDate = new Date(event.time);
            if (eventDate < today) return false; // Filter out past days

            const searchLower = filters.search.toLowerCase();
            const matchSearch = searchLower === '' ||
                event.event.toLowerCase().includes(searchLower) ||
                event.currency.toLowerCase().includes(searchLower);
            const matchImpact = filters.impact.length === 0 || filters.impact.includes(event.impact);
            const matchCountry = filters.country === '' || event.countryCode === filters.country;
            return matchSearch && matchImpact && matchCountry;
        });
    }, [events, filters]);
    
    const handleFilterChange = <K extends keyof typeof filters>(key: K, value: (typeof filters)[K]) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };
    
    const handleImpactFilterToggle = (impact: MarketEvent['impact']) => {
        handleFilterChange('impact', filters.impact.includes(impact)
            ? filters.impact.filter(i => i !== impact)
            : [...filters.impact, impact]
        );
    };

    const renderContent = () => {
        if (loading && events.length === 0) return <SkeletonLoader />;
        if (error) return <div className="text-center p-8 text-red-500"><AlertTriangle className="mx-auto mb-2" />{error}</div>;
        if (filteredEvents.length === 0) return <div className="text-center p-8 text-gray-500">هیچ رویداد آتی مطابق با فیلترهای شما یافت نشد.</div>;

        return (
            <div className="space-y-3">
                {filteredEvents.map(event => (
                    <EventCard key={event.id} event={event} />
                ))}
            </div>
        );
    };

    return (
        <div className="space-y-4">
            <div className="p-3 rounded-lg bg-gray-100/50 dark:bg-gray-800/20 flex flex-wrap items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-4">
                    <div className="relative">
                        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="جستجوی رویداد یا نماد..."
                            value={filters.search}
                            onChange={e => handleFilterChange('search', e.target.value)}
                            className={`w-full sm:w-64 p-2 pr-10 border rounded-md dark:bg-gray-700 dark:border-gray-600 text-sm focus:outline-none focus:ring-2 ${colors.ring}`}
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        {IMPACT_LEVELS.map(impact => (
                            <button
                                key={impact}
                                onClick={() => handleImpactFilterToggle(impact)}
                                className={`px-3 py-1.5 text-xs rounded-full border-2 transition-colors ${filters.impact.includes(impact) ? `${colors.bg} text-white ${colors.border}` : 'bg-transparent border-gray-300 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-700'}`}
                            >
                                {impact === 'High' ? 'بالا' : impact === 'Medium' ? 'متوسط' : 'پایین'}
                            </button>
                        ))}
                    </div>
                     <div className="relative">
                        <select
                            value={filters.country}
                            onChange={e => handleFilterChange('country', e.target.value)}
                            className={`appearance-none w-full sm:w-32 p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 text-sm focus:outline-none focus:ring-2 ${colors.ring}`}
                        >
                            <option value="">همه کشورها</option>
                            {countries.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                        <ChevronDown className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" />
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                        <span>بروزرسانی تا: </span>
                        <span className="font-mono">{Math.floor(countdown / 60000)}:{String(Math.floor((countdown / 1000) % 60)).padStart(2, '0')}</span>
                    </div>
                    <button onClick={() => loadData(true)} className="p-2 text-gray-500 dark:text-gray-400 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700" title="تازه‌سازی دستی">
                        <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                    </button>
                </div>
            </div>
            {renderContent()}
        </div>
    );
};

export default FinancialCalendarTab;
