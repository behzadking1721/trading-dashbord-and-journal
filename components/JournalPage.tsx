import React, { useState, useEffect, useCallback, lazy, Suspense, useMemo } from 'react';
import type { JournalEntry, TradingSetup } from '../types';
import { getJournalEntries, deleteJournalEntry } from '../db';
import { Plus, Edit2, Trash2, Sparkles, RefreshCw, BookOpen, Search, DollarSign, Percent, BarChart2, Target, TrendingUp, TrendingDown, Star } from 'lucide-react';

const AIAnalysisModal = lazy(() => import('./AIAnalysisModal'));
const JournalFormModal = lazy(() => import('./journal/JournalFormModal'));


const SummaryCard: React.FC<{ title: string; value: string | number; icon: React.ElementType; colorClass?: string; isLoading: boolean; }> = ({ title, value, icon: Icon, colorClass = 'text-gray-800 dark:text-gray-200', isLoading }) => {
  if (isLoading) {
    return (
      <div className="p-4 rounded-lg shadow-md bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border border-gray-200 dark:border-gray-700 animate-pulse">
        <div className="h-5 bg-gray-300 dark:bg-gray-600 rounded w-3/4 mb-2"></div>
        <div className="h-8 bg-gray-300 dark:bg-gray-600 rounded w-1/2"></div>
      </div>
    );
  }
  return (
    <div className="p-4 rounded-lg shadow-md bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
            <Icon className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            <h3 className="font-semibold text-sm text-gray-500 dark:text-gray-400">{title}</h3>
        </div>
        <p className={`text-2xl font-bold mt-2 ${colorClass}`}>{value}</p>
    </div>
  );
};

const initialFilters = { symbol: '', side: 'all', status: 'all', setupId: 'all', time: 'all' };

const StarDisplay: React.FC<{ rating?: number }> = ({ rating = 0 }) => (
    <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map(i => (
            <Star key={i} size={16} className={i <= rating ? 'text-yellow-400' : 'text-gray-300 dark:text-gray-600'} fill={i <= rating ? 'currentColor' : 'none'} />
        ))}
    </div>
);


