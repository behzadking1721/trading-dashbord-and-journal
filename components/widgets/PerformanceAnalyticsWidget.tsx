import React, { useState, useEffect } from 'react';
import { TrendingUp, Target, Percent, LineChart } from 'lucide-react';
import { getJournalEntries } from '../../db';
import type { JournalEntry } from '../../types';

interface Stats {
    winRate: number;
    avgRR: number;
    totalPnl: number;
    maxDrawdown: number; // For future use
}

const SkeletonLoader: React.FC = () => (
    <div className="animate-pulse grid grid-cols-3 gap-4 text-center">
        {[...Array(3)].map((_, i) => (
            <div key={i} className="p-2 rounded-lg bg-gray-200 dark:bg-gray-700/50">
                <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-3/4 mx-auto mb-2"></div>
                <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded w-1/2 mx-auto"></div>
            </div>
        ))}
    </div>
);

const PerformanceAnalyticsWidget: React.FC = () => {
    const [stats, setStats] = useState<Stats>({ winRate: 0, avgRR: 0, totalPnl: 0, maxDrawdown: 0 });
    const [loading, setLoading] = useState(true);

    const calculateStats = async () => {
        setLoading(true);
        try {
            const entries = await getJournalEntries();
            if (entries.length === 0) {
                setStats({ winRate: 0, avgRR: 0, totalPnl: 0, maxDrawdown: 0 });
                return;
            };

            const wins = entries.filter(e => e.status === 'Win').length;
            const winRate = (wins / entries.length) * 100;

            const totalPnl = entries.reduce((acc, e) => acc + e.profitOrLoss, 0);

            const validRRTrades = entries.filter(e => e.riskRewardRatio > 0 && isFinite(e.riskRewardRatio));
            const totalRR = validRRTrades.reduce((acc, e) => acc + e.riskRewardRatio, 0);
            const avgRR = validRRTrades.length > 0 ? totalRR / validRRTrades.length : 0;
            
            setStats({ winRate, avgRR, totalPnl, maxDrawdown: -8.2 }); // Using mock drawdown
        } catch (error) {
            console.error("Failed to calculate performance stats:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        window.addEventListener('journalUpdated', calculateStats);
        calculateStats();
        return () => {
            window.removeEventListener('journalUpdated', calculateStats);
        }
    }, []);

    const pnlColor = stats.totalPnl >= 0 ? 'text-green-500' : 'text-red-500';

  return (
    <div className="space-y-4">
      {loading ? <SkeletonLoader /> : (
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700/50">
              <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center justify-center gap-1"><Percent size={12}/> نرخ برد</p>
              <p className="text-lg font-bold text-green-500">{stats.winRate.toFixed(1)}%</p>
          </div>
          <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700/50">
              <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center justify-center gap-1"><Target size={12}/> R/R متوسط</p>
              <p className="text-lg font-bold text-blue-500">{stats.avgRR.toFixed(2)}</p>
          </div>
          <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700/50">
              <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center justify-center gap-1"><TrendingUp size={12}/> مجموع PnL</p>
              <p className={`text-lg font-bold ${pnlColor}`}>{`$${stats.totalPnl.toFixed(2)}`}</p>
          </div>
        </div>
      )}
      <div>
        <h4 className="text-sm font-semibold mb-2">نمودار رشد سرمایه (Equity Curve)</h4>
        <div className="flex items-center justify-center h-32 rounded-lg bg-gray-100 dark:bg-gray-700/50 text-gray-400">
            <LineChart className="w-12 h-12"/>
            <p className="text-sm me-4">به زودی...</p>
        </div>
      </div>
    </div>
  );
};

export default PerformanceAnalyticsWidget;