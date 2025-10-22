import React, { useState, useEffect, useCallback, lazy, Suspense, useMemo } from 'react';
import type { JournalEntry, TradingSetup, TradeOutcome, RiskSettings } from '../types';
import { addJournalEntry, getJournalEntries, deleteJournalEntry, getLatestJournalEntries } from '../db';
import { Plus, Trash2, TrendingUp, TrendingDown, ChevronDown, LineChart, Sparkles, RefreshCw, Brain } from 'lucide-react';

const AIAnalysisModal = lazy(() => import('./AIAnalysisModal'));

const JournalPage: React.FC = () => {
    const [entries, setEntries] = useState<JournalEntry[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isAnalysisModalOpen, setIsAnalysisModalOpen] = useState(false);
    
    const loadEntries = useCallback(async () => {
        try {
            const storedEntries = await getJournalEntries();
            setEntries(storedEntries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
        } catch (e) {
            // FIX: Renamed 'error' to 'e' to avoid potential parsing conflicts that caused cascading 'Cannot find name' errors.
            console.error("Failed to load journal entries from DB:", e);
        }
    }, []);

    useEffect(() => {
        loadEntries();
    }, [loadEntries]);

    const handleDelete = async (id: string) => {
        if (window.confirm('آیا از حذف این آیتم مطمئن هستید؟')) {
            try {
                await deleteJournalEntry(id);
                await loadEntries(); 
            } catch (e) {
                // FIX: Renamed 'error' to 'e' to maintain consistency and avoid potential parsing issues.
                console.error("Failed to delete journal entry:", e);
                alert("خطا در حذف معامله. لطفا دوباره تلاش کنید.");
            }
        }
    };
    
    const showTradeOnChart = (trade: JournalEntry) => {
        const event = new CustomEvent('showTradeOnChart', { detail: trade });
        window.dispatchEvent(event);
        window.location.hash = '/'; // Navigate to dashboard
    };

    const handleSave = async () => {
        await loadEntries();
    };

    return (
        <div className="p-6 h-full flex flex-col">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">ژورنال معاملات</h1>
                <div className="flex items-center gap-2">
                     <button onClick={() => setIsAnalysisModalOpen(true)} className="flex items-center gap-2 bg-teal-500 text-white px-4 py-2 rounded-lg shadow-md hover:bg-teal-600 transition-colors">
                        <Sparkles size={18} />
                        <span>تحلیل با هوش مصنوعی</span>
                    </button>
                    <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 bg-indigo-500 text-white px-4 py-2 rounded-lg shadow-md hover:bg-indigo-600 transition-colors">
                        <Plus size={18} />
                        <span>ثبت معامله جدید</span>
                    </button>
                </div>
            </div>

            <div className="flex-grow overflow-auto rounded-lg shadow-md border border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
                <table className="w-full text-sm text-right">
                    <thead className="text-xs text-gray-500 uppercase bg-gray-50 dark:bg-gray-700/50">
                        <tr>
                            <th className="px-4 py-3">تاریخ</th>
                            <th className="px-4 py-3">نماد</th>
                            <th className="px-4 py-3">جهت</th>
                            <th className="px-4 py-3">ستاپ معاملاتی</th>
                            <th className="px-4 py-3">سود/ضرر</th>
                            <th className="px-4 py-3">عملیات</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {entries.length > 0 ? entries.map(entry => (
                            <tr key={entry.id} className="hover:bg-gray-100/50 dark:hover:bg-gray-700/50">
                                <td className="px-4 py-3 font-mono">{new Date(entry.date).toLocaleDateString('fa-IR')}</td>
                                <td className="px-4 py-3 font-semibold">{entry.symbol.toUpperCase()}</td>
                                <td className={`px-4 py-3 flex items-center gap-2 ${entry.side === 'Buy' ? 'text-green-500' : 'text-red-500'}`}>
                                    {entry.side === 'Buy' ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                                    {entry.side === 'Buy' ? 'خرید' : 'فروش'}
                                </td>
                                <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{entry.setupName || '-'}</td>
                                <td className={`px-4 py-3 font-mono font-bold ${Number(entry.profitOrLoss) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                    ${typeof entry.profitOrLoss === 'number' && !isNaN(entry.profitOrLoss) ? entry.profitOrLoss.toFixed(2) : '0.00'}
                                </td>
                                <td className="px-4 py-3 flex items-center gap-1">
                                    <button onClick={() => showTradeOnChart(entry)} className="p-2 text-gray-500 hover:text-indigo-500 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600" title="نمایش روی چارت">
                                        <LineChart size={16} />
                                    </button>
                                    <button onClick={() => handleDelete(entry.id)} className="p-2 text-gray-500 hover:text-red-500 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600" title="حذف">
                                        <Trash2 size={16} />
                                    </button>
                                </td>
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan={6} className="text-center py-10 text-gray-500">
                                    هیچ معامله‌ای ثبت نشده است.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {isModalOpen && <JournalFormModal onClose={() => setIsModalOpen(false)} onSave={handleSave} />}
            {isAnalysisModalOpen && (
                 <Suspense fallback={
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                         <RefreshCw className="w-10 h-10 animate-spin text-white" />
                    </div>
                 }>
                    <AIAnalysisModal 
                        isOpen={isAnalysisModalOpen} 
                        onClose={() => setIsAnalysisModalOpen(false)} 
                        entries={entries} 
                    />
                </Suspense>
            )}
        </div>
    );
};

const MISTAKES_LIST = ['نادیده گرفتن چک‌لیست', 'ورود بدون ستاپ', 'جابجا کردن حد ضرر', 'ریسک بیش از حد', 'خروج زودهنگام (ترس)', 'خروج دیرهنگام (طمع)'];
const singleEmotionMap: { emoji: string; value: string; color: string; selectedClasses: string }[] = [
    { emoji: '😊', value: 'مطمئن', color: 'green-500', selectedClasses: 'border-green-500 text-green-500 bg-green-500/10' },
    { emoji: '😐', value: 'منظم', color: 'blue-500', selectedClasses: 'border-blue-500 text-blue-500 bg-blue-500/10' },
    { emoji: '😡', value: 'عصبی', color: 'red-500', selectedClasses: 'border-red-500 text-red-500 bg-red-500/10' },
    { emoji: '😰', value: 'مضطرب', color: 'orange-500', selectedClasses: 'border-orange-500 text-orange-500 bg-orange-500/10' },
];

interface FormState extends Omit<Partial<JournalEntry>, 'outcome'> {
    outcome?: TradeOutcome;
    manualExitPrice?: number;
}


const JournalFormModal: React.FC<{ onClose: () => void; onSave: () => void; }> = ({ onClose, onSave }) => {
    const [formData, setFormData] = useState<FormState>({
        symbol: '', side: 'Buy', entryPrice: undefined, stopLoss: undefined, takeProfit: undefined, positionSize: undefined, setupId: '', emotions: [], mistakes: [], notesBefore: '', notesAfter: '', outcome: 'Manual Exit', manualExitPrice: undefined,
    });
    const [setups, setSetups] = useState<TradingSetup[]>([]);
    const [riskSettings, setRiskSettings] = useState<RiskSettings | null>(null);
    const [lastTrade, setLastTrade] = useState<JournalEntry | null>(null);
    const PSYCHO_ANALYSIS_LS_KEY = 'journal-form-psycho-analysis-open';
    const [isPsychoAnalysisOpen, setIsPsychoAnalysisOpen] = useState(() => {
        try { return localStorage.getItem(PSYCHO_ANALYSIS_LS_KEY) === 'true'; } catch { return false; }
    });

    const togglePsychoAnalysis = () => {
        setIsPsychoAnalysisOpen(prev => {
            const newState = !prev;
            try { localStorage.setItem(PSYCHO_ANALYSIS_LS_KEY, String(newState)); } catch (e) { console.error(e); }
            return newState;
        });
    };
    
    useEffect(() => {
        const loadInitialData = async () => {
            try {
                // Load setups
                const savedSetups = localStorage.getItem('trading-setups');
                if (savedSetups) setSetups(JSON.parse(savedSetups));

                // Load risk settings
                const savedRiskSettings = localStorage.getItem('risk-management-settings');
                if (savedRiskSettings) {
                    setRiskSettings(JSON.parse(savedRiskSettings));
                } else {
                    // FIX: Explicitly type `defaultSettings` as `RiskSettings` to ensure `strategy` is correctly typed as a literal.
                    const defaultSettings: RiskSettings = { accountBalance: 10000, strategy: 'fixed_percent', fixedPercent: { risk: 1 }, antiMartingale: { baseRisk: 1, increment: 0.5, maxRisk: 4 }};
                    setRiskSettings(defaultSettings);
                }

                // Load last trade for anti-martingale
                const [latestTrade] = await getLatestJournalEntries(1);
                setLastTrade(latestTrade || null);

            } catch(e) { console.error(e) }
        };
        loadInitialData();
    }, []);

    const suggestedPositionSize = useMemo(() => {
        if (!riskSettings || !formData.entryPrice || !formData.stopLoss) {
            return null;
        }
        const stopDistance = Math.abs(formData.entryPrice - formData.stopLoss);
        if (stopDistance === 0) return null;

        let riskPercent = riskSettings.fixedPercent.risk;

        if (riskSettings.strategy === 'anti_martingale' && lastTrade) {
            const { baseRisk, increment, maxRisk } = riskSettings.antiMartingale;
            if (lastTrade.status === 'Win') {
                // This logic needs current risk level, which we don't store.
                // We'll simplify: if last was a win, we increment base risk once.
                riskPercent = Math.min(baseRisk + increment, maxRisk);
            } else {
                riskPercent = baseRisk;
            }
        }
        
        const riskAmount = riskSettings.accountBalance * (riskPercent / 100);
        
        // Assuming standard lot (100,000 units) and a pip value of $10 for a 1 lot trade.
        // This is a simplification for non-JPY pairs.
        // position size in lots = risk amount / (stop distance in pips * value per pip)
        // Let's assume price is like 1.2345, so stop distance is e.g. 0.0020
        // stop distance in pips = stopDistance * 10000
        // position_size * 10 = riskAmount / (stopDistance * 10000)
        // position_size = riskAmount / (stopDistance * 10000 * 10)
        // Let's use a simpler formula: position_size_in_units = riskAmount / stopDistance
        // position_size_in_lots = position_size_in_units / 100000
        const positionSizeInLots = (riskAmount / stopDistance) / 100000;

        return `پیشنهاد: ${positionSizeInLots.toFixed(2)}`;

    }, [formData.entryPrice, formData.stopLoss, riskSettings, lastTrade]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        const isNumberField = e.target instanceof HTMLInputElement && e.target.type === 'number';
        setFormData(prev => ({ ...prev, [name]: isNumberField ? (value === '' ? undefined : parseFloat(value)) : value }));
    };

    const handleEmotionSelect = (emotionValue: string) => {
        setFormData(prev => ({ ...prev, emotions: prev.emotions?.includes(emotionValue) ? [] : [emotionValue] }));
    };

    const handleMultiSelect = (name: 'mistakes', value: string) => {
        const currentValues = formData[name] || [];
        const newValues = currentValues.includes(value) ? currentValues.filter(v => v !== value) : [...currentValues, value];
        setFormData(prev => ({ ...prev, [name]: newValues }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const { entryPrice, stopLoss, takeProfit, positionSize = 1, side = 'Buy', setupId, outcome, manualExitPrice } = formData;
        
        let finalExitPrice: number | undefined;
        if(outcome === 'Take Profit') finalExitPrice = takeProfit;
        else if(outcome === 'Stop Loss') finalExitPrice = stopLoss;
        else if(outcome === 'Manual Exit') finalExitPrice = manualExitPrice;

        if ([entryPrice, stopLoss, takeProfit, finalExitPrice].some(p => p === undefined || isNaN(p))) {
             alert('لطفاً تمام قیمت‌های ضروری را به درستی وارد کنید.');
             return;
        }

        const pnl = (finalExitPrice! - entryPrice!) * positionSize * (side === 'Buy' ? 1 : -1) * 100000;
        const rrDenominator = Math.abs(entryPrice! - stopLoss!);
        const riskRewardRatio = rrDenominator > 0 ? Math.abs(takeProfit! - entryPrice!) / rrDenominator : 0;
        const status: 'Win' | 'Loss' | 'Breakeven' = pnl > 0 ? 'Win' : pnl < 0 ? 'Loss' : 'Breakeven';
        const selectedSetup = setups.find(s => s.id === setupId);

        const newEntry: JournalEntry = {
            id: new Date().toISOString(), date: new Date().toISOString(), symbol: formData.symbol || '', side,
            entryPrice: entryPrice!, exitPrice: finalExitPrice!, stopLoss: stopLoss!, takeProfit: takeProfit!, positionSize,
            profitOrLoss: pnl, status, riskRewardRatio: isFinite(riskRewardRatio) ? riskRewardRatio : 0, setupId,
            outcome: outcome!, setupName: selectedSetup?.name, emotions: formData.emotions || [], mistakes: formData.mistakes || [],
            notesBefore: formData.notesBefore || '', notesAfter: formData.notesAfter || '',
        };
        
        try {
            await addJournalEntry(newEntry);
            onSave();
            onClose();
        } catch (e) {
            console.error("Failed to save journal entry:", e);
            alert("خطا در ذخیره معامله. لطفا دوباره تلاش کنید.");
        }
    };
    
    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col">
                <div className="flex justify-between items-center p-4 border-b dark:border-gray-700">
                    <h2 className="text-xl font-bold">ثبت معامله جدید</h2>
                    <button onClick={onClose} className="p-1 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">&times;</button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
                    {/* Trade Details */}
                    <fieldset className="border p-4 rounded-md dark:border-gray-600">
                        <legend className="px-2 font-semibold text-sm">جزئیات معامله</legend>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <input type="text" name="symbol" placeholder="نماد" required className="p-2 border rounded dark:bg-gray-700 dark:border-gray-600" value={formData.symbol} onChange={handleChange} />
                            <select name="side" className="p-2 border rounded dark:bg-gray-700 dark:border-gray-600" value={formData.side} onChange={handleChange}>
                                <option value="Buy">خرید (Buy)</option>
                                <option value="Sell">فروش (Sell)</option>
                            </select>
                            <input type="number" name="entryPrice" step="any" placeholder="قیمت ورود" required className="p-2 border rounded dark:bg-gray-700 dark:border-gray-600" value={formData.entryPrice === undefined ? '' : formData.entryPrice} onChange={handleChange}/>
                            <input type="number" name="stopLoss" step="any" placeholder="حد ضرر" required className="p-2 border rounded dark:bg-gray-700 dark:border-gray-600" value={formData.stopLoss === undefined ? '' : formData.stopLoss} onChange={handleChange}/>
                            <input type="number" name="takeProfit" step="any" placeholder="حد سود" required className="p-2 border rounded dark:bg-gray-700 dark:border-gray-600" value={formData.takeProfit === undefined ? '' : formData.takeProfit} onChange={handleChange}/>
                            
                             <select name="outcome" className="p-2 border rounded dark:bg-gray-700 dark:border-gray-600" value={formData.outcome} onChange={handleChange}>
                                <option value="Manual Exit">خروج دستی</option>
                                <option value="Take Profit">حد سود</option>
                                <option value="Stop Loss">حد ضرر</option>
                            </select>

                            {formData.outcome === 'Manual Exit' && (
                                <input type="number" name="manualExitPrice" step="any" placeholder="قیمت خروج" required className="p-2 border rounded dark:bg-gray-700 dark:border-gray-600" value={formData.manualExitPrice === undefined ? '' : formData.manualExitPrice} onChange={handleChange}/>
                            )}
                            <div className="relative">
                                <input type="number" name="positionSize" step="any" placeholder={suggestedPositionSize || 'حجم (لات)'} className="p-2 border rounded dark:bg-gray-700 dark:border-gray-600 w-full" value={formData.positionSize === undefined ? '' : formData.positionSize} onChange={handleChange}/>
                                {suggestedPositionSize && <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-gray-400 pointer-events-none">{suggestedPositionSize}</span>}
                            </div>
                        </div>
                    </fieldset>
                    
                    {/* Psychological Analysis (Collapsible) */}
                    <div className="border rounded-md dark:border-gray-600">
                        <button type="button" onClick={togglePsychoAnalysis} className="flex justify-between items-center w-full p-4 text-right">
                            <div className="flex items-center gap-2">
                                <Brain size={18} className="text-indigo-500" />
                                <span className="font-semibold text-sm">تحلیل روانشناسی و استراتژی (اختیاری)</span>
                            </div>
                            <ChevronDown className={`w-5 h-5 transition-transform ${isPsychoAnalysisOpen ? 'rotate-180' : ''}`} />
                        </button>
                        <div className={`transition-all duration-300 ease-in-out overflow-hidden ${isPsychoAnalysisOpen ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'}`}>
                            <div className="p-4 border-t dark:border-gray-600 space-y-4">
                                <div className="relative">
                                    <label className="block text-sm font-medium mb-2">ستاپ معاملاتی</label>
                                    <select name="setupId" value={formData.setupId || ''} onChange={handleChange} className="w-full p-2 border rounded appearance-none dark:bg-gray-700 dark:border-gray-600">
                                        <option value="">انتخاب ستاپ معاملاتی</option>
                                        {setups.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                    </select>
                                    <ChevronDown className="absolute left-3 top-10 -translate-y-1/2 w-4 h-4 pointer-events-none" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-2">احساسات غالب</label>
                                    <div className="flex justify-around items-center gap-2">
                                        {singleEmotionMap.map(emo => (
                                            <button key={emo.value} type="button" onClick={() => handleEmotionSelect(emo.value)} className={`flex-1 p-2 rounded-lg border-2 transition-all text-center ${formData.emotions?.includes(emo.value) ? emo.selectedClasses : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'}`}>
                                                <span className="text-3xl">{emo.emoji}</span>
                                                <span className="block text-xs mt-1">{emo.value}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                 <div>
                                    <label className="block text-sm font-medium mb-2">اشتباهات (در صورت وجود)</label>
                                    <div className="flex flex-wrap gap-2">
                                        {MISTAKES_LIST.map(mistake => (
                                            <button key={mistake} type="button" onClick={() => handleMultiSelect('mistakes', mistake)} className={`px-3 py-1.5 text-xs rounded-full border transition-colors ${formData.mistakes?.includes(mistake) ? 'bg-red-500 border-red-500 text-white' : 'bg-gray-200 dark:bg-gray-700 border-transparent hover:bg-gray-300 dark:hover:bg-gray-600'}`}>
                                                {mistake}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <textarea name="notesBefore" rows={2} placeholder="یادداشت‌های قبل از معامله" value={formData.notesBefore} onChange={handleChange} className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"></textarea>
                                    <textarea name="notesAfter" rows={2} placeholder="درس‌های آموخته‌شده بعد از معامله" value={formData.notesAfter} onChange={handleChange} className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"></textarea>
                                </div>
                                <p className="text-xs text-gray-500 text-center pt-2">پر کردن این بخش اختیاری است، اما به شما کمک می‌کند در گزارش‌ها الگوهای روانشناسی و استراتژی خود را بهتر ببینید.</p>
                            </div>
                        </div>
                    </div>
                </form>
                 <div className="flex justify-end gap-3 p-4 mt-auto border-t dark:border-gray-700">
                    <button type="button" onClick={onClose} className="px-4 py-2 rounded bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500">انصراف</button>
                    <button type="submit" onClick={handleSubmit} className="px-4 py-2 rounded bg-indigo-500 text-white hover:bg-indigo-600">ذخیره</button>
                </div>
            </div>
        </div>
    );
};


export default JournalPage;