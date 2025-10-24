import type { MarketEvent } from '../types';

const generateMockData = (): MarketEvent[] => {
    const results: MarketEvent[] = [
        {
            id: 'commodities-1',
            time: new Date(Date.now() + 3600 * 1000 * 4).toISOString(),
            countryCode: 'US',
            currency: 'OIL',
            event: 'Crude Oil Inventories',
            impact: 'High',
            actual: null,
            forecast: '-2.1M',
            previous: '1.8M',
        },
        {
            id: 'commodities-2',
            time: new Date(Date.now() + 3600 * 1000 * 24 * 3).toISOString(),
            countryCode: 'OPEC',
            currency: 'OIL',
            event: 'OPEC-JMMC Meetings',
            impact: 'High',
            actual: null,
            forecast: null,
            previous: null,
        },
        {
            id: 'commodities-3',
            time: new Date(Date.now() - 3600 * 1000 * 20).toISOString(),
            countryCode: 'US',
            currency: 'GOLD',
            event: 'Gold Futures Rollover',
            impact: 'Low',
            actual: 'Completed',
            forecast: null,
            previous: null,
        },
         {
            id: 'commodities-4',
            time: new Date(Date.now() + 3600 * 1000 * 10).toISOString(),
            countryCode: 'US',
            currency: 'GAS',
            event: 'Natural Gas Storage',
            impact: 'Medium',
            actual: null,
            forecast: '75B',
            previous: '84B',
        },
    ];
    return results;
};


export const fetchCommoditiesEvents = (): Promise<MarketEvent[]> => {
    return new Promise(resolve => {
        setTimeout(() => {
            resolve(generateMockData());
        }, 700);
    });
};
