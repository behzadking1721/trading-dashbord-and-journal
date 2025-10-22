
import React, { useState, useEffect } from 'react';
import type { NewsItem } from '../../types';
import { Flame, Pin } from 'lucide-react';

const MOCK_NEWS: NewsItem[] = [
  { id: '1', title: 'Non-Farm Payrolls', time: new Date(Date.now() + 120 * 60 * 1000), importance: 'High', currency: 'USD', link: '#' },
  { id: '2', title: 'ECB Press Conference', time: new Date(Date.now() + 300 * 60 * 1000), importance: 'High', currency: 'EUR', link: '#' },
  { id: '3', title: 'Retail Sales m/m', time: new Date(Date.now() + 20 * 60 * 1000), importance: 'Medium', currency: 'GBP', link: '#' },
  { id: '4', title: 'Unemployment Rate', time: new Date(Date.now() + 5 * 60 * 1000), importance: 'Low', currency: 'CAD', link: '#' },
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
  return (
    <div className="space-y-3">
      {MOCK_NEWS.map(item => (
        <div key={item.id} className="flex items-center justify-between text-sm p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700/50">
          <div className="flex items-center gap-3">
            <ImportanceBadge importance={item.importance} />
            <span className="font-bold text-xs">{item.currency}</span>
            <p>{item.title}</p>
          </div>
          <div className="flex items-center gap-3">
            <Countdown targetDate={item.time} />
            <Pin className="w-4 h-4 text-gray-400 hover:text-indigo-500 cursor-pointer" />
          </div>
        </div>
      ))}
    </div>
  );
};

export default ForexNewsWidget;
