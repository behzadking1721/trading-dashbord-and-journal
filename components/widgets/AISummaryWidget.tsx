import React, { useState, useEffect } from 'react';
import { GoogleGenAI } from '@google/genai';
import { marked } from 'marked';
import { RefreshCw, Sparkles, AlertTriangle } from 'lucide-react';

const AISummaryWidget: React.FC = () => {
    const [summary, setSummary] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [hasGenerated, setHasGenerated] = useState(false);

    useEffect(() => {
        // Attempt to load cached summary from session storage
        try {
            const cachedSummary = sessionStorage.getItem('ai-market-summary');
            if (cachedSummary) {
                setSummary(cachedSummary);
                setHasGenerated(true);
            }
        } catch (e) {
            console.warn("Could not access sessionStorage for AI summary.", e);
        }
    }, []);


    const generateSummary = async () => {
        setLoading(true);
        setError('');
        setSummary('');
        
        if (!process.env.API_KEY) {
            setError('کلید API برای هوش مصنوعی تنظیم نشده است.');
            setLoading(false);
            return;
        }

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const prompt = `
                شما یک تحلیل‌گر ارشد بازارهای مالی هستید. لطفاً یک تحلیل کوتاه و جامع از وضعیت فعلی بازار فارکس برای امروز ارائه دهید. به موارد زیر اشاره کنید:
                - سنتیمنت کلی بازار (ریسک‌پذیر یا ریسک‌گریز).
                - مهم‌ترین رویدادهای اقتصادی پیش رو که می‌توانند بازار را تحت تأثیر قرار دهند.
                - تحلیل تکنیکال مختصر برای جفت‌ارزهای اصلی (EURUSD, GBPUSD, USDJPY) و سطوح کلیدی احتمالی.
                
                پاسخ شما باید به زبان فارسی و با استفاده از قالب‌بندی Markdown برای خوانایی بهتر (سرتیتر، لیست و...) باشد. لحن شما باید حرفه‌ای و بی‌طرفانه باشد.
            `;

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt
            });
            
            const summaryText = response.text;
            setSummary(summaryText);
            setHasGenerated(true);
            try {
                sessionStorage.setItem('ai-market-summary', summaryText);
            } catch (e) {
                console.warn("Could not save AI summary to sessionStorage.", e);
            }

        } catch (e) {
            console.error("AI Summary Generation Error:", e);
            setError('خطا در ارتباط با سرویس هوش مصنوعی. لطفاً اتصال اینترنت خود را بررسی کنید.');
        } finally {
            setLoading(false);
        }
    };

    const renderContent = () => {
        if (loading) {
            return (
                <div className="flex flex-col items-center justify-center text-center p-4 h-full">
                    <RefreshCw className="w-8 h-8 animate-spin text-indigo-400" />
                    <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">در حال دریافت تحلیل...</p>
                </div>
            );
        }

        if (error) {
            return (
                <div className="flex flex-col items-center justify-center text-center p-4 h-full">
                    <AlertTriangle className="w-8 h-8 text-red-500" />
                    <p className="mt-3 text-sm text-red-500">{error}</p>
                    <button onClick={generateSummary} className="mt-3 text-xs bg-indigo-500 text-white px-3 py-1 rounded hover:bg-indigo-600">
                        تلاش مجدد
                    </button>
                </div>
            );
        }

        if (summary) {
            const htmlSummary = marked.parse(summary) as string;
            return (
                 <div className="space-y-4">
                    <div 
                        className="prose prose-sm dark:prose-invert max-w-none text-right"
                        dangerouslySetInnerHTML={{ __html: htmlSummary }}
                    />
                    <button onClick={generateSummary} className="w-full text-xs flex items-center justify-center gap-2 text-indigo-500 hover:underline">
                        <RefreshCw size={12} />
                        به‌روزرسانی تحلیل
                    </button>
                </div>
            );
        }

        return (
             <div className="flex flex-col items-center justify-center text-center p-4 h-full">
                <p className="text-gray-500 dark:text-gray-400 mb-4 text-sm">
                   یک دید کلی از وضعیت بازار امروز با کمک هوش مصنوعی دریافت کنید.
                </p>
                <button onClick={generateSummary} className="bg-indigo-500 text-white px-4 py-2 rounded-lg font-semibold shadow hover:bg-indigo-600 transition-transform transform hover:scale-105 flex items-center gap-2">
                    <Sparkles size={16} />
                    دریافت تحلیل روز
                </button>
            </div>
        );
    }
    
    return (
        <div className="h-full flex flex-col justify-center">
            {renderContent()}
        </div>
    );
};

export default AISummaryWidget;