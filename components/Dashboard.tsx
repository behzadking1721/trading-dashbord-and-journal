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

// Define widgets for the new two-part layout
const kpiWidgets = ['todays_performance', 'wallet_overview', 'performance_analytics', 'risk_management'];
const mainColumnWidgets = ['trades_table'];
const sideColumnWidgets = ['sessions_clock', 'live_prices', 'trading_checklist', 'position_size_calculator', 'market_news'];


const Dashboard: React.FC = () => {
    const [widgetVisibility, setWidgetVisibility] = useState<WidgetVisibility>({});

    useEffect(() => {
        const loadVisibility = () => {
            const savedVisibility = getFromLS(STORAGE_KEY_WIDGET_VISIBILITY, null);
            
            const defaultVisibleWidgets = [
                ...kpiWidgets, ...mainColumnWidgets, ...sideColumnWidgets
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
        <div className="p-4 space-y-4">
            {/* Top KPI Bar */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                {kpiWidgets.map(createWidget)}
            </div>

            {/* Main Workspace */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Main Column */}
                <div className="lg:col-span-2 flex flex-col gap-4">
                    {mainColumnWidgets.map(createWidget)}
                </div>

                {/* Side Column */}
                <div className="lg:col-span-1 flex flex-col gap-4">
                    {sideColumnWidgets.map(createWidget)}
                </div>
            </div>
        </div>
    );
};

export default Dashboard;