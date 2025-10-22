
import React, { useState, useEffect } from 'react';
import { Clock, Sun, Moon } from 'lucide-react';

interface Session {
  name: string;
  openUtc: number;
  closeUtc: number;
}

const SESSIONS: Session[] = [
  { name: 'آسیا (توکیو)', openUtc: 0, closeUtc: 9 },
  { name: 'اروپا (لندن)', openUtc: 8, closeUtc: 17 },
  { name: 'آمریکا (نیویورک)', openUtc: 13, closeUtc: 22 },
];

const getTimeInTimezone = (date: Date, timeZone: string) => {
  return new Date(date.toLocaleString('en-US', { timeZone }));
};

const SessionsClockWidget: React.FC = () => {
  const [utcTime, setUtcTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setUtcTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const currentUtcHour = utcTime.getUTCHours();

  const getSessionStatus = (session: Session) => {
    const isOpen = currentUtcHour >= session.openUtc && currentUtcHour < session.closeUtc;
    const isClosingSoon = !isOpen && currentUtcHour === session.openUtc - 1;
    const isOpeningSoon = !isOpen && currentUtcHour === session.closeUtc -1;
    
    if (isOpen) return { text: 'باز', color: 'text-green-500' };
    if (isClosingSoon || isOpeningSoon) return { text: 'در آستانه تغییر', color: 'text-yellow-500' };
    return { text: 'بسته', color: 'text-red-500' };
  };
  
  const tehranTime = getTimeInTimezone(utcTime, 'Asia/Tehran');

  return (
    <div className="space-y-4">
      <div className="flex justify-around p-2 rounded-lg bg-gray-100 dark:bg-gray-700/50">
        <div className="text-center">
          <p className="text-xs text-gray-500 dark:text-gray-400">تهران</p>
          <p className="font-bold text-lg">{tehranTime.toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })}</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-gray-500 dark:text-gray-400">UTC</p>
          <p className="font-bold text-lg">{utcTime.toLocaleTimeString('en-US', { timeZone: 'UTC', hour12: false, hour: '2-digit', minute: '2-digit' })}</p>
        </div>
      </div>
      <div className="space-y-2">
        {SESSIONS.map(session => (
            <div key={session.name} className="flex justify-between items-center text-sm p-2 rounded">
                <span>{session.name}</span>
                <div className="flex items-center gap-2">
                    <span className="text-xs font-mono">{String(session.openUtc).padStart(2,'0')}:00 - {String(session.closeUtc).padStart(2,'0')}:00</span>
                    <span className={`font-semibold ${getSessionStatus(session).color}`}>
                        {getSessionStatus(session).text}
                    </span>
                </div>
            </div>
        ))}
      </div>
    </div>
  );
};

export default SessionsClockWidget;
