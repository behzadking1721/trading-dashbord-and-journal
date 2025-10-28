import React, { useState, useEffect, useCallback } from 'react';
import { getJournalEntries } from '../../db';
import type { JournalEntry } from '../../types';
import { Calendar, BarChart2, DollarSign, Percent, TrendingUp, TrendingDown, BookOpen } from 'lucide-react';

// --- Helper Functions ---
const isToday = (date: Date): boolean => {
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
};

// --- UI Components ---
const StatItem: React.FC<{ icon: React.ElementType, label: string, value: string | number, color?: string }> = ({ icon: Icon, label, value, color = 'text-gray-900 dark:text-gray-100' }) => (
    <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            <Icon size={14} />
            <span>{label}</span>
        </div>
        <span className={`font-bold font-mono text-base ${color}`}>{value}</span>
    </div>
);

const SkeletonLoader: React.FC = () => (
    <div className="animate-pulse space-y-4">
        {[...Array(4)].map((_, i) => (
            <div key={i} className="flex justify-between items-center">
                <div className="h-5 bg-gray-300 dark:bg-gray-600 rounded w-2/5"></div>
                <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded w-1/3"></div>
            </div>
        ))}
    </div>
);

// --- Main Widget ---
const TodaysPerformanceWidget: React.FC = () => {
    const [stats, setStats] = useState({
        pnl: 0,
        winRate: 0,
        totalTrades: 0,
        openTrades: 0,
    });
    const [loading, setLoading] = useState(true);

    const calculateStats = useCallback(async () => {
        setLoading(true);
        try {
            const allEntries = await getJournalEntries();

            const todaysEntries = allEntries.filter(e => isToday(new Date(e.date)));
            const closedToday = todaysEntries.filter(e => e.status);
            const winsToday = closedToday.filter(e => e.status === 'Win');
            
            const pnlToday = closedToday.reduce((sum, trade) => sum + (trade.profitOrLoss || 0), 0);
            const winRateToday = closedToday.length > 0 ? (winsToday.length / closedToday.length) * 100 : 0;
            const openTradesToday = todaysEntries.filter(e => !e.status).length;
            
            setStats({
                pnl: pnlToday,
                winRate: winRateToday,
                totalTrades: todaysEntries.length,
                openTrades: openTradesToday,
            });

        } catch (error) {
            console.error("Failed to calculate today's performance stats:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        window.addEventListener('journalUpdated', calculateStats);
        calculateStats();
        return () => {
            window.removeEventListener('journalUpdated', calculateStats);
        };
    }, [calculateStats]);
    
    if (loading) {
        return <SkeletonLoader />;
    }

    return (
        <div className="space-y-3 h-full flex flex-col justify-center">
            <StatItem 
                icon={DollarSign}
                label="سود/ضرر امروز"
                value={`$${stats.pnl.toFixed(2)}`}
                color={stats.pnl >= 0 ? 'text-green-500' : 'text-red-500'}
            />
            <StatItem 
                icon={Percent}
                label="نرخ برد امروز"
                value={`${stats.winRate.toFixed(1)}%`}
            />
             <StatItem 
                icon={BarChart2}
                label="تعداد معاملات امروز"
                value={stats.totalTrades}
            />
            <StatItem 
                icon={BookOpen}
                label="پوزیشن‌های باز"
                value={stats.openTrades}
                color="text-blue-500"
            />
        </div>
    );
};

export default TodaysPerformanceWidget;