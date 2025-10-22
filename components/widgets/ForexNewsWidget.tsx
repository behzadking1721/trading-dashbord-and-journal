import React, { useState, useEffect } from 'react';
import type { EconomicEvent, NewsAlert } from '../../types';
import { Pin, Bell, Flame } from 'lucide-react';
import { addAlert } from '../../db';
import { useNotification } from '../../contexts/NotificationContext';

// --- MOCK DATA GENERATOR ---
const generateMockEventsForToday = (): EconomicEvent[] => {
    const events: Omit<EconomicEvent, 'id' | 'time' | 'actual'>[] = [
      { event: 'Non-Farm Payrolls', currency: 'USD', countryCode: 'US', importance: 'High', forecast: '180K', previous: '175K' },
      { event: 'ECB Press Conference', currency: 'EUR', countryCode: 'EU', importance: 'High', forecast: '', previous: '' },
      { event: 'Retail Sales m/m', currency: 'GBP', countryCode: 'GB', importance: 'Medium', forecast: '0.5%', previous: '0.2%' },
      { event: 'Unemployment Rate', currency: 'CAD', countryCode: 'CA', importance: 'Low', forecast: '5.8%', previous: '5.8%' },
      { event: 'CPI m/m', currency: 'USD', countryCode: 'US', importance: 'Medium', forecast: '0.3%', previous: '0.4%' },
      { event: 'BoJ Policy Rate', currency: 'JPY', countryCode: 'JP', importance: 'High', forecast: '0.10%', previous: '0.10%' },
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

const COUNTRY_FLAGS: { [key: string]: string } = {
  US: '🇺🇸', EU: '🇪🇺', GB: '🇬🇧', CA: '🇨🇦', JP: '🇯🇵', AU: '🇦🇺', NZ: '🇳🇿', CH: '🇨🇭', CN: '🇨🇳'
};

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
    // The flashing animation will be achieved with the `animate-ping` class.
    const isImminent = minutesLeft < 1;

    return (
        <div className="flex flex-col items-end">
             <span className={`text-sm font-mono tabular-nums transition-colors ${isUrgent ? 'text-red-500 font-bold' : ''}`}>
                {`${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`}
            </span>
            {isImminent && <span className="absolute h-2 w-2 rounded-full bg-red-500 animate-ping"></span>}
        </div>
    );
};


const ForexNewsWidget: React.FC = () => {
    const [events, setEvents] = useState<EconomicEvent[]>([]);
    const { addNotification } = useNotification();
    
    useEffect(() => {
        // Initial load
        const todayEvents = generateMockEventsForToday();
        setEvents(todayEvents);

        // Simulate live updates
        const interval = setInterval(() => {
            setEvents(prevEvents => prevEvents.map(event => {
                if (event.time.getTime() <= Date.now() && event.actual === null) {
                    // When time passes, mark as published.
                    // A more realistic simulation could provide a random 'Actual' value.
                    return { ...event, actual: 'Simulated' }; 
                }
                return event;
            }));
        }, 30000); // Check every 30 seconds

        return () => clearInterval(interval);
    }, []);

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

    const upcomingEvents = events.filter(e => e.time.getTime() > Date.now());

    return (
        <div>
            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                {upcomingEvents.length > 0 ? upcomingEvents.slice(0, 5).map(item => (
                    <div key={item.id} className="grid grid-cols-[auto,1fr,auto] items-center gap-3 text-sm p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700/50">
                        <ImportanceIndicator importance={item.importance} />
                        <div>
                            <p className="font-semibold truncate flex items-center gap-2">
                                <span title={item.countryCode}>{COUNTRY_FLAGS[item.countryCode]}</span>
                                {item.event}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{item.currency} | {item.time.toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })}</p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                            <Countdown targetDate={item.time} />
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