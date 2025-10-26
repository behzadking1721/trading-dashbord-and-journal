import React, { Suspense, useState, lazy, useEffect, useCallback } from 'react';
import Card from './shared/Card';
import { WIDGETS, WIDGET_DEFINITIONS } from '../constants';
import { RefreshCw, Clock, Bell } from 'lucide-react';
import type { WidgetVisibility } from '../types';

const AlertsManager = lazy(() => import('./AlertsManager'));

const STORAGE_KEY_WIDGET_VISIBILITY = 'dashboard-widget-visibility';

const Dashboard: React.FC = () => {
    const [isAlertsModalOpen, setIsAlertsModalOpen] = useState(false);
    const [widgetVisibility, setWidgetVisibility] = useState<WidgetVisibility>({});

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

    const renderWidget = (key: string) => {
        if (!widgetVisibility[key]) return null;

        const WidgetComponent = WIDGETS[key as keyof typeof WIDGETS];
        const def = WIDGET_DEFINITIONS[key as keyof typeof WIDGET_DEFINITIONS];
        if (!WidgetComponent || !def) return null;

        return (
            <Card title={def.title} icon={def.icon}>
                <Suspense fallback={<div className="flex items-center justify-center h-full"><RefreshCw className="animate-spin" /></div>}>
                    <WidgetComponent />
                </Suspense>
            </Card>
        );
    };

    return (
        <div className="p-4 lg:p-6">
            <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold">مرکز فرماندهی</h1>
                    <p className="text-gray-500 dark:text-gray-400">خوش آمدید! این نمای کلی از وضعیت معاملاتی شماست.</p>
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

            <div className="space-y-6">
                {/* Row 1: KPI Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
                    {renderWidget('performance_analytics')}
                    {renderWidget('wallet_overview')}
                    {renderWidget('risk_management')}
                    {renderWidget('trading_checklist')}
                </div>

                {/* Row 2: Main Content Area */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Main Column */}
                    <div className="lg:col-span-8 space-y-6">
                        {renderWidget('price_chart')}
                        {renderWidget('trades_table')}
                    </div>
                    {/* Sidebar Column */}
                    <div className="lg:col-span-4 space-y-6">
                        {renderWidget('ai_summary')}
                        {renderWidget('sessions_clock')}
                        {renderWidget('forex_news')}
                        {renderWidget('weather')}
                        {renderWidget('hafez_fortune')}
                    </div>
                </div>
            </div>


            <Suspense fallback={null}>
              {isAlertsModalOpen && <AlertsManager isOpen={isAlertsModalOpen} onClose={() => setIsAlertsModalOpen(false)} />}
            </Suspense>
        </div>
    );
};

export default Dashboard;
