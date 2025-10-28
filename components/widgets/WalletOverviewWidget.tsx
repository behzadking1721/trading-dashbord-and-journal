import React, { useState, useEffect } from 'react';
import { getJournalEntries } from '../../db';

const SkeletonLoader = () => (
    <div className="animate-pulse space-y-3">
        {[...Array(2)].map((_, i) => (
            <div key={i} className="flex justify-between items-center">
                <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-2/5"></div>
                <div className="h-5 bg-gray-300 dark:bg-gray-600 rounded w-1/3"></div>
            </div>
        ))}
         <div className="h-2.5 bg-gray-300 dark:bg-gray-600 rounded-full w-full mt-4"></div>
    </div>
);


const WalletOverviewWidget: React.FC = () => {
    const [balance, setBalance] = useState(0);
    const [equity, setEquity] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const updateWallet = async () => {
            setLoading(true);
            try {
                const savedBalance = localStorage.getItem('accountBalance') || '10000';
                const currentBalance = parseFloat(savedBalance);
                setBalance(currentBalance);

                const entries = await getJournalEntries();
                const totalPnl = entries.reduce((acc, entry) => acc + Number(entry.profitOrLoss || 0), 0);
                setEquity(currentBalance + totalPnl);
            } catch (error) {
                console.error("Failed to update wallet overview:", error);
                const fallbackBalance = 10000;
                setBalance(fallbackBalance);
                setEquity(fallbackBalance);
            } finally {
                setLoading(false);
            }
        };

        const handleStorageChange = (event: StorageEvent) => {
            if (event.key === 'accountBalance') {
                updateWallet();
            }
        };

        window.addEventListener('storage', handleStorageChange);
        window.addEventListener('journalUpdated', updateWallet);
        
        updateWallet();

        return () => {
             window.removeEventListener('storage', handleStorageChange);
             window.removeEventListener('journalUpdated', updateWallet);
        }
    }, []);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);
    }
    
    const equityToBalanceRatio = balance > 0 ? (equity / balance) * 100 : 0;
    const pnlPercent = balance > 0 ? ((equity / balance) - 1) * 100 : 0;

  return (
    <div className="space-y-3 text-sm h-full flex flex-col justify-around">
        {loading ? <SkeletonLoader /> : (
            <>
                 <div className="flex justify-between items-center">
                    <span className="text-gray-500 dark:text-gray-400">موجودی اولیه</span>
                    <span className="font-mono font-semibold">{formatCurrency(balance)}</span>
                </div>
                <div className="flex justify-between items-center">
                    <span className="text-gray-500 dark:text-gray-400">سرمایه فعلی</span>
                    <span className={`font-mono font-bold text-lg ${equity >= balance ? 'text-green-500' : 'text-red-500'}`}>{formatCurrency(equity)}</span>
                </div>
                 <div className="pt-2">
                    <div className="relative w-full h-2.5 bg-gray-200 dark:bg-gray-700 rounded-full" title={`موجودی اولیه: ${formatCurrency(balance)}`}>
                        <div 
                            className={`h-2.5 rounded-full ${equity >= balance ? 'bg-green-500' : 'bg-red-500'}`}
                            style={{ width: `${Math.min(equityToBalanceRatio, 100)}%` }}
                            title={`سرمایه فعلی: ${formatCurrency(equity)}`}>
                        </div>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-1.5">
                        <span className={`font-bold ${equity >= balance ? 'text-green-500' : 'text-red-500'}`}>{pnlPercent.toFixed(2)}%</span>
                        {equity >= balance ? ' سود' : ' ضرر'}
                    </p>
                </div>
            </>
        )}
    </div>
  );
};

export default WalletOverviewWidget;