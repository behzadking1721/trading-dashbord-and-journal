import type { GlobalStockNews } from '../types';

const MOCK_STOCKS_NEWS: Omit<GlobalStockNews, 'id' | 'datetime'>[] = [
    { headline: 'Fed Chair comments on inflation send S&P 500 futures lower', source: 'Bloomberg', url: '#', summary: 'Jerome Powell hinted at a hawkish stance, causing concern among investors about future rate hikes.' },
    { headline: 'NVIDIA stock hits new all-time high after positive earnings report', source: 'Wall Street Journal', url: '#', summary: 'The chipmaker giant exceeded expectations, boosting the entire tech sector.' },
    { headline: 'US Jobless claims unexpectedly fall, signaling strong labor market', source: 'Associated Press', url: '#', summary: 'The labor market remains resilient, which could influence the Federal Reserve\'s monetary policy.' },
    { headline: 'European markets mixed as traders digest ECB policy statements', source: 'Financial Times', url: '#', summary: 'The European Central Bank offered a cautious outlook on economic growth and inflation.' },
];

export const fetchMockGlobalStocksNews = (): Promise<GlobalStockNews[]> => {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            if (Math.random() > 0.1) { // 90% success
                const newsWithDates = MOCK_STOCKS_NEWS.map((item, index) => ({
                    ...item,
                    id: `stock-${index}-${Date.now()}`,
                    datetime: Math.floor(Date.now() / 1000) - (index * 25 + 10) * 60,
                }));
                resolve(newsWithDates);
            } else {
                reject(new Error('خطا در ارتباط با سرور اخبار بورس جهانی.'));
            }
        }, 1000); // Simulate network delay
    });
};