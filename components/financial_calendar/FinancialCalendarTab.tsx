import React, { useState, useEffect, useMemo, useCallback } from 'react';
import type { MarketEvent } from '../../types';
import { RefreshCw, Search, AlertTriangle, ChevronDown, Flame, Filter } from 'lucide-react';

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
    <div className="animate-pulse space-y-2">
        {[...Array(6)].map((_, i) => (
            <div key={i} className="h-12 bg-gray-200 dark:bg-gray-700/50 rounded-md"></div>
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
    if (diff <= 0) return <span className="text-xs text-gray-400 dark:text-gray-500">منتشر شد</span>;

    const hours = String(Math.floor(diff / 3600000)).padStart(2, '0');
    const minutes = String(Math.floor((diff / 60000) % 60)).padStart(2, '0');
    const seconds = String(Math.floor((diff / 1000) % 60)).padStart(2, '0');

    return <span className="font-mono text-sm tabular-nums">{`${hours}:${minutes}:${seconds}`}</span>;
};

const ImpactIndicator: React.FC<{ impact: MarketEvent['impact'] }> = ({ impact }) => {
    const styles = {
        High: { color: 'bg-red-500', label: 'بالا' },
        Medium: { color: 'bg-orange-400', label: 'متوسط' },
        Low: { color: 'bg-gray-400', label: 'پایین' },
    };
    return (
        <div className="flex items-center gap-2" title={`اهمیت: ${styles[impact].label}`}>
            <span className={`w-2.5 h-2.5 rounded-full ${styles[impact].color}`}></span>
        </div>
    );
};

const FinancialCalendarTab: React.FC<FinancialCalendarTabProps> = ({ market, fetchData, color, viewMode }) => {
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
            const sortedData = data.sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());
            setEvents(sortedData);
            const uniqueCountries = [...new Set(sortedData.map(e => e.countryCode))].sort();
            setCountries(uniqueCountries);
        } catch (e: any) {
            setError(e.message || `خطا در دریافت اطلاعات بازار ${market}.`);
        } finally {
            setLoading(false);
            setCountdown(REFRESH_INTERVAL_MS);
        }
    }, [fetchData, market, loading]);

    useEffect(() => {
        loadData(false);
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
        return events.filter(event => {
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
        if (filteredEvents.length === 0) return <div className="text-center p-8 text-gray-500">هیچ رویدادی مطابق با فیلترهای شما یافت نشد.</div>;

        return (
            <div className={`rounded-lg border dark:border-gray-700 bg-white/30 dark:bg-gray-800/30 overflow-hidden`}>
                <div className="grid grid-cols-12 gap-4 items-center p-3 text-xs uppercase text-gray-500 dark:text-gray-400 border-b dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 font-semibold">
                    <span className="col-span-3">زمان</span>
                    <span className="col-span-1">کشور</span>
                    <span className={viewMode === 'expanded' ? "col-span-4" : "col-span-5"}>رویداد</span>
                    <span className="col-span-1 text-center">اهمیت</span>
                    {viewMode === 'expanded' && <span className="col-span-2 text-center">ارقام</span>}
                    <span className="col-span-1 text-center">شمارش معکوس</span>
                </div>
                <div>
                    {filteredEvents.map(event => (
                        <div key={event.id} className="grid grid-cols-12 gap-4 items-center p-3 text-sm border-b dark:border-gray-700 last:border-b-0 hover:bg-gray-50 dark:hover:bg-gray-700/30">
                            <div className="col-span-3 font-semibold">
                                {new Date(event.time).toLocaleString('fa-IR', { month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </div>
                            <div className="col-span-1 flex items-center gap-2">
                                <img src={`https://flagcdn.com/w20/${event.countryCode.toLowerCase()}.png`} alt={event.countryCode} className="w-5 h-auto rounded-sm" />
                            </div>
                            <div className={viewMode === 'expanded' ? "col-span-4 font-semibold" : "col-span-5 font-semibold"}>{event.event} ({event.currency})</div>
                            <div className="col-span-1 flex justify-center"><ImpactIndicator impact={event.impact} /></div>
                            {viewMode === 'expanded' && <div className="col-span-2 grid grid-cols-3 gap-1 text-center text-xs font-mono">
                                <span className={event.actual ? `font-bold ${colors.text}` : 'text-gray-500'}>{event.actual ?? '...'}</span>
                                <span className="text-gray-500">{event.forecast ?? '-'}</span>
                                <span className="text-gray-500">{event.previous ?? '-'}</span>
                            </div>}
                            <div className="col-span-1 text-center"><Countdown targetDate={event.time} /></div>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-4">
            <div className="p-4 rounded-lg bg-gray-100/50 dark:bg-gray-800/20 flex flex-wrap items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-4">
                    <div className="relative">
                        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="جستجوی رویداد یا نماد..."
                            value={filters.search}
                            onChange={e => handleFilterChange('search', e.target.value)}
                            className="w-full sm:w-64 p-2 pr-10 border rounded-md dark:bg-gray-700 dark:border-gray-600 text-sm focus:outline-none focus:ring-2"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        {IMPACT_LEVELS.map(impact => (
                            <button
                                key={impact}
                                onClick={() => handleImpactFilterToggle(impact)}
                                className={`px-3 py-1.5 text-xs rounded-full border-2 transition-colors ${filters.impact.includes(impact) ? `${colors.bg} text-white ${colors.border}` : 'bg-transparent border-gray-300 dark:border-gray-600'}`}
                            >
                                {impact === 'High' ? 'بالا' : impact === 'Medium' ? 'متوسط' : 'پایین'}
                            </button>
                        ))}
                    </div>
                     <div className="relative">
                        <select
                            value={filters.country}
                            onChange={e => handleFilterChange('country', e.target.value)}
                            className="appearance-none w-full sm:w-32 p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 text-sm focus:outline-none focus:ring-2"
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
