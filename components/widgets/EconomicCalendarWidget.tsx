import React, { useState, useEffect, useMemo } from 'react';
import { Bell, Pin, Flame, CalendarPlus, Check } from 'lucide-react';
import { addAlert } from '../../db';
import { useNotification } from '../../contexts/NotificationContext';
import type { NewsAlert, EconomicEvent } from '../../types';

// --- CALENDAR HELPERS ---
const formatGoogleCalendarDate = (date: Date): string => {
  return date.toISOString().replace(/-|:|\.\d{3}/g, '');
};

const generateGoogleCalendarLink = (event: EconomicEvent): string => {
    const startTime = event.time;
    const endTime = new Date(startTime.getTime() + 30 * 60 * 1000); // Add 30 minutes
    const details = `Forecast: ${event.forecast || 'N/A'}\nPrevious: ${event.previous || 'N/A'}\n${event.sourceUrl ? `Source: ${event.sourceUrl}` : ''}`;
    const params = new URLSearchParams({
        action: 'TEMPLATE', text: `${event.event} (${event.currency})`,
        dates: `${formatGoogleCalendarDate(startTime)}/${formatGoogleCalendarDate(endTime)}`,
        details: details, location: `${event.currency} - Importance: ${event.importance}`,
    });
    return `https://www.google.com/calendar/render?${params.toString()}`;
};

const downloadICSFile = (event: EconomicEvent) => {
    const startTime = event.time;
    const endTime = new Date(startTime.getTime() + 30 * 60 * 1000);
    const description = `Forecast: ${event.forecast || 'N/A'}\\nPrevious: ${event.previous || 'N/A'}\\n${event.sourceUrl ? `Source: ${event.sourceUrl}` : ''}`;
    const icsContent = [
        'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//MyTradingDashboard//EN', 'BEGIN:VEVENT',
        `UID:${event.id}@tradingdashboard.com`, `DTSTAMP:${formatGoogleCalendarDate(new Date())}`, `DTSTART:${formatGoogleCalendarDate(startTime)}`, `DTEND:${formatGoogleCalendarDate(endTime)}`,
        `SUMMARY:${event.event} [${event.importance}] (${event.currency})`, `DESCRIPTION:${description}`,
        'END:VEVENT', 'END:VCALENDAR'
    ].join('\r\n');
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${event.event}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
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
    ];
    const results: EconomicEvent[] = [];
    for (let i = -daysInPast; i < daysInFuture; i++) {
        for (const [index, e] of events.entries()) {
             const eventTime = new Date();
             eventTime.setDate(eventTime.getDate() + i);
             eventTime.setHours(Math.floor(Math.random() * 16) + 2, Math.floor(Math.random() * 60), 0, 0);
             if(i === 0 && eventTime.getTime() < Date.now()) { eventTime.setTime(Date.now() + (Math.random() * 8 * 60 + 5) * 60 * 1000); }
             results.push({ ...e, id: `event-${i}-${index}`, time: eventTime, actual: i < 0 ? (parseFloat(e.previous || '0') * (1 + (Math.random() - 0.5) * 0.1)).toFixed(1) + (e.forecast?.includes('K') ? 'K' : e.forecast?.includes('%') ? '%' : '') : null });
        }
    }
    return results.sort((a,b) => a.time.getTime() - b.time.getTime());
};

const ImportanceIndicator: React.FC<{ importance: EconomicEvent['importance'] }> = ({ importance }) => {
    const styles = { High: { c: 'bg-red-500', t: 'text-red-500', i: <Flame size={14} className="text-red-500" />, l: "بالا" }, Medium: { c: 'bg-orange-400', t: 'text-orange-400', i: null, l: "متوسط" }, Low: { c: 'bg-gray-400', t: 'text-gray-400', i: null, l: "پایین" } };
    const s = styles[importance];
    return <div className="flex items-center gap-2" title={`اهمیت: ${s.l}`}><span className={`w-3 h-3 rounded-full ${s.c}`}></span><span className={`font-semibold text-sm ${s.t}`}>{s.l}</span>{s.i}</div>;
};

