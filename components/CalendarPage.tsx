import React, { useState, useEffect, useMemo } from 'react';
import { Bell, Pin, Filter, X, Flame, Search, CalendarPlus, Check, Calendar as CalendarIcon, Newspaper } from 'lucide-react';
import { addAlert } from '../db';
import { useNotification } from '../contexts/NotificationContext';
import type { NewsAlert, EconomicEvent } from '../types';
import Card from './shared/Card';
import IranianBourseNewsWidget from './widgets/IranianBourseNewsWidget';


// --- CALENDAR HELPERS ---
const formatGoogleCalendarDate = (date: Date): string => {
  return date.toISOString().replace(/-|:|\.\d{3}/g, '');
};

const generateGoogleCalendarLink = (event: EconomicEvent): string => {
    const startTime = event.time;
    const endTime = new Date(startTime.getTime() + 30 * 60 * 1000); // Add 30 minutes
    const details = `Forecast: ${event.forecast || 'N/A'}\nPrevious: ${event.previous || 'N/A'}\n${event.sourceUrl ? `Source: ${event.sourceUrl}` : ''}`;

    const params = new URLSearchParams({
        action: 'TEMPLATE',
        text: `${event.event} (${event.currency})`,
        dates: `${formatGoogleCalendarDate(startTime)}/${formatGoogleCalendarDate(endTime)}`,
        details: details,
        location: `${event.currency} - Importance: ${event.importance}`,
    });
    return `https://www.google.com/calendar/render?${params.toString()}`;
};

