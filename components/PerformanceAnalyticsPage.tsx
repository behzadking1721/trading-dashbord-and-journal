import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { createChart, IChartApi, ISeriesApi, Time } from 'lightweight-charts';
import { getJournalEntries } from '../../db';
import type { JournalEntry, TradingSetup } from '../../types';
import { useAppContext } from '../contexts/AppContext';
import { RefreshCw, TrendingUp, TrendingDown, DollarSign, Percent, Target, ChevronsDown, ChevronsUp, Activity, Filter, BarChartHorizontal, Briefcase } from 'lucide-react';

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
    <div className="p-4 rounded-lg shadow-md bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border border-gray-200 dark:border-gray-700 h-full">
        <div className="flex items-center gap-2 mb-2">
            <Icon className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            <h3 className="font-semibold text-xs text-gray-600 dark:text-gray-300">{title}</h3>
        </div>
        <p className={`text-xl font-bold ${colorClass}`}>{value}</p>
        {description && <p className="text-xs text-gray-500 mt-1">{description}</p>}
    </div>
);

const AnalysisBarChart: React.FC<{ data: { [key: string]: number } }> = ({ data }) => {
    const sortedData = Object.entries(data).sort(([, a], [, b]) => b - a).slice(0, 5); // Show top 5
    if (sortedData.length === 0) {
        return <p className="text-center text-sm text-gray-500">داده‌ای برای نمایش وجود ندارد.</p>;
    }
    const maxValue = Math.max(...sortedData.map(([, v]) => Math.abs(v)), 1);
    return (
        <div className="space-y-2 text-sm">
            {sortedData.map(([key, value]) => (
                <div key={key} className="flex items-center gap-2">
                    <span className="w-24 truncate text-gray-500 dark:text-gray-400 text-xs" title={key}>{key}</span>
                    <div className="flex-grow bg-gray-200 dark:bg-gray-700 rounded-full h-5 relative">
                        <div
                            className={`h-5 rounded-full ${value >= 0 ? 'bg-green-500' : 'bg-red-500'}`}
                            style={{ width: `${(Math.abs(value) / maxValue) * 100}%` }}
                        />
                        <span className="absolute inset-0 px-2 flex items-center text-xs font-bold text-white mix-blend-difference">
                           ${value.toFixed(2)}
                        </span>
                    </div>
                </div>
            ))}
        </div>
    );
};

type TimeFilter = 'all' | '90d' | '30d' | '7d';
const SESSION_STORAGE_KEY_FILTERS = 'performance-analytics-filters';


