import React, { useState, useEffect } from 'react';

interface Session {
  name: string;
  shortName: string;
  openUtc: number;
  closeUtc: number;
  color: string;
}

const SESSIONS: Session[] = [
  { name: 'آسیا (توکیو)', shortName: 'توکیو', openUtc: 0, closeUtc: 9, color: 'bg-blue-500' },
  { name: 'اروپا (لندن)', shortName: 'لندن', openUtc: 8, closeUtc: 17, color: 'bg-green-500' },
  { name: 'آمریکا (نیویورک)', shortName: 'نیویورک', openUtc: 13, closeUtc: 22, color: 'bg-red-500' },
];

const SessionsClockWidget: React.FC = () => {
  const [utcTime, setUtcTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setUtcTime(new Date()), 1000 * 60); // Update every minute
    return () => clearInterval(timer);
  }, []);

  const currentUtcHour = utcTime.getUTCHours() + utcTime.getUTCMinutes() / 60;
  const tehranTime = new Date(utcTime.toLocaleString('en-US', { timeZone: 'Asia/Tehran' }));

  const getSessionStatus = (session: Session) => {
    const isOpen = currentUtcHour >= session.openUtc && currentUtcHour < session.closeUtc;
    return isOpen ? { text: 'باز', color: 'text-green-500' } : { text: 'بسته', color: 'text-red-500' };
  };

  return (
    <div className="space-y-4">
        {/* Time Display */}
        <div className="flex justify-around p-2 rounded-lg bg-gray-100 dark:bg-gray-700/50">
            <div className="text-center">
                <p className="text-xs text-gray-500 dark:text-gray-400">تهران</p>
                <p className="font-bold text-lg font-mono">{tehranTime.toLocaleTimeString('fa-IR-u-nu-latn', { hour: '2-digit', minute: '2-digit' })}</p>
            </div>
            <div className="text-center">
                <p className="text-xs text-gray-500 dark:text-gray-400">UTC</p>
                <p className="font-bold text-lg font-mono">{utcTime.toLocaleTimeString('en-US', { timeZone: 'UTC', hour12: false, hour: '2-digit', minute: '2-digit' })}</p>
            </div>
        </div>
        
        {/* Timeline */}
        <div>
            <h4 className="text-sm font-semibold mb-3">تایم‌لاین ۲۴ ساعته (UTC)</h4>
            <div className="relative w-full h-8 bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden">
                {SESSIONS.map(session => (
                    <div
                        key={session.name}
                        className={`absolute h-full ${session.color} opacity-70 flex items-center justify-center`}
                        style={{
                            left: `${(session.openUtc / 24) * 100}%`,
                            width: `${((session.closeUtc - session.openUtc) / 24) * 100}%`,
                        }}
                        title={`${session.name}: ${session.openUtc}:00 - ${session.closeUtc}:00 UTC`}
                    >
                        <span className="text-white text-[10px] font-bold">{session.shortName}</span>
                    </div>
                ))}
                 {/* Current Time Marker */}
                 <div 
                    className="absolute top-0 bottom-0 w-0.5 bg-yellow-400"
                    style={{ left: `${(currentUtcHour / 24) * 100}%` }}
                    title={`Current UTC Time: ${utcTime.getUTCHours()}:${utcTime.getUTCMinutes()}`}
                 >
                     <div className="absolute -top-1 -left-1 w-2.5 h-2.5 bg-yellow-400 rounded-full"></div>
                 </div>
            </div>
        </div>

      {/* Session List */}
      <div className="space-y-2">
        {SESSIONS.map(session => (
            <div key={session.name} className="flex justify-between items-center text-sm p-2 rounded">
                <span>{session.name}</span>
                <div className="flex items-center gap-2">
                    <span className="text-xs font-mono">{String(session.openUtc).padStart(2,'0')}:00 - {String(session.closeUtc).padStart(2,'0')}</span>
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