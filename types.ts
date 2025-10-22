import type { Layout } from 'react-grid-layout';

export type Theme = 'light' | 'dark' | 'glass';

export interface Trade {
  id: string;
  symbol: string;
  side: 'Buy' | 'Sell';
  qty: number;
  entryPrice: number;
  exitPrice?: number;
  stopLoss: number;
  takeProfit: number;
  resultPnL: number;
  date: string;
}

export interface NewsItem {
  id: string;
  title: string;
  time: Date;
  importance: 'High' | 'Medium' | 'Low';
  currency: string;
  link: string;
}

export interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
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
    strategy: string;
    preTradeThoughts: string;
    postTradeThoughts: string;
    status: 'Win' | 'Loss' | 'Breakeven';
}

export interface OHLCData {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
}