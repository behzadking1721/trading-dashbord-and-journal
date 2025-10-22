
import React from 'react';
import { ShieldAlert, PieChart } from 'lucide-react';

const ProgressBar: React.FC<{ value: number }> = ({ value }) => {
    let color = 'bg-green-500';
    if (value > 50 && value <= 90) color = 'bg-yellow-500';
    if (value > 90) color = 'bg-red-500';

    return (
        <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
            <div className={`${color} h-2.5 rounded-full`} style={{ width: `${value}%` }}></div>
        </div>
    );
};


const RiskManagementWidget: React.FC = () => {
    const totalRiskPercent = 2.5; // Example: 2.5% of total equity at risk
    const maxAllowedRisk = 6; // Max 6%
    const riskLevel = (totalRiskPercent / maxAllowedRisk) * 100;

  return (
    <div className="space-y-6">
        <div>
            <div className="flex justify-between items-center mb-1">
                <h4 className="text-sm font-semibold">مجموع ریسک فعال</h4>
                <span className="text-lg font-bold text-yellow-500">{totalRiskPercent.toFixed(1)}%</span>
            </div>
            <ProgressBar value={riskLevel} />
            <p className="text-xs text-gray-500 mt-1">حد مجاز ریسک کلی: {maxAllowedRisk}%</p>
        </div>
        
        <div>
            <h4 className="text-sm font-semibold mb-3">توزیع ریسک بین نمادها</h4>
            <div className="flex items-center justify-center text-gray-400">
                <PieChart className="w-24 h-24" />
                <div className="space-y-2 text-xs">
                    <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-blue-500"></span> EURUSD (40%)</div>
                    <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-green-500"></span> GBPUSD (25%)</div>
                    <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-red-500"></span> USDJPY (35%)</div>
                </div>
            </div>
        </div>
    </div>
  );
};

export default RiskManagementWidget;
