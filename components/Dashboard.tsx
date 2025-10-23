import React, { Suspense, useState, lazy } from 'react';
import Card from './shared/Card';
import { WIDGETS, WIDGET_DEFINITIONS } from '../constants';
import { RefreshCw, Clock, Bell } from 'lucide-react';

const AlertsManager = lazy(() => import('./AlertsManager'));

const Dashboard: React.FC = () => {
    const [isAlertsModalOpen, setIsAlertsModalOpen] = useState(false);

    // This is a helper function to avoid repeating the Suspense and Card logic
    const renderWidget = (widgetKey: keyof typeof WIDGETS, customContainerClass: string = "") => {
        const WidgetComponent = WIDGETS[widgetKey];
        const def = WIDGET_DEFINITIONS[widgetKey];
        if (!WidgetComponent || !def) return null;

        return (
            <div className={customContainerClass}>
                <Card title={def.title} icon={def.icon}>
                    <Suspense fallback={<div className="flex items-center justify-center h-full"><RefreshCw className="animate-spin" /></div>}>
                        <WidgetComponent />
                    </Suspense>
                </Card>
            </div>
        );
    };

    return (
        <div className="p-4 lg:p-6 space-y-6">
            {/* Smart Header */}
            <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold">مرکز فرماندهی</h1>
                    <p className="text-gray-500 dark:text-gray-400">خوش آمدید! این نمای کلی از وضعیت معاملاتی شماست.</p>
                </div>
                <div className="flex items-center gap-4">
                     <button onClick={() => setIsAlertsModalOpen(true)} className="p-3 rounded-lg bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border border-gray-200 dark:border-gray-700 hover:bg-gray-200/50 dark:hover:bg-gray-700/50" title="هشدارها">
                        <Bell className="w-6 h-6 text-indigo-500"/>
                    </button>
                    <div className="flex items-center gap-4 p-3 rounded-lg bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border border-gray-200 dark:border-gray-700">
                         <div className="text-right">
                            <p className="font-semibold">{new Date().toLocaleDateString('fa-IR-u-nu-latn', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                            <p className="text-xs text-gray-500">ساعت به وقت تهران</p>
                        </div>
                         <Clock className="w-8 h-8 text-indigo-500" />
                    </div>
                </div>
            </header>

            {/* Main Grid Layout */}
            <main className="space-y-6">
                {/* Section 1: KPIs & Readiness */}
                <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                    {renderWidget('performance_analytics')}
                    {renderWidget('wallet_overview')}
                    {renderWidget('risk_management')}
                    {renderWidget('trading_checklist')}
                </section>
                
                {/* Section 2 & 3: Market Analysis, Execution & Environmental Info */}
                <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main column */}
                    <div className="lg:col-span-2 space-y-6">
                        {renderWidget('price_chart', "h-[450px]")}
                        {renderWidget('trades_table')}
                    </div>
                    {/* Side column */}
                    <div className="lg:col-span-1 space-y-6">
                        {renderWidget('ai_summary')}
                        {renderWidget('sessions_clock')}
                        {renderWidget('forex_news')}
                        {renderWidget('weather')}
                        {renderWidget('hafez_fortune')}
                    </div>
                </section>
            </main>

            <Suspense fallback={null}>
              {isAlertsModalOpen && <AlertsManager isOpen={isAlertsModalOpen} onClose={() => setIsAlertsModalOpen(false)} />}
            </Suspense>
        </div>
    );
};

export default Dashboard;