import React, { Suspense, useState, lazy, useEffect, useLayoutEffect } from 'react';
import Card from './shared/Card';
import { WIDGETS, WIDGET_DEFINITIONS } from '../constants';
import { RefreshCw, Clock, Bell } from 'lucide-react';
import type { WidgetVisibility } from '../types';

const AlertsManager = lazy(() => import('./AlertsManager'));

const STORAGE_KEY_WIDGET_VISIBILITY = 'dashboard-widget-visibility';

type ScreenSize = 'sm' | 'md' | 'lg';

// Defines the position of each widget within the CSS Grid layout for LARGE screens.
const WIDGET_LAYOUT_CONFIG_LG: { [key: string]: { col: string; row: string; } } = {
  performance_analytics: { col: '1 / 4', row: '1 / 2' },
  wallet_overview:       { col: '1 / 4', row: '2 / 3' },
  risk_management:       { col: '1 / 4', row: '3 / 4' },
  trades_table:          { col: '4 / 10', row: '1 / 4' },
  sessions_clock:        { col: '10 / 13', row: '1 / 2' },
  trading_checklist:     { col: '10 / 13', row: '2 / 3' },
  market_news:           { col: '10 / 13', row: '3 / 4' },
  ai_summary:            { col: '1 / 5', row: '4 / 5' },
  weather:               { col: '5 / 9', row: '4 / 5' },
  hafez_fortune:         { col: '9 / 13', row: '4 / 5' },
};

// For MEDIUM screens (tablets) - 8 columns
const WIDGET_LAYOUT_CONFIG_MD: { [key: string]: { col: string; row: string; } } = {
  trades_table:          { col: '1 / 9', row: '1 / 2' },
  performance_analytics: { col: '1 / 5', row: '2 / 3' },
  wallet_overview:       { col: '5 / 9', row: '2 / 3' },
  risk_management:       { col: '1 / 5', row: '3 / 4' },
  sessions_clock:        { col: '5 / 9', row: '3 / 4' },
  trading_checklist:     { col: '1 / 5', row: '4 / 5' },
  market_news:           { col: '5 / 9', row: '4 / 5' },
  ai_summary:            { col: '1 / 9', row: '5 / 6' },
  weather:               { col: '1 / 9', row: '6 / 7' },
  hafez_fortune:         { col: '1 / 9', row: '7 / 8' },
};

// For SMALL screens (mobile) - 4 columns, single column layout
const WIDGET_LAYOUT_CONFIG_SM: { [key: string]: { col: string; row: string; } } = {
  performance_analytics: { col: '1 / 5', row: '1 / 2' },
  trades_table:          { col: '1 / 5', row: '2 / 3' },
  wallet_overview:       { col: '1 / 5', row: '3 / 4' },
  risk_management:       { col: '1 / 5', row: '4 / 5' },
  sessions_clock:        { col: '1 / 5', row: '5 / 6' },
  trading_checklist:     { col: '1 / 5', row: '6 / 7' },
  market_news:           { col: '1 / 5', row: '7 / 8' },
  ai_summary:            { col: '1 / 5', row: '8 / 9' },
  weather:               { col: '1 / 5', row: '9 / 10' },
  hafez_fortune:         { col: '1 / 5', row: '10 / 11' },
};

const GRID_STYLES = {
  lg: {
    gridTemplateColumns: 'repeat(12, minmax(0, 1fr))',
    gridAutoRows: '320px',
  },
  md: {
    gridTemplateColumns: 'repeat(8, minmax(0, 1fr))',
    gridAutoRows: '320px',
  },
  sm: {
    gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
    gridAutoRows: '320px',
  }
};


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


const Dashboard: React.FC = () => {
    const [isAlertsModalOpen, setIsAlertsModalOpen] = useState(false);
    const [widgetVisibility, setWidgetVisibility] = useState<WidgetVisibility>({});
    const [time, setTime] = useState(new Date());
    const [screenSize, setScreenSize] = useState<ScreenSize>('lg');

     useLayoutEffect(() => {
        const checkScreenSize = () => {
            if (window.matchMedia('(max-width: 767px)').matches) {
                setScreenSize('sm');
            } else if (window.matchMedia('(max-width: 1023px)').matches) {
                setScreenSize('md');
            } else {
                setScreenSize('lg');
            }
        };

        checkScreenSize();
        window.addEventListener('resize', checkScreenSize);
        return () => window.removeEventListener('resize', checkScreenSize);
    }, []);

    useEffect(() => {
        const timerId = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(timerId);
    }, []);

    useEffect(() => {
        const loadVisibility = () => {
            const savedVisibility = getFromLS(STORAGE_KEY_WIDGET_VISIBILITY, null);
            
            const defaultVisibleWidgets = [
                'performance_analytics', 'wallet_overview', 'risk_management',
                'trades_table', 'sessions_clock', 'trading_checklist', 'market_news',
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
    
    const WIDGET_LAYOUT_CONFIG = {
        lg: WIDGET_LAYOUT_CONFIG_LG,
        md: WIDGET_LAYOUT_CONFIG_MD,
        sm: WIDGET_LAYOUT_CONFIG_SM,
    }[screenSize];

    const gridStyle = GRID_STYLES[screenSize];
    
    const createWidget = (key: string) => {
        const WidgetComponent = WIDGETS[key as keyof typeof WIDGETS];
        const def = WIDGET_DEFINITIONS[key as keyof typeof WIDGET_DEFINITIONS];
        if (!WidgetComponent || !def) return null;

        const layout = WIDGET_LAYOUT_CONFIG[key];
        if (!layout) return null; 

        return (
            <div key={key} style={{ gridColumn: layout.col, gridRow: layout.row }}>
                <Card title={def.title} icon={def.icon}>
                    <Suspense fallback={<div className="flex items-center justify-center h-full"><RefreshCw className="animate-spin" /></div>}>
                        <WidgetComponent />
                    </Suspense>
                </Card>
            </div>
        );
    };

    return (
        <div className="p-4 lg:p-6">
            <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold">مرکز فرماندهی</h1>
                    <p className="text-gray-500 dark:text-gray-400">نمای کلی از وضعیت بازار و معاملات شما.</p>
                </div>
                <div className="flex items-center gap-4">
                     <button onClick={() => setIsAlertsModalOpen(true)} className="p-4 rounded-lg bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm border border-gray-200 dark:border-slate-700 hover:bg-gray-200/50 dark:hover:bg-slate-700/50" title="هشدارها">
                        <Bell className="w-6 h-6 text-indigo-500"/>
                    </button>
                    <div className="flex items-center gap-4 p-3 rounded-lg bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm border border-gray-200 dark:border-slate-700">
                         <div className="text-right">
                            <p className="font-semibold text-sm">{time.toLocaleDateString('fa-IR-u-nu-latn', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                            <p className="text-lg font-mono tracking-wider">{time.toLocaleTimeString('fa-IR-u-nu-latn', { timeZone: 'Asia/Tehran' })}</p>
                        </div>
                         <Clock className="w-8 h-8 text-indigo-500" />
                    </div>
                </div>
            </header>

            <div
                className="grid gap-6"
                style={gridStyle}
            >
                {Object.keys(WIDGET_DEFINITIONS)
                    .filter(key => widgetVisibility[key])
                    .map(key => createWidget(key))}
            </div>


            <Suspense fallback={null}>
              {isAlertsModalOpen && <AlertsManager isOpen={isAlertsModalOpen} onClose={() => setIsAlertsModalOpen(false)} />}
            </Suspense>
        </div>
    );
};

export default Dashboard;