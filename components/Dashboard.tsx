import React, { Suspense, useState, lazy, useEffect, useCallback } from 'react';
import Card from './shared/Card';
import { WIDGETS, WIDGET_DEFINITIONS } from '../constants';
import { RefreshCw, Clock, Bell, LayoutDashboard, Lock, Unlock, Wand2 } from 'lucide-react';
import type { WidgetVisibility } from '../types';
import { Responsive, WidthProvider } from 'react-grid-layout';

const AlertsManager = lazy(() => import('./AlertsManager'));
const ResponsiveGridLayout = WidthProvider(Responsive);

const STORAGE_KEY_WIDGET_VISIBILITY = 'dashboard-widget-visibility';
const STORAGE_KEY_LAYOUT = 'dashboard-layout';
const STORAGE_KEY_LAYOUT_LOCKED = 'dashboard-layout-locked';

// Default layout for large screens
const initialLayouts = {
    lg: [
        // Row 1: KPIs
        { i: 'performance_analytics', x: 0, y: 0, w: 3, h: 4, minH: 4, minW: 2 },
        { i: 'wallet_overview', x: 3, y: 0, w: 3, h: 4, minH: 4, minW: 2 },
        { i: 'risk_management', x: 6, y: 0, w: 3, h: 4, minH: 4, minW: 3 },
        { i: 'trading_checklist', x: 9, y: 0, w: 3, h: 4, minH: 4, minW: 2 },
        // Main Content Column
        { i: 'price_chart', x: 0, y: 4, w: 8, h: 9, minH: 6, minW: 6 },
        { i: 'trades_table', x: 0, y: 13, w: 8, h: 7, minH: 5, minW: 5 },
        // Side Column
        { i: 'ai_summary', x: 8, y: 4, w: 4, h: 7, minH: 6, minW: 3 },
        { i: 'sessions_clock', x: 8, y: 11, w: 4, h: 6, minH: 6, minW: 3 },
        { i: 'forex_news', x: 8, y: 17, w: 4, h: 6, minH: 5, minW: 3 },
        { i: 'weather', x: 8, y: 23, w: 4, h: 8, minH: 7, minW: 3 },
        { i: 'hafez_fortune', x: 8, y: 31, w: 4, h: 6, minH: 5, minW: 2 },
    ],
};

// Generates the widget components to be rendered by react-grid-layout
const generateWidgetDOM = (visibility: WidgetVisibility) => {
    // We use the layout definition to determine the render order
    const renderOrder = initialLayouts.lg.map(item => item.i);

    return renderOrder
        .filter(key => visibility[key])
        .map(key => {
            const WidgetComponent = WIDGETS[key as keyof typeof WIDGETS];
            const def = WIDGET_DEFINITIONS[key as keyof typeof WIDGET_DEFINITIONS];
            if (!WidgetComponent || !def) return null;

            return (
                <div key={key} data-grid={{ i: key, ...initialLayouts.lg.find(l => l.i === key) }}>
                    <Card title={def.title} icon={def.icon}>
                        <Suspense fallback={<div className="flex items-center justify-center h-full"><RefreshCw className="animate-spin" /></div>}>
                            <WidgetComponent />
                        </Suspense>
                    </Card>
                </div>
            );
        })
        .filter(Boolean);
};

