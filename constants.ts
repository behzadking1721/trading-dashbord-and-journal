import { lazy } from 'react';
import type { Layouts } from 'react-grid-layout';
import {
    LineChart, Flame, Globe, History, ShieldAlert,
    TrendingUp, ListChecks, Wallet
} from 'lucide-react';

export const WIDGETS: { [key: string]: React.LazyExoticComponent<React.FC<any>> } = {
  price_chart: lazy(() => import('./components/widgets/PriceChartWidget')),
  forex_news: lazy(() => import('./components/widgets/ForexNewsWidget')),
  sessions_clock: lazy(() => import('./components/widgets/SessionsClockWidget')),
  trades_table: lazy(() => import('./components/widgets/TradesTableWidget')),
  risk_management: lazy(() => import('./components/widgets/RiskManagementWidget')),
  performance_analytics: lazy(() => import('./components/widgets/PerformanceAnalyticsWidget')),
  trading_checklist: lazy(() => import('./components/widgets/TradingChecklistWidget')),
  wallet_overview: lazy(() => import('./components/widgets/WalletOverviewWidget')),
};

export const WIDGET_DEFINITIONS: { [key: string]: { title: string, icon: React.ElementType, description: string } } = {
  price_chart: { title: 'نمودار قیمت', icon: LineChart, description: 'نمودار تعاملی قیمت برای تحلیل تکنیکال.' },
  forex_news: { title: 'اخبار لحظه‌ای فارکس', icon: Flame, description: 'نمایش اخبار و رویدادهای مهم اقتصادی.' },
  sessions_clock: { title: 'سشن‌های معاملاتی', icon: Globe, description: 'وضعیت بازارهای جهانی و ساعت سشن‌ها.' },
  trades_table: { title: 'آخرین معاملات', icon: History, description: 'نمایش سریع آخرین معاملات ثبت‌شده در ژورنال.' },
  risk_management: { title: 'مدیریت ریسک', icon: ShieldAlert, description: 'تحلیل ریسک فعال و توزیع نمادها.' },
  performance_analytics: { title: 'تحلیل عملکرد', icon: TrendingUp, description: 'شاخص‌های کلیدی عملکرد مانند نرخ برد و R/R.' },
  trading_checklist: { title: 'چک‌لیست ترید', icon: ListChecks, description: 'چک‌لیست ستاپ معاملاتی فعال شما.' },
  wallet_overview: { title: 'نمای کلی کیف پول', icon: Wallet, description: 'نمایش موجودی و سرمایه کل حساب.' },
};


export const initialLayouts: Layouts = {
  lg: [
    // Row 1
    { i: 'price_chart', x: 0, y: 0, w: 9, h: 12 },
    { i: 'trading_checklist', x: 9, y: 0, w: 3, h: 12 },
    // Row 2
    { i: 'performance_analytics', x: 0, y: 12, w: 4, h: 7 },
    { i: 'wallet_overview', x: 4, y: 12, w: 2, h: 7 },
    { i: 'risk_management', x: 6, y: 12, w: 6, h: 7 },
     // Row 3
    { i: 'trades_table', x: 0, y: 19, w: 12, h: 8 },
    // Row 4
    { i: 'sessions_clock', x: 0, y: 27, w: 6, h: 9 },
    { i: 'forex_news', x: 6, y: 27, w: 6, h: 9 },
  ],
  md: [
    { i: 'price_chart', x: 0, y: 0, w: 10, h: 10 },
    { i: 'trading_checklist', x: 0, y: 10, w: 10, h: 8 },
    { i: 'performance_analytics', x: 0, y: 18, w: 5, h: 7 },
    { i: 'wallet_overview', x: 5, y: 18, w: 5, h: 7 },
    { i: 'risk_management', x: 0, y: 25, w: 10, h: 7 },
    { i: 'trades_table', x: 0, y: 32, w: 10, h: 8 },
    { i: 'sessions_clock', x: 0, y: 40, w: 10, h: 9 },
    { i: 'forex_news', x: 0, y: 49, w: 10, h: 9 },
  ],
  sm: [
    { i: 'price_chart', x: 0, y: 0, w: 6, h: 10 },
    { i: 'performance_analytics', x: 0, y: 10, w: 6, h: 7 },
    { i: 'wallet_overview', x: 0, y: 17, w: 6, h: 7 },
    { i: 'risk_management', x: 0, y: 24, w: 6, h: 7 },
    { i: 'trading_checklist', x: 0, y: 31, w: 6, h: 8 },
    { i: 'trades_table', x: 0, y: 39, w: 6, h: 8 },
    { i: 'sessions_clock', x: 0, y: 47, w: 6, h: 9 },
    { i: 'forex_news', x: 0, y: 56, w: 6, h: 9 },
  ],
};