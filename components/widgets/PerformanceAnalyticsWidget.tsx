
import React from 'react';
import { TrendingUp, Target, Percent } from 'lucide-react';

const PerformanceAnalyticsWidget: React.FC = () => {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-4 text-center">
        <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700/50">
            <p className="text-xs text-gray-500 dark:text-gray-400">نرخ برد</p>
            <p className="text-lg font-bold text-green-500">56%</p>
        </div>
        <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700/50">
            <p className="text-xs text-gray-500 dark:text-gray-400">R/R متوسط</p>
            <p className="text-lg font-bold text-blue-500">1.8</p>
        </div>
        <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700/50">
            <p className="text-xs text-gray-500 dark:text-gray-400">افت سرمایه</p>
            <p className="text-lg font-bold text-red-500">-8.2%</p>
        </div>
      </div>
      <div>
        <h4 className="text-sm font-semibold mb-2">نمودار سود و زیان (PnL)</h4>
        <div className="flex items-center justify-center h-32 rounded-lg bg-gray-100 dark:bg-gray-700/50 text-gray-400">
            <TrendingUp className="w-12 h-12"/>
            <p className="text-sm me-4">ادغام کتابخانه recharts</p>
        </div>
      </div>
    </div>
  );
};

export default PerformanceAnalyticsWidget;