const downloadICSFile = (event: EconomicEvent) => {
    const startTime = event.time;
    const endTime = new Date(startTime.getTime() + 30 * 60 * 1000); // Add 30 minutes
    const startTimeStr = formatGoogleCalendarDate(startTime);
    const endTimeStr = formatGoogleCalendarDate(endTime);
    const nowStr = formatGoogleCalendarDate(new Date());

    const description = `Forecast: ${event.forecast || 'N/A'}\\nPrevious: ${event.previous || 'N/A'}\\n${event.sourceUrl ? `Source: ${event.sourceUrl}` : ''}`;

    const icsContent = [
        'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//MyTradingDashboard//EN', 'BEGIN:VEVENT',
        `UID:${event.id}@tradingdashboard.com`, `DTSTAMP:${nowStr}`, `DTSTART:${startTimeStr}`, `DTEND:${endTimeStr}`,
        `SUMMARY:${event.event} [${event.importance}] (${event.currency})`, `DESCRIPTION:${description}`,
        'END:VEVENT', 'END:VCALENDAR'
    ].join('\r\n');

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `${event.event}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
};


// --- MOCK DATA & HELPERS ---
const ALL_CURRENCIES = ['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'NZD', 'CHF', 'CNY'];
const ALL_IMPORTANCES: EconomicEvent['importance'][] = ['High', 'Medium', 'Low'];

const generateMockEvents = (daysInFuture: number, daysInPast: number = 0): EconomicEvent[] => {
    const events: Omit<EconomicEvent, 'id' | 'time' | 'actual'>[] = [
      { event: 'Non-Farm Payrolls', currency: 'USD', countryCode: 'US', importance: 'High', forecast: '180K', previous: '175K', sourceUrl: 'https://www.bls.gov/news.release/empsit.nr0.htm' },
      { event: 'ECB Press Conference', currency: 'EUR', countryCode: 'EU', importance: 'High', forecast: '', previous: '' },
      { event: 'Retail Sales m/m', currency: 'GBP', countryCode: 'GB', importance: 'Medium', forecast: '0.5%', previous: '0.2%' },
      { event: 'Unemployment Rate', currency: 'CAD', countryCode: 'CA', importance: 'Low', forecast: '5.8%', previous: '5.8%' },
      { event: 'CPI m/m', currency: 'USD', countryCode: 'US', importance: 'Medium', forecast: '0.3%', previous: '0.4%' },
      { event: 'BoJ Policy Rate', currency: 'JPY', countryCode: 'JP', importance: 'High', forecast: '0.10%', previous: '0.10%' },
      { event: 'Trade Balance', currency: 'AUD', countryCode: 'AU', importance: 'Low', forecast: '6.5B', previous: '7.2B' },
      { event: 'Manufacturing PMI', currency: 'CNY', countryCode: 'CN', importance: 'Medium', forecast: '50.5', previous: '50.8' },
    ];
    
    const results: EconomicEvent[] = [];
    const totalDays = daysInFuture + daysInPast;

    for (let i = -daysInPast; i < daysInFuture; i++) {
        for (const [index, e] of events.entries()) {
             const eventTime = new Date();
             eventTime.setDate(eventTime.getDate() + i);
             eventTime.setHours(Math.floor(Math.random() * 16) + 2, Math.floor(Math.random() * 60), 0, 0);

             if(i === 0 && eventTime.getTime() < Date.now()) {
                 eventTime.setTime(Date.now() + (Math.random() * 8 * 60 + 5) * 60 * 1000);
             }
            
             results.push({
                ...e,
                id: `event-${i}-${index}`,
                time: eventTime,
                actual: i < 0 ? (parseFloat(e.previous || '0') * (1 + (Math.random() - 0.5) * 0.1)).toFixed(1) + (e.forecast?.includes('K') ? 'K' : e.forecast?.includes('%') ? '%' : '') : null
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
        <div className="flex items-center gap-2" title={`اهمیت: ${style.label}`}>
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
        <span className={`text-sm font-mono tabular-nums transition-colors relative ${isUrgent ? 'text-red-500 font-bold' : ''} ${isImminent ? 'animate-pulse' : ''}`}>
            {`${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`}
        </span>
    );
};

const SkeletonLoader: React.FC = () => (
    <div className="animate-pulse space-y-3">
        {[...Array(5)].map((_, i) => (
             <div key={i} className="grid grid-cols-[120px_100px_1fr_100px_200px_100px_100px] gap-4 items-center p-3">
                <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-full"></div>
                <div className="flex items-center gap-2">
                    <div className="h-6 w-6 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
                    <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-10"></div>
                </div>
                <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-full"></div>
                <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-3/4"></div>
                <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-full"></div>
                <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-1/2"></div>
            </div>
        ))}
    </div>
);

const AddToCalendarButton: React.FC<{ event: EconomicEvent; isAdded: boolean; onAdd: (id: string) => void; }> = ({ event, isAdded, onAdd }) => {
    const [isOpen, setIsOpen] = useState(false);

    const handleGoogleClick = () => {
        window.open(generateGoogleCalendarLink(event), '_blank');
        onAdd(event.id);
        setIsOpen(false);
    };
    
    const handleIcsClick = () => {
        downloadICSFile(event);
        onAdd(event.id);
        setIsOpen(false);
    };

    if (isAdded) {
        return (
            <button title="به تقویم اضافه شد" className="p-2 text-green-500 cursor-default">
                <Check size={16} />
            </button>
        )
    }

    return (
        <div className="relative">
            <button onClick={() => setIsOpen(!isOpen)} title="افزودن به تقویم" className="p-2 text-gray-400 hover:text-indigo-500">
                <CalendarPlus size={16} />
            </button>
            {isOpen && (
                <div className="absolute z-10 left-0 mt-2 w-48 rounded-md shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5 focus:outline-none">
                    <div className="py-1">
                        <a href="#" onClick={(e) => { e.preventDefault(); handleGoogleClick(); }} className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700">افزودن به تقویم گوگل</a>
                        <a href="#" onClick={(e) => { e.preventDefault(); handleIcsClick(); }} className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700">دانلود فایل ICS</a>
                    </div>
                </div>
            )}
        </div>
    )
}

const formatDateForInput = (date: Date) => {
    return date.toISOString().split('T')[0];
}

const CalendarPage: React.FC = () => {
    const [allEvents, setAllEvents] = useState<EconomicEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const { addNotification } = useNotification();
    
    const [timeFilter, setTimeFilter] = useState<'today' | 'week' | 'custom'>('today');
    const [customDateRange, setCustomDateRange] = useState<{ start: string; end: string }>({ start: formatDateForInput(new Date()), end: formatDateForInput(new Date()) });
    const [importanceFilter, setImportanceFilter] = useState<EconomicEvent['importance'][]>([]);
    const [currencyFilter, setCurrencyFilter] = useState<string[]>([]);
    
    const PINNED_EVENTS_LS_KEY = 'calendar_pinned_events';
    const [pinnedIds, setPinnedIds] = useState<string[]>(() => {
        try {
            const saved = localStorage.getItem(PINNED_EVENTS_LS_KEY);
            return saved ? JSON.parse(saved) : [];
        } catch {
            return [];
        }
    });
    
    const [addedToCalendarIds, setAddedToCalendarIds] = useState<Set<string>>(new Set());

    useEffect(() => {
        setLoading(true);
        // Simulate a broader data fetch for filtering
        const events = generateMockEvents(30, 30);
        setAllEvents(events);
        setTimeout(() => setLoading(false), 500);

        const addedIds = new Set<string>();
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith('calendar_added_')) {
                addedIds.add(key.replace('calendar_added_', ''));
            }
        }
        setAddedToCalendarIds(addedIds);

        const interval = setInterval(() => {
            setAllEvents(prevEvents => prevEvents.map(event => {
                if (event.time.getTime() <= Date.now() && event.actual === null) {
                    return { ...event, actual: 'Simulated' }; 
                }
                return event;
            }));
        }, 30000);

        return () => clearInterval(interval);
    }, []);

    const filteredEvents = useMemo(() => {
        return allEvents.filter(event => {
            if (importanceFilter.length > 0 && !importanceFilter.includes(event.importance)) return false;
            if (currencyFilter.length > 0 && !currencyFilter.includes(event.currency)) return false;

            const eventDate = new Date(event.time);

            if (timeFilter === 'today') {
                const today = new Date();
                return eventDate.toDateString() === today.toDateString();
            }
            if (timeFilter === 'week') {
                 const today = new Date();
                 const dayOfWeek = today.getDay(); // Sunday - 0, Saturday - 6
                 const startOfWeek = new Date(today);
                 startOfWeek.setDate(today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1)); // Assuming Monday start
                 startOfWeek.setHours(0, 0, 0, 0);
                 const endOfWeek = new Date(startOfWeek);
                 endOfWeek.setDate(startOfWeek.getDate() + 6);
                 endOfWeek.setHours(23, 59, 59, 999);
                 return event.time >= startOfWeek && event.time <= endOfWeek;
            }
            if (timeFilter === 'custom') {
                if (!customDateRange.start || !customDateRange.end) return true;
                const startDate = new Date(customDateRange.start);
                startDate.setHours(0, 0, 0, 0);
                const endDate = new Date(customDateRange.end);
                endDate.setHours(23, 59, 59, 999);
                return event.time >= startDate && event.time <= endDate;
            }
            return true;
        });
    }, [allEvents, importanceFilter, currencyFilter, timeFilter, customDateRange]);
    
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
        return { pinnedEvents: pinned.sort((a, b) => a.time.getTime() - b.time.getTime()), regularEvents: regular };
    }, [filteredEvents, pinnedIds]);

    const handlePinToggle = (id: string) => {
        setPinnedIds(prev => {
            const newPinned = prev.includes(id) ? prev.filter(pId => pId !== id) : [...prev, id];
            try {
                localStorage.setItem(PINNED_EVENTS_LS_KEY, JSON.stringify(newPinned));
            } catch (e) {
                console.error("Failed to save pinned IDs to localStorage", e);
            }
            return newPinned;
        });
    };

    const markAsAddedToCalendar = (eventId: string) => {
        try {
            localStorage.setItem(`calendar_added_${eventId}`, 'true');
            setAddedToCalendarIds(prev => new Set(prev).add(eventId));
            addNotification("رویداد به تقویم شما اضافه شد.", "success");
        } catch (e) {
            console.error("Failed to save to localStorage", e);
            addNotification("خطا در ذخیره وضعیت تقویم.", "error");
        }
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
         <div className={`grid grid-cols-[120px_100px_1fr_100px_200px_100px_100px] gap-4 items-center p-3 text-sm border-b dark:border-gray-700 ${isPinned ? 'bg-indigo-500/10' : ''}`}>
            <div className="font-semibold">{event.time.toLocaleDateString('fa-IR', { month: 'long', day: 'numeric'})}, {event.time.toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })}</div>
            <div className="flex items-center gap-2 font-bold">
                <img src={`https://flagcdn.com/w40/${event.countryCode.toLowerCase()}.png`} alt={event.countryCode} className="w-6 h-auto rounded-sm" />
                {event.currency}
            </div>
            <p className="font-semibold">{event.event}</p>
            <ImportanceIndicator importance={event.importance} />
            <div className="grid grid-cols-3 gap-2 text-center font-mono">
                <span className={event.actual ? 'font-bold' : 'text-gray-500'}>{event.actual ?? '...'}</span>
                <span className="text-gray-500">{event.forecast ?? '-'}</span>
                <span className="text-gray-500">{event.previous ?? '-'}</span>
            </div>
            <div className="text-center">
                <Countdown targetDate={event.time} />
            </div>
            <div className="flex items-center gap-1 justify-end">
                <AddToCalendarButton event={event} isAdded={addedToCalendarIds.has(event.id)} onAdd={markAsAddedToCalendar} />
                <button onClick={() => handleAddNewsAlert(event)} title="ایجاد هشدار" className="p-2 text-gray-400 hover:text-indigo-500"><Bell size={16} /></button>
                <button onClick={() => handlePinToggle(event.id)} title="پین کردن" className={`p-2 hover:text-yellow-500 ${isPinned ? 'text-yellow-500' : 'text-gray-400'}`}><Pin size={16} /></button>
            </div>
        </div>
    );

    return (
        <div className="p-6 space-y-6">
            <h1 className="text-2xl font-bold">تقویم و اخبار اقتصادی</h1>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                <div className="lg:col-span-2 space-y-6">
                    <div className="p-4 rounded-lg bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border dark:border-gray-700 space-y-4">
                        <div className="flex flex-wrap items-center gap-x-6 gap-y-4 text-sm">
                            <div className="flex items-center gap-2 p-1 rounded-lg bg-gray-200 dark:bg-gray-700">
                                {(['today', 'week', 'custom'] as const).map(filter => (
                                    <button key={filter} onClick={() => setTimeFilter(filter)} className={`px-3 py-1 rounded-md text-sm font-semibold ${timeFilter === filter ? 'bg-white dark:bg-gray-800 shadow' : 'text-gray-600 dark:text-gray-300'}`}>
                                        {{ 'today': 'امروز', 'week': 'هفته جاری', 'custom': 'سفارشی' }[filter]}
                                    </button>
                                ))}
                            </div>
                            {timeFilter === 'custom' && (
                                <div className="flex items-center gap-2 animate-fade-in">
                                    <input type="date" value={customDateRange.start} onChange={e => setCustomDateRange(prev => ({...prev, start: e.target.value}))} className="p-1.5 border rounded-md dark:bg-gray-700 dark:border-gray-600 text-xs"/>
                                    <span>تا</span>
                                    <input type="date" value={customDateRange.end} onChange={e => setCustomDateRange(prev => ({...prev, end: e.target.value}))} className="p-1.5 border rounded-md dark:bg-gray-700 dark:border-gray-600 text-xs"/>
                                </div>
                            )}
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
                                    {ALL_CURRENCIES.slice(0,5).map(curr => (
                                        <label key={curr} className="flex items-center gap-1 cursor-pointer">
                                            <input type="checkbox" checked={currencyFilter.includes(curr)} onChange={() => setCurrencyFilter(prev => prev.includes(curr) ? prev.filter(c => c !== curr) : [...prev, curr])} className="rounded" />
                                            {curr}
                                        </label>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-lg shadow-md border dark:border-gray-700 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm overflow-hidden">
                        <div className="grid grid-cols-[120px_100px_1fr_100px_200px_100px_100px] gap-4 items-center p-3 text-xs uppercase text-gray-500 dark:text-gray-400 border-b dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                            <span>زمان</span>
                            <span>ارز</span>
                            <span>رویداد</span>
                            <span>اهمیت</span>
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

                <div className="lg:col-span-1">
                    <Card title="آخرین اخبار بورس ایران" icon={Newspaper}>
                        <IranianBourseNewsWidget />
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default CalendarPage;