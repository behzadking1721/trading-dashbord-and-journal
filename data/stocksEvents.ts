import type { MarketEvent } from '../types';

const generateMockData = (): MarketEvent[] => {
    const results: MarketEvent[] = [
        {
            id: 'stocks-1',
            time: new Date(Date.now() + 3600 * 1000 * 2).toISOString(),
            countryCode: 'US',
            currency: 'USD',
            event: 'FOMC Meeting Minutes',
            impact: 'High',
            actual: null,
            forecast: null,
            previous: null,
        },
        {
            id: 'stocks-2',
            time: new Date(Date.now() + 3600 * 1000 * 24 * 2).toISOString(),
            countryCode: 'US',
            currency: 'NVDA',
            event: 'NVIDIA Corp. Earnings Report',
            impact: 'High',
            actual: null,
            forecast: '$2.5 EPS',
            previous: '$2.1 EPS',
        },
        {
            id: 'stocks-3',
            time: new Date(Date.now() - 3600 * 1000 * 3).toISOString(),
            countryCode: 'US',
            currency: 'AAPL',
            event: 'Apple Inc. Product Announcement',
            impact: 'Medium',
            actual: 'Announced',
            forecast: null,
            previous: null,
        },
        {
            id: 'stocks-4',
            time: new Date(Date.now() + 3600 * 1000 * 5).toISOString(),
            countryCode: 'US',
            currency: 'SPX',
            event: 'S&P 500 E-mini Futures Expiration',
            impact: 'Medium',
            actual: null,
            forecast: null,
            previous: null,
        }
    ];
    return results;
};


export const fetchStocksEvents = (): Promise<MarketEvent[]> => {
    return new Promise(resolve => {
        setTimeout(() => {
            resolve(generateMockData());
        }, 1000);
    });
};
