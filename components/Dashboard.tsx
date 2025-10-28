import React, { Suspense, useState, lazy, useEffect, useMemo } from 'react';
import Card from './shared/Card';
import { WIDGETS, WIDGET_DEFINITIONS } from '../constants';
import { RefreshCw } from 'lucide-react';
import type { WidgetVisibility, JournalEntry } from '../types';
import { useAppContext } from '../contexts/AppContext';

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

const mainWidget = 'trades_table';

const simpleWidgets = [
    'todays_performance', 'wallet_overview', 'sessions_clock', 'market_news'
];

const advancedWidgets = [
    'performance_analytics', 'risk_management', 'trading_checklist', 'position_size_calculator',
    'live_prices', 'psychology_analysis', 'ai_summary', 'weather', 'hafez_fortune'
];


interface DashboardProps {
    onOpenModal: (entry: JournalEntry | null) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onOpenModal }) => {
    const [widgetVisibility, setWidgetVisibility] = useState<WidgetVisibility>({});
    const { appMode } = useAppContext();

    useEffect(() => {
        const loadVisibility = () => {
            const savedVisibility = getFromLS(STORAGE_KEY_WIDGET_VISIBILITY, null);
            
            const defaultVisibleWidgets = [mainWidget, ...simpleWidgets, ...advancedWidgets];

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
        
        const widgetProps: any = {};
        if (key === 'trades_table') {
            widgetProps.onEditTrade = onOpenModal;
        }

        return (
            <Card key={key} title={def.title} icon={def.icon}>
                <Suspense fallback={<div className="flex items-center justify-center h-full min-h-[100px]"><RefreshCw className="animate-spin" /></div>}>
                    <WidgetComponent {...widgetProps} />
                </Suspense>
            </Card>
        );
    };

    const widgetsToRender = useMemo(() => {
        if (appMode === 'simple') {
            return simpleWidgets;
        }
        return [...simpleWidgets, ...advancedWidgets];
    }, [appMode]);


    return (
        <div className="p-4 space-y-4">
            {/* Main full-width widget */}
            <div>
                {createWidget(mainWidget)}
            </div>

            {/* Grid for other widgets */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {widgetsToRender.map(createWidget)}
            </div>
        </div>
    );
};

export default Dashboard;