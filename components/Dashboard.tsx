import React, { Suspense, useState, lazy, useEffect } from 'react';
import Card from './shared/Card';
import { WIDGETS, WIDGET_DEFINITIONS } from '../constants';
import { RefreshCw, Clock, Bell } from 'lucide-react';
import type { WidgetVisibility } from '../types';

const AlertsManager = lazy(() => import('./AlertsManager'));

const STORAGE_KEY_WIDGET_VISIBILITY = 'dashboard-widget-visibility';

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

// Defines the position of each widget within the CSS Grid layout.
const WIDGET_LAYOUT_CONFIG: { [key: string]: { col: string; row: string; } } = {
  // Right Column (KPIs) - Visually on the right in RTL
  performance_analytics: { col: '1 / 4', row: '1 / 2' },
  wallet_overview:       { col: '1 / 4', row: '2 / 3' },
  risk_management:       { col: '1 / 4', row: '3 / 4' },
  
  // Center Column (Main Workspace)
  price_chart:           { col: '4 / 10', row: '1 / 3' },
  trades_table:          { col: '4 / 10', row: '3 / 4' },

  // Left Column (Tools & Context) - Visually on the left in RTL
  sessions_clock:        { col: '10 / 13', row: '1 / 2' },
  trading_checklist:     { col: '10 / 13', row: '2 / 3' },
  forex_news:            { col: '10 / 13', row: '3 / 4' },
  
  // Bottom Full-width Row
  ai_summary:            { col: '1 / 5', row: '4 / 5' },
  weather:               { col: '5 / 9', row: '4 / 5' },
  hafez_fortune:         { col: '9 / 13', row: '4 / 5' },
};


const Dashboard: React.FC = () => {
    const [isAlertsModalOpen, setIsAlertsModalOpen] = useState(false);
    const [widgetVisibility, setWidgetVisibility] = useState<WidgetVisibility>({});

    useEffect(() => {
        const loadVisibility = () => {
            const savedVisibility = getFromLS(STORAGE_KEY_WIDGET_VISIBILITY, null);
            
            const defaultVisibleWidgets = [
                'performance_analytics',
                'wallet_overview',
                'risk_management',
                'price_chart',
                'trades_table',
                'sessions_clock',
                'trading_checklist',
                'forex_news',
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
                     <button onClick={() => setIsAlertsModalOpen(true)} className="p-3 rounded-lg bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm border border-gray-200 dark:border-slate-700 hover:bg-gray-200/50 dark:hover:bg-slate-700/50" title="هشدارها">
                        <Bell className="w-6 h-6 text-indigo-500"/>
                    </button>
                    <div className="flex items-center gap-4 p-3 rounded-lg bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm border border-gray-200 dark:border-slate-700">
                         <div className="text-right">
                            <p className="font-semibold">{new Date().toLocaleDateString('fa-IR-u-nu-latn', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                            <p className="text-xs text-gray-500">ساعت به وقت تهران</p>
                        </div>
                         <Clock className="w-8 h-8 text-indigo-500" />
                    </div>
                </div>
            </header>

            <div
                className="grid gap-6"
                style={{
                    gridTemplateColumns: 'repeat(12, minmax(0, 1fr))',
                    gridTemplateRows: 'repeat(3, 290px) auto',
                }}
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