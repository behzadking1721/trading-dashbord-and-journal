import React, { useState, useEffect, useCallback } from 'react';
import type { JournalEntry } from '../../types';
import { getJournalEntries } from '../../db';
import { ArrowUpCircle, ArrowDownCircle, ExternalLink, History, BookOpen } from 'lucide-react';

const SkeletonLoader = () => (
    <tbody className="animate-pulse">
        {[...Array(3)].map((_, i) => (
            <tr key={i} className="border-b dark:border-gray-700">
                <td className="px-4 py-2.5"><div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-3/4"></div></td>
                <td className="px-4 py-2.5"><div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-1/2"></div></td>
                <td className="px-4 py-2.5"><div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-full"></div></td>
                <td className="px-4 py-2.5"><div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-full"></div></td>
                <td className="px-4 py-2.5"><div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-3/4"></div></td>
            </tr>
        ))}
    </tbody>
);

type ActiveTab = 'open' | 'history';

const TradesTableWidget: React.FC = () => {
    const [allTrades, setAllTrades] = useState<JournalEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<ActiveTab>('open');

    const fetchTrades = useCallback(async () => {
        setLoading(true);
        try {
            const entries = await getJournalEntries();
            setAllTrades(entries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
        } catch (error) {
            console.error("Failed to fetch trades for widget:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        window.addEventListener('journalUpdated', fetchTrades);
        fetchTrades();
        return () => window.removeEventListener('journalUpdated', fetchTrades);
    }, [fetchTrades]);

    const openPositions = allTrades.filter(trade => !trade.status);
    const closedTrades = allTrades.filter(trade => !!trade.status).slice(0, 5);
    const tradesToShow = activeTab === 'open' ? openPositions : closedTrades;

    const formatNumber = (value: any, digits: number, prefix = ''): string => {
        const num = Number(value);
        if (value === null || value === undefined || isNaN(num)) {
            return '-';
        }
        return `${prefix}${num.toFixed(digits)}`;
    };

    return (
        <div className="flex flex-col h-full">
            <div className="flex justify-between items-center mb-2">
                <div className="flex items-center border-b border-gray-200 dark:border-gray-700">
                    <button
                        onClick={() => setActiveTab('open')}
                        className={`flex items-center gap-2 px-3 py-2 text-sm font-semibold transition-colors ${
                            activeTab === 'open' ? 'border-b-2 border-indigo-500 text-indigo-500' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                        }`}
                    >
                        <BookOpen size={14} /> پوزیشن‌های باز ({openPositions.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('history')}
                        className={`flex items-center gap-2 px-3 py-2 text-sm font-semibold transition-colors ${
                            activeTab === 'history' ? 'border-b-2 border-indigo-500 text-indigo-500' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                        }`}
                    >
                        <History size={14} /> تاریخچه (۵ اخیر)
                    </button>
                </div>
                 <a href="#/journal" className="flex items-center gap-2 text-xs text-indigo-500 hover:underline">
                    <ExternalLink size={14}/>
                    مشاهده همه
                </a>
            </div>
            <div className="overflow-x-auto flex-grow">
                <table className="w-full text-sm text-right">
                    <thead className="text-xs text-gray-500 uppercase bg-gray-50 dark:bg-gray-700">
                        <tr>
                            <th scope="col" className="px-4 py-2">نماد</th>
                            <th scope="col" className="px-4 py-2">جهت</th>
                            <th scope="col" className="px-4 py-2">ورود</th>
                            <th scope="col" className="px-4 py-2">خروج</th>
                            <th scope="col" className="px-4 py-2">سود/ضرر</th>
                        </tr>
                    </thead>
                    {loading ? <SkeletonLoader /> : (
                        <tbody>
                            {tradesToShow.length > 0 ? tradesToShow.map(trade => (
                                <tr key={trade.id} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600/50">
                                    <td className="px-4 py-1.5 font-medium">{trade.symbol || '-'}</td>
                                    <td className={`px-4 py-1.5 flex items-center gap-1 ${trade.side === 'Buy' ? 'text-green-500' : 'text-red-500'}`}>
                                        {trade.side === 'Buy' ? <ArrowUpCircle size={14} /> : trade.side === 'Sell' ? <ArrowDownCircle size={14} /> : null}
                                        {trade.side === 'Buy' ? 'خرید' : trade.side === 'Sell' ? 'فروش' : '-'}
                                    </td>
                                    <td className="px-4 py-1.5 font-mono">{formatNumber(trade.entryPrice, 4)}</td>
                                    <td className="px-4 py-1.5 font-mono">{formatNumber(trade.exitPrice, 4)}</td>
                                    <td className={`px-4 py-1.5 font-bold font-mono ${trade.profitOrLoss == null ? '' : trade.profitOrLoss >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                        {trade.profitOrLoss != null ? formatNumber(trade.profitOrLoss, 2, '$') : <span className="text-xs text-blue-500">باز</span>}
                                    </td>
                                </tr>
                            )) : (
                                <tr><td colSpan={5} className="text-center py-4 text-gray-500">
                                    {activeTab === 'open' ? 'هیچ پوزیشن بازی وجود ندارد.' : 'هیچ معامله بسته‌شده‌ای یافت نشد.'}
                                </td></tr>
                            )}
                        </tbody>
                    )}
                </table>
            </div>
        </div>
    );
};

export default TradesTableWidget;