import React, { useState, useEffect } from 'react';
import type { NewsItem, NewsAlert } from '../../types';
import { Pin, Bell } from 'lucide-react';
import { addAlert } from '../../db';
import { useNotification } from '../../contexts/NotificationContext';

const MOCK_NEWS: NewsItem[] = [
  { id: '1', title: 'Non-Farm Payrolls', time: new Date(Date.now() + 120 * 60 * 1000), importance: 'High', currency: 'USD', link: '#' },
  { id: '2', title: 'ECB Press Conference', time: new Date(Date.now() + 300 * 60 * 1000), importance: 'High', currency: 'EUR', link: '#' },
  { id: '3', title: 'Retail Sales m/m', time: new Date(Date.now() + 20 * 60 * 1000), importance: 'Medium', currency: 'GBP', link: '#' },
  { id: '4', title: 'Unemployment Rate', time: new Date(Date.now() + 5 * 60 * 1000), importance: 'Low', currency: 'CAD', link: '#' },
  { id: '5', title: 'CPI m/m', time: new Date(Date.now() + 65 * 60 * 1000), importance: 'Medium', currency: 'USD', link: '#' },
  { id: '6', title: 'BoJ Policy Rate', time: new Date(Date.now() + 480 * 60 * 1000), importance: 'High', currency: 'JPY', link: '#' },
];

const ImportanceBadge: React.FC<{ importance: 'High' | 'Medium' | 'Low' }> = ({ importance }) => {
  const color = {
    High: 'bg-red-500',
    Medium: 'bg-orange-500',
    Low: 'bg-gray-500',
  }[importance];
  return <span className={`w-3 h-3 rounded-full ${color} inline-block`}></span>;
};

const Countdown: React.FC<{ targetDate: Date }> = ({ targetDate }) => {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      const difference = targetDate.getTime() - now.getTime();
      
      if (difference > 0) {
        const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
        const minutes = Math.floor((difference / 1000 / 60) % 60);
        const seconds = Math.floor((difference / 1000) % 60);
        setTimeLeft(`${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`);
      } else {
        setTimeLeft('منتشر شد');
        clearInterval(timer);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [targetDate]);

  return <span className="text-xs font-mono">{timeLeft}</span>;
};


const ForexNewsWidget: React.FC = () => {
    type FilterType = 'All' | 'High' | 'Medium' | 'Low';
    const [filter, setFilter] = useState<FilterType>('All');
    const { addNotification } = useNotification();
    
    const filteredNews = MOCK_NEWS
        .filter(item => filter === 'All' || item.importance === filter)
        .sort((a, b) => a.time.getTime() - b.time.getTime());

    const handleAddNewsAlert = async (item: NewsItem) => {
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
                    newsTitle: item.title,
                    eventTime: item.time.toISOString(),
                    triggerBeforeMinutes: triggerBeforeMinutes,
                };
                await addAlert(newAlert);
                addNotification(`هشدار برای "${item.title}" ثبت شد.`, 'success');
            } else {
                addNotification("لطفا یک عدد معتبر وارد کنید.", 'error');
            }
        }
    };

    return (
        <div>
            <div className="flex items-center gap-1 p-1 rounded-lg bg-gray-200 dark:bg-gray-700/50 mb-3">
                {(['All', 'High', 'Medium', 'Low'] as FilterType[]).map(f => (
                    <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className={`w-full px-2 py-1 rounded-md text-xs font-semibold transition-colors ${
                            filter === f ? 'bg-white dark:bg-gray-800 shadow' : 'text-gray-600 dark:text-gray-300'
                        }`}
                    >
                        {{'All': 'همه', 'High': 'مهم', 'Medium': 'متوسط', 'Low': 'کم'}[f]}
                    </button>
                ))}
            </div>
            <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                {filteredNews.map(item => (
                    <div key={item.id} className="flex items-center justify-between text-sm p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700/50">
                        <div className="flex items-center gap-3">
                            <ImportanceBadge importance={item.importance} />
                            <span className="font-bold text-xs w-8">{item.currency}</span>
                            <p className="truncate">{item.title}</p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                            <Countdown targetDate={item.time} />
                            <button onClick={() => handleAddNewsAlert(item)} title="ایجاد هشدار" className="text-gray-400 hover:text-indigo-500 cursor-pointer">
                                <Bell className="w-4 h-4" />
                            </button>
                            <Pin className="w-4 h-4 text-gray-400 hover:text-indigo-500 cursor-pointer" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ForexNewsWidget;