const JournalPage: React.FC = () => {
    const [entries, setEntries] = useState<JournalEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isAnalysisModalOpen, setIsAnalysisModalOpen] = useState(false);
    const [editingEntry, setEditingEntry] = useState<JournalEntry | null>(null);
    const [filters, setFilters] = useState(initialFilters);
    const [setups, setSetups] = useState<TradingSetup[]>([]);

    const loadEntries = useCallback(async () => {
        setLoading(true);
        try {
            const storedEntries = await getJournalEntries();
            setEntries(storedEntries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));

            const savedSetups = localStorage.getItem('trading-setups');
            if (savedSetups) setSetups(JSON.parse(savedSetups));

        } catch (e) {
            console.error("Failed to load journal data:", e);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadEntries();
    }, [loadEntries]);

    const summaryStats = useMemo(() => {
        const closedTrades = entries.filter(e => e.status);
        if (closedTrades.length === 0) return { totalPnl: 0, winRate: 0, totalTrades: 0, avgRR: 0 };

        const totalPnl = closedTrades.reduce((acc, e) => acc + (e.profitOrLoss || 0), 0);
        const wins = closedTrades.filter(e => e.status === 'Win').length;
        const winRate = (wins / closedTrades.length) * 100;

        const tradesWithRR = closedTrades.filter(e => e.riskRewardRatio != null && e.riskRewardRatio > 0);
        const totalRR = tradesWithRR.reduce((acc, e) => acc + e.riskRewardRatio!, 0);
        const avgRR = tradesWithRR.length > 0 ? totalRR / tradesWithRR.length : 0;

        return { totalPnl, winRate, totalTrades: entries.length, avgRR };
    }, [entries]);

    const filteredEntries = useMemo(() => {
        return entries.filter(entry => {
            const symbolMatch = !filters.symbol || entry.symbol?.toLowerCase().includes(filters.symbol.toLowerCase());
            const sideMatch = filters.side === 'all' || entry.side === filters.side;
            const statusMatch = filters.status === 'all' || entry.status === filters.status || (filters.status === 'Open' && !entry.status);
            const setupMatch = filters.setupId === 'all' || entry.setupId === filters.setupId;
            
            let timeMatch = true;
            if (filters.time !== 'all') {
                const now = new Date();
                const entryDate = new Date(entry.date);
                const days = { '7d': 7, '30d': 30, '90d': 90 }[filters.time as '7d' | '30d' | '90d'];
                if (days) {
                    const filterDate = new Date(new Date().setDate(now.getDate() - days));
                    timeMatch = entryDate >= filterDate;
                }
            }

            return symbolMatch && sideMatch && statusMatch && setupMatch && timeMatch;
        });
    }, [entries, filters]);
    
    const handleResetFilters = () => {
        setFilters(initialFilters);
    };

    const handleOpenModal = (entry: JournalEntry | null = null) => {
        setEditingEntry(entry);
        setIsModalOpen(true);
    }

    const handleDelete = async (id: string) => {
        if (window.confirm('آیا از حذف این آیتم مطمئن هستید؟')) {
            try {
                await deleteJournalEntry(id);
                await loadEntries(); 
            } catch (e) {
                console.error("Failed to delete journal entry:", e);
                alert("خطا در حذف معامله. لطفا دوباره تلاش کنید.");
            }
        }
    };
    
    const handleSave = async () => {
        await loadEntries();
    };
    
    const renderStatusBadge = (status?: 'Win' | 'Loss' | 'Breakeven') => {
        if (!status) return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">باز</span>;
        switch (status) {
            case 'Win': return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">برد</span>;
            case 'Loss': return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300">باخت</span>;
            case 'Breakeven': return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-300">سر به سر</span>;
            default: return null;
        }
    };
    
    return (
        <div className="p-6 h-full flex flex-col">
            <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold">ژورنال معاملات</h1>
                    <p className="text-gray-500 dark:text-gray-400">تمام معاملات خود را با جزئیات ثبت و تحلیل کنید.</p>
                </div>
                <div className="flex items-center gap-2">
                     <button onClick={() => setIsAnalysisModalOpen(true)} className="flex items-center gap-2 bg-teal-500 text-white px-4 py-2 rounded-lg shadow-md hover:bg-teal-600 transition-colors">
                        <Sparkles size={18} />
                        <span>تحلیل با هوش مصنوعی</span>
                    </button>
                    <button onClick={() => handleOpenModal()} className="flex items-center gap-2 bg-indigo-500 text-white px-4 py-2 rounded-lg shadow-md hover:bg-indigo-600 transition-colors">
                        <Plus size={18} />
                        <span>ثبت معامله جدید</span>
                    </button>
                </div>
            </header>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <SummaryCard title="سود/ضرر خالص" value={`$${summaryStats.totalPnl.toFixed(2)}`} icon={DollarSign} colorClass={summaryStats.totalPnl >= 0 ? 'text-green-500' : 'text-red-500'} isLoading={loading} />
                <SummaryCard title="نرخ برد" value={`${summaryStats.winRate.toFixed(1)}%`} icon={Percent} isLoading={loading} />
                <SummaryCard title="تعداد کل معاملات" value={summaryStats.totalTrades} icon={BarChart2} isLoading={loading} />
                <SummaryCard title="R/R متوسط" value={summaryStats.avgRR.toFixed(2)} icon={Target} isLoading={loading} />
            </div>

             <div className="p-4 rounded-lg bg-gray-100/50 dark:bg-gray-800/20 mb-6 space-y-4">
                <div className="flex justify-between items-center">
                    <h3 className="font-bold text-md">فیلترها و جستجو</h3>
                    <button onClick={handleResetFilters} className="text-xs text-indigo-500 hover:underline">پاک کردن فیلترها</button>
                </div>
                <div className="flex flex-wrap items-center gap-4 text-sm">
                    <div className="relative">
                        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                        <input type="text" placeholder="جستجوی نماد..." value={filters.symbol} onChange={e => setFilters(f => ({ ...f, symbol: e.target.value }))} className="p-2 pr-10 border rounded-md dark:bg-gray-700 dark:border-gray-600" />
                    </div>
                    <select value={filters.side} onChange={e => setFilters(f => ({ ...f, side: e.target.value }))} className="p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"><option value="all">همه جهت‌ها</option><option value="Buy">خرید</option><option value="Sell">فروش</option></select>
                    <select value={filters.status} onChange={e => setFilters(f => ({ ...f, status: e.target.value }))} className="p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"><option value="all">همه وضعیت‌ها</option><option value="Open">باز</option><option value="Win">برد</option><option value="Loss">باخت</option><option value="Breakeven">سر به سر</option></select>
                    <select value={filters.setupId} onChange={e => setFilters(f => ({ ...f, setupId: e.target.value }))} className="p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"><option value="all">همه ستاپ‌ها</option>{setups.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select>
                    <select value={filters.time} onChange={e => setFilters(f => ({ ...f, time: e.target.value }))} className="p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"><option value="all">همه زمان‌ها</option><option value="7d">۷ روز اخیر</option><option value="30d">۳۰ روز اخیر</option><option value="90d">۹۰ روز اخیر</option></select>
                </div>
            </div>


            <div className="flex-grow overflow-auto rounded-lg shadow-md border border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[1024px] text-sm text-right">
                        <thead className="text-xs text-gray-500 uppercase bg-gray-50 dark:bg-gray-700/50">
                            <tr>
                                <th className="px-4 py-3">تاریخ</th>
                                <th className="px-4 py-3">نماد</th>
                                <th className="px-4 py-3">جهت</th>
                                <th className="px-4 py-3">وضعیت</th>
                                <th className="px-4 py-3">ستاپ</th>
                                <th className="px-4 py-3">امتیاز</th>
                                <th className="px-4 py-3">R/R</th>
                                <th className="px-4 py-3">سود/ضرر</th>
                                <th className="px-4 py-3">عملیات</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {loading ? (
                                <tr><td colSpan={9} className="text-center py-10"><RefreshCw className="w-8 h-8 animate-spin text-indigo-500 mx-auto" /></td></tr>
                            ) : filteredEntries.length > 0 ? filteredEntries.map(entry => (
                                <tr key={entry.id} className="hover:bg-gray-100/50 dark:hover:bg-gray-700/50 cursor-pointer" onClick={() => handleOpenModal(entry)}>
                                    <td className="px-4 py-3 font-mono">{new Date(entry.date).toLocaleDateString('fa-IR')}</td>
                                    <td className="px-4 py-3 font-semibold">{entry.symbol?.toUpperCase() || '-'}</td>
                                    <td className={`px-4 py-3 flex items-center gap-2 ${entry.side === 'Buy' ? 'text-green-500' : entry.side === 'Sell' ? 'text-red-500' : ''}`}>
                                        {entry.side === 'Buy' ? <TrendingUp size={16} /> : entry.side === 'Sell' ? <TrendingDown size={16} /> : null}
                                        {entry.side === 'Buy' ? 'خرید' : entry.side === 'Sell' ? 'فروش' : '-'}
                                    </td>
                                    <td className="px-4 py-3">{renderStatusBadge(entry.status)}</td>
                                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{entry.setupName || '-'}</td>
                                    <td className="px-4 py-3">
                                        <StarDisplay rating={entry.setupRating} />
                                    </td>
                                    <td className="px-4 py-3 font-mono">{entry.riskRewardRatio?.toFixed(2) || '-'}</td>
                                    <td className={`px-4 py-3 font-mono font-bold`}>
                                        <span className={`px-2 py-1 rounded-full text-xs ${entry.profitOrLoss == null ? 'text-blue-800 dark:text-blue-300 bg-blue-100 dark:bg-blue-900' : entry.profitOrLoss >= 0 ? 'text-green-800 dark:text-green-300 bg-green-100 dark:bg-green-900' : 'text-red-800 dark:text-red-300 bg-red-100 dark:bg-red-900'}`}>
                                            {entry.profitOrLoss != null ? `$${entry.profitOrLoss.toFixed(2)}` : 'باز'}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                                        <div className="flex items-center gap-1">
                                            <button onClick={() => handleOpenModal(entry)} className="p-2 text-gray-500 hover:text-blue-500 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600" title="ویرایش">
                                                <Edit2 size={16} />
                                            </button>
                                            <button onClick={() => handleDelete(entry.id)} className="p-2 text-gray-500 hover:text-red-500 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600" title="حذف">
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={9} className="text-center py-16">
                                        <BookOpen className="mx-auto h-12 w-12 text-gray-400" />
                                        <h3 className="mt-2 text-sm font-semibold text-gray-900 dark:text-white">
                                            {entries.length === 0 ? 'ژورنال شما خالی است' : 'موردی یافت نشد'}
                                        </h3>
                                        <p className="mt-1 text-sm text-gray-500">
                                            {entries.length === 0 ? 'برای شروع، اولین معامله خود را ثبت کنید.' : 'فیلترهای خود را تغییر دهید یا آن‌ها را پاک کنید.'}
                                        </p>
                                        {entries.length === 0 && !loading && (
                                            <div className="mt-6">
                                                <button onClick={() => handleOpenModal()} className="inline-flex items-center gap-2 bg-indigo-500 text-white px-4 py-2 rounded-lg shadow-md hover:bg-indigo-600 transition-colors text-sm">
                                                    <Plus size={16} />
                                                    <span>ثبت معامله جدید</span>
                                                </button>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {isModalOpen && (
                <Suspense fallback={null}>
                    <JournalFormModal key={editingEntry?.id || 'new'} onClose={() => setIsModalOpen(false)} onSave={handleSave} entry={editingEntry} />
                </Suspense>
            )}

            {isAnalysisModalOpen && (
                 <Suspense fallback={
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                         <RefreshCw className="w-10 h-10 animate-spin text-white" />
                    </div>
                 }>
                    <AIAnalysisModal 
                        isOpen={isAnalysisModalOpen} 
                        onClose={() => setIsAnalysisModalOpen(false)} 
                        entries={entries} 
                    />
                </Suspense>
            )}
        </div>
    );
};

export default JournalPage;