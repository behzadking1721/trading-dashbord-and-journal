import React, { useState, useEffect, useRef } from 'react';
import { Bitcoin, Waves, CandlestickChart, BarChart } from 'lucide-react';

interface Price {
    value: number;
    change: 'up' | 'down' | 'none';
}

type Prices = {
    [key: string]: Price;
};

const SYMBOLS_CONFIG = {
    BTC: { icon: Bitcoin, name: 'Bitcoin', initial: 68500.00, factor: 50, digits: 2 },
    ETH: { icon: Waves, name: 'Ethereum', initial: 3500.00, factor: 10, digits: 2 },
    EURUSD: { icon: CandlestickChart, name: 'EUR/USD', initial: 1.0850, factor: 0.0001, digits: 5 },
    SP500: { icon: BarChart, name: 'S&P 500', initial: 5280.50, factor: 0.5, digits: 2 },
};

const LivePricesWidget: React.FC = () => {
    const [prices, setPrices] = useState<Prices>(() => {
        const initialPrices: Prices = {};
        Object.keys(SYMBOLS_CONFIG).forEach(key => {
            initialPrices[key] = { value: SYMBOLS_CONFIG[key as keyof typeof SYMBOLS_CONFIG].initial, change: 'none' };
        });
        return initialPrices;
    });

    // Fix: Use ReturnType<typeof setTimeout> for browser compatibility instead of NodeJS.Timeout
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        const updatePrices = () => {
            setPrices(currentPrices => {
                const newPrices: Prices = {};
                Object.keys(currentPrices).forEach(key => {
                    const config = SYMBOLS_CONFIG[key as keyof typeof SYMBOLS_CONFIG];
                    const randomChange = (Math.random() - 0.49) * config.factor;
                    const oldValue = currentPrices[key].value;
                    const newValue = oldValue + randomChange;

                    let changeDirection: 'up' | 'down' | 'none' = 'none';
                    if (newValue > oldValue) changeDirection = 'up';
                    else if (newValue < oldValue) changeDirection = 'down';

                    newPrices[key] = { value: newValue, change: changeDirection };
                });
                return newPrices;
            });

            // Reset change color after animation
            timeoutRef.current = setTimeout(() => {
                 setPrices(currentPrices => {
                    const resetPrices: Prices = {};
                    Object.keys(currentPrices).forEach(key => {
                        resetPrices[key] = { ...currentPrices[key], change: 'none' };
                    });
                    return resetPrices;
                });
            }, 500);
        };
        
        const interval = setInterval(updatePrices, 2000); // Update every 2 seconds

        return () => {
            clearInterval(interval);
            if(timeoutRef.current) clearTimeout(timeoutRef.current);
        };
    }, []);

    const getChangeColor = (change: 'up' | 'down' | 'none') => {
        switch (change) {
            case 'up': return 'bg-green-500/20 text-green-500';
            case 'down': return 'bg-red-500/20 text-red-500';
            default: return 'bg-transparent';
        }
    };

    return (
        <div className="space-y-3">
            {Object.entries(prices).map(([symbol, priceData]) => {
                const config = SYMBOLS_CONFIG[symbol as keyof typeof SYMBOLS_CONFIG];
                return (
                    <div key={symbol} className="flex items-center justify-between p-2 rounded-md">
                        <div className="flex items-center gap-3">
                            <config.icon className="w-6 h-6 text-indigo-400" />
                            <div>
                                <p className="font-bold text-sm">{symbol}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">{config.name}</p>
                            </div>
                        </div>
                        <div className={`px-2 py-1 rounded-md transition-colors duration-300 ${getChangeColor(priceData.change)}`}>
                            <p className="font-mono font-semibold text-sm text-right">
                                {priceData.value.toFixed(config.digits)}
                            </p>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default LivePricesWidget;