const Countdown: React.FC<{ targetDate: Date }> = ({ targetDate }) => {
    const [now, setNow] = useState(new Date());
    useEffect(() => { const timer = setInterval(() => setNow(new Date()), 1000); return () => clearInterval(timer); }, []);
    const diff = targetDate.getTime() - now.getTime();
    if (diff <= 0) return <span className="text-xs font-mono text-gray-400 dark:text-gray-500">منتشر شد</span>;
    const minsLeft = Math.floor(diff / 60000);
    const isUrgent = minsLeft < 5;
    return <span className={`text-sm font-mono tabular-nums transition-colors ${isUrgent ? 'text-red-500 font-bold animate-pulse' : ''}`}>{`${String(Math.floor(diff/3600000)).padStart(2,'0')}:${String(Math.floor((diff/60000)%60)).padStart(2,'0')}:${String(Math.floor((diff/1000)%60)).padStart(2,'0')}`}</span>;
};

const SkeletonLoader: React.FC = () => ( <div className="animate-pulse space-y-3"> {[...Array(5)].map((_, i) => ( <div key={i} className="grid grid-cols-[120px_100px_1fr_100px_200px_100px_100px] gap-4 items-center p-3"> <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-full"></div><div className="flex items-center gap-2"><div className="h-6 w-6 bg-gray-300 dark:bg-gray-600 rounded-full"></div><div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-10"></div></div><div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-full"></div><div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-3/4"></div><div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-full"></div><div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-1/2"></div></div> ))} </div> );

