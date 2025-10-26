import React, { Suspense, useState, lazy, useEffect } from 'react';
import { Responsive, WidthProvider } from 'react-grid-layout';
import Card from './shared/Card';
import { WIDGETS, WIDGET_DEFINITIONS } from '../constants';
import { RefreshCw, Clock, Bell } from 'lucide-react';
import type { WidgetVisibility } from '../types';

const AlertsManager = lazy(() => import('./AlertsManager'));

const ResponsiveGridLayout = WidthProvider(Responsive);

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

const defaultLayouts = {
  lg: [
    // Right Column (KPIs) - Visually on the right in RTL
    { i: 'performance_analytics', x: 0, y: 0, w: 3, h: 12 },
    { i: 'wallet_overview', x: 0, y: 12, w: 3, h: 12 },
    { i: 'risk_management', x: 0, y: 24, w: 3, h: 12 },
    
    // Center Column (Main Workspace)
    { i: 'price_chart', x: 3, y: 0, w: 6, h: 24 },
    { i: 'trades_table', x: 3, y: 24, w: 6, h: 12 },

    // Left Column (Tools & Context) - Visually on the left in RTL
    { i: 'sessions_clock', x: 9, y: 0, w: 3, h: 12 },
    { i: 'trading_checklist', x: 9, y: 12, w: 3, h: 12 },
    { i: 'forex_news', x: 9, y: 24, w: 3, h: 12 },
  ]
};

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

const Dashboard: React.FC = () => {
    const [isAlertsModalOpen, setIsAlertsModalOpen] = useState(false);
    const [widgetVisibility, setWidgetVisibility] = useState<WidgetVisibility>({});

    useEffect(() => {
        const loadVisibility = () => {
            const savedVisibility = getFromLS(STORAGE_KEY_WIDGET_VISIBILITY, null);
            
            if (savedVisibility) {
                const newVisibility: WidgetVisibility = {};
                Object.keys(WIDGET_DEFINITIONS).forEach(key => {
                    newVisibility[key] = savedVisibility[key] !== false;
                });
                setWidgetVisibility(newVisibility);
            } else {
                const newDefaultVisibility: WidgetVisibility = {};
                Object.keys(WIDGET_DEFINITIONS).forEach(key => {
                    newDefaultVisibility[key] = defaultVisibleWidgets.includes(key);
                });
                setWidgetVisibility(newDefaultVisibility);
            }
        };
        loadVisibility();
        window.addEventListener('storage', loadVisibility);
        return () => window.removeEventListener('storage', loadVisibility);
    }, []);
    
    const createWidget = (key: string) => {
        const WidgetComponent = WIDGETS[key as keyof typeof WIDGETS];
        const def = WIDGET_DEFINITIONS[key as keyof typeof WIDGET_DEFINITIONS];
        if (!WidgetComponent || !def) return null;

        return (
            <div key={key}>
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

            <ResponsiveGridLayout
                layouts={defaultLayouts}
                breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
                cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
                rowHeight={30}
                isDraggable={false}
                isResizable={false}
                compactType="vertical"
            >
                {Object.keys(WIDGET_DEFINITIONS)
                    .filter(key => widgetVisibility[key])
                    .map(key => createWidget(key))}
            </ResponsiveGridLayout>


            <Suspense fallback={null}>
              {isAlertsModalOpen && <AlertsManager isOpen={isAlertsModalOpen} onClose={() => setIsAlertsModalOpen(false)} />}
            </Suspense>
        </div>
    );
};

export default Dashboard;