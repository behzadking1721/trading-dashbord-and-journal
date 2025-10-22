
import React from 'react';
import { CalendarDays } from 'lucide-react';

const EconomicCalendarWidget: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center h-full text-gray-400">
      <CalendarDays className="w-12 h-12 mb-4" />
      <p className="text-center text-sm">
        نمایش کامل تقویم اقتصادی با فیلترها در اینجا قرار می‌گیرد.
      </p>
    </div>
  );
};

export default EconomicCalendarWidget;
