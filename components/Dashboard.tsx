import React, { Suspense, useState, lazy, useEffect } from 'react';
import Card from './shared/Card';
import { WIDGETS, WIDGET_DEFINITIONS } from '../constants';
import { RefreshCw } from 'lucide-react';
import type { WidgetVisibility } from '../types';

const STORAGE_KEY_WIDGET_VISIBILITY = 'dashboard-widget-visibility';

// Helper function to load settings from localStorage safely
const getFromLS = (key: string, defaultValue: any) => {
    if (typeof localStorage !== 'undefined') {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : defaultValue;
        } catch (e) {
            console.error("Could not read from localStorage", e);
            return defaultValue;
        }
    }
    return defaultValue;
};

// Define which widgets belong to which column
const leftColumnWidgets = ['todays_performance', 'wallet_overview', 'performance_analytics', 'risk_management', 'trading_checklist'];
const middleColumnWidgets = ['trades_table'];
const rightColumnWidgets = ['sessions_clock', 'live_prices', 'market_news', 'hafez_fortune', 'ai_summary', 'weather'];

const Dashboard: React.FC = () => {
    const [widgetVisibility, setWidgetVisibility] = useState<WidgetVisibility>({});

    useEffect(() => {
        const loadVisibility = () => {
            const savedVisibility = getFromLS(STORAGE_KEY_WIDGET_VISIBILITY, null);
            
            const defaultVisibleWidgets = [
                'todays_performance', 'performance_analytics', 'wallet_overview', 'risk_management',
                'trades_table', 'sessions_clock', 'live_prices', 'trading_checklist', 'market_news',
                'hafez_fortune',
            ];

            const newVisibility: WidgetVisibility = {};
            Object.keys(WIDGET_DEFINITIONS).forEach(key => {
                newVisibility[key] = savedVisibility ? (savedVisibility[key] !== false) : defaultVisibleWidgets.includes(key);
            });
            setWidgetVisibility(newVisibility);
        };
        
        loadVisibility();
        window.addEventListener('storage', loadVisibility);
        return () => window.removeEventListener('storage', loadVisibility);
    }, []);
    
    const createWidget = (key: string) => {
        const WidgetComponent = WIDGETS[key as keyof typeof WIDGETS];
        const def = WIDGET_DEFINITIONS[key as keyof typeof WIDGET_DEFINITIONS];
        if (!WidgetComponent || !def || !widgetVisibility[key]) return null;

        return (
            <Card key={key} title={def.title} icon={def.icon}>
                <Suspense fallback={<div className="flex items-center justify-center h-full"><RefreshCw className="animate-spin" /></div>}>
                    <WidgetComponent />
                </Suspense>
            </Card>
        );
    };

    return (
        <div className="p-4 sm:p-6 lg:p-8">
            <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
                
                {/* Right Column (on RTL) - Analysis & Prep */}
                <div className="xl:col-span-1 flex flex-col gap-6">
                    {leftColumnWidgets.map(createWidget)}
                </div>

                {/* Middle Column - Core Operations */}
                <div className="xl:col-span-2 flex flex-col gap-6">
                    {middleColumnWidgets.map(createWidget)}
                </div>

                {/* Left Column (on RTL) - Market Status & Context */}
                <div className="xl:col-span-1 flex flex-col gap-6">
                    {rightColumnWidgets.map(createWidget)}
                </div>

            </div>
        </div>
    );
};

export default Dashboard;