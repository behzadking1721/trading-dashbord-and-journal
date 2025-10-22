import type { Layout } from 'react-grid-layout';

export type Theme = 'light' | 'dark' | 'glass';

export interface NewsItem {
  id: string;
  title: string;
  time: Date;
  importance: 'High' | 'Medium' | 'Low';
  currency: string;
  link: string;
  actual?: string;
  forecast?: string;
  previous?: string;
}

export type StoredLayouts = {
  lg: Layout[];
  md: Layout[];
  sm: Layout[];
};

export interface JournalEntry {
    id: string;
    date: string;
    symbol: string;
    side: 'Buy' | 'Sell';
    entryPrice: number;
    exitPrice: number;
    stopLoss: number;
    takeProfit: number;
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