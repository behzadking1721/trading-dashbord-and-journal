import React, { useState, useEffect } from 'react';
import { getJournalEntries } from '../../db';
import { Wallet } from 'lucide-react';

const WalletOverviewWidget: React.FC = () => {
    const [balance, setBalance] = useState(0);
    const [equity, setEquity] = useState(0);

    useEffect(() => {
        const updateWallet = async () => {
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
    <div className="space-y-3 text-sm">
        <div className="flex justify-between items-center">
            <span className="text-gray-500 dark:text-gray-400 flex items-center gap-2"><Wallet size={14}/> موجودی (Balance)</span>
            <span className="font-mono font-semibold">{formatCurrency(balance)}</span>
        </div>
        <div className="flex justify-between items-center">
            <span className="text-gray-500 dark:text-gray-400 flex items-center gap-2"><Wallet size={14}/> سرمایه (Equity)</span>
            <span className="font-mono font-semibold">{formatCurrency(equity)}</span>
        </div>
        <div className="flex justify-between items-center">
            <span className="text-gray-500 dark:text-gray-400 flex items-center gap-2"><Wallet size={14}/> مارجین آزاد</span>
            <span className="font-mono font-semibold">{formatCurrency(equity * 0.95)}</span>
        </div>
    </div>
  );
};

export default WalletOverviewWidget;