const AddToCalendarButton: React.FC<{ event: EconomicEvent; isAdded: boolean; onAdd: (id: string) => void; }> = ({ event, isAdded, onAdd }) => {
    const [isOpen, setIsOpen] = useState(false);
    const handleGoogle = () => { window.open(generateGoogleCalendarLink(event), '_blank'); onAdd(event.id); setIsOpen(false); };
    const handleIcs = () => { downloadICSFile(event); onAdd(event.id); setIsOpen(false); };
    if (isAdded) return <button title="به تقویم اضافه شد" className="p-2 text-green-500 cursor-default"><Check size={16} /></button>;
    return (
        <div className="relative">
            <button onClick={() => setIsOpen(!isOpen)} title="افزودن به تقویم" className="p-2 text-gray-400 hover:text-indigo-500"><CalendarPlus size={16} /></button>
            {isOpen && <div className="absolute z-10 left-0 mt-2 w-48 rounded-md shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5"><div className="py-1"><a href="#" onClick={e=>{e.preventDefault();handleGoogle()}} className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700">افزودن به تقویم گوگل</a><a href="#" onClick={e=>{e.preventDefault();handleIcs()}} className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700">دانلود فایل ICS</a></div></div>}
        </div>
    );
};

const formatDateForInput = (date: Date) => date.toISOString().split('T')[0];

const EconomicCalendarWidget: React.FC = () => {
    const [allEvents, setAllEvents] = useState<EconomicEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const { addNotification } = useNotification();
    const [timeFilter, setTimeFilter] = useState<'today' | 'week' | 'custom'>('today');
    const [customDateRange, setCustomDateRange] = useState({ start: formatDateForInput(new Date()), end: formatDateForInput(new Date()) });
    const [importanceFilter, setImportanceFilter] = useState<EconomicEvent['importance'][]>([]);
    const [currencyFilter, setCurrencyFilter] = useState<string[]>([]);
    const PINNED_EVENTS_LS_KEY = 'calendar_pinned_events';
    const [pinnedIds, setPinnedIds] = useState<string[]>(() => { try { const s = localStorage.getItem(PINNED_EVENTS_LS_KEY); return s ? JSON.parse(s) : []; } catch { return []; } });
    const [addedToCalendarIds, setAddedToCalendarIds] = useState<Set<string>>(new Set());

    useEffect(() => {
        setLoading(true);
        setAllEvents(generateMockEvents(30, 30));
        setTimeout(() => setLoading(false), 500);
        const addedIds = new Set<string>();
        for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (k && k.startsWith('calendar_added_')) addedIds.add(k.replace('calendar_added_', '')); }
        setAddedToCalendarIds(addedIds);
        const interval = setInterval(() => { setAllEvents(p => p.map(e => (e.time.getTime() <= Date.now() && e.actual === null ? { ...e, actual: 'Simulated' } : e))); }, 30000);
        return () => clearInterval(interval);
    }, []);

    const filteredEvents = useMemo(() => allEvents.filter(event => {
        if (importanceFilter.length > 0 && !importanceFilter.includes(event.importance)) return false;
        if (currencyFilter.length > 0 && !currencyFilter.includes(event.currency)) return false;
        if (timeFilter === 'today') return event.time.toDateString() === new Date().toDateString();
        if (timeFilter === 'week') {
            const today = new Date(); const day = today.getDay();
            const start = new Date(today); start.setDate(today.getDate() - day + (day === 0 ? -6 : 1)); start.setHours(0,0,0,0);
            const end = new Date(start); end.setDate(start.getDate() + 6); end.setHours(23,59,59,999);
            return event.time >= start && event.time <= end;
        }
        if (timeFilter === 'custom') {
            if (!customDateRange.start || !customDateRange.end) return true;
            const start = new Date(customDateRange.start); start.setHours(0,0,0,0);
            const end = new Date(customDateRange.end); end.setHours(23,59,59,999);
            return event.time >= start && event.time <= end;
        }
        return true;
    }), [allEvents, importanceFilter, currencyFilter, timeFilter, customDateRange]);
    
    const { pinnedEvents, regularEvents } = useMemo(() => {
        const pinned: EconomicEvent[] = []; const regular: EconomicEvent[] = [];
        for(const event of filteredEvents) { (pinnedIds.includes(event.id) ? pinned : regular).push(event); }
        return { pinnedEvents: pinned.sort((a,b) => a.time.getTime() - b.time.getTime()), regularEvents: regular };
    }, [filteredEvents, pinnedIds]);

    const handlePinToggle = (id: string) => setPinnedIds(p => { const n = p.includes(id) ? p.filter(pId => pId !== id) : [...p, id]; try { localStorage.setItem(PINNED_EVENTS_LS_KEY, JSON.stringify(n)); } catch (e) { console.error(e); } return n; });
    const markAsAdded = (id: string) => { try { localStorage.setItem(`calendar_added_${id}`, 'true'); setAddedToCalendarIds(p => new Set(p).add(id)); addNotification("رویداد به تقویم شما اضافه شد.", "success"); } catch (e) { addNotification("خطا در ذخیره وضعیت تقویم.", "error"); }};
    const handleAddAlert = async (item: EconomicEvent) => {
        const mins = prompt("چند دقیقه قبل از رویداد اطلاع داده شود؟", "5");
        if (mins) { const triggerMins = parseInt(mins, 10); if (!isNaN(triggerMins) && triggerMins > 0) { await addAlert({ id: `news-${item.id}-${Date.now()}`, type: 'news', status: 'active', createdAt: new Date().toISOString(), newsId: item.id, newsTitle: item.event, eventTime: item.time.toISOString(), triggerBeforeMinutes: triggerMins }); addNotification(`هشدار برای "${item.event}" ثبت شد.`, 'success'); } else { addNotification("عدد معتبر وارد کنید.", 'error'); }}
    };
    
    const EventRow: React.FC<{ event: EconomicEvent, isPinned: boolean }> = ({ event, isPinned }) => (
         <div className={`grid grid-cols-[120px_100px_1fr_100px_200px_100px_100px] gap-4 items-center p-3 text-sm border-b dark:border-gray-700 ${isPinned ? 'bg-indigo-500/10' : ''}`}>
            <div className="font-semibold">{event.time.toLocaleDateString('fa-IR', { month: 'long', day: 'numeric'})}, {event.time.toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })}</div>
            <div className="flex items-center gap-2 font-bold"><img src={`https://flagcdn.com/w40/${event.countryCode.toLowerCase()}.png`} alt={event.countryCode} className="w-6 h-auto rounded-sm" />{event.currency}</div>
            <p className="font-semibold">{event.event}</p>
            <ImportanceIndicator importance={event.importance} />
            <div className="grid grid-cols-3 gap-2 text-center font-mono"><span className={event.actual ? 'font-bold' : 'text-gray-500'}>{event.actual ?? '...'}</span><span className="text-gray-500">{event.forecast ?? '-'}</span><span className="text-gray-500">{event.previous ?? '-'}</span></div>
            <div className="text-center"><Countdown targetDate={event.time} /></div>
            <div className="flex items-center gap-1 justify-end"><AddToCalendarButton event={event} isAdded={addedToCalendarIds.has(event.id)} onAdd={markAsAdded} /><button onClick={() => handleAddAlert(event)} title="ایجاد هشدار" className="p-2 text-gray-400 hover:text-indigo-500"><Bell size={16} /></button><button onClick={() => handlePinToggle(event.id)} title="پین کردن" className={`p-2 hover:text-yellow-500 ${isPinned ? 'text-yellow-500' : 'text-gray-400'}`}><Pin size={16} /></button></div>
        </div>
    );

    return (
        <div>
            <div className="p-4 rounded-lg bg-gray-100/50 dark:bg-gray-800/20 mb-4 space-y-4">
                <div className="flex flex-wrap items-center gap-x-6 gap-y-4 text-sm">
                    <div className="flex items-center gap-2 p-1 rounded-lg bg-gray-200 dark:bg-gray-700">
                        {(['today', 'week', 'custom'] as const).map(f => <button key={f} onClick={() => setTimeFilter(f)} className={`px-3 py-1 rounded-md text-sm font-semibold ${timeFilter === f ? 'bg-white dark:bg-gray-800 shadow' : 'text-gray-600 dark:text-gray-300'}`}>{{ 'today': 'امروز', 'week': 'هفته', 'custom': 'سفارشی' }[f]}</button>)}
                    </div>
                    {timeFilter === 'custom' && <div className="flex items-center gap-2"><input type="date" value={customDateRange.start} onChange={e => setCustomDateRange(p=>({...p,start:e.target.value}))} className="p-1.5 border rounded-md dark:bg-gray-700 dark:border-gray-600 text-xs"/><span>تا</span><input type="date" value={customDateRange.end} onChange={e=>setCustomDateRange(p=>({...p,end:e.target.value}))} className="p-1.5 border rounded-md dark:bg-gray-700 dark:border-gray-600 text-xs"/></div>}
                    <div className="flex items-center gap-3"><span className="font-semibold">اهمیت:</span>{ALL_IMPORTANCES.map(imp => <label key={imp} className="flex items-center gap-1.5 cursor-pointer"><input type="checkbox" checked={importanceFilter.includes(imp)} onChange={() => setImportanceFilter(p => p.includes(imp) ? p.filter(i=>i!==imp) : [...p, imp])} className="rounded" />{{"High":"بالا","Medium":"متوسط","Low":"پایین"}[imp]}</label>)}</div>
                    <div className="flex items-center gap-3"><span className="font-semibold">ارز:</span><div className="flex items-center gap-1.5">{ALL_CURRENCIES.slice(0,5).map(c => <label key={c} className="flex items-center gap-1 cursor-pointer"><input type="checkbox" checked={currencyFilter.includes(c)} onChange={()=>setCurrencyFilter(p=>p.includes(c)?p.filter(i=>i!==c):[...p,c])} className="rounded"/>{c}</label>)}</div></div>
                </div>
            </div>

            <div className="rounded-lg border dark:border-gray-700 bg-white/30 dark:bg-gray-800/30 overflow-hidden">
                <div className="grid grid-cols-[120px_100px_1fr_100px_200px_100px_100px] gap-4 items-center p-3 text-xs uppercase text-gray-500 dark:text-gray-400 border-b dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                    <span>زمان</span><span>ارز</span><span>رویداد</span><span>اهمیت</span>
                    <div className="grid grid-cols-3 gap-2 text-center"><span>واقعی</span><span>پیش‌بینی</span><span>قبلی</span></div>
                    <span className="text-center">شمارش معکوس</span><span className="text-right">عملیات</span>
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

export default EconomicCalendarWidget;