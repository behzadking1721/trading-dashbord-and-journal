import React, { useState, useEffect, useMemo } from 'react';
import type { RiskSettings } from '../../types';

const STORAGE_KEY_RISK_SETTINGS = 'risk-management-settings';

const PositionSizeCalculatorWidget: React.FC = () => {
    const [riskSettings, setRiskSettings] = useState<RiskSettings | null>(null);
    const [entryPrice, setEntryPrice] = useState('');
    const [stopLoss, setStopLoss] = useState('');

    useEffect(() => {
        const loadSettings = () => {
            try {
                const saved = localStorage.getItem(STORAGE_KEY_RISK_SETTINGS);
                if (saved) {
                    setRiskSettings(JSON.parse(saved));
                } else {
                    // Default settings if not found
                    setRiskSettings({
                        accountBalance: 10000,
                        strategy: 'fixed_percent',
                        fixedPercent: { risk: 1 },
                        antiMartingale: { baseRisk: 1, increment: 0.5, maxRisk: 4 }
                    });
                }
            } catch (e) { console.error("Failed to load risk settings for calculator", e); }
        };
        
        loadSettings();
        window.addEventListener('storage', loadSettings);
        return () => window.removeEventListener('storage', loadSettings);
    }, []);

    const calculatedSize = useMemo(() => {
        if (!riskSettings) return null;

        const riskPercent = riskSettings.strategy === 'fixed_percent' 
            ? riskSettings.fixedPercent.risk 
            : riskSettings.antiMartingale.baseRisk; // Note: This simplified for now, not using win-streak
        
        const balance = riskSettings.accountBalance;
        const entry = parseFloat(entryPrice);
        const sl = parseFloat(stopLoss);

        if (isNaN(entry) || isNaN(sl) || entry <= 0 || sl <= 0 || balance <= 0 || riskPercent <= 0) {
            return null;
        }

        const riskAmount = (balance * riskPercent) / 100;
        const slDistance = Math.abs(entry - sl);

        if (slDistance === 0) return null;

        // Assuming standard lot (100,000) for currency pairs like EURUSD
        // Lot Size = Risk Amount / (Stop Loss Distance * Contract Size)
        const positionSize = riskAmount / (slDistance * 100000);

        return positionSize.toFixed(2);

    }, [riskSettings, entryPrice, stopLoss]);

    const riskPercentToShow = riskSettings
        ? riskSettings.strategy === 'fixed_percent'
            ? riskSettings.fixedPercent.risk
            : riskSettings.antiMartingale.baseRisk
        : 1;

    return (
        <div className="h-full flex flex-col justify-around space-y-2 text-sm">
            <div className="p-2 text-center rounded-lg bg-gray-100 dark:bg-gray-700/50">
                <p className="text-xs text-gray-500 dark:text-gray-400">حجم محاسبه شده (لات)</p>
                <p className="text-xl font-bold font-mono text-indigo-500">{calculatedSize || '0.00'}</p>
                <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-1">
                    برای حساب <span className="font-mono">${riskSettings?.accountBalance.toLocaleString() || 'N/A'}</span> با ریسک <span className="font-mono">{riskPercentToShow}%</span>
                </p>
            </div>

            <div className="space-y-2">
                <div>
                    <label className="block text-xs font-medium mb-1">قیمت ورود</label>
                    <input
                        type="number"
                        step="any"
                        placeholder="1.08500"
                        value={entryPrice}
                        onChange={(e) => setEntryPrice(e.target.value)}
                        className="w-full p-1.5 border rounded dark:bg-gray-700 dark:border-gray-600 text-center font-mono text-xs"
                        aria-label="قیمت ورود"
                    />
                </div>
                <div>
                    <label className="block text-xs font-medium mb-1">حد ضرر</label>
                    <input
                        type="number"
                        step="any"
                        placeholder="1.08300"
                        value={stopLoss}
                        onChange={(e) => setStopLoss(e.target.value)}
                        className="w-full p-1.5 border rounded dark:bg-gray-700 dark:border-gray-600 text-center font-mono text-xs"
                        aria-label="حد ضرر"
                    />
                </div>
            </div>
            <p className="text-center text-[10px] text-gray-400 dark:text-gray-500">
                محاسبه بر اساس جفت‌ارزهای مبتنی بر دلار آمریکا (XXX/USD) با لات استاندارد است.
            </p>
        </div>
    );
};

export default PositionSizeCalculatorWidget;