import type { MarketEvent } from '../types';

const generateMockData = (): MarketEvent[] => {
    const results: MarketEvent[] = [
        {
            id: 'crypto-1',
            time: new Date(Date.now() + 3600 * 1000 * 24 * 5).toISOString(),
            countryCode: 'CRYPTO',
            currency: 'BTC',
            event: 'Bitcoin Halving',
            impact: 'High',
            actual: null,
            forecast: 'Block 840,000',
            previous: 'Block 630,000',
        },
        {
            id: 'crypto-2',
            time: new Date(Date.now() + 3600 * 1000 * 8).toISOString(),
            countryCode: 'CRYPTO',
            currency: 'ETH',
            event: 'Ethereum "Pectra" Upgrade',
            impact: 'High',
            actual: null,
            forecast: 'Q4 2024',
            previous: 'Dencun',
        },
         {
            id: 'crypto-3',
            time: new Date(Date.now() - 3600 * 1000 * 5).toISOString(),
            countryCode: 'US',
            currency: 'CRYPTO',
            event: 'SEC Decision on Spot ETH ETF',
            impact: 'High',
            actual: 'Delayed',
            forecast: 'Approval',
            previous: 'Pending',
        },
        {
            id: 'crypto-4',
            time: new Date(Date.now() + 3600 * 1000 * 12).toISOString(),
            countryCode: 'CRYPTO',
            currency: 'SOL',
            event: 'Solana Network v1.18 Mainnet Release',
            impact: 'Medium',
            actual: null,
            forecast: 'Target Release',
            previous: 'v1.17',
        },
    ];
    return results;
};


export const fetchCryptoEvents = (): Promise<MarketEvent[]> => {
    return new Promise(resolve => {
        setTimeout(() => {
            resolve(generateMockData());
        }, 600);
    });
};