const Dashboard: React.FC = () => {
    const [isAlertsModalOpen, setIsAlertsModalOpen] = useState(false);
    const [widgetVisibility, setWidgetVisibility] = useState<WidgetVisibility>({});
    
    const [layouts, setLayouts] = useState(() => {
        try {
            const savedLayouts = localStorage.getItem(STORAGE_KEY_LAYOUT);
            if (savedLayouts) {
                const parsed = JSON.parse(savedLayouts);
                // Ensure all keys from initial layout are present
                const lgLayout = initialLayouts.lg.map(initialItem => {
                    const savedItem = parsed.lg?.find((i: { i: string; }) => i.i === initialItem.i);
                    return savedItem || initialItem;
                });
                return { ...parsed, lg: lgLayout };
            }
        } catch (error) {
            console.error("Failed to load layout from localStorage", error);
        }
        return initialLayouts;
    });

     const [isLayoutLocked, setIsLayoutLocked] = useState(() => {
        try {
            // Default to locked state if the setting is not explicitly 'false'.
            // This makes the layout locked for new users or if the setting is cleared.
            return localStorage.getItem(STORAGE_KEY_LAYOUT_LOCKED) !== 'false';
        } catch (error) {
            console.error("Failed to load layout lock state", error);
            return true; // Default to locked on error for safety.
        }
    });
    
    const [breakpoint, setBreakpoint] = useState('lg');

    useEffect(() => {
        try {
            localStorage.setItem(STORAGE_KEY_LAYOUT_LOCKED, String(isLayoutLocked));
        } catch (e) {
            console.error("Failed to save layout lock state", e);
        }
    }, [isLayoutLocked]);


    useEffect(() => {
        const loadVisibility = () => {
            try {
                const savedVisibility = localStorage.getItem(STORAGE_KEY_WIDGET_VISIBILITY);
                const initialVisibility: WidgetVisibility = savedVisibility ? JSON.parse(savedVisibility) : {};
                // Ensure all widgets have a default value of true if not set
                Object.keys(WIDGET_DEFINITIONS).forEach(key => {
                    if (initialVisibility[key] === undefined) {
                        initialVisibility[key] = true;
                    }
                });
                setWidgetVisibility(initialVisibility);
            } catch (error) {
                console.error("Failed to load widget visibility", error);
                const allVisible: WidgetVisibility = {};
                Object.keys(WIDGET_DEFINITIONS).forEach(key => { allVisible[key] = true; });
                setWidgetVisibility(allVisible);
            }
        };

        loadVisibility();
        window.addEventListener('storage', loadVisibility);
        return () => window.removeEventListener('storage', loadVisibility);
    }, []);

    const onLayoutChange = useCallback((layout: any, allLayouts: any) => {
        if (isLayoutLocked) return;
        try {
            localStorage.setItem(STORAGE_KEY_LAYOUT, JSON.stringify(allLayouts));
            setLayouts(allLayouts);
        } catch (error) {
            console.error("Failed to save layout", error);
        }
    }, [isLayoutLocked]);

    const resetLayout = useCallback(() => {
        if(window.confirm("آیا از بازنشانی چیدمان داشبورد به حالت اولیه مطمئن هستید؟")) {
            try {
                localStorage.removeItem(STORAGE_KEY_LAYOUT);
                setLayouts(initialLayouts);
            } catch (error) {
                console.error("Failed to reset layout", error);
            }
        }
    }, []);
    
    const autoArrangeLayout = useCallback(() => {
        setLayouts(prevLayouts => {
            const currentBreakpointLayout = prevLayouts[breakpoint as keyof typeof prevLayouts];
            if (!currentBreakpointLayout) return prevLayouts;

            // Remove position to let RGL auto-place them compactly
            const newLayout = currentBreakpointLayout.map((l: any) => {
                const { x, y, ...rest } = l;
                return rest;
            });

            return {
                ...prevLayouts,
                [breakpoint]: newLayout
            };
        });
    }, [breakpoint]);

    const toggleLockLayout = useCallback(() => setIsLayoutLocked(prev => !prev), []);

    return (
        <div className="p-4 lg:p-6">
            <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold">مرکز فرماندهی</h1>
                    <p className="text-gray-500 dark:text-gray-400">خوش آمدید! این نمای کلی از وضعیت معاملاتی شماست.</p>
                </div>
                <div className="flex items-center gap-4">
                     <button onClick={toggleLockLayout} className="p-3 rounded-lg bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm border border-gray-200 dark:border-slate-700 hover:bg-gray-200/50 dark:hover:bg-slate-700/50" title={isLayoutLocked ? 'باز کردن قفل چیدمان' : 'قفل کردن چیدمان'}>
                        {isLayoutLocked ? <Lock className="w-6 h-6 text-red-500"/> : <Unlock className="w-6 h-6 text-green-500"/>}
                    </button>
                     <button onClick={autoArrangeLayout} className="p-3 rounded-lg bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm border border-gray-200 dark:border-slate-700 hover:bg-gray-200/50 dark:hover:bg-slate-700/50" title="چینش خودکار">
                        <Wand2 className="w-6 h-6 text-indigo-500"/>
                    </button>
                     <button onClick={resetLayout} className="p-3 rounded-lg bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm border border-gray-200 dark:border-slate-700 hover:bg-gray-200/50 dark:hover:bg-slate-700/50" title="بازنشانی چیدمان">
                        <LayoutDashboard className="w-6 h-6 text-indigo-500"/>
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
                onBreakpointChange={setBreakpoint}
                breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
                cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
                rowHeight={30}
                margin={[24, 24]}
                draggableHandle=".card-drag-handle"
                compactType="vertical"
                isDraggable={!isLayoutLocked}
                isResizable={!isLayoutLocked}
                className={isLayoutLocked ? 'layout-locked' : ''}
            >
                {generateWidgetDOM(widgetVisibility)}
            </ResponsiveGridLayout>

            <Suspense fallback={null}>
              {isAlertsModalOpen && <AlertsManager isOpen={isAlertsModalOpen} onClose={() => setIsAlertsModalOpen(false)} />}
            </Suspense>
        </div>
    );
};

export default Dashboard;