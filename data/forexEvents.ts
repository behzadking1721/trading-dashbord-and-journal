import type { MarketEvent } from '../types';

// The new, reliable JSON endpoint provided by the user.
const JSON_URL = 'https://nfs.faireconomy.media/ff_calendar_thisweek.json?version=ecf12feb3895649f700076a2b3ef16f5';

const currencyToCountryCode: { [key: string]: string } = {
    USD: 'US', EUR: 'EU', GBP: 'GB', JPY: 'JP', CAD: 'CA', AUD: 'AU', NZD: 'NZ', CHF: 'CH', CNY: 'CN',
};

const parseImpact = (impact: string): MarketEvent['impact'] => {
    const lowerImpact = impact.toLowerCase();
    if (lowerImpact.includes('high')) return 'High';
    if (lowerImpact.includes('medium')) return 'Medium';
    // Treat 'Low' and 'Holiday' as 'Low' impact.
    if (lowerImpact.includes('low') || lowerImpact.includes('holiday')) return 'Low';
    return 'Low';
};

export const fetchForexEvents = async (): Promise<MarketEvent[]> => {
    try {
        const response = await fetch(JSON_URL);
        if (!response.ok) {
            throw new Error(`Failed to fetch calendar data: ${response.statusText}`);
        }
        const jsonData: any[] = await response.json();

        if (!Array.isArray(jsonData)) {
            throw new Error('Invalid data format received from API.');
        }

        const events: MarketEvent[] = jsonData
            .filter(item => item && typeof item.date === 'string' && !isNaN(new Date(item.date).getTime()))
            .map((item: any, index: number) => {
                const currency = item.country || 'N/A';
                return {
                    id: `ff-json-${item.date}-${currency}-${index}`,
                    time: item.date, // Already in ISO 8601 format
                    countryCode: currencyToCountryCode[currency] || currency,
                    currency: currency,
                    event: item.title,
                    impact: parseImpact(item.impact),
                    actual: item.actual || null,
                    forecast: item.forecast || null,
                    previous: item.previous || null,
                };
            });
        
        // Sort events by time, as the API might not guarantee order
        return events.sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());

    } catch (error)
    {
        console.error("Error fetching or parsing Forex Factory JSON data:", error);
        // Throw a user-friendly error message.
        throw new Error("Failed to load Forex Factory calendar data. Please check your connection.");
    }
};