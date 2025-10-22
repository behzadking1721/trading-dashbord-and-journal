
import React from 'react';
import { BarChart } from 'lucide-react';

const PriceChartWidget: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center h-full text-gray-400">
      <BarChart className="w-16 h-16 mb-4" />
      <p className="text-center">
        ادغام کتابخانه lightweight-charts در اینجا انجام می‌شود.
      </p>
      <div className="flex gap-2 mt-4">
        <button className="px-3 py-1 text-xs rounded bg-gray-200 dark:bg-gray-700">1m</button>
        <button className="px-3 py-1 text-xs rounded bg-gray-200 dark:bg-gray-700">5m</button>
        <button className="px-3 py-1 text-xs rounded bg-indigo-500 text-white">15m</button>
        <button className="px-3 py-1 text-xs rounded bg-gray-200 dark:bg-gray-700">1H</button>
        <button className="px-3 py-1 text-xs rounded bg-gray-200 dark:bg-gray-700">4H</button>
        <button className="px-3 py-1 text-xs rounded bg-gray-200 dark:bg-gray-700">1D</button>
      </div>
    </div>
  );
};

export default PriceChartWidget;
