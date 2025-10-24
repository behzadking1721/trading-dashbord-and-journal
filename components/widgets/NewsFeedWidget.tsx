import React, { useState, Suspense, lazy } from 'react';
import { RefreshCw } from 'lucide-react';

const ForexNewsWidget = lazy(() => import('./ForexNewsWidget'));
const CryptoNewsWidget = lazy(() => import('./CryptoNewsWidget'));
const GlobalStocksNewsWidget = lazy(() => import('./GlobalStocksNewsWidget'));
const IranianBourseNewsWidget = lazy(() => import('./IranianBourseNewsWidget'));

type Tab = 'forex' | 'crypto' | 'stocks' | 'iran';

const TABS: { id: Tab; label: string }[] = [
    { id: 'forex', label: 'فارکس' },
    { id: 'crypto', label: 'کریپتو' },
    { id: 'stocks', label: 'بورس جهانی' },
    { id: 'iran', label: 'بورس ایران' },
];

const NewsFeedWidget: React.FC = () => {
    const [activeTab, setActiveTab] = useState<Tab>('forex');

    const renderContent = () => {
        switch (activeTab) {
            case 'forex': return <ForexNewsWidget />;
            case 'crypto': return <CryptoNewsWidget />;
            case 'stocks': return <GlobalStocksNewsWidget />;
            case 'iran': return <IranianBourseNewsWidget />;
            default: return null;
        }
    };

    return (
        <div>
            <div className="flex items-center border-b border-gray-200 dark:border-gray-700 -mt-2 mb-2">
                {TABS.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`px-3 py-2 text-sm font-semibold transition-colors ${
                            activeTab === tab.id
                                ? 'border-b-2 border-indigo-500 text-indigo-500'
                                : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                        }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>
            <Suspense fallback={
                <div className="flex items-center justify-center h-48">
                    <RefreshCw className="animate-spin text-indigo-500" />
                </div>
            }>
                {renderContent()}
            </Suspense>
        </div>
    );
};

export default NewsFeedWidget;