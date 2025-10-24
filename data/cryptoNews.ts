import type { CryptoNews } from '../types';

const MOCK_CRYPTO_NEWS: Omit<CryptoNews, 'id' | 'published_at'>[] = [
    { title: 'Bitcoin nears $70k as market sentiment improves', source: 'CoinDesk', url: '#' },
    { title: 'Ethereum Foundation announces details for next major upgrade', source: 'The Block', url: '#' },
    { title: 'US SEC delays decision on spot Ethereum ETF', source: 'Reuters', url: '#' },
    { title: 'Solana network activity surges amid meme coin frenzy', source: 'Decrypt', url: '#' },
    { title: 'Crypto market cap surpasses $2.5 trillion for the first time since 2021', source: 'CoinTelegraph', url: '#' },
];

export const fetchMockCryptoNews = (): Promise<CryptoNews[]> => {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            if (Math.random() > 0.1) { // 90% success
                const newsWithDates = MOCK_CRYPTO_NEWS.map((item, index) => ({
                    ...item,
                    id: `crypto-${index}-${Date.now()}`,
                    published_at: new Date(Date.now() - (index * 15 + 5) * 60000).toISOString(), // 5, 20, 35 mins ago etc.
                }));
                resolve(newsWithDates);
            } else {
                reject(new Error('خطا در ارتباط با سرور اخبار کریپتو.'));
            }
        }, 800); // Simulate network delay
    });
};