import React, { useState } from 'react';
import { Filter } from 'lucide-react';

type Importance = 'High' | 'Medium' | 'Low';

interface CalendarEvent {
  id: string;
  time: string;
  currency: string;
  importance: Importance;
  event: string;
  actual?: string;
  forecast?: string;
  previous?: string;
}

const MOCK_EVENTS: CalendarEvent[] = [
  { id: '1', time: '12:30', currency: 'CAD', importance: 'Low', event: 'Manufacturing Sales m/m' },
  { id: '2', time: '17:00', currency: 'USD', importance: 'High', event: 'FOMC Statement', forecast: '5.50%', previous: '5.50%' },
  { id: '3', time: '17:30', currency: 'USD', importance: 'High', event: 'FOMC Press Conference' },
  { id: '4', time: '20:00', currency: 'NZD', importance: 'Medium', event: 'Visitor Arrivals m/m' },
  { id: '5', time: 'فردا 04:30', currency: 'AUD', importance: 'High', event: 'Employment Change', forecast: '15K', previous: '-6.6K' },
];

const ImportanceBadge: React.FC<{ importance: Importance }> = ({ importance }) => {
  const color = {
    High: 'bg-red-500',
    Medium: 'bg-orange-500',
    Low: 'bg-gray-500',
  }[importance];
  return <span className={`w-3 h-3 rounded-full ${color} inline-block`} title={`اهمیت ${importance}`}></span>;
};

const CalendarPage: React.FC = () => {
    const [filteredEvents, setFilteredEvents] = useState(MOCK_EVENTS);

    return (
        <div className="p-6 h-full flex flex-col">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">تقویم اقتصادی</h1>
                {/* Add filter controls here */}
            </div>

            <div className="flex-grow overflow-auto rounded-lg shadow-md border border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
                <table className="w-full text-sm text-right">
                    <thead className="text-xs text-gray-500 uppercase bg-gray-50 dark:bg-gray-700/50">
                        <tr>
                            <th className="px-4 py-3">زمان</th>
                            <th className="px-4 py-3">ارز</th>
                            <th className="px-4 py-3">اهمیت</th>
                            <th className="px-4 py-3">رویداد</th>
                            <th className="px-4 py-3">واقعی</th>
                            <th className="px-4 py-3">پیش‌بینی</th>
                            <th className="px-4 py-3">قبلی</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {filteredEvents.map(e => (
                             <tr key={e.id} className="hover:bg-gray-100/50 dark:hover:bg-gray-700/50">
                                <td className="px-4 py-3 font-mono">{e.time}</td>
                                <td className="px-4 py-3 font-bold">{e.currency}</td>
                                <td className="px-4 py-3 text-center"><ImportanceBadge importance={e.importance} /></td>
                                <td className="px-4 py-3">{e.event}</td>
                                <td className="px-4 py-3 font-mono">{e.actual || '-'}</td>
                                <td className="px-4 py-3 font-mono">{e.forecast || '-'}</td>
                                <td className="px-4 py-3 font-mono">{e.previous || '-'}</td>
                             </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default CalendarPage;
