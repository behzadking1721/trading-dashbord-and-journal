
import React from 'react';
import type { Trade } from '../../types';
import { PlusCircle, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';

const MOCK_TRADES: Trade[] = [
  { id: '1', symbol: 'EURUSD', side: 'Buy', qty: 0.1, entryPrice: 1.0850, exitPrice: 1.0900, stopLoss: 1.0820, takeProfit: 1.0920, resultPnL: 50, date: '2023-10-27' },
  { id: '2', symbol: 'GBPUSD', side: 'Sell', qty: 0.05, entryPrice: 1.2200, exitPrice: 1.2150, stopLoss: 1.2230, takeProfit: 1.2100, resultPnL: 25, date: '2023-10-27' },
  { id: '3', symbol: 'USDJPY', side: 'Buy', qty: 0.2, entryPrice: 150.00, exitPrice: 149.80, stopLoss: 149.70, takeProfit: 150.50, resultPnL: -40, date: '2023-10-26' },
];

const TradesTableWidget: React.FC = () => {
  return (
    <div className="flex flex-col h-full">
        <div className="flex justify-end mb-2">
            <button className="flex items-center gap-2 px-3 py-1.5 text-xs bg-indigo-500 text-white rounded-md hover:bg-indigo-600">
                <PlusCircle size={16} />
                ثبت معامله جدید
            </button>
        </div>
      <div className="overflow-x-auto flex-grow">
        <table className="w-full text-sm text-right">
          <thead className="text-xs text-gray-500 uppercase bg-gray-50 dark:bg-gray-700">
            <tr>
              <th scope="col" className="px-4 py-2">نماد</th>
              <th scope="col" className="px-4 py-2">جهت</th>
              <th scope="col" className="px-4 py-2">حجم</th>
              <th scope="col" className="px-4 py-2">ورود</th>
              <th scope="col" className="px-4 py-2">خروج</th>
              <th scope="col" className="px-4 py-2">سود/ضرر</th>
            </tr>
          </thead>
          <tbody>
            {MOCK_TRADES.map(trade => (
              <tr key={trade.id} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600/50">
                <td className="px-4 py-2 font-medium">{trade.symbol}</td>
                <td className={`px-4 py-2 flex items-center gap-1 ${trade.side === 'Buy' ? 'text-green-500' : 'text-red-500'}`}>
                    {trade.side === 'Buy' ? <ArrowUpCircle size={14} /> : <ArrowDownCircle size={14} />}
                    {trade.side === 'Buy' ? 'خرید' : 'فروش'}
                </td>
                <td className="px-4 py-2">{trade.qty}</td>
                <td className="px-4 py-2">{trade.entryPrice.toFixed(4)}</td>
                <td className="px-4 py-2">{trade.exitPrice?.toFixed(4)}</td>
                <td className={`px-4 py-2 font-bold ${trade.resultPnL >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  ${trade.resultPnL.toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TradesTableWidget;
