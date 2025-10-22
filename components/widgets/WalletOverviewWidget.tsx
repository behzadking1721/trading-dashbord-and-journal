import React, { useState, useEffect } from 'react';
import { getJournalEntries } from '../../db';

const SkeletonLoader = () => (
    <div className="animate-pulse space-y-4">
        {[...Array(3)].map((_, i) => (
            <div key={i} className="flex justify-between items-center">
                <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-2/5"></div>
                <div className="h-5 bg-gray-300 dark:bg-gray-600 rounded w-1/3"></div>
            </div>
        ))}
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
                const totalPnl = entries.reduce((acc, entry) => acc + entry.profitOrLoss, 0);
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
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
    }

  return (
    <div className="space-y-3 text-sm h-full flex flex-col justify-center">
        {loading ? <SkeletonLoader /> : (
            <>
                 <div className="flex justify-between items-center">
                    <span className="text-gray-500 dark:text-gray-400">موجودی (Balance)</span>
                    <span className="font-mono font-semibold">{formatCurrency(balance)}</span>
                </div>
                <div className="flex justify-between items-center">
                    <span className="text-gray-500 dark:text-gray-400">سرمایه (Equity)</span>
                    <span className="font-mono font-semibold">{formatCurrency(equity)}</span>
                </div>
                <div className="flex justify-between items-center">
                    <span className="text-gray-500 dark:text-gray-400">مارجین آزاد</span>
                    <span className="font-mono font-semibold">{formatCurrency(equity * 0.95)}</span>
                </div>
            </>
        )}
    </div>
  );
};

export default WalletOverviewWidget;
