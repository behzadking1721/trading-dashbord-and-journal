import React, { useState, useEffect, Suspense, lazy } from 'react';
import type { FinancialCalendarSettings, MarketType } from '../types';
import { RefreshCw, Settings, Flame, Coins, BarChart as BarChartIcon, Beaker } from 'lucide-react';
import { fetchForexEvents } from '../data/forexEvents';
import { fetchCryptoEvents } from '../data/cryptoEvents';
import { fetchStocksEvents } from '../data/stocksEvents';
import { fetchCommoditiesEvents } from '../data/commoditiesEvents';

const FinancialCalendarTab = lazy(() => import('./financial_calendar/FinancialCalendarTab'));
const CalendarSettingsTab = lazy(() => import('./financial_calendar/CalendarSettingsTab'));

type TabId = MarketType | 'settings';

const TABS_CONFIG: { id: TabId, label: string, color: string, icon: React.ElementType, fetchData?: () => Promise<any> }[] = [
    { id: 'forex', label: 'فارکس', color: 'blue', icon: Flame, fetchData: fetchForexEvents },
    { id: 'crypto', label: 'کریپتو', color: 'orange', icon: Coins, fetchData: fetchCryptoEvents },
    { id: 'stocks', label: 'بورس جهانی', color: 'green', icon: BarChartIcon, fetchData: fetchStocksEvents },
    { id: 'commodities', label: 'کالاها', color: 'gray', icon: Beaker, fetchData: fetchCommoditiesEvents },
    { id: 'settings', label: 'تنظیمات', color: 'purple', icon: Settings }
];

const CALENDAR_SETTINGS_LS_KEY = 'financial-calendar-settings';
const DEFAULT_SETTINGS: FinancialCalendarSettings = {
    visibleTabs: { forex: true, crypto: true, stocks: true, commodities: true },
    viewMode: 'expanded',
};

const CalendarPage: React.FC = () => {
    const [settings, setSettings] = useState<FinancialCalendarSettings>(DEFAULT_SETTINGS);
    const [activeTab, setActiveTab] = useState<TabId>('forex');

    useEffect(() => {
        const loadSettings = () => {
            try {
                const saved = localStorage.getItem(CALENDAR_SETTINGS_LS_KEY);
                if (saved) {
                    // Merge saved settings with defaults to ensure all keys are present
                    const parsed = JSON.parse(saved);
                    setSettings(prev => ({
                        ...prev,
                        ...parsed,
                        visibleTabs: {
                            ...prev.visibleTabs,
                            ...parsed.visibleTabs
                        }
                    }));
                }
            } catch (e) { console.error("Failed to load calendar settings", e); }
        };
        loadSettings();
    }, []);

    const handleSettingsChange = (newSettings: FinancialCalendarSettings) => {
        setSettings(newSettings);
        try {
            localStorage.setItem(CALENDAR_SETTINGS_LS_KEY, JSON.stringify(newSettings));
        } catch (e) { console.error("Failed to save calendar settings", e); }
    };

    const visibleTabs = TABS_CONFIG.filter(tab => {
        return tab.id === 'settings' || settings.visibleTabs[tab.id as MarketType];
    });

    useEffect(() => {
        if (!visibleTabs.some(t => t.id === activeTab)) {
            setActiveTab(visibleTabs[0]?.id || 'settings');
        }
    }, [settings.visibleTabs, activeTab, visibleTabs]);

    const activeTabData = TABS_CONFIG.find(tab => tab.id === activeTab);

    const tabColorClasses: { [key: string]: { border: string, text: string, bg: string } } = {
        blue: { border: 'border-blue-500', text: 'text-blue-500', bg: 'bg-blue-500' },
        orange: { border: 'border-orange-500', text: 'text-orange-500', bg: 'bg-orange-500' },
        green: { border: 'border-green-500', text: 'text-green-500', bg: 'bg-green-500' },
        gray: { border: 'border-gray-500', text: 'text-gray-500', bg: 'bg-gray-500' },
        purple: { border: 'border-purple-500', text: 'text-purple-500', bg: 'bg-purple-500' },
    };

    return (
        <div className="p-4 sm:p-6 space-y-6 h-full flex flex-col">
            <header>
                <h1 className="text-2xl font-bold">تقویم اقتصادی بازارهای مالی</h1>
                <p className="text-gray-500 dark:text-gray-400">رویدادهای کلیدی بازارهای فارکس، کریپتو، سهام و کالاها را رصد کنید.</p>
            </header>

            <div className="border-b border-gray-200 dark:border-gray-700">
                <nav className="-mb-px flex space-x-4 overflow-x-auto" aria-label="Tabs">
                    {visibleTabs.map(tab => {
                        const colors = tabColorClasses[tab.color] || tabColorClasses.gray;
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`whitespace-nowrap flex items-center gap-2 py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                                    isActive
                                        ? `${colors.border} ${colors.text}`
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:hover:text-gray-300 dark:hover:border-gray-600'
                                }`}
                            >
                                <tab.icon size={16} />
                                {tab.label}
                            </button>
                        );
                    })}
                </nav>
            </div>

            <main className="flex-grow overflow-y-auto">
                <Suspense fallback={
                    <div className="flex items-center justify-center h-full">
                        <RefreshCw className="w-8 h-8 animate-spin text-indigo-500" />
                    </div>
                }>
                    {activeTab === 'settings' ? (
                        <CalendarSettingsTab settings={settings} onSettingsChange={handleSettingsChange} />
                    ) : activeTabData?.fetchData ? (
                        <FinancialCalendarTab
                            key={activeTab} // Add key to force re-mount on tab change
                            market={activeTab as MarketType}
                            fetchData={activeTabData.fetchData}
                            color={activeTabData.color}
                            viewMode={settings.viewMode}
                        />
                    ) : null}
                </Suspense>
            </main>
        </div>
    );
};

export default CalendarPage;