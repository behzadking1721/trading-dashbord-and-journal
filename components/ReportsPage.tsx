import React, { useState, useEffect, useMemo } from 'react';
import { getJournalEntries } from '../db';
import type { JournalEntry } from '../types';
import { RefreshCw, BarChart2, PieChart, Calendar as CalendarIcon, Target, Bot, BookOpen, AlertTriangle, Briefcase, Brain } from 'lucide-react';

type PerformanceByGroup = {
    [key: string]: {
        totalTrades: number;
        winRate: number;
        totalPnl: number;
    }
}

type TimeFilter = 'all' | '7d' | '30d' | '90d';

const AnalysisCard: React.FC<{ title: string; icon: React.ElementType; children: React.ReactNode; isLoading: boolean }> = ({ title, icon: Icon, children, isLoading }) => (
    <div className="p-4 rounded-lg shadow-md bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border border-gray-200 dark:border-gray-700 min-h-[200px]">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Icon size={20} className="text-indigo-500" />
            {title}
        </h2>
        {isLoading ? <SkeletonLoader /> : children}
    </div>
);

const SkeletonLoader = () => (
    <div className="animate-pulse space-y-3">
        {[...Array(4)].map((_, i) => (
            <div key={i} className="h-5 bg-gray-300 dark:bg-gray-600 rounded w-full" style={{ opacity: 1 - i * 0.2 }}></div>
        ))}
    </div>
);

