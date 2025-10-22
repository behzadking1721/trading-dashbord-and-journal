import React, { useState, useEffect, useMemo } from 'react';
import { Bell, Pin, Filter, X, Flame, Search } from 'lucide-react';
import { addAlert } from '../db';
import { useNotification } from '../contexts/NotificationContext';
import type { NewsAlert, EconomicEvent } from '../types';

// --- MOCK DATA & HELPERS ---
const COUNTRY_FLAGS: { [key: string]: string } = {
  US: '🇺🇸', EU: '🇪🇺', GB: '🇬🇧', CA: '🇨🇦', JP: '🇯🇵', AU: '🇦🇺', NZ: '🇳🇿', CH: '🇨🇭', CN: '🇨🇳'
};

const ALL_CURRENCIES = ['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'NZD', 'CHF', 'CNY'];
const ALL_IMPORTANCES: EconomicEvent['importance'][] = ['High', 'Medium', 'Low'];

const generateMockEvents = (timeframe: 'today' | 'week'): EconomicEvent[] => {
    const events: Omit<EconomicEvent, 'id' | 'time' | 'actual'>[] = [
      { event: 'Non-Farm Payrolls', currency: 'USD', countryCode: 'US', importance: 'High', forecast: '180K', previous: '175K' },
      { event: 'ECB Press Conference', currency: 'EUR', countryCode: 'EU', importance: 'High', forecast: '', previous: '' },
      { event: 'Retail Sales m/m', currency: 'GBP', countryCode: 'GB', importance: 'Medium', forecast: '0.5%', previous: '0.2%' },
      { event: 'Unemployment Rate', currency: 'CAD', countryCode: 'CA', importance: 'Low', forecast: '5.8%', previous: '5.8%' },
      { event: 'CPI m/m', currency: 'USD', countryCode: 'US', importance: 'Medium', forecast: '0.3%', previous: '0.4%' },
      { event: 'BoJ Policy Rate', currency: 'JPY', countryCode: 'JP', importance: 'High', forecast: '0.10%', previous: '0.10%' },
      { event: 'Trade Balance', currency: 'AUD', countryCode: 'AU', importance: 'Low', forecast: '6.5B', previous: '7.2B' },
      { event: 'Manufacturing PMI', currency: 'CNY', countryCode: 'CN', importance: 'Medium', forecast: '50.5', previous: '50.8' },
    ];
    
    const results: EconomicEvent[] = [];
    const days = timeframe === 'today' ? 1 : 7;
    for (let i = 0; i < days; i++) {
        for (const [index, e] of events.entries()) {
             // Stagger events throughout the day
             const eventTime = new Date();
             eventTime.setDate(eventTime.getDate() + i);
             eventTime.setHours(Math.floor(Math.random() * 16) + 2, Math.floor(Math.random() * 60), 0, 0);

             // Only add future events for today
             if(i === 0 && eventTime.getTime() < Date.now()) {
                 eventTime.setTime(Date.now() + (Math.random() * 8 * 60 + 5) * 60 * 1000); // in the next 8 hours
             }
            
             results.push({
                ...e,
                id: `event-${i}-${index}`,
                time: eventTime,
                actual: null
             });
        }
    }
    return results.sort((a,b) => a.time.getTime() - b.time.getTime());
};
// --- END MOCK DATA ---

const ImportanceIndicator: React.FC<{ importance: EconomicEvent['importance'] }> = ({ importance }) => {
    const styles = {
      High: { color: 'bg-red-500', text: 'text-red-500', icon: <Flame size={14} className="text-red-500" />, label: "بالا" },
      Medium: { color: 'bg-orange-400', text: 'text-orange-400', icon: null, label: "متوسط" },
      Low: { color: 'bg-gray-400', text: 'text-gray-400', icon: null, label: "پایین" },
    };
    const style = styles[importance];
    return (
        <div className="flex items-center gap-2 w-24" title={`اهمیت: ${style.label}`}>
            <span className={`w-3 h-3 rounded-full ${style.color}`}></span>
            <span className={`font-semibold text-sm ${style.text}`}>{style.label}</span>
            {style.icon}
        </div>
    );
};

const Countdown: React.FC<{ targetDate: Date }> = ({ targetDate }) => {
    const [now, setNow] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setNow(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const difference = targetDate.getTime() - now.getTime();
    
    if (difference <= 0) {
        return <span className="text-xs font-mono text-gray-400 dark:text-gray-500">منتشر شد</span>;
    }

    const minutesLeft = Math.floor(difference / (1000 * 60));
    const hours = Math.floor(difference / (1000 * 60 * 60));
    const minutes = Math.floor((difference / 1000 / 60) % 60);
    const seconds = Math.floor((difference / 1000) % 60);

    const isUrgent = minutesLeft < 5;
    const isImminent = minutesLeft < 1;

    return (
        <span className={`text-sm font-mono tabular-nums transition-colors relative ${isUrgent ? 'text-red-500 font-bold' : ''}`}>
            {isImminent && <span className="absolute left-[-10px] top-1/2 -translate-y-1/2 h-2 w-2 rounded-full bg-red-500 animate-ping"></span>}
            {`${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`}
        </span>
    );
};

const SkeletonLoader: React.FC = () => (
    <div className="animate-pulse space-y-3">
        {[...Array(5)].map((_, i) => (
             <div key={i} className="grid grid-cols-[120px_100px_100px_1fr_200px_100px_80px] gap-4 items-center p-3">
                <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-full"></div>
                <div className="flex items-center gap-2">
                    <div className="h-6 w-6 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
                    <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-10"></div>
                </div>
                <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-3/4"></div>
                <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-full"></div>
                <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-full"></div>
                <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-1/2"></div>
            </div>
        ))}
    </div>
);


const CalendarPage: React.FC = () => {
    const [allEvents, setAllEvents] = useState<EconomicEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const { addNotification } = useNotification();
    
    // Filters State
    const [timeFilter, setTimeFilter] = useState<'today' | 'week'>('today');
    const [importanceFilter, setImportanceFilter] = useState<EconomicEvent['importance'][]>([]);
    const [currencyFilter, setCurrencyFilter] = useState<string[]>([]);
    const [pinnedIds, setPinnedIds] = useState<string[]>([]);

    useEffect(() => {
        setLoading(true);
        const events = generateMockEvents(timeFilter);
        setAllEvents(events);
        // Simulate network delay
        setTimeout(() => setLoading(false), 500);

        const interval = setInterval(() => {
            setAllEvents(prevEvents => prevEvents.map(event => {
                if (event.time.getTime() <= Date.now() && event.actual === null) {
                    return { ...event, actual: 'Simulated' }; 
                }
                return event;
            }));
        }, 30000);

        return () => clearInterval(interval);
    }, [timeFilter]);

    const filteredEvents = useMemo(() => {
        return allEvents.filter(event => {
            if (importanceFilter.length > 0 && !importanceFilter.includes(event.importance)) return false;
            if (currencyFilter.length > 0 && !currencyFilter.includes(event.currency)) return false;
            return true;
        });
    }, [allEvents, importanceFilter, currencyFilter]);
    
    const { pinnedEvents, regularEvents } = useMemo(() => {
        const pinned: EconomicEvent[] = [];
        const regular: EconomicEvent[] = [];
        for(const event of filteredEvents) {
            if (pinnedIds.includes(event.id)) {
                pinned.push(event);
            } else {
                regular.push(event);
            }
        }
        return { pinnedEvents: pinned, regularEvents: regular };
    }, [filteredEvents, pinnedIds]);

    const handlePinToggle = (id: string) => {
        setPinnedIds(prev => prev.includes(id) ? prev.filter(pId => pId !== id) : [...prev, id]);
    };

    const handleAddNewsAlert = async (item: EconomicEvent) => {
        const minutesStr = prompt("چند دقیقه قبل از رویداد به شما اطلاع داده شود؟", "5");
        if (minutesStr) {
            const triggerBeforeMinutes = parseInt(minutesStr, 10);
            if (!isNaN(triggerBeforeMinutes) && triggerBeforeMinutes > 0) {
                const newAlert: NewsAlert = {
                    id: `news-${item.id}-${Date.now()}`,
                    type: 'news', status: 'active', createdAt: new Date().toISOString(),
                    newsId: item.id, newsTitle: item.event, eventTime: item.time.toISOString(), triggerBeforeMinutes,
                };
                await addAlert(newAlert);
                addNotification(`هشدار برای "${item.event}" ثبت شد.`, 'success');
            } else {
                addNotification("لطفا یک عدد معتبر وارد کنید.", 'error');
            }
        }
    };
    
    const EventRow: React.FC<{ event: EconomicEvent, isPinned: boolean }> = ({ event, isPinned }) => (
         <div className={`grid grid-cols-[120px_100px_100px_1fr_200px_100px_80px] gap-4 items-center p-3 text-sm border-b dark:border-gray-700 ${isPinned ? 'bg-indigo-500/10' : ''}`}>
            <div className="font-semibold">{event.time.toLocaleDateString('fa-IR', { month: 'long', day: 'numeric'})}, {event.time.toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })}</div>
            <div className="flex items-center gap-2 font-bold">
                <span title={event.countryCode}>{COUNTRY_FLAGS[event.countryCode]}</span>
                {event.currency}
            </div>
             <ImportanceIndicator importance={event.importance} />
            <p className="font-semibold">{event.event}</p>
            <div className="grid grid-cols-3 gap-2 text-center font-mono">
                <span className={event.actual ? 'font-bold' : 'text-gray-500'}>{event.actual ?? '...'}</span>
                <span className="text-gray-500">{event.forecast ?? '-'}</span>
                <span className="text-gray-500">{event.previous ?? '-'}</span>
            </div>
            <div className="text-center">
                <Countdown targetDate={event.time} />
            </div>
            <div className="flex items-center gap-2 justify-end">
                <button onClick={() => handleAddNewsAlert(event)} title="ایجاد هشدار" className="text-gray-400 hover:text-indigo-500"><Bell size={16} /></button>
                <button onClick={() => handlePinToggle(event.id)} title="پین کردن" className={`hover:text-yellow-500 ${isPinned ? 'text-yellow-500' : 'text-gray-400'}`}><Pin size={16} /></button>
            </div>
        </div>
    );

    return (
        <div className="p-6 space-y-6">
            <h1 className="text-2xl font-bold">تقویم اقتصادی</h1>
            
            {/* Filters */}
            <div className="p-4 rounded-lg bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border dark:border-gray-700 space-y-4">
                <div className="flex flex-wrap items-center gap-4 text-sm">
                    <div className="flex items-center gap-2 p-1 rounded-lg bg-gray-200 dark:bg-gray-700">
                        {(['today', 'week'] as const).map(filter => (
                            <button key={filter} onClick={() => setTimeFilter(filter)} className={`px-3 py-1 rounded-md text-sm font-semibold ${timeFilter === filter ? 'bg-white dark:bg-gray-800 shadow' : 'text-gray-600 dark:text-gray-300'}`}>
                                {{ 'today': 'امروز', 'week': 'هفته جاری' }[filter]}
                            </button>
                        ))}
                    </div>
                     <div className="flex items-center gap-3">
                        <span className="font-semibold">اهمیت:</span>
                        {ALL_IMPORTANCES.map(imp => (
                           <label key={imp} className="flex items-center gap-1.5 cursor-pointer">
                                <input type="checkbox" checked={importanceFilter.includes(imp)} onChange={() => setImportanceFilter(prev => prev.includes(imp) ? prev.filter(i => i !== imp) : [...prev, imp])} className="rounded" />
                                {imp === "High" ? "بالا" : imp === "Medium" ? "متوسط" : "پایین"}
                           </label>
                        ))}
                    </div>
                     <div className="flex items-center gap-3">
                        <span className="font-semibold">ارز:</span>
                        <div className="flex items-center gap-1.5">
                             {ALL_CURRENCIES.slice(0,5).map(curr => ( // Show first 5 for brevity
                                <label key={curr} className="flex items-center gap-1 cursor-pointer">
                                    <input type="checkbox" checked={currencyFilter.includes(curr)} onChange={() => setCurrencyFilter(prev => prev.includes(curr) ? prev.filter(c => c !== curr) : [...prev, curr])} className="rounded" />
                                    {curr}
                                </label>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Calendar Table */}
            <div className="rounded-lg shadow-md border dark:border-gray-700 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm overflow-hidden">
                <div className="grid grid-cols-[120px_100px_100px_1fr_200px_100px_80px] gap-4 items-center p-3 text-xs uppercase text-gray-500 dark:text-gray-400 border-b dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                    <span>زمان</span>
                    <span>ارز</span>
                    <span>اهمیت</span>
                    <span>رویداد</span>
                    <div className="grid grid-cols-3 gap-2 text-center">
                        <span>واقعی</span><span>پیش‌بینی</span><span>قبلی</span>
                    </div>
                    <span className="text-center">شمارش معکوس</span>
                    <span className="text-right">عملیات</span>
                </div>
                {loading ? <SkeletonLoader /> : (
                    <div>
                        {pinnedEvents.map(event => <EventRow key={event.id} event={event} isPinned={true} />)}
                        {regularEvents.map(event => <EventRow key={event.id} event={event} isPinned={false} />)}
                        {filteredEvents.length === 0 && <p className="text-center p-8 text-gray-500">هیچ رویدادی مطابق با فیلترهای شما یافت نشد.</p>}
                    </div>
                )}
            </div>
        </div>
    );
};

export default CalendarPage;
