import React, { useState, useEffect, useCallback } from 'react';
import type { JournalEntry } from '../../types';
import { getJournalEntries } from '../../db';
import { ArrowUpCircle, ArrowDownCircle, ExternalLink, History, BookOpen, Edit2 } from 'lucide-react';

const SkeletonLoader = () => (
    <tbody className="animate-pulse">
        {[...Array(3)].map((_, i) => (
            <tr key={i} className="border-b dark:border-gray-700">
                <td className="px-4 py-3"><div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-3/4"></div></td>
                <td className="px-4 py-3"><div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-1/2"></div></td>
                <td className="px-4 py-3"><div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-full"></div></td>
                <td className="px-4 py-3"><div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-full"></div></td>
                <td className="px-4 py-3"><div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-3/4"></div></td>
                <td className="px-4 py-3"><div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-1/4"></div></td>
            </tr>
        ))}
    </tbody>
);

type ActiveTab = 'open' | 'history';

interface TradesTableWidgetProps {
    onEditTrade: (entry: JournalEntry) => void;
}

const TradesTableWidget: React.FC<TradesTableWidgetProps> = ({ onEditTrade }) => {
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

    const formatNumber = (value: any, digits: number): string => {
        const num = Number(value);
        if (value === null || value === undefined || isNaN(num)) {
            return '-';
        }
        return num.toFixed(digits);
    };

    return (
        <div className="flex flex-col h-full">
            <div className="flex justify-between items-center mb-3">
                 <div className="flex items-center p-1 rounded-lg bg-gray-100 dark:bg-gray-700/50">
                    <button
                        onClick={() => setActiveTab('open')}
                        className={`flex-1 flex items-center justify-center gap-2 px-4 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                            activeTab === 'open' ? 'bg-white dark:bg-gray-800 shadow text-indigo-500' : 'text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'
                        }`}
                    >
                        <BookOpen size={14} /> پوزیشن‌های باز ({openPositions.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('history')}
                        className={`flex-1 flex items-center justify-center gap-2 px-4 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                            activeTab === 'history' ? 'bg-white dark:bg-gray-800 shadow text-indigo-500' : 'text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'
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
                <table className="w-full text-xs text-right">
                    <thead className="text-[11px] text-gray-500 uppercase bg-gray-50 dark:bg-gray-900/50">
                        <tr>
                            <th scope="col" className="px-3 py-2">نماد</th>
                            <th scope="col" className="px-3 py-2">جهت</th>
                            <th scope="col" className="px-3 py-2">ورود</th>
                            <th scope="col" className="px-3 py-2">خروج</th>
                            <th scope="col" className="px-3 py-2">سود/ضرر</th>
                            <th scope="col" className="px-3 py-2">عملیات</th>
                        </tr>
                    </thead>
                    {loading ? <SkeletonLoader /> : (
                        <tbody>
                            {tradesToShow.length > 0 ? tradesToShow.map(trade => (
                                <tr key={trade.id} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/20">
                                    <td className="px-3 py-2 font-medium">{trade.symbol || '-'}</td>
                                    <td className={`px-3 py-2 flex items-center gap-1.5 ${trade.side === 'Buy' ? 'text-green-500' : 'text-red-500'}`}>
                                        {trade.side === 'Buy' ? <ArrowUpCircle size={14} /> : trade.side === 'Sell' ? <ArrowDownCircle size={14} /> : null}
                                        {trade.side === 'Buy' ? 'خرید' : trade.side === 'Sell' ? 'فروش' : '-'}
                                    </td>
                                    <td className="px-3 py-2 font-mono">{formatNumber(trade.entryPrice, 4)}</td>
                                    <td className="px-3 py-2 font-mono">{formatNumber(trade.exitPrice, 4)}</td>
                                     <td className="px-3 py-2">
                                        {trade.profitOrLoss != null ? (
                                            <span className={`px-2.5 py-1 text-xs font-semibold rounded-full font-mono ${
                                            trade.profitOrLoss >= 0 
                                            ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300' 
                                            : 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300'
                                            }`}>
                                            {trade.profitOrLoss >= 0 ? '+' : ''}${trade.profitOrLoss.toFixed(2)}
                                            </span>
                                        ) : (
                                            <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300">
                                            باز
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-3 py-2">
                                        {activeTab === 'open' && (
                                            <button 
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onEditTrade(trade);
                                                }}
                                                className="p-2 text-gray-500 hover:text-blue-500 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600" 
                                                title="مدیریت معامله"
                                            >
                                                <Edit2 size={14} />
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            )) : (
                                <tr><td colSpan={6} className="text-center py-6 text-gray-500">
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