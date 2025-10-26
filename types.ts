export type Theme = 'light' | 'dark' | 'glass';

export interface EconomicEvent {
  id: string;
  time: Date;
  currency: string;
  countryCode: string; // e.g., 'US', 'EU', 'GB' for flags
  importance: 'High' | 'Medium' | 'Low';
  event: string;
  actual: string | null;
  forecast: string | null;
  previous: string | null;
  sourceUrl?: string;
  sentiment?: 'Bullish' | 'Bearish' | 'Neutral';
}


export type TradeOutcome = 'Take Profit' | 'Stop Loss' | 'Manual Exit';

export type EmotionBefore = 'مطمئن' | 'مضطرب' | 'هیجانی' | 'منظم';
export type EmotionAfter = 'رضایت' | 'پشیمانی' | 'شک' | 'هیجان‌زده';
export type EntryReason = 'ستاپ تکنیکال' | 'خبر' | 'دنبال کردن ترند' | 'ترس از دست دادن (FOMO)' | 'انتقام';


export interface JournalEntry {
    id: string;
    date: string;
    symbol?: string;
    side?: 'Buy' | 'Sell';
    entryPrice?: number;
    exitPrice?: number;
    stopLoss?: number;
    takeProfit?: number;
    outcome?: TradeOutcome;
    positionSize?: number;
    riskRewardRatio?: number;
    profitOrLoss?: number;
    status?: 'Win' | 'Loss' | 'Breakeven';
    setupId?: string;
    setupName?: string;
    tags?: string[];
    mistakes?: string[];
    notesBefore?: string;
    notesAfter?: string;
    imageUrl?: string;
    psychology?: {
        emotionBefore?: EmotionBefore;
        entryReason?: EntryReason;
        emotionAfter?: EmotionAfter;
    };
}

export interface OHLCData {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
}

// Types for Trading Setups
export interface TradingChecklistItem {
    id: string;
    text: string;
    description?: string;
}

export interface TradingSetup {
    id:string;
    name: string;
    description: string;
    category: string;
    checklist: TradingChecklistItem[];
    isActive: boolean;
    // New fields for smart-entry presets
    defaultRiskRewardRatio?: number;
    defaultTags?: string[];
    defaultMistakes?: string[];
}

export type WidgetVisibility = { [key: string]: boolean };

// Types for Alerts
export type AlertType = 'price' | 'news';
export type AlertStatus = 'active' | 'triggered';
export type PriceAlertCondition = 'crosses_above' | 'crosses_below';

export interface BaseAlert {
    id: string;
    type: AlertType;
    status: AlertStatus;
    createdAt: string; // ISO string
}

export interface PriceAlert extends BaseAlert {
    type: 'price';
    symbol: string;
    condition: PriceAlertCondition;
    targetPrice: number;
}

export interface NewsAlert extends BaseAlert {
    type: 'news';
    newsId: string; // To link back to the news item
    newsTitle: string;
    eventTime: string; // ISO string of the event
    triggerBeforeMinutes: number;
}

export type Alert = PriceAlert | NewsAlert;

// Types for Settings
export interface NotificationSettings {
    globalEnable: boolean;
    priceAlerts: boolean;
    newsAlerts: boolean;
    cryptoNewsAlerts?: boolean;
    stockNewsAlerts?: boolean;
}

export interface RiskSettings {
    accountBalance: number;
    strategy: 'fixed_percent' | 'anti_martingale';
    fixedPercent: {
        risk: number;
    };
    antiMartingale: {
        baseRisk: number;
        increment: number;
        maxRisk: number;
    };
}

// --- Journal Form Settings ---
export type JournalFormField =
    | 'symbol'
    | 'entryPrice' | 'stopLoss' | 'takeProfit' | 'positionSize'
    | 'outcome' | 'setupId' | 'imageUrl'
    | 'psychology.emotionBefore' | 'psychology.entryReason' | 'psychology.emotionAfter'
    | 'tags' | 'mistakes' | 'notesBefore' | 'notesAfter';

export interface FormFieldSetting {
    isActive: boolean;
    defaultValue?: any;
}

export type JournalFormSettings = {
    [key in JournalFormField]?: FormFieldSetting;
};

// --- Financial Calendar Page Types ---
export type MarketType = 'forex' | 'crypto' | 'stocks' | 'commodities';

export interface MarketEvent {
    id: string;
    time: string; // ISO String
    countryCode: string;
    currency: string;
    event: string;
    impact: 'High' | 'Medium' | 'Low';
    actual: string | null;
    forecast: string | null;
    previous: string | null;
}

export interface FinancialCalendarSettings {
    visibleTabs: {
        forex: boolean;
        crypto: boolean;
        stocks: boolean;
        commodities: boolean;
    };
    viewMode: 'compact' | 'expanded';
    // notification settings can be added later
}

// --- News Types ---
export interface CryptoNews {
    id: string;
    title: string;
    source: string;
    url: string;
    published_at: string; // ISO string
}

export interface GlobalStockNews {
    id: string;
    headline: string;
    source: string;
    url: string;
    summary: string;
    datetime: number; // unix timestamp
}