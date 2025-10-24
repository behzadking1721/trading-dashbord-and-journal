import React from 'react';
import type { FinancialCalendarSettings, MarketType } from '../../types';
import { Eye, EyeOff, Layout, List } from 'lucide-react';

interface CalendarSettingsTabProps {
    settings: FinancialCalendarSettings;
    onSettingsChange: (newSettings: FinancialCalendarSettings) => void;
}

const ToggleSwitch: React.FC<{ checked: boolean; onChange: (checked: boolean) => void; }> = ({ checked, onChange }) => (
    <label className="relative inline-flex items-center cursor-pointer">
        <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} className="sr-only peer" />
        <div className="w-11 h-6 bg-gray-200 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
    </label>
);

const CalendarSettingsTab: React.FC<CalendarSettingsTabProps> = ({ settings, onSettingsChange }) => {

    const handleTabVisibilityChange = (tab: MarketType, isVisible: boolean) => {
        const newSettings = {
            ...settings,
            visibleTabs: {
                ...settings.visibleTabs,
                [tab]: isVisible,
            },
        };
        onSettingsChange(newSettings);
    };

    const handleViewModeChange = (mode: 'compact' | 'expanded') => {
        onSettingsChange({ ...settings, viewMode: mode });
    };

    return (
        <div className="max-w-2xl mx-auto p-4 space-y-8">
            <div className="p-6 rounded-lg shadow-md bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-semibold mb-4">مدیریت تب‌های بازار</h2>
                <div className="space-y-4">
                    {(['forex', 'crypto', 'stocks', 'commodities'] as MarketType[]).map(market => (
                        <div key={market} className="flex items-center justify-between">
                            <span className="font-medium">
                                { { forex: 'فارکس', crypto: 'کریپتو', stocks: 'بورس جهانی', commodities: 'کالاها' }[market] }
                            </span>
                            <ToggleSwitch
                                checked={settings.visibleTabs[market]}
                                onChange={(c) => handleTabVisibilityChange(market, c)}
                            />
                        </div>
                    ))}
                </div>
            </div>

            <div className="p-6 rounded-lg shadow-md bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-semibold mb-4">تنظیمات نمایش</h2>
                <div className="flex items-center justify-between">
                     <span className="font-medium">حالت نمایش جدول</span>
                     <div className="flex items-center gap-2 p-1 rounded-lg bg-gray-200 dark:bg-gray-700">
                        <button
                            onClick={() => handleViewModeChange('expanded')}
                            className={`flex items-center gap-2 px-3 py-1 rounded-md text-sm font-semibold ${settings.viewMode === 'expanded' ? 'bg-white dark:bg-gray-800 shadow' : 'text-gray-600 dark:text-gray-300'}`}
                        >
                            <Layout size={16} /> گسترده
                        </button>
                        <button
                             onClick={() => handleViewModeChange('compact')}
                            className={`flex items-center gap-2 px-3 py-1 rounded-md text-sm font-semibold ${settings.viewMode === 'compact' ? 'bg-white dark:bg-gray-800 shadow' : 'text-gray-600 dark:text-gray-300'}`}
                        >
                           <List size={16} /> فشرده
                        </button>
                     </div>
                </div>
            </div>
             <p className="text-center text-xs text-gray-500 dark:text-gray-400">
                تمام تنظیمات شما به صورت خودکار در این مرورگر ذخیره می‌شود.
            </p>
        </div>
    );
};

export default CalendarSettingsTab;