const StatTable: React.FC<{ data: PerformanceByGroup }> = ({ data }) => (
    <table className="w-full text-sm text-right">
        <thead className="text-xs text-gray-500 uppercase">
            <tr>
                <th className="py-2 px-1">آیتم</th>
                <th className="py-2 px-1 text-center">تعداد</th>
                <th className="py-2 px-1 text-center">نرخ برد</th>
                <th className="py-2 px-1 text-center">سود/ضرر</th>
            </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {Object.entries(data).map(([key, value]) => {
                // FIX: Add type assertion to resolve 'unknown' type from Object.entries
                const typedValue = value as { totalTrades: number, winRate: number, totalPnl: number };
                return (
                <tr key={key}>
                    <td className="py-2 px-1 font-semibold">{key}</td>
                    <td className="py-2 px-1 text-center">{typedValue.totalTrades}</td>
                    <td className="py-2 px-1 text-center">{typedValue.winRate.toFixed(1)}%</td>
                    <td className={`py-2 px-1 text-center font-mono font-bold ${typedValue.totalPnl >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        ${typedValue.totalPnl.toFixed(2)}
                    </td>
                </tr>
            )})}
        </tbody>
    </table>
);

const BarChart: React.FC<{ data: { [key: string]: number }, valuePrefix?: string }> = ({ data, valuePrefix = '' }) => {
    // FIX: Add type assertion to resolve 'unknown' type from Object.values
    const maxValue = Math.max(...(Object.values(data) as number[]).map(v => Math.abs(v)), 1);
    return (
        <div className="space-y-2 text-sm">
            {Object.entries(data).map(([key, value]) => {
                // FIX: Add type assertion to resolve 'unknown' type from Object.entries
                const numericValue = value as number;
                return (
                <div key={key} className="flex items-center gap-2">
                    <span className="w-24 truncate text-gray-500 dark:text-gray-400">{key}</span>
                    <div className="flex-grow bg-gray-200 dark:bg-gray-700 rounded-full h-5 relative">
                        <div
                            className={`h-5 rounded-full ${numericValue >= 0 ? 'bg-green-500' : 'bg-red-500'}`}
                            style={{ width: `${(Math.abs(numericValue) / maxValue) * 100}%` }}
                        />
                         <span className="absolute inset-0 px-2 flex items-center text-xs font-bold text-white mix-blend-difference">
                            {valuePrefix}{numericValue.toFixed(valuePrefix === '$' ? 2 : 0)}
                         </span>
                    </div>
                </div>
            )})}
        </div>
    );
}

const ReportsPage: React.FC = () => {
    const [allEntries, setAllEntries] = useState<JournalEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [timeFilter, setTimeFilter] = useState<TimeFilter>('all');

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            try {
                const entries = await getJournalEntries();
                setAllEntries(entries);
            } catch (error) {
                console.error("Failed to load entries for reports:", error);
            } finally {
                setLoading(false);
            }
        };
        window.addEventListener('journalUpdated', loadData);
        loadData();
        return () => window.removeEventListener('journalUpdated', loadData);
    }, []);

    const filteredEntries = useMemo(() => {
        if (timeFilter === 'all') return allEntries;
        const now = new Date();
        const daysToSubtract = { '7d': 7, '30d': 30, '90d': 90 }[timeFilter];
        const filterDate = new Date(now.setDate(now.getDate() - daysToSubtract));
        return allEntries.filter(entry => new Date(entry.date) >= filterDate);
    }, [allEntries, timeFilter]);
    
    // FIX: Refactored function to be type-safe. The original implementation had a type error
    // when initializing the accumulator because it used a temporary `wins` property that was not
    // defined in the type. This new version first aggregates data into an intermediate object with the
    // correct type (including `wins`), then calculates the final `winRate` and maps the result
    // to the expected `PerformanceByGroup` type.
    const calculatePerformanceByGroup = (key: 'setupName' | 'symbol'): PerformanceByGroup => {
        const groups = filteredEntries.reduce((acc, entry) => {
            const groupKey = entry[key] || 'نامشخص';
            if (!acc[groupKey]) {
                acc[groupKey] = { totalTrades: 0, wins: 0, totalPnl: 0 };
            }
            acc[groupKey].totalTrades++;
            acc[groupKey].totalPnl += entry.profitOrLoss;
            if (entry.profitOrLoss > 0) {
                acc[groupKey].wins++;
            }
            return acc;
        }, {} as { [key: string]: { totalTrades: number; wins: number; totalPnl: number; } });

        const result: PerformanceByGroup = {};
        for (const key in groups) {
            const group = groups[key];
            result[key] = {
                totalTrades: group.totalTrades,
                totalPnl: group.totalPnl,
                winRate: group.totalTrades > 0 ? (group.wins / group.totalTrades) * 100 : 0
            };
        }
        return result;
    };

    const performanceBySetup = useMemo(() => calculatePerformanceByGroup('setupName'), [filteredEntries]);
    const performanceBySymbol = useMemo(() => calculatePerformanceByGroup('symbol'), [filteredEntries]);
    
    const performanceByDay = useMemo(() => {
        const days = ['یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنج‌شنبه', 'جمعه', 'شنبه'];
        const data: { [key: string]: number } = {};
        filteredEntries.forEach(entry => {
            const dayName = days[new Date(entry.date).getDay()];
            data[dayName] = (data[dayName] || 0) + entry.profitOrLoss;
        });
        return data;
    }, [filteredEntries]);

    const performanceByEmotion = useMemo(() => {
        const data: { [key: string]: number } = {};
        filteredEntries.forEach(entry => {
            entry.emotions?.forEach(emotion => {
                data[emotion] = (data[emotion] || 0) + entry.profitOrLoss;
            });
        });
        return data;
    }, [filteredEntries]);
    
    const mistakeFrequency = useMemo(() => {
        const data: { [key: string]: number } = {};
        filteredEntries.forEach(entry => {
            entry.mistakes?.forEach(mistake => {
                data[mistake] = (data[mistake] || 0) + 1;
            });
        });
        return data;
    }, [filteredEntries]);

    if (loading) {
        return <div className="w-full h-screen flex items-center justify-center"><RefreshCw className="w-10 h-10 animate-spin text-indigo-500" /></div>;
    }

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold">گزارش‌های پیشرفته</h1>
                <div className="flex items-center gap-2 p-1 rounded-lg bg-gray-200 dark:bg-gray-700">
                    {(['all', '90d', '30d', '7d'] as TimeFilter[]).map(filter => (
                        <button
                            key={filter}
                            onClick={() => setTimeFilter(filter)}
                            className={`px-3 py-1 rounded-md text-sm font-semibold transition-colors ${
                                timeFilter === filter ? 'bg-white dark:bg-gray-800 shadow' : 'text-gray-600 dark:text-gray-300'
                            }`}
                        >
                            {{'all': 'همه', '90d': '۹۰ روز', '30d': '۳۰ روز', '7d': '۷ روز'}[filter]}
                        </button>
                    ))}
                </div>
            </div>

            {filteredEntries.length === 0 && !loading ? (
                 <div className="text-center py-10 text-gray-500">
                    <p>داده‌ای برای نمایش در این بازه زمانی وجود ندارد.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                    <AnalysisCard title="عملکرد بر اساس ستاپ" icon={Target} isLoading={loading}>
                        <StatTable data={performanceBySetup} />
                    </AnalysisCard>

                     <AnalysisCard title="عملکرد بر اساس نماد" icon={Briefcase} isLoading={loading}>
                        <StatTable data={performanceBySymbol} />
                    </AnalysisCard>
                    
                     <AnalysisCard title="عملکرد بر اساس روز هفته" icon={CalendarIcon} isLoading={loading}>
                        <BarChart data={performanceByDay} valuePrefix="$" />
                    </AnalysisCard>

                     <AnalysisCard title="تحلیل روانشناسی: احساسات" icon={Brain} isLoading={loading}>
                         <BarChart data={performanceByEmotion} valuePrefix="$" />
                    </AnalysisCard>
                    
                    <AnalysisCard title="تحلیل روانشناسی: اشتباهات" icon={AlertTriangle} isLoading={loading}>
                        <BarChart data={mistakeFrequency} />
                    </AnalysisCard>
                </div>
            )}
        </div>
    );
};

export default ReportsPage;
