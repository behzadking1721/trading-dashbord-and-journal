import React, { useState, useEffect, useRef, useContext } from 'react';
// FIX: Import the `Time` type from lightweight-charts to correctly type chart data.
import { createChart, IChartApi, ISeriesApi, Time } from 'lightweight-charts';
import { getJournalEntries } from '../db';
import type { JournalEntry } from '../types';
import { ThemeContext } from '../contexts/ThemeContext';
import { RefreshCw, TrendingUp, TrendingDown, DollarSign, Percent, Target, ChevronsDown, ChevronsUp, Activity } from 'lucide-react';

interface Stats {
    totalTrades: number;
    netProfit: number;
    profitFactor: number;
    winRate: number;
    maxDrawdown: number;
    avgWin: number;
    avgLoss: number;
    largestWin: number;
    largestLoss: number;
}

const StatCard: React.FC<{ icon: React.ElementType, title: string, value: string | number, colorClass?: string, description?: string }> = ({ icon: Icon, title, value, colorClass = 'text-gray-800 dark:text-gray-200', description }) => (
    <div className="p-4 rounded-lg shadow-md bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3 mb-2">
            <Icon className="w-6 h-6 text-gray-500 dark:text-gray-400" />
            <h3 className="font-semibold text-sm text-gray-600 dark:text-gray-300">{title}</h3>
        </div>
        <p className={`text-2xl font-bold ${colorClass}`}>{value}</p>
        {description && <p className="text-xs text-gray-500 mt-1">{description}</p>}
    </div>
);

