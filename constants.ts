
import type { Layouts } from 'react-grid-layout';

export const initialLayouts: Layouts = {
  lg: [
    // Row 1
    { i: 'price_chart', x: 0, y: 0, w: 12, h: 10 },
    // Row 2
    { i: 'forex_news', x: 0, y: 10, w: 6, h: 8 },
    { i: 'sessions_clock', x: 6, y: 10, w: 6, h: 8 },
    // Row 3
    { i: 'trades_table', x: 0, y: 18, w: 12, h: 10 },
    // Row 4
    { i: 'performance_analytics', x: 0, y: 28, w: 6, h: 9 },
    { i: 'risk_management', x: 6, y: 28, w: 6, h: 9 },
    // Row 5
    { i: 'trading_checklist', x: 0, y: 37, w: 6, h: 8 },
    { i: 'economic_calendar', x: 6, y: 37, w: 6, h: 8 },
    // Row 6
    { i: 'alarms_reminders', x: 0, y: 45, w: 3, h: 7 },
    { i: 'system_status', x: 3, y: 45, w: 3, h: 7 },
    { i: 'wallet_overview', x: 6, y: 45, w: 3, h: 7 },
    // Row 7 (Side widgets)
    { i: 'weather', x: 9, y: 45, w: 3, h: 7 },
    { i: 'hafez_fortune', x: 0, y: 52, w: 3, h: 7 },
    { i: 'motivational_quote', x: 3, y: 52, w: 3, h: 7 },
    { i: 'daily_education', x: 6, y: 52, w: 6, h: 7 },
  ],
  md: [
    // This is a simplified layout for medium screens, adjust as needed
    { i: 'price_chart', x: 0, y: 0, w: 10, h: 10 },
    { i: 'forex_news', x: 0, y: 10, w: 5, h: 8 },
    { i: 'sessions_clock', x: 5, y: 10, w: 5, h: 8 },
    { i: 'trades_table', x: 0, y: 18, w: 10, h: 10 },
    { i: 'performance_analytics', x: 0, y: 28, w: 5, h: 9 },
    { i: 'risk_management', x: 5, y: 28, w: 5, h: 9 },
    { i: 'trading_checklist', x: 0, y: 37, w: 10, h: 6 },
    { i: 'economic_calendar', x: 0, y: 43, w: 10, h: 6 },
  ],
  sm: [
    // Single column layout for small screens
    { i: 'price_chart', x: 0, y: 0, w: 6, h: 10 },
    { i: 'forex_news', x: 0, y: 10, w: 6, h: 8 },
    { i: 'sessions_clock', x: 0, y: 18, w: 6, h: 8 },
    { i: 'trades_table', x: 0, y: 26, w: 6, h: 10 },
    { i: 'performance_analytics', x: 0, y: 36, w: 6, h: 9 },
    { i: 'risk_management', x: 0, y: 45, w: 6, h: 9 },
  ],
};
