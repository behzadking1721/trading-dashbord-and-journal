import React, { useState } from 'react';
import { GoogleGenAI } from '@google/genai';
import { marked } from 'marked';
import { RefreshCw, X } from 'lucide-react';
import type { JournalEntry } from '../types';

interface AIAnalysisModalProps {
    isOpen: boolean;
    onClose: () => void;
    entries: JournalEntry[];
}

const AIAnalysisModal: React.FC<AIAnalysisModalProps> = ({ isOpen, onClose, entries }) => {
    const [loading, setLoading] = useState(false);
    const [analysis, setAnalysis] = useState('');
    const [error, setError] = useState('');
    const [hasAnalyzed, setHasAnalyzed] = useState(false);

    const handleAnalysis = async () => {
        setLoading(true);
        setError('');
        setAnalysis('');
        setHasAnalyzed(true);
        
        if (!process.env.API_KEY) {
            setError('کلید API تنظیم نشده است. لطفاً از طریق تنظیمات برنامه، کلید خود را وارد کنید.');
            setLoading(false);
            return;
        }

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            
            const tradesToAnalyze = entries.slice(0, 30);

            if(tradesToAnalyze.length < 3) {
                setError('برای تحلیل دقیق، حداقل به ۳ معامله ثبت‌شده نیاز است.');
                setLoading(false);
                return;
            }

            const formattedTrades = tradesToAnalyze.map(t => {
                const emotions = [
                    t.psychology?.emotionBefore,
                    t.psychology?.emotionAfter
                ].filter(Boolean).join(' -> ');

                const pnl = t.profitOrLoss != null ? `${t.profitOrLoss.toFixed(2)}$` : 'باز';

                return `- نماد: ${t.symbol || 'نامشخص'}, جهت: ${t.side || 'نامشخص'}, سود/ضرر: ${pnl}, وضعیت: ${t.status || 'نامشخص'}, ستاپ: ${t.setupName || 'نامشخص'}, احساسات: ${emotions || 'ثبت نشده'}, اشتباهات: ${t.mistakes?.join(', ') || 'ثبت نشده'}`;
            }).join('\n');

            const prompt = `
                شما یک مربی حرفه‌ای معامله‌گری و روانشناس هستید. لیست معاملات اخیر از ژورنال یک کاربر در زیر آمده است. داده‌های هر معامله شامل: نماد، جهت (خرید/فروش)، سود/ضرر (PnL)، وضعیت (برد/باخت)، نام ستاپ، احساسات و اشتباهات ثبت‌شده است. معاملات با سود/ضرر "باز" هنوز بسته نشده‌اند.

                بر اساس این داده‌ها، یک تحلیل کوتاه اما عمیق به زبان فارسی ارائه دهید. تحلیل شما باید شامل موارد زیر باشد:
                ۱. شناسایی الگوهای مثبت تکرارشونده (مثال: «به نظر می‌رسد شما با ستاپ 'شکست' روی جفت‌ارز EURUSD بسیار موفق هستید.»).
                ۲. اشاره به اشتباهات رایج و تأثیر احتمالی آن‌ها (مثال: «متوجه شدم که شما به طور مکرر اشتباه 'جابجا کردن حد ضرر' را مرتکب می‌شوید. این کار احتمالاً ضررهای شما را در معاملاتی که باید کوچک می‌ماندند، افزایش می‌دهد.»).
                ۳. تحلیل ارتباط بین احساسات و عملکرد (مثال: «معاملاتی که در آن‌ها احساس 'اضطراب' داشته‌اید، معمولاً زودتر از موعد بسته شده‌اند و مقداری از سود بالقوه از دست رفته است.»).
                ۴. ارائه ۲ تا ۳ توصیه واضح و کاربردی برای بهبود.
                ۵. لحن خود را تشویق‌کننده و سازنده حفظ کنید.
                ۶. پاسخ خود را با استفاده از Markdown (سرتیتر، لیست، متن ضخیم) برای خوانایی بهتر قالب‌بندی کنید.

                این هم لیست معاملات:
                ${formattedTrades}
            `;

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt
            });
            
            setAnalysis(response.text);

        } catch (e) {
            console.error(e);
            setError('خطا در ارتباط با سرویس هوش مصنوعی. لطفاً اتصال اینترنت و کلید API خود را بررسی کنید.');
        } finally {
            setLoading(false);
        }
    };
    
    if (!isOpen) return null;

    const renderContent = () => {
        if (loading) {
            return (
                <div className="flex flex-col items-center justify-center text-center p-8">
                    <RefreshCw className="w-10 h-10 animate-spin text-teal-400" />
                    <p className="mt-4 text-lg">در حال تحلیل هوشمند معاملات شما...</p>
                    <p className="text-sm text-gray-400">این فرآیند ممکن است چند لحظه طول بکشد.</p>
                </div>
            );
        }
        if (error) {
            return (
                <div className="text-center p-8">
                    <p className="text-red-500">{error}</p>
                    <button onClick={handleAnalysis} className="mt-4 px-4 py-2 rounded bg-indigo-500 text-white hover:bg-indigo-600">تلاش مجدد</button>
                </div>
            );
        }
        if (analysis) {
             const htmlAnalysis = marked.parse(analysis) as string;
            return (
                <div 
                    className="prose prose-sm dark:prose-invert max-w-none p-6 bg-gray-50 dark:bg-gray-900/50 rounded-b-lg overflow-y-auto"
                    dangerouslySetInnerHTML={{ __html: htmlAnalysis }}
                />
            );
        }
        if (!hasAnalyzed) {
             return (
                <div className="flex flex-col items-center justify-center text-center p-8">
                    <h3 className="text-xl font-bold mb-2">دستیار هوشمند تحلیل ژورنال</h3>
                    <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md">
                        این دستیار با استفاده از هوش مصنوعی، معاملات اخیر شما را بررسی کرده و به شما در شناسایی نقاط قوت، ضعف و الگوهای رفتاری کمک می‌کند.
                    </p>
                    <button onClick={handleAnalysis} className="bg-teal-500 text-white px-6 py-3 rounded-lg font-semibold shadow-lg hover:bg-teal-600 transition-transform transform hover:scale-105">
                        شروع تحلیل
                    </button>
                </div>
            );
        }
        return null;
    };


    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div 
                className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex justify-between items-center p-4 border-b dark:border-gray-700">
                    <h2 className="text-xl font-bold">تحلیل هوشمند ژورنال</h2>
                    <button onClick={onClose} className="p-2 rounded-full text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-600">
                        <X size={20}/>
                    </button>
                </div>
                <div className="flex-grow flex flex-col justify-center">
                   {renderContent()}
                </div>
                 {analysis && !loading && (
                    <div className="flex justify-end gap-3 p-4 border-t dark:border-gray-700">
                        <button type="button" onClick={onClose} className="px-4 py-2 rounded bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500">بستن</button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AIAnalysisModal;