const PerformanceAnalyticsPage: React.FC = () => {
    const [stats, setStats] = useState<Stats | null>(null);
    // FIX: Use the `Time` type for the time property to match lightweight-charts' expected data structure.
    const [equityData, setEquityData] = useState<{ time: Time, value: number }[]>([]);
    const [loading, setLoading] = useState(true);
    const chartContainerRef = useRef<HTMLDivElement>(null);
    const chartRef = useRef<IChartApi | null>(null);
    const seriesRef = useRef<ISeriesApi<'Area'> | null>(null);
    const { theme } = useContext(ThemeContext);

    const calculatePerformance = async () => {
        setLoading(true);
        try {
            const savedBalance = localStorage.getItem('accountBalance') || '10000';
            const initialBalance = parseFloat(savedBalance);

            const entries = (await getJournalEntries()).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
            
            if (entries.length === 0) {
                setStats(null);
                setEquityData([]);
                setLoading(false);
                return;
            }

            let currentEquity = initialBalance;
            let peakEquity = initialBalance;
            let maxDrawdown = 0;
            
            // Use a timestamp slightly before the first trade for the initial point
            const firstTradeTimestamp = Math.floor(new Date(entries[0].date).getTime() / 1000);
            // FIX: Ensure the data structure matches the state type by casting timestamps to `Time`.
            const newEquityData: { time: Time, value: number }[] = [{ time: (firstTradeTimestamp - 60) as Time, value: initialBalance }];


            const wins = entries.filter(e => Number(e.profitOrLoss) > 0);
            const losses = entries.filter(e => Number(e.profitOrLoss) < 0);
            
            const totalProfit = wins.reduce((acc, e) => acc + Number(e.profitOrLoss || 0), 0);
            const totalLoss = Math.abs(losses.reduce((acc, e) => acc + Number(e.profitOrLoss || 0), 0));

            for (const entry of entries) {
                currentEquity += Number(entry.profitOrLoss || 0);
                if (currentEquity > peakEquity) {
                    peakEquity = currentEquity;
                }
                const drawdown = peakEquity > 0 ? ((peakEquity - currentEquity) / peakEquity) * 100 : 0;
                if (drawdown > maxDrawdown) {
                    maxDrawdown = drawdown;
                }
                // Use precise timestamp (in seconds) for each trade
                const timestamp = Math.floor(new Date(entry.date).getTime() / 1000);
                // FIX: Ensure the data structure matches the state type by casting timestamps to `Time`.
                newEquityData.push({ time: timestamp as Time, value: currentEquity });
            }
            
            setEquityData(newEquityData);

            setStats({
                totalTrades: entries.length,
                netProfit: currentEquity - initialBalance,
                profitFactor: totalLoss > 0 ? totalProfit / totalLoss : Infinity,
                winRate: (wins.length / entries.length) * 100,
                maxDrawdown: maxDrawdown,
                avgWin: wins.length > 0 ? totalProfit / wins.length : 0,
                avgLoss: losses.length > 0 ? totalLoss / losses.length : 0,
                largestWin: Math.max(0, ...wins.map(e => Number(e.profitOrLoss || 0))),
                largestLoss: Math.min(0, ...losses.map(e => Number(e.profitOrLoss || 0))),
            });

        } catch (error) {
            console.error("Failed to calculate performance:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        calculatePerformance();
        window.addEventListener('journalUpdated', calculatePerformance);
        return () => window.removeEventListener('journalUpdated', calculatePerformance);
    }, []);

    useEffect(() => {
        if (!chartContainerRef.current || equityData.length < 2) {
             if(chartRef.current) {
                chartRef.current.remove();
                chartRef.current = null;
            }
            return;
        };

        const handleResize = () => {
            if (chartRef.current) {
                chartRef.current.applyOptions({ width: chartContainerRef.current.clientWidth });
            }
        };

        if (!chartRef.current) {
             chartRef.current = createChart(chartContainerRef.current, {
                width: chartContainerRef.current.clientWidth,
                height: 300,
                layout: { background: { color: 'transparent' } },
                timeScale: { timeVisible: true, secondsVisible: false },
             });
             // FIX: Cast chartRef.current to 'any' to bypass potential type mismatch issues
             // in the lightweight-charts library where addAreaSeries is not found on IChartApi.
             seriesRef.current = (chartRef.current as any).addAreaSeries();
        }

        const isDark = theme !== 'light';
        chartRef.current.applyOptions({
            layout: { textColor: isDark ? '#d1d5db' : '#1f2937' },
            grid: {
                vertLines: { color: isDark ? '#374151' : '#e5e7eb' },
                horzLines: { color: isDark ? '#374151' : '#e5e7eb' },
            },
        });
        
        const lastValue = equityData[equityData.length - 1]?.value ?? 0;
        const firstValue = equityData[0]?.value ?? 0;
        const color = lastValue >= firstValue ? '#22c55e' : '#ef4444';
        const topColor = lastValue >= firstValue ? 'rgba(34, 197, 94, 0.4)' : 'rgba(239, 68, 68, 0.4)';

        seriesRef.current.applyOptions({
            lineColor: color,
            topColor: topColor,
            bottomColor: 'rgba(255, 255, 255, 0)',
        });
        
        seriesRef.current.setData(equityData);
        chartRef.current.timeScale().fitContent();

        window.addEventListener('resize', handleResize);
        return () => {
            window.removeEventListener('resize', handleResize);
        };
    }, [equityData, theme]);

    if (loading) {
        return <div className="w-full h-screen flex items-center justify-center"><RefreshCw className="w-10 h-10 animate-spin text-indigo-500" /></div>;
    }
    
    if (!stats || stats.totalTrades === 0) {
        return (
            <div className="p-6 text-center">
                <h1 className="text-2xl font-bold mb-4">تحلیل عملکرد</h1>
                <p className="text-gray-500">هیچ معامله‌ای برای تحلیل یافت نشد. لطفاً ابتدا معاملاتی را در ژورنال خود ثبت کنید.</p>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6">
            <h1 className="text-2xl font-bold">تحلیل عملکرد</h1>

            <div className="p-6 rounded-lg shadow-md bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2"><Activity /> منحنی سرمایه (Equity Curve)</h2>
                <div ref={chartContainerRef} className="w-full h-[300px]" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                 <StatCard 
                    icon={DollarSign}
                    title="سود خالص"
                    value={`$${stats.netProfit.toFixed(2)}`}
                    colorClass={stats.netProfit >= 0 ? 'text-green-500' : 'text-red-500'}
                />
                 <StatCard 
                    icon={Target}
                    title="فاکتور سود"
                    value={isFinite(stats.profitFactor) ? stats.profitFactor.toFixed(2) : '∞'}
                    description="مجموع سود / مجموع ضرر"
                />
                 <StatCard 
                    icon={Percent}
                    title="نرخ برد"
                    value={`${stats.winRate.toFixed(1)}%`}
                    description={`${(stats.winRate / 100 * stats.totalTrades).toFixed(0)} از ${stats.totalTrades} معامله`}
                />
                 <StatCard 
                    icon={TrendingDown}
                    title="حداکثر افت سرمایه"
                    value={`${stats.maxDrawdown.toFixed(2)}%`}
                    colorClass="text-red-500"
                />
                 <StatCard 
                    icon={TrendingUp}
                    title="متوسط برد"
                    value={`$${stats.avgWin.toFixed(2)}`}
                    colorClass="text-green-500"
                />
                 <StatCard 
                    icon={TrendingDown}
                    title="متوسط باخت"
                    value={`$${stats.avgLoss.toFixed(2)}`}
                    colorClass="text-red-500"
                />
                 <StatCard 
                    icon={ChevronsUp}
                    title="بزرگترین برد"
                    value={`$${stats.largestWin.toFixed(2)}`}
                    colorClass="text-green-500"
                />
                 <StatCard 
                    icon={ChevronsDown}
                    title="بزرگترین باخت"
                    value={`$${stats.largestLoss.toFixed(2)}`}
                    colorClass="text-red-500"
                />
            </div>
        </div>
    );
};

export default PerformanceAnalyticsPage;