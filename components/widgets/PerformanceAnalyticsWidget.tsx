import React, { useState, useEffect } from 'react';
import { TrendingUp, Target, Percent } from 'lucide-react';
import { getJournalEntries } from '../../db';
import type { JournalEntry } from '../../types';

interface Stats {
    winRate: number;
    avgRR: number;
    totalPnl: number;
}

const KpiCard: React.FC<{ icon: React.ElementType, label: string, value: string, color: string }> = ({ icon: Icon, label, value, color }) => (
    <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700/50">
        <p className={`text-[10px] text-gray-500 dark:text-gray-400 flex items-center justify-center gap-1`}>
            <Icon size={10}/> {label}
        </p>
        <p className={`text-sm font-bold ${color}`}>{value}</p>
    </div>
);

const SkeletonLoader: React.FC = () => (
    <div className="animate-pulse grid grid-cols-3 gap-2 text-center">
        {[...Array(3)].map((_, i) => (
            <div key={i} className="p-2 rounded-lg bg-gray-200 dark:bg-gray-700/50">
                <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-3/4 mx-auto mb-2"></div>
                <div className="h-5 bg-gray-300 dark:bg-gray-600 rounded w-1/2 mx-auto"></div>
            </div>
        ))}
    </div>
);

const PerformanceAnalyticsWidget: React.FC = () => {
    const [stats, setStats] = useState<Stats>({ winRate: 0, avgRR: 0, totalPnl: 0 });
    const [loading, setLoading] = useState(true);

    const calculateStats = async () => {
        setLoading(true);
        try {
            const entries = await getJournalEntries();
            if (entries.length === 0) {
                setStats({ winRate: 0, avgRR: 0, totalPnl: 0 });
                return;
            };

            const wins = entries.filter(e => Number(e.profitOrLoss) > 0).length;
            const winRate = entries.length > 0 ? (wins / entries.length) * 100 : 0;

            const totalPnl = entries.reduce((acc, e) => acc + Number(e.profitOrLoss || 0), 0);

            const validRRTrades = entries.filter(e => {
                const rr = Number(e.riskRewardRatio);
                return rr > 0 && isFinite(rr);
            });
            const totalRR = validRRTrades.reduce((acc, e) => acc + Number(e.riskRewardRatio || 0), 0);
            const avgRR = validRRTrades.length > 0 ? totalRR / validRRTrades.length : 0;
            
            setStats({ winRate, avgRR, totalPnl });
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

  return (
    <div className="h-full flex flex-col justify-center">
      {loading ? <SkeletonLoader /> : (
        <div className="grid grid-cols-3 gap-2 text-center">
            <KpiCard 
                icon={Percent}
                label="نرخ برد"
                value={`${stats.winRate.toFixed(1)}%`}
                color="text-green-500"
            />
             <KpiCard 
                icon={Target}
                label="R/R متوسط"
                value={stats.avgRR.toFixed(2)}
                color="text-blue-500"
            />
             <KpiCard 
                icon={TrendingUp}
                label="مجموع PnL"
                value={`$${stats.totalPnl.toFixed(0)}`}
                color={stats.totalPnl >= 0 ? 'text-green-500' : 'text-red-500'}
            />
        </div>
      )}
    </div>
  );
};

export default PerformanceAnalyticsWidget;