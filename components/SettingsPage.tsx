import React, { useState, useEffect } from 'react';
import { Save } from 'lucide-react';

const SettingsPage: React.FC = () => {
    const [maxRiskPerTrade, setMaxRiskPerTrade] = useState('1');
    const [accountBalance, setAccountBalance] = useState('10000');
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        try {
            const savedRisk = localStorage.getItem('maxRiskPerTrade');
            const savedBalance = localStorage.getItem('accountBalance');
            if (savedRisk) setMaxRiskPerTrade(savedRisk);
            if (savedBalance) setAccountBalance(savedBalance);
        } catch (error) {
            console.error("Could not access localStorage to get settings:", error);
        }
    }, []);

    const handleSave = () => {
        try {
            localStorage.setItem('maxRiskPerTrade', maxRiskPerTrade);
            localStorage.setItem('accountBalance', accountBalance);
            setSaved(true);
            setTimeout(() => setSaved(false), 2000);
        } catch (error) {
            console.error("Could not access localStorage to save settings:", error);
            alert("خطا در ذخیره تنظیمات. ممکن است دسترسی به حافظه مرورگر مسدود باشد.");
        }
    };

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-6">تنظیمات</h1>

            <div className="max-w-md mx-auto space-y-6 p-6 rounded-lg shadow-md bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border border-gray-200 dark:border-gray-700">
                <div>
                    <h2 className="text-lg font-semibold mb-4">مدیریت سرمایه و ریسک</h2>
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="accountBalance" className="block text-sm font-medium mb-1">موجودی حساب ($)</label>
                            <input
                                type="number"
                                id="accountBalance"
                                value={accountBalance}
                                onChange={e => setAccountBalance(e.target.value)}
                                className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                                placeholder="مثال: 10000"
                            />
                        </div>
                        <div>
                            <label htmlFor="maxRisk" className="block text-sm font-medium mb-1">حداکثر ریسک در هر معامله (%)</label>
                            <input
                                type="number"
                                id="maxRisk"
                                value={maxRiskPerTrade}
                                onChange={e => setMaxRiskPerTrade(e.target.value)}
                                className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                                placeholder="مثال: 1"
                            />
                             <p className="text-xs text-gray-500 mt-1">این درصد برای محاسبه خودکار حجم پوزیشن در فرم ژورنال استفاده می‌شود.</p>
                        </div>
                    </div>
                </div>

                <div className="border-t border-gray-200 dark:border-gray-600 pt-6">
                    <button onClick={handleSave} className="w-full flex items-center justify-center gap-2 bg-indigo-500 text-white px-4 py-2 rounded-lg shadow-md hover:bg-indigo-600 transition-colors">
                        <Save size={18} />
                        <span>{saved ? 'ذخیره شد!' : 'ذخیره تنظیمات'}</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SettingsPage;