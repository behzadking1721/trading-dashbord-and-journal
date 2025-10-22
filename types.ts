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
}


export type TradeOutcome = 'Take Profit' | 'Stop Loss' | 'Manual Exit';

export interface JournalEntry {
    id: string;
    date: string;
    symbol: string;
    side: 'Buy' | 'Sell';
    entryPrice: number;
    exitPrice: number;
    stopLoss: number;
    takeProfit: number;
    outcome: TradeOutcome;
    positionSize: number;
    riskRewardRatio: number;
    profitOrLoss: number;
    status: 'Win' | 'Loss' | 'Breakeven';
    setupId?: string; // Link to the TradingSetup
    setupName?: string; // Denormalized for easy display
    emotions?: string[];
    mistakes?: string[];
    notesBefore?: string;
    notesAfter?: string;
    imageUrl?: string; // For chart screenshots
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
    id: string;
    name: string;
    description: string;
    category: string;
    checklist: TradingChecklistItem[];
    isActive: boolean;
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