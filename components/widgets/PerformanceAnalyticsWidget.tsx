import React, { useState, useEffect } from 'react';
import { TrendingUp, Target, Percent } from 'lucide-react';
import { getJournalEntries } from '../../db';
import type { JournalEntry } from '../../types';

interface Stats {
    winRate: number;
    avgRR: number;
    totalPnl: number;
    maxDrawdown: number; // For future use
}

const PerformanceAnalyticsWidget: React.FC = () => {
    const [stats, setStats] = useState<Stats>({ winRate: 0, avgRR: 0, totalPnl: 0, maxDrawdown: 0 });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const calculateStats = async () => {
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
        calculateStats();
    }, []);

    const pnlColor = stats.totalPnl >= 0 ? 'text-green-500' : 'text-red-500';

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-4 text-center">
        <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700/50">
            <p className="text-xs text-gray-500 dark:text-gray-400">نرخ برد</p>
            <p className="text-lg font-bold text-green-500">{loading ? '-' : stats.winRate.toFixed(1)}%</p>
        </div>
        <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700/50">
            <p className="text-xs text-gray-500 dark:text-gray-400">R/R متوسط</p>
            <p className="text-lg font-bold text-blue-500">{loading ? '-' : stats.avgRR.toFixed(2)}</p>
        </div>
        <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700/50">
            <p className="text-xs text-gray-500 dark:text-gray-400">مجموع PnL</p>
            <p className={`text-lg font-bold ${pnlColor}`}>{loading ? '-' : `$${stats.totalPnl.toFixed(2)}`}</p>
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
