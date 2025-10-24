import React, { useState, useEffect, Suspense, lazy } from 'react';
import Card from './shared/Card';
import { Calendar as CalendarIcon, BarChart3, Newspaper, RefreshCw } from 'lucide-react';
import type { CalendarPageVisibility } from '../types';

const EconomicCalendarWidget = lazy(() => import('./widgets/EconomicCalendarWidget'));
const NewsFeedWidget = lazy(() => import('./widgets/NewsFeedWidget'));
const LivePricesWidget = lazy(() => import('./widgets/LivePricesWidget'));

const CALENDAR_PAGE_VISIBILITY_LS_KEY = 'calendar-page-visibility';

const CalendarPage: React.FC = () => {
    const [visibility, setVisibility] = useState<CalendarPageVisibility>({
        calendar: true,
        newsFeed: true,
        livePrices: true,
    });

    useEffect(() => {
        const loadVisibility = () => {
             try {
                const saved = localStorage.getItem(CALENDAR_PAGE_VISIBILITY_LS_KEY);
                const defaultVisibility = { calendar: true, newsFeed: true, livePrices: true };
                if (saved) {
                    setVisibility({ ...defaultVisibility, ...JSON.parse(saved) });
                } else {
                    setVisibility(defaultVisibility);
                }
            } catch (e) {
                console.error("Failed to load calendar page visibility", e);
            }
        };
        
        window.addEventListener('storage', loadVisibility);
        loadVisibility();
        
        return () => window.removeEventListener('storage', loadVisibility);
    }, []);

    const WidgetSuspense: React.FC<{children: React.ReactNode}> = ({ children }) => (
        <Suspense fallback={
            <div className="flex items-center justify-center h-48">
                <RefreshCw className="animate-spin text-indigo-500" />
            </div>
        }>
            {children}
        </Suspense>
    );

    return (
        <div className="p-6 space-y-6">
            <h1 className="text-2xl font-bold">هاب خبری و تحلیلی</h1>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                
                {visibility.calendar && (
                    <div className="lg:col-span-2">
                         <Card title="تقویم اقتصادی" icon={CalendarIcon}>
                            <WidgetSuspense>
                                <EconomicCalendarWidget />
                            </WidgetSuspense>
                        </Card>
                    </div>
                )}
                
                <div className="lg:col-span-1 space-y-6">
                    {visibility.newsFeed && (
                        <Card title="فید اخبار لحظه‌ای" icon={Newspaper}>
                            <WidgetSuspense>
                                <NewsFeedWidget />
                            </WidgetSuspense>
                        </Card>
                    )}
                    
                    {visibility.livePrices && (
                        <Card title="قیمت‌های زنده" icon={BarChart3}>
                            <WidgetSuspense>
                                <LivePricesWidget />
                            </WidgetSuspense>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CalendarPage;