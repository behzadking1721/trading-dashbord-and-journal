import React, { Suspense, useState, lazy, useEffect } from 'react';
import { Responsive, WidthProvider } from 'react-grid-layout';
import Card from './shared/Card';
import { WIDGETS, WIDGET_DEFINITIONS } from '../constants';
import { RefreshCw, Clock, Bell, Lock, Unlock } from 'lucide-react';
import type { WidgetVisibility } from '../types';

const AlertsManager = lazy(() => import('./AlertsManager'));

const ResponsiveGridLayout = WidthProvider(Responsive);

const STORAGE_KEY_WIDGET_VISIBILITY = 'dashboard-widget-visibility';
const STORAGE_KEY_LAYOUTS = 'dashboard-layouts';

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

const saveToLS = (key: string, value: any) => {
    if (typeof localStorage !== 'undefined') {
        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch (e) {
            console.error("Could not save to localStorage", e);
        }
    }
};

const defaultLayouts = {
  lg: [
    { i: 'performance_analytics', x: 0, y: 0, w: 3, h: 3, minW: 3, minH: 3 },
    { i: 'wallet_overview', x: 3, y: 0, w: 3, h: 3, minW: 3, minH: 3 },
    { i: 'risk_management', x: 6, y: 0, w: 3, h: 3, minW: 3, minH: 3 },
    { i: 'trading_checklist', x: 9, y: 0, w: 3, h: 3, minW: 3, minH: 3 },
    { i: 'price_chart', x: 0, y: 3, w: 8, h: 9, minW: 6, minH: 8 },
    { i: 'trades_table', x: 0, y: 12, w: 8, h: 7, minW: 6, minH: 6 },
    { i: 'ai_summary', x: 8, y: 3, w: 4, h: 7, minW: 3, minH: 6 },
    { i: 'sessions_clock', x: 8, y: 10, w: 4, h: 6, minW: 3, minH: 5 },
    { i: 'forex_news', x: 8, y: 16, w: 4, h: 8, minW: 3, minH: 7 },
    { i: 'weather', x: 0, y: 19, w: 6, h: 7, minW: 4, minH: 6 },
    { i: 'hafez_fortune', x: 6, y: 19, w: 6, h: 5, minW: 4, minH: 4 },
  ]
};

const Dashboard: React.FC = () => {
    const [isAlertsModalOpen, setIsAlertsModalOpen] = useState(false);
    const [widgetVisibility, setWidgetVisibility] = useState<WidgetVisibility>({});
    const [layouts, setLayouts] = useState(() => getFromLS(STORAGE_KEY_LAYOUTS, defaultLayouts));
    const [isLayoutLocked, setIsLayoutLocked] = useState(true);

    useEffect(() => {
        const loadVisibility = () => {
            const savedVisibility = getFromLS(STORAGE_KEY_WIDGET_VISIBILITY, {});
            const allVisible: WidgetVisibility = {};
            Object.keys(WIDGET_DEFINITIONS).forEach(key => {
                allVisible[key] = savedVisibility[key] !== false;
            });
            setWidgetVisibility(allVisible);
        };
        loadVisibility();
        window.addEventListener('storage', loadVisibility);
        return () => window.removeEventListener('storage', loadVisibility);
    }, []);
    
    const onLayoutChange = (_: any, newLayouts: any) => {
        saveToLS(STORAGE_KEY_LAYOUTS, newLayouts);
        setLayouts(newLayouts);
    };
    
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
        <div className={`p-4 lg:p-6 ${isLayoutLocked ? 'layout-locked' : ''}`}>
            <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold">مرکز فرماندهی</h1>
                    <p className="text-gray-500 dark:text-gray-400">خوش آمدید! چیدمان داشبورد را به دلخواه خود تغییر دهید.</p>
                </div>
                <div className="flex items-center gap-4">
                     <button onClick={() => setIsLayoutLocked(!isLayoutLocked)} className="p-3 rounded-lg bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm border border-gray-200 dark:border-slate-700 hover:bg-gray-200/50 dark:hover:bg-slate-700/50" title={isLayoutLocked ? "باز کردن قفل چیدمان" : "قفل کردن چیدمان"}>
                        {isLayoutLocked ? <Lock className="w-6 h-6 text-indigo-500"/> : <Unlock className="w-6 h-6 text-indigo-500"/>}
                    </button>
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
                layouts={layouts}
                onLayoutChange={onLayoutChange}
                breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
                cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
                rowHeight={40}
                draggableHandle=".card-drag-handle"
                isDraggable={!isLayoutLocked}
                isResizable={!isLayoutLocked}
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