const PerformanceAnalyticsPage: React.FC = () => {
    const [allEntries, setAllEntries] = useState<JournalEntry[]>([]);
    const [setups, setSetups] = useState<TradingSetup[]>([]);
    const [loading, setLoading] = useState(true);
    const chartContainerRef = useRef<HTMLDivElement>(null);
    const { theme } = useAppContext();

    // Filters
    const [filters, setFilters] = useState(() => {
        try {
            const saved = sessionStorage.getItem(SESSION_STORAGE_KEY_FILTERS);
            return saved ? JSON.parse(saved) : { time: 'all', symbol: 'all', setup: 'all' };
        } catch (error) {
            console.error("Failed to load performance filters from session storage", error);
            return { time: 'all', symbol: 'all', setup: 'all' };
        }
    });
    const { time: timeFilter, symbol: symbolFilter, setup: setupFilter } = filters;

    const handleFilterChange = <K extends keyof typeof filters>(key: K, value: typeof filters[K]) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const [entries, savedSetups] = await Promise.all([
                getJournalEntries(),
                localStorage.getItem('trading-setups')
            ]);
            setAllEntries(entries);
            if (savedSetups) setSetups(JSON.parse(savedSetups));
        } catch (error) {
            console.error("Failed to load performance data:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadData();
        window.addEventListener('journalUpdated', loadData);
        return () => window.removeEventListener('journalUpdated', loadData);
    }, [loadData]);

    useEffect(() => {
        try {
            sessionStorage.setItem(SESSION_STORAGE_KEY_FILTERS, JSON.stringify(filters));
        } catch (error) {
            console.error("Failed to save performance filters to session storage", error);
        }
    }, [filters]);

    const { filteredEntries, availableSymbols } = useMemo(() => {
        const symbols = new Set<string>();
        allEntries.forEach(e => e.symbol && symbols.add(e.symbol));

        const filtered = allEntries.filter(entry => {
            if (symbolFilter !== 'all' && entry.symbol !== symbolFilter) return false;
            if (setupFilter !== 'all' && entry.setupId !== setupFilter) return false;

            if (timeFilter !== 'all') {
                const now = new Date();
                const entryDate = new Date(entry.date);
                const days = { '7d': 7, '30d': 30, '90d': 90 }[timeFilter as '7d' | '30d' | '90d'];
                if (days) {
                    const filterDate = new Date(new Date().setDate(now.getDate() - days));
                    if(entryDate < filterDate) return false;
                }
            }
            return true;
        });
        return { filteredEntries: filtered, availableSymbols: Array.from(symbols).sort() };
    }, [allEntries, timeFilter, symbolFilter, setupFilter]);


    const performanceData = useMemo(() => {
        const entries = filteredEntries
            .filter(e => e.profitOrLoss != null)
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        
        if (entries.length === 0) return null;

        const initialBalance = parseFloat(localStorage.getItem('accountBalance') || '10000');
        let currentEquity = initialBalance;
        let peakEquity = initialBalance;
        let maxDrawdown = 0;
        let maxDrawdownPeriod = { start: 0, end: 0 };
        let peakTime = 0;

        const firstTradeTimestamp = Math.floor(new Date(entries[0].date).getTime() / 1000);
        const equityData: { time: Time, value: number }[] = [{ time: (firstTradeTimestamp - 3600) as Time, value: initialBalance }];
        
        for (const entry of entries) {
            currentEquity += entry.profitOrLoss!;
            const timestamp = Math.floor(new Date(entry.date).getTime() / 1000);

            if (currentEquity > peakEquity) {
                peakEquity = currentEquity;
                peakTime = timestamp;
            }
            const drawdown = peakEquity > 0 ? ((peakEquity - currentEquity) / peakEquity) * 100 : 0;
            if (drawdown > maxDrawdown) {
                maxDrawdown = drawdown;
                maxDrawdownPeriod = { start: peakTime, end: timestamp };
            }
            equityData.push({ time: timestamp as Time, value: currentEquity });
        }
        
        const wins = entries.filter(e => e.profitOrLoss! > 0);
        const losses = entries.filter(e => e.profitOrLoss! < 0);
        const totalProfit = wins.reduce((acc, e) => acc + e.profitOrLoss!, 0);
        const totalLoss = Math.abs(losses.reduce((acc, e) => acc + e.profitOrLoss!, 0));

        const stats: Stats = {
            totalTrades: entries.length,
            netProfit: currentEquity - initialBalance,
            profitFactor: totalLoss > 0 ? totalProfit / totalLoss : Infinity,
            winRate: (wins.length / entries.length) * 100,
            maxDrawdown: maxDrawdown,
            avgWin: wins.length > 0 ? totalProfit / wins.length : 0,
            avgLoss: losses.length > 0 ? totalLoss / losses.length : 0,
            largestWin: Math.max(0, ...wins.map(e => e.profitOrLoss!)),
            largestLoss: Math.min(0, ...losses.map(e => e.profitOrLoss!)),
        };

        const pnlBySetup: { [key: string]: number } = {};
        const pnlBySymbol: { [key: string]: number } = {};
        entries.forEach(e => {
            const setupName = e.setupName || 'نامشخص';
            pnlBySetup[setupName] = (pnlBySetup[setupName] || 0) + e.profitOrLoss!;
            
            const symbolName = e.symbol || 'نامشخص';
            pnlBySymbol[symbolName] = (pnlBySymbol[symbolName] || 0) + e.profitOrLoss!;
        });

        return { stats, equityData, peakEquityData: { time: peakTime, value: peakEquity }, maxDrawdownPeriod, pnlBySetup, pnlBySymbol };

    }, [filteredEntries]);

    useEffect(() => {
        const chartContainer = chartContainerRef.current;
        if (!chartContainer) return;

        // --- Robust redraw logic ---
        // Clear previous chart instance completely before creating a new one.
        chartContainer.innerHTML = '';
        if (!performanceData) {
            return;
        }

        const chart = createChart(chartContainer, {
            width: chartContainer.clientWidth,
            height: 350,
            layout: { background: { color: 'transparent' } },
            timeScale: { timeVisible: true, secondsVisible: false },
        });

        const isDark = theme !== 'light';
        chart.applyOptions({
            layout: { textColor: isDark ? '#d1d5db' : '#1f2937' },
            grid: { vertLines: { color: 'transparent' }, horzLines: { color: isDark ? '#374151' : '#e5e7eb' } },
        });

        // The type definitions might be incorrect in this environment. Casting to `any` to ensure it works.
        const areaSeries = (chart as any).addAreaSeries();
        const { equityData, peakEquityData } = performanceData;
        const lastValue = equityData[equityData.length - 1]?.value ?? 0;
        const firstValue = equityData[0]?.value ?? 0;
        const color = lastValue >= firstValue ? '#22c55e' : '#ef4444';
        
        areaSeries.applyOptions({
            lineColor: color,
            topColor: `${color}55`,
            bottomColor: `${color}00`,
        });
        
        areaSeries.setData(equityData);
        chart.timeScale().fitContent();

        if (peakEquityData.value > firstValue) {
            areaSeries.createPriceLine({ price: peakEquityData.value, color: '#3b82f6', lineWidth: 1, lineStyle: 2, axisLabelVisible: true, title: 'اوج سرمایه' });
        }
        
        const handleResize = () => chart.applyOptions({ width: chartContainer.clientWidth });
        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
            chart.remove();
        };
    }, [performanceData, theme]);


    if (loading) {
        return <div className="w-full h-screen flex items-center justify-center"><RefreshCw className="w-10 h-10 animate-spin text-indigo-500" /></div>;
    }
    
    return (
        <div className="p-6 space-y-6">
            <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-2">
                <div>
                    <h1 className="text-2xl font-bold">تحلیل عملکرد</h1>
                    <p className="text-gray-500 dark:text-gray-400">شاخص‌های کلیدی عملکرد خود را برای بهبود استراتژی دنبال کنید.</p>
                </div>
            </header>

            <div className="flex flex-col lg:flex-row gap-6">
                {/* Main Content */}
                <main className="flex-1 space-y-6">
                    <div className="p-4 rounded-lg shadow-md bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border border-gray-200 dark:border-gray-700">
                        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2"><Activity /> منحنی سرمایه (Equity Curve)</h2>
                        <div ref={chartContainerRef} className="w-full h-[350px]" />
                    </div>

                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                         <div className="p-4 rounded-lg shadow-md bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border border-gray-200 dark:border-gray-700">
                            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2"><BarChartHorizontal /> عملکرد بر اساس ستاپ</h2>
                            {performanceData && <AnalysisBarChart data={performanceData.pnlBySetup} />}
                        </div>
                         <div className="p-4 rounded-lg shadow-md bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border border-gray-200 dark:border-gray-700">
                            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2"><Briefcase /> عملکرد بر اساس نماد</h2>
                             {performanceData && <AnalysisBarChart data={performanceData.pnlBySymbol} />}
                        </div>
                    </div>
                </main>

                {/* Sidebar */}
                <aside className="lg:w-80 flex-shrink-0 space-y-6">
                    <div className="p-4 rounded-lg shadow-md bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border border-gray-200 dark:border-gray-700">
                        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2"><Filter /> فیلترها</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="text-sm font-medium">بازه زمانی</label>
                                 <div className="flex items-center p-1 rounded-lg bg-gray-200 dark:bg-gray-700/50 mt-1">
                                    {(['all', '90d', '30d', '7d'] as const).map(f => (
                                        <button key={f} onClick={() => handleFilterChange('time', f)} className={`flex-1 px-2 py-1 text-xs font-semibold rounded-md transition-colors ${timeFilter === f ? 'bg-white dark:bg-gray-800 shadow text-indigo-500' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}>
                                            {{'all': 'همه', '90d': '۹۰ روز', '30d': '۳۰ روز', '7d': '۷ روز'}[f]}
                                        </button>
                                    ))}
                                </div>
                            </div>
                             <div>
                                <label htmlFor="symbolFilter" className="text-sm font-medium">نماد</label>
                                <select id="symbolFilter" value={symbolFilter} onChange={e => handleFilterChange('symbol', e.target.value)} className="w-full mt-1 p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 text-sm">
                                    <option value="all">همه نمادها</option>
                                    {availableSymbols.map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </div>
                             <div>
                                <label htmlFor="setupFilter" className="text-sm font-medium">ستاپ معاملاتی</label>
                                <select id="setupFilter" value={setupFilter} onChange={e => handleFilterChange('setup', e.target.value)} className="w-full mt-1 p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 text-sm">
                                    <option value="all">همه ستاپ‌ها</option>
                                     {setups.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                </select>
                            </div>
                        </div>
                    </div>
                     {!performanceData ? (
                        <div className="text-center py-10 text-gray-500">
                            <p>هیچ معامله‌ای برای این فیلترها یافت نشد.</p>
                        </div>
                     ) : (
                        <div className="grid grid-cols-2 gap-4">
                            <StatCard icon={DollarSign} title="سود خالص" value={`$${performanceData.stats.netProfit.toFixed(2)}`} colorClass={performanceData.stats.netProfit >= 0 ? 'text-green-500' : 'text-red-500'} />
                            <StatCard icon={Target} title="فاکتور سود" value={isFinite(performanceData.stats.profitFactor) ? performanceData.stats.profitFactor.toFixed(2) : '∞'} />
                            <StatCard icon={Percent} title="نرخ برد" value={`${performanceData.stats.winRate.toFixed(1)}%`} description={`${(performanceData.stats.winRate / 100 * performanceData.stats.totalTrades).toFixed(0)} از ${performanceData.stats.totalTrades}`} />
                            <StatCard icon={TrendingDown} title="افت سرمایه" value={`${performanceData.stats.maxDrawdown.toFixed(2)}%`} colorClass="text-red-500" />
                             <StatCard icon={TrendingUp} title="میانگین سود" value={`$${performanceData.stats.avgWin.toFixed(2)}`} colorClass="text-green-500" />
                            <StatCard icon={TrendingDown} title="میانگین ضرر" value={`$${performanceData.stats.avgLoss.toFixed(2)}`} colorClass="text-red-500" />
                             <StatCard icon={ChevronsUp} title="بزرگترین برد" value={`$${performanceData.stats.largestWin.toFixed(2)}`} colorClass="text-green-500" />
                            <StatCard icon={ChevronsDown} title="بزرگترین باخت" value={`$${performanceData.stats.largestLoss.toFixed(2)}`} colorClass="text-red-500" />
                        </div>
                    )}
                </aside>
            </div>
        </div>
    );
};

export default PerformanceAnalyticsPage;