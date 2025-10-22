import React, { useState, useEffect } from 'react';
import { ShieldAlert, PieChart } from 'lucide-react';
import { getLatestJournalEntries } from '../../db';
import type { JournalEntry } from '../../types';

const ProgressBar: React.FC<{ value: number }> = ({ value }) => {
    let color = 'bg-green-500';
    if (value > 50 && value <= 90) color = 'bg-yellow-500';
    if (value > 90) color = 'bg-red-500';

    return (
        <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
            <div className={`${color} h-2.5 rounded-full transition-all duration-500`} style={{ width: `${value}%` }}></div>
        </div>
    );
};


const RiskManagementWidget: React.FC = () => {
    const totalRiskPercent = 2.5; // Example: 2.5% of total equity at risk
    const maxAllowedRisk = 6; // Max 6%
    const riskLevel = (totalRiskPercent / maxAllowedRisk) * 100;
    
    const [distribution, setDistribution] = useState<{name: string, value: number, color: string}[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSymbolData = async () => {
            setLoading(true);
            try {
                const entries = await getLatestJournalEntries(10);
                if (entries.length === 0) {
                    setDistribution([]);
                    return;
                };

                const counts = entries.reduce((acc, entry) => {
                    const symbol = entry.symbol.toUpperCase();
                    acc[symbol] = (acc[symbol] || 0) + 1;
                    return acc;
                }, {} as { [key: string]: number });
                
                const colors = ['#3b82f6', '#22c55e', '#ef4444', '#f97316', '#8b5cf6'];
                const distData = Object.entries(counts).map(([symbol, count], index) => ({
                    name: symbol,
                    value: (count / entries.length) * 100,
                    color: colors[index % colors.length]
                }));
                setDistribution(distData);

            } catch (error) {
                console.error("Failed to fetch symbol distribution data", error);
            } finally {
                setLoading(false);
            }
        };
        
        window.addEventListener('journalUpdated', fetchSymbolData);
        fetchSymbolData();
        
        return () => {
            window.removeEventListener('journalUpdated', fetchSymbolData);
        }
    }, []);

  return (
    <div className="space-y-6">
        <div>
            <div className="flex justify-between items-center mb-1">
                <h4 className="text-sm font-semibold flex items-center gap-2">
                    <ShieldAlert size={16} className="text-yellow-500"/>
                    مجموع ریسک فعال
                </h4>
                <span className="text-lg font-bold text-yellow-500">{totalRiskPercent.toFixed(1)}%</span>
            </div>
            <ProgressBar value={riskLevel} />
            <p className="text-xs text-gray-500 mt-1">حد مجاز ریسک کلی: {maxAllowedRisk}%</p>
        </div>
        
        <div>
            <h4 className="text-sm font-semibold mb-3">توزیع نمادها (۱۰ معامله اخیر)</h4>
            {loading ? (
                 <div className="flex items-center justify-center h-24">
                    <div className="animate-pulse flex space-x-4">
                        <div className="rounded-full bg-gray-300 dark:bg-gray-600 h-12 w-12"></div>
                        <div className="flex-1 space-y-3 py-1">
                            <div className="h-2 bg-gray-300 dark:bg-gray-600 rounded"></div>
                            <div className="h-2 bg-gray-300 dark:bg-gray-600 rounded"></div>
                            <div className="h-2 bg-gray-300 dark:bg-gray-600 rounded"></div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="flex items-center justify-center text-gray-400">
                    <PieChart className="w-24 h-24 min-w-24" />
                     <div className="space-y-2 text-xs w-full">
                        {distribution.length > 0 ? distribution.map(item => (
                             <div key={item.name} className="flex items-center gap-2">
                                <span className="w-3 h-3 rounded-full" style={{backgroundColor: item.color}}></span> 
                                {item.name} ({item.value.toFixed(0)}%)
                             </div>
                        )) : <p className="text-xs text-center">داده‌ای برای نمایش وجود ندارد.</p>}
                    </div>
                </div>
            )}
        </div>
    </div>
  );
};

export default RiskManagementWidget;