import React from 'react';
import { lazy } from 'react';
import {
    LineChart, Flame, Globe, History, ShieldAlert,
    TrendingUp, ListChecks, Wallet, Sparkles, CloudSun, BookOpen
} from 'lucide-react';
import type { JournalFormField } from './types';

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


export const JOURNAL_FORM_FIELDS: { id: JournalFormField; label: string; type: 'text' | 'number' | 'select' | 'special'; placeholder?: string; }[] = [
  { id: 'symbol', label: 'نماد', type: 'text', placeholder: 'EURUSD' },
  { id: 'entryPrice', label: 'قیمت ورود', type: 'number', placeholder: '1.2345' },
  { id: 'stopLoss', label: 'حد ضرر', type: 'number', placeholder: '1.2300' },
  { id: 'takeProfit', label: 'حد سود', type: 'number', placeholder: '1.2400' },
  { id: 'outcome', label: 'نتیجه معامله', type: 'special' },
  { id: 'positionSize', label: 'حجم (لات)', type: 'number', placeholder: '0.01' },
  { id: 'setupId', label: 'ستاپ معاملاتی', type: 'select' },
  { id: 'imageUrl', label: 'تصویر چارت', type: 'special' },
  { id: 'psychology.emotionBefore', label: 'احساس قبل از ورود', type: 'select' },
  { id: 'psychology.entryReason', label: 'انگیزه ورود', type: 'select' },
  { id: 'psychology.emotionAfter', label: 'احساس بعد از خروج', type: 'select' },
  { id: 'tags', label: 'تگ‌ها', type: 'special' },
  { id: 'mistakes', label: 'اشتباهات', type: 'special' },
  { id: 'notesBefore', label: 'یادداشت‌های قبل', type: 'special' },
  { id: 'notesAfter', label: 'یادداشت‌های بعد', type: 'special' },
];
