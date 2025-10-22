
import React from 'react';
import { Wallet } from 'lucide-react';

const WalletOverviewWidget: React.FC = () => {
  return (
    <div className="space-y-2 text-sm">
        <div className="flex justify-between items-center">
            <span className="text-gray-500 dark:text-gray-400">موجودی (Balance)</span>
            <span className="font-mono font-semibold">$10,000</span>
        </div>
        <div className="flex justify-between items-center">
            <span className="text-gray-500 dark:text-gray-400">سرمایه (Equity)</span>
            <span className="font-mono font-semibold">$9,925</span>
        </div>
        <div className="flex justify-between items-center">
            <span className="text-gray-500 dark:text-gray-400">مارجین آزاد</span>
            <span className="font-mono font-semibold">$9,500</span>
        </div>
    </div>
  );
};

export default WalletOverviewWidget;
