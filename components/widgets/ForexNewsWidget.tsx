import React, { useState, useEffect } from 'react';
import type { EconomicEvent, NewsAlert } from '../../types';
import { Pin, Bell, Flame, CalendarPlus, Check, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { addAlert } from '../../db';
import { useNotification } from '../../contexts/NotificationContext';

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


// --- MOCK DATA GENERATOR ---
const generateMockEventsForToday = (): EconomicEvent[] => {
    const events: Omit<EconomicEvent, 'id' | 'time' | 'actual'>[] = [
      { event: 'Fed Interest Rate Decision', currency: 'USD', countryCode: 'US', importance: 'High', forecast: '5.50%', previous: '5.50%', sourceUrl: 'https://www.federalreserve.gov', sentiment: 'Neutral' },
      { event: 'US Non-Farm Payrolls', currency: 'USD', countryCode: 'US', importance: 'High', forecast: '180K', previous: '175K', sentiment: 'Bullish' },
      { event: 'ECB Press Conference', currency: 'EUR', countryCode: 'EU', importance: 'High', forecast: '', previous: '', sentiment: 'Bearish' },
      { event: 'Retail Sales m/m', currency: 'GBP', countryCode: 'GB', importance: 'Medium', forecast: '0.5%', previous: '0.2%', sentiment: 'Bullish' },
      { event: 'CPI m/m', currency: 'EUR', countryCode: 'EU', importance: 'Medium', forecast: '0.3%', previous: '0.4%', sentiment: 'Neutral' },
      { event: 'BoJ Policy Rate', currency: 'JPY', countryCode: 'JP', importance: 'High', forecast: '0.10%', previous: '0.10%', sentiment: 'Neutral' },
    ];

    // Generate events only in the future for today
    return events.map((e, index) => ({
        ...e,
        id: `today-widget-event-${index + 1}`,
        time: new Date(Date.now() + (Math.random() * 8 * 60 + 5) * 60 * 1000), // Random time in the next 8 hours
        actual: null,
    })).sort((a,b) => a.time.getTime() - b.time.getTime());
};
// --- END MOCK DATA ---


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
        <div className="flex flex-col items-end">
             <span className={`text-sm font-mono tabular-nums transition-colors ${isUrgent ? 'text-red-500 font-bold' : ''} ${isImminent ? 'animate-pulse' : ''}`}>
                {`${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`}
            </span>
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
             <button title="به تقویم اضافه شد" className="text-green-500 cursor-default">
                <Check className="w-4 h-4" />
            </button>
        )
    }

    return (
        <div className="relative">
            <button onClick={() => setIsOpen(!isOpen)} title="افزودن به تقویم" className="text-gray-400 hover:text-indigo-500 cursor-pointer">
                <CalendarPlus className="w-4 h-4" />
            </button>
            {isOpen && (
                <div className="absolute z-10 -left-4 mt-2 w-48 rounded-md shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5 focus:outline-none">
                    <div className="py-1">
                        <a href="#" onClick={(e) => { e.preventDefault(); handleGoogleClick(); }} className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700">افزودن به تقویم گوگل</a>
                        <a href="#" onClick={(e) => { e.preventDefault(); handleIcsClick(); }} className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700">دانلود فایل ICS</a>
                    </div>
                </div>
            )}
        </div>
    )
}


const ForexNewsWidget: React.FC = () => {
    const [events, setEvents] = useState<EconomicEvent[]>([]);
    const { addNotification } = useNotification();
    const [addedToCalendarIds, setAddedToCalendarIds] = useState<Set<string>>(new Set());
    
    useEffect(() => {
        // Initial load
        const todayEvents = generateMockEventsForToday();
        setEvents(todayEvents);

        // Load added calendar events from localStorage
        const addedIds = new Set<string>();
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith('calendar_added_')) {
                addedIds.add(key.replace('calendar_added_', ''));
            }
        }
        setAddedToCalendarIds(addedIds);

        // Simulate live updates
        const interval = setInterval(() => {
            setEvents(prevEvents => prevEvents.map(event => {
                if (event.time.getTime() <= Date.now() && event.actual === null) {
                    return { ...event, actual: 'Simulated' }; 
                }
                return event;
            }));
        }, 30000);

        return () => clearInterval(interval);
    }, []);

     const markAsAddedToCalendar = (eventId: string) => {
        try {
            localStorage.setItem(`calendar_added_${eventId}`, 'true');
            setAddedToCalendarIds(prev => new Set(prev).add(eventId));
        } catch (e) {
            console.error("Failed to save to localStorage", e);
        }
    };

    const handleAddNewsAlert = async (item: EconomicEvent) => {
        const minutesStr = prompt("چند دقیقه قبل از رویداد به شما اطلاع داده شود؟", "5");
        if (minutesStr) {
            const triggerBeforeMinutes = parseInt(minutesStr, 10);
            if (!isNaN(triggerBeforeMinutes) && triggerBeforeMinutes > 0) {
                const newAlert: NewsAlert = {
                    id: `news-${item.id}-${Date.now()}`,
                    type: 'news',
                    status: 'active',
                    createdAt: new Date().toISOString(),
                    newsId: item.id,
                    newsTitle: item.event,
                    eventTime: item.time.toISOString(),
                    triggerBeforeMinutes: triggerBeforeMinutes,
                };
                await addAlert(newAlert);
                addNotification(`هشدار برای "${item.event}" ثبت شد.`, 'success');
            } else {
                addNotification("لطفا یک عدد معتبر وارد کنید.", 'error');
            }
        }
    };

    const isHighlighted = (event: EconomicEvent): boolean => {
        const isImportantCurrency = event.currency === 'USD' || event.currency === 'EUR';
        const isInterestRateNews = event.event.toLowerCase().includes('interest rate') || event.event.toLowerCase().includes('rate') || event.event.toLowerCase().includes('نرخ بهره');
        return isImportantCurrency || isInterestRateNews;
    };

    const upcomingEvents = events.filter(e => e.time.getTime() > Date.now());

    return (
        <div>
            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                {upcomingEvents.length > 0 ? upcomingEvents.slice(0, 5).map(item => (
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
                            <p className="text-xs text-gray-500 dark:text-gray-400">{item.currency} | {item.time.toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })}</p>
                        </div>
                        <div className="flex items-center gap-3 flex-shrink-0">
                            <Countdown targetDate={item.time} />
                            <AddToCalendarButton event={item} isAdded={addedToCalendarIds.has(item.id)} onAdd={markAsAddedToCalendar} />
                            <button onClick={() => handleAddNewsAlert(item)} title="ایجاد هشدار" className="text-gray-400 hover:text-indigo-500 cursor-pointer">
                                <Bell className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )) : <p className="text-center text-sm text-gray-500 py-4">رویداد مهمی برای امروز باقی نمانده است.</p>}
            </div>
        </div>
    );
};

export default ForexNewsWidget;