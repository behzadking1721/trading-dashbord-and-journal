import type { MarketEvent } from '../types';

const generateMockData = (): MarketEvent[] => {
    const events: Omit<MarketEvent, 'id' | 'time'>[] = [
        { event: 'Non-Farm Payrolls', currency: 'USD', countryCode: 'US', impact: 'High', forecast: '180K', previous: '175K', actual: null },
        { event: 'ECB Press Conference', currency: 'EUR', countryCode: 'EU', impact: 'High', forecast: '', previous: '', actual: null },
        { event: 'Retail Sales m/m', currency: 'GBP', countryCode: 'GB', impact: 'Medium', forecast: '0.5%', previous: '0.2%', actual: null },
        { event: 'Unemployment Rate', currency: 'CAD', countryCode: 'CA', impact: 'Low', forecast: '5.8%', previous: '5.8%', actual: null },
        { event: 'CPI m/m', currency: 'USD', countryCode: 'US', impact: 'Medium', forecast: '0.3%', previous: '0.4%', actual: null },
        { event: 'BoJ Policy Rate', currency: 'JPY', countryCode: 'JP', impact: 'High', forecast: '0.10%', previous: '0.10%', actual: null },
    ];
    
    const results: MarketEvent[] = [];
    
    // Past events
    for (let i = 1; i <= 2; i++) {
        const eventTime = new Date();
        eventTime.setHours(eventTime.getHours() - i * 4);
        const randomEvent = events[Math.floor(Math.random() * events.length)];
        results.push({
            ...randomEvent,
            id: `forex-past-${i}`,
            time: eventTime.toISOString(),
            actual: (parseFloat(randomEvent.previous || '0') * (1 + (Math.random() - 0.5) * 0.1)).toFixed(1) + (randomEvent.forecast?.includes('%') ? '%' : ''),
        });
    }
    
    // Future events
    for (let i = 1; i <= 5; i++) {
        const eventTime = new Date();
        eventTime.setHours(eventTime.getHours() + i * 3);
        const randomEvent = events[Math.floor(Math.random() * events.length)];
        results.push({
            ...randomEvent,
            id: `forex-future-${i}`,
            time: eventTime.toISOString(),
        });
    }

    return results;
};

export const fetchForexEvents = (): Promise<MarketEvent[]> => {
    return new Promise(resolve => {
        setTimeout(() => {
            resolve(generateMockData());
        }, 800);
    });
};
