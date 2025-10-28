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

const SkeletonLoader: React.FC = () => (
    <div className="animate-pulse space-y-3">
        <div className="p-4 rounded-lg bg-gray-200 dark:bg-gray-700/50">
            <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-1/2 mx-auto mb-2"></div>
            <div className="h-8 bg-gray-300 dark:bg-gray-600 rounded w-3/4 mx-auto"></div>
        </div>
        <div className="grid grid-cols-3 gap-2">
            <div className="h-12 bg-gray-200 dark:bg-gray-700/50 rounded-md"></div>
            <div className="h-12 bg-gray-200 dark:bg-gray-700/50 rounded-md"></div>
            <div className="h-12 bg-gray-200 dark:bg-gray-700/50 rounded-md"></div>
        </div>
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

    const pnlColor = stats.pnl >= 0 ? 'text-green-500' : 'text-red-500';

    return (
        <div className="space-y-3">
            <div className={`p-3 rounded-lg text-center bg-opacity-50 ${stats.pnl >= 0 ? 'bg-green-100 dark:bg-green-900/50' : 'bg-red-100 dark:bg-red-900/50'}`}>
                <p className="text-sm text-gray-600 dark:text-gray-300">سود/ضرر امروز</p>
                <p className={`text-3xl font-bold font-mono ${pnlColor}`}>
                    {stats.pnl >= 0 ? '+' : ''}${stats.pnl.toFixed(2)}
                </p>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-2 rounded-md bg-gray-100 dark:bg-gray-700/50">
                    <p className="text-xs text-gray-500 dark:text-gray-400">نرخ برد</p>
                    <p className="font-bold text-lg">{stats.winRate.toFixed(1)}%</p>
                </div>
                <div className="p-2 rounded-md bg-gray-100 dark:bg-gray-700/50">
                    <p className="text-xs text-gray-500 dark:text-gray-400">معاملات</p>
                    <p className="font-bold text-lg">{stats.totalTrades}</p>
                </div>
                <div className="p-2 rounded-md bg-gray-100 dark:bg-gray-700/50">
                    <p className="text-xs text-gray-500 dark:text-gray-400">پوزیشن باز</p>
                    <p className="font-bold text-lg text-blue-500">{stats.openTrades}</p>
                </div>
            </div>
        </div>
    );
};

export default TodaysPerformanceWidget;