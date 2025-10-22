import React, { useState, useEffect, Suspense, lazy } from 'react';
import { Responsive, WidthProvider } from 'react-grid-layout';
import type { Layout, Layouts } from 'react-grid-layout';
import { openDB, IDBPDatabase } from 'idb';
import type { StoredLayouts } from '../types';
import Card from './shared/Card';
import { initialLayouts } from '../constants';
import { RefreshCw, RefreshCcw } from 'lucide-react';

const ResponsiveGridLayout = WidthProvider(Responsive);

const WIDGETS: { [key: string]: React.LazyExoticComponent<React.FC<any>> } = {
  price_chart: lazy(() => import('./widgets/PriceChartWidget')),
  forex_news: lazy(() => import('./widgets/ForexNewsWidget')),
  sessions_clock: lazy(() => import('./widgets/SessionsClockWidget')),
  trades_table: lazy(() => import('./widgets/TradesTableWidget')),
  risk_management: lazy(() => import('./widgets/RiskManagementWidget')),
  performance_analytics: lazy(() => import('./widgets/PerformanceAnalyticsWidget')),
  trading_checklist: lazy(() => import('./widgets/TradingChecklistWidget')),
  economic_calendar: lazy(() => import('./widgets/EconomicCalendarWidget')),
  alarms_reminders: lazy(() => import('./widgets/AlarmsRemindersWidget')),
  system_status: lazy(() => import('./widgets/SystemStatusWidget')),
  weather: lazy(() => import('./widgets/WeatherWidget')),
  hafez_fortune: lazy(() => import('./widgets/HafezFortuneWidget')),
  motivational_quote: lazy(() => import('./widgets/MotivationalQuoteWidget')),
  daily_education: lazy(() => import('./widgets/DailyEducationWidget')),
  wallet_overview: lazy(() => import('./widgets/WalletOverviewWidget')),
};

const WIDGET_TITLES: { [key: string]: string } = {
  price_chart: 'نمودار قیمت',
  forex_news: 'اخبار لحظه‌ای فارکس',
  sessions_clock: 'سشن‌های معاملاتی و ساعت جهانی',
  trades_table: 'تاریخچه معاملات',
  risk_management: 'مدیریت ریسک',
  performance_analytics: 'تحلیل عملکرد',
  trading_checklist: 'چک‌لیست ترید',
  economic_calendar: 'تقویم اقتصادی',
  alarms_reminders: 'آلارم‌ها و یادآورها',
  system_status: 'وضعیت سیستم',
  weather: 'هواشناسی',
  hafez_fortune: 'فال حافظ',
  motivational_quote: 'جمله انگیزشی',
  daily_education: 'آموزش روزانه',
  wallet_overview: 'نمای کلی کیف پول',
};

// Define the canonical list of all widget keys.
const WIDGET_KEYS = Object.keys(WIDGETS);

let dbPromise: Promise<IDBPDatabase> | null = null;
const getLayoutDb = () => {
    if (!dbPromise) {
        dbPromise = openDB('dashboard-db', 1, {
            upgrade(db) {
                if (!db.objectStoreNames.contains('layouts')) {
                    db.createObjectStore('layouts');
                }
            },
        });
    }
    return dbPromise;
};


const Dashboard: React.FC = () => {
  const [layouts, setLayouts] = useState<Layouts>(initialLayouts);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    const loadLayout = async () => {
      try {
        const db = await getLayoutDb();
        const savedLayouts = await db.get('layouts', 'userLayout');
        if (savedLayouts) {
          setLayouts(savedLayouts);
        }
      } catch (error) {
        console.error("Failed to load layout from IndexedDB", error);
        setLayouts(initialLayouts);
      }
    };
    loadLayout();
  }, []);

  const handleLayoutChange = (layout: Layout[], allLayouts: Layouts) => {
    setLayouts(allLayouts);
    saveLayout(allLayouts as StoredLayouts);
  };

  const saveLayout = async (layoutsToSave: StoredLayouts) => {
    try {
      const db = await getLayoutDb();
      await db.put('layouts', layoutsToSave, 'userLayout');
    } catch (error) {
      console.error("Failed to save layout to IndexedDB", error);
    }
  };

  const resetLayout = () => {
    setLayouts(initialLayouts);
    saveLayout(initialLayouts as StoredLayouts);
  };

  if (!isClient) {
    return null; 
  }

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold">داشبورد</h1>
          <button
              onClick={resetLayout}
              className="flex items-center gap-2 text-sm px-3 py-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              title="بازنشانی چیدمان"
            >
              <RefreshCcw className="w-4 h-4" />
              <span>بازنشانی چیدمان</span>
        </button>
      </div>
      <ResponsiveGridLayout
        className="layout"
        layouts={layouts}
        breakpoints={{ lg: 1200, md: 996, sm: 768 }}
        cols={{ lg: 12, md: 10, sm: 6 }}
        rowHeight={30}
        onLayoutChange={handleLayoutChange}
        isDraggable={true}
        isResizable={true}
        draggableHandle=".drag-handle"
      >
        {WIDGET_KEYS.map((key) => {
          const WidgetComponent = WIDGETS[key];
          return (
            <div key={key}>
              <Card title={WIDGET_TITLES[key] || 'کارت'}>
                 <Suspense fallback={<div className="flex items-center justify-center h-full"><RefreshCw className="animate-spin" /></div>}>
                    {WidgetComponent ? <WidgetComponent /> : <div>کامپوننت یافت نشد.</div>}
                 </Suspense>
              </Card>
            </div>
          );
        })}
      </ResponsiveGridLayout>
    </div>
  );
};

export default Dashboard;