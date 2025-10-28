import React, { useState, useEffect } from 'react';
import type { JournalEntry } from '../../types';
import { getLatestJournalEntries } from '../../db';
import { PlusCircle, ArrowUpCircle, ArrowDownCircle, ExternalLink } from 'lucide-react';

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


const TradesTableWidget: React.FC = () => {
  const [trades, setTrades] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTrades = async () => {
      setLoading(true);
      try {
        const latestTrades = await getLatestJournalEntries(5);
        setTrades(latestTrades);
      } catch (error) {
        console.error("Failed to fetch latest trades for widget:", error);
      } finally {
        setLoading(false);
      }
    };
    window.addEventListener('journalUpdated', fetchTrades);
    fetchTrades();
    return () => window.removeEventListener('journalUpdated', fetchTrades);
  }, []);

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
            <a href="#/journal" className="flex items-center gap-2 text-xs text-indigo-500 hover:underline">
                <ExternalLink size={14}/>
                مشاهده همه
            </a>
            <a href="#/journal" className="flex items-center gap-2 px-3 py-1.5 text-xs bg-indigo-500 text-white rounded-md hover:bg-indigo-600">
                <PlusCircle size={16} />
                ثبت معامله جدید
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
              {trades.length > 0 ? trades.map(trade => (
                <tr key={trade.id} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600/50">
                  <td className="px-4 py-2 font-medium">{trade.symbol || '-'}</td>
                  <td className={`px-4 py-2 flex items-center gap-1 ${trade.side === 'Buy' ? 'text-green-500' : 'text-red-500'}`}>
                      {trade.side === 'Buy' ? <ArrowUpCircle size={14} /> : trade.side === 'Sell' ? <ArrowDownCircle size={14} /> : null}
                      {trade.side === 'Buy' ? 'خرید' : trade.side === 'Sell' ? 'فروش' : '-'}
                  </td>
                  <td className="px-4 py-2 font-mono">{formatNumber(trade.entryPrice, 4)}</td>
                  <td className="px-4 py-2 font-mono">{formatNumber(trade.exitPrice, 4)}</td>
                  <td className={`px-4 py-2 font-bold font-mono ${trade.profitOrLoss == null ? '' : trade.profitOrLoss >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {trade.profitOrLoss != null ? formatNumber(trade.profitOrLoss, 2, '$') : <span className="text-xs text-blue-500">باز</span>}
                  </td>
                </tr>
              )) : (
                  <tr><td colSpan={5} className="text-center py-4 text-gray-500">هیچ معامله‌ای یافت نشد.</td></tr>
              )}
            </tbody>
          )}
        </table>
      </div>
    </div>
  );
};

export default TradesTableWidget;