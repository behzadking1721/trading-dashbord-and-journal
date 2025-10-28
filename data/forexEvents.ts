import type { MarketEvent } from '../types';

const CSV_URL = 'https://nfs.faireconomy.media/ff_calendar_thisweek.csv?version=ecf12feb3895649f700076a2b3ef16f5';
const PROXY_URL = 'https://corsproxy.io/?';

const currencyToCountryCode: { [key: string]: string } = {
    USD: 'US', EUR: 'EU', GBP: 'GB', JPY: 'JP', CAD: 'CA', AUD: 'AU', NZD: 'NZ', CHF: 'CH', CNY: 'CN',
};

const parseImpact = (impact: string): MarketEvent['impact'] => {
    const lowerImpact = impact.toLowerCase();
    if (lowerImpact.includes('high')) return 'High';
    if (lowerImpact.includes('medium') || lowerImpact.includes('moderate')) return 'Medium';
    if (lowerImpact.includes('low')) return 'Low';
    return 'Low'; // Default for non-impact events like holidays
};

const parseDateTime = (dateStr: string, timeStr: string): Date => {
    const now = new Date();
    const currentYear = now.getFullYear();
    
    // The date format is MM-DD
    const [month, day] = dateStr.split('-').map(Number);
    
    let hours = 0;
    let minutes = 0;
    
    if (timeStr.toLowerCase() !== 'all day') {
        const timeMatch = timeStr.match(/(\d{1,2}):(\d{2})(am|pm)/i);
        if (timeMatch) {
            hours = parseInt(timeMatch[1], 10);
            minutes = parseInt(timeMatch[2], 10);
            const period = timeMatch[3].toLowerCase();

            if (period === 'pm' && hours < 12) {
                hours += 12;
            }
            if (period === 'am' && hours === 12) { // Midnight case
                hours = 0;
            }
        }
    }
    
    // Create date object. Assuming the times are in the user's local timezone for simplicity.
    const eventDate = new Date(currentYear, month - 1, day, hours, minutes);
    
    // Handle year rollover (e.g., if it's January and the event is for December)
    if (now.getMonth() === 0 && eventDate.getMonth() === 11) {
        eventDate.setFullYear(currentYear - 1);
    }
    // Handle year rollover (e.g., if it's December and the event is for January)
    else if (now.getMonth() === 11 && eventDate.getMonth() === 0) {
        eventDate.setFullYear(currentYear + 1);
    }

    return eventDate;
};


// Simple CSV parser that handles quoted fields
const parseCsvLine = (line: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            result.push(current.trim());
            current = '';
        } else {
            current += char;
        }
    }
    result.push(current.trim());
    return result;
}


export const fetchForexEvents = async (): Promise<MarketEvent[]> => {
    try {
        const response = await fetch(`${PROXY_URL}${CSV_URL}`);
        if (!response.ok) {
            throw new Error(`Failed to fetch calendar data: ${response.statusText}`);
        }
        const csvText = await response.text();
        const lines = csvText.trim().split('\n');
        
        // Skip header
        const dataLines = lines.slice(1);
        
        const events: MarketEvent[] = dataLines.map((line, index) => {
            const columns = parseCsvLine(line);
            
            // Expected columns: Date,Time,Currency,Impact,Event,Actual,Forecast,Previous
            if (columns.length < 8) {
                console.warn(`Skipping invalid CSV line ${index + 2}: ${line}`);
                return null;
            }

            const [date, time, currency, impact, event, actual, forecast, previous] = columns;

            if (!date || !time || !currency) {
                return null;
            }

            const eventTime = parseDateTime(date, time);

            return {
                id: `ff-${date}-${time}-${currency}-${index}`,
                time: eventTime.toISOString(),
                countryCode: currencyToCountryCode[currency] || currency,
                currency: currency,
                event: event.replace(/"/g, ''), // Remove quotes if any
                impact: parseImpact(impact),
                actual: actual || null,
                forecast: forecast || null,
                previous: previous || null,
            };
        }).filter((event): event is MarketEvent => event !== null);

        return events;

    } catch (error) {
        console.error("Error fetching or parsing Forex Factory data:", error);
        throw new Error("Failed to load Forex Factory calendar data.");
    }
};