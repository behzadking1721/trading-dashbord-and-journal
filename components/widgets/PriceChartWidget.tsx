import React, { useEffect, useRef, useState, useContext } from 'react';
import { createChart, IChartApi, ISeriesApi, LineStyle, IPriceLine } from 'lightweight-charts';
import type { OHLCData, JournalEntry } from '../../types';
import { ThemeContext } from '../../contexts/ThemeContext';

// Fix: Declare a global interface for window.currentPrices to inform TypeScript of its existence and structure.
declare global {
  interface Window {
    currentPrices: { [symbol: string]: { price: number; lastPrice: number } };
  }
}
// Fix: Initialize window.currentPrices if it doesn't exist to prevent runtime errors.
window.currentPrices = window.currentPrices || {};

const generateMockData = (numBars = 100): OHLCData[] => {
  const data: OHLCData[] = [];
  let lastClose = 100;
  let time = new Date();
  time.setDate(time.getDate() - numBars);

  for (let i = 0; i < numBars; i++) {
    const open = lastClose + (Math.random() - 0.5);
    const close = open + (Math.random() - 0.5) * 2;
    const high = Math.max(open, close) + Math.random();
    const low = Math.min(open, close) - Math.random();
    
    data.push({
      time: time.toISOString().split('T')[0],
      open,
      high,
      low,
      close,
    });
    lastClose = close;
    time.setDate(time.getDate() + 1);
  }
  return data;
};

export const SYMBOLS = ['EURUSD', 'GBPUSD', 'USDJPY', 'BTCUSD', 'ETHUSD'];
const TIMEFRAMES = ['1m', '5m', '15m', '1H', '4H', '1D'];

const PriceChartWidget: React.FC = () => {
    const chartContainerRef = useRef<HTMLDivElement>(null);
    const chartRef = useRef<IChartApi | null>(null);
    const seriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
    const tradeLinesRef = useRef<IPriceLine[]>([]);
    const { theme } = useContext(ThemeContext);

    const [symbol, setSymbol] = useState(SYMBOLS[0]);
    const [timeframe, setTimeframe] = useState(TIMEFRAMES[2]);
    const [chartData, setChartData] = useState<OHLCData[]>(generateMockData());

    useEffect(() => {
        if (!chartContainerRef.current) return;

        const handleResize = () => {
            if (chartRef.current && chartContainerRef.current) {
                chartRef.current.resize(chartContainerRef.current.clientWidth, chartContainerRef.current.clientHeight);
            }
        };

        chartRef.current = createChart(chartContainerRef.current, {
            width: chartContainerRef.current.clientWidth,
            height: chartContainerRef.current.clientHeight, // Use container's height for responsiveness
            layout: {
                background: { color: 'transparent' },
                textColor: theme === 'light' ? '#1f2937' : '#d1d5db',
            },
            grid: {
                vertLines: { color: theme === 'light' ? '#e5e7eb' : '#374151' },
                horzLines: { color: theme === 'light' ? '#e5e7eb' : '#374151' },
            },
            rightPriceScale: {
                borderColor: theme === 'light' ? '#d1d5db' : '#4b5563',
            },
            timeScale: {
                borderColor: theme === 'light' ? '#d1d5db' : '#4b5563',
                rightOffset: 12,
                timeVisible: true,
                secondsVisible: false,
            },
        });
        
        seriesRef.current = (chartRef.current as any).addCandlestickSeries({
            upColor: '#22c55e',
            downColor: '#ef4444',
            borderDownColor: '#ef4444',
            borderUpColor: '#22c55e',
            wickDownColor: '#ef4444',
            wickUpColor: '#22c55e',
        });
        
        seriesRef.current.setData(chartData);
        chartRef.current.timeScale().fitContent();

        const resizeObserver = new ResizeObserver(handleResize);
        resizeObserver.observe(chartContainerRef.current);

        return () => {
            resizeObserver.disconnect();
            chartRef.current?.remove();
        };
    }, []);

    useEffect(() => {
        const clearTradeLines = () => {
            if (seriesRef.current && tradeLinesRef.current.length > 0) {
                tradeLinesRef.current.forEach(line => seriesRef.current!.removePriceLine(line));
                tradeLinesRef.current = [];
            }
        };

        const handleShowTrade = (event: CustomEvent<JournalEntry>) => {
            if (!seriesRef.current) return;

            const trade = event.detail;

            clearTradeLines();

            const newLines: IPriceLine[] = [];

            // Entry Price
            newLines.push(seriesRef.current.createPriceLine({
                price: trade.entryPrice,
                color: '#3b82f6', // blue-500
                lineWidth: 2,
                lineStyle: LineStyle.Solid,
                axisLabelVisible: true,
                title: `ورود ${trade.side}`,
            }));

            // Take Profit
            newLines.push(seriesRef.current.createPriceLine({
                price: trade.takeProfit,
                color: '#22c55e', // green-500
                lineWidth: 2,
                lineStyle: LineStyle.Dashed,
                axisLabelVisible: true,
                title: 'حد سود',
            }));

            // Stop Loss
            newLines.push(seriesRef.current.createPriceLine({
                price: trade.stopLoss,
                color: '#ef4444', // red-500
                lineWidth: 2,
                lineStyle: LineStyle.Dashed,
                axisLabelVisible: true,
                title: 'حد ضرر',
            }));

            tradeLinesRef.current = newLines;
        };
        
        window.addEventListener('showTradeOnChart', handleShowTrade as EventListener);
        clearTradeLines();

        return () => {
            window.removeEventListener('showTradeOnChart', handleShowTrade as EventListener);
        };
    }, [symbol]);

    useEffect(() => {
        chartRef.current?.applyOptions({
            layout: {
                textColor: theme === 'light' ? '#1f2937' : '#d1d5db',
            },
             grid: {
                vertLines: { color: theme === 'light' ? '#e5e7eb' : '#374151' },
                horzLines: { color: theme === 'light' ? '#e5e7eb' : '#374151' },
            },
             rightPriceScale: {
                borderColor: theme === 'light' ? '#d1d5db' : '#4b5563',
            },
            timeScale: {
                borderColor: theme === 'light' ? '#d1d5db' : '#4b5563',
            },
        });
    }, [theme]);
    
    useEffect(() => {
        const newData = generateMockData(Math.floor(Math.random() * 50) + 50);
        setChartData(newData);
        seriesRef.current?.setData(newData);
        chartRef.current?.timeScale().fitContent();
    }, [symbol, timeframe]);

    // Simulate live price ticks for alert checking
    useEffect(() => {
        const interval = setInterval(() => {
            setChartData(prevData => {
                if (prevData.length === 0) return prevData;
                
                const lastCandle = { ...prevData[prevData.length - 1] };
                const lastPrice = lastCandle.close;
                const newClose = lastPrice + (Math.random() - 0.5) * 0.1;
                
                lastCandle.close = newClose;
                lastCandle.high = Math.max(lastCandle.high, newClose);
                lastCandle.low = Math.min(lastCandle.low, newClose);

                seriesRef.current?.update(lastCandle);

                // Update global price state for alerts
                window.currentPrices[symbol] = { price: newClose, lastPrice: lastPrice };
                
                return [...prevData.slice(0, -1), lastCandle];
            });
        }, 2000); // New tick every 2 seconds

        return () => clearInterval(interval);
    }, [symbol]);

  return (
    <div className="flex flex-col h-full">
        <div className="flex justify-between items-center mb-2 px-2">
            <div className="flex items-center gap-2">
                <select value={symbol} onChange={(e) => setSymbol(e.target.value)} className="bg-gray-200 dark:bg-gray-700 rounded-md px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500">
                    {SYMBOLS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
            </div>
             <div className="flex gap-1">
                {TIMEFRAMES.map(tf => (
                    <button key={tf} onClick={() => setTimeframe(tf)} className={`px-2 py-1 text-xs rounded ${timeframe === tf ? 'bg-indigo-500 text-white' : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600'}`}>
                        {tf}
                    </button>
                ))}
            </div>
        </div>
        <div ref={chartContainerRef} className="flex-grow" />
    </div>
  );
};

export default PriceChartWidget;