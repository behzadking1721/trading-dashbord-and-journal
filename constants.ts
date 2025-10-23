import React from 'react';
import { lazy } from 'react';
import {
    LineChart, Flame, Globe, History, ShieldAlert,
    TrendingUp, ListChecks, Wallet, Sparkles, CloudSun, BookOpen
} from 'lucide-react';

export const WIDGETS: { [key: string]: React.LazyExoticComponent<React.FC<any>> } = {
  price_chart: lazy(() => import('./components/widgets/PriceChartWidget')),
  forex_news: lazy(() => import('./components/widgets/ForexNewsWidget')),
  sessions_clock: lazy(() => import('./components/widgets/SessionsClockWidget')),
  trades_table: lazy(() => import('./components/widgets/TradesTableWidget')),
  risk_management: lazy(() => import('./components/widgets/RiskManagementWidget')),
  performance_analytics: lazy(() => import('./components/widgets/PerformanceAnalyticsWidget')),
  trading_checklist: lazy(() => import('./components/widgets/TradingChecklistWidget')),
  ai_summary: lazy(() => import('./components/widgets/AISummaryWidget')),
  wallet_overview: lazy(() => import('./components/widgets/WalletOverviewWidget')),
  weather: lazy(() => import('./components/widgets/WeatherWidget')),
  hafez_fortune: lazy(() => import('./components/widgets/HafezFortuneWidget')),
};

export const WIDGET_DEFINITIONS: { [key: string]: { title: string, icon: React.ElementType, description: string } } = {
  price_chart: { title: 'نمودار قیمت', icon: LineChart, description: 'نمودار تعاملی قیمت برای تحلیل تکنیکال.' },
  forex_news: { title: 'اخبار لحظه‌ای فارکس', icon: Flame, description: 'نمایش اخبار و رویدادهای مهم اقتصادی.' },
  sessions_clock: { title: 'سشن‌های معاملاتی', icon: Globe, description: 'وضعیت بازارهای جهانی و ساعت سشن‌ها.' },
  trades_table: { title: 'آخرین معاملات', icon: History, description: 'نمایش سریع آخرین معاملات ثبت‌شده در ژورنال.' },
  risk_management: { title: 'مدیریت ریسک', icon: ShieldAlert, description: 'تحلیل ریسک فعال و توزیع نمادها.' },
  performance_analytics: { title: 'تحلیل عملکرد', icon: TrendingUp, description: 'شاخص‌های کلیدی عملکرد مانند نرخ برد و R/R.' },
  trading_checklist: { title: 'چک‌لیست ترید', icon: ListChecks, description: 'چک‌لیست ستاپ معاملاتی فعال شما.' },
  ai_summary: { title: 'تحلیل هوشمند بازار', icon: Sparkles, description: 'دریافت خلاصه‌ای از وضعیت بازار با کمک هوش مصنوعی.' },
  wallet_overview: { title: 'نمای کلی کیف پول', icon: Wallet, description: 'نمایش موجودی و سرمایه کل حساب.' },
  weather: { title: 'وضعیت آب و هوا', icon: CloudSun, description: 'نمایش وضعیت آب و هوای فعلی موقعیت شما.' },
  hafez_fortune: { title: 'فال حافظ', icon: BookOpen, description: 'یک غزل از دیوان حافظ برای الهام روزانه.' },
};