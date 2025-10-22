import React, { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import type { JournalEntry, TradingSetup } from '../types';
import { addJournalEntry, getJournalEntries, deleteJournalEntry } from '../db';
import { Plus, Trash2, TrendingUp, TrendingDown, ChevronDown, LineChart, Sparkles, RefreshCw } from 'lucide-react';

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

const EMOTIONS_LIST = ['منظم', 'مطمئن', 'هیجان‌زده', 'مضطرب', 'ترسو', 'عصبی', 'انتقام‌جو'];
const MISTAKES_LIST = ['نادیده گرفتن چک‌لیست', 'ورود بدون ستاپ', 'جابجا کردن حد ضرر', 'ریسک بیش از حد', 'خروج زودهنگام (ترس)', 'خروج دیرهنگام (طمع)'];

const JournalFormModal: React.FC<{ onClose: () => void; onSave: () => void; }> = ({ onClose, onSave }) => {
    const [formData, setFormData] = useState<Partial<JournalEntry>>({
        symbol: '', side: 'Buy', entryPrice: undefined, stopLoss: undefined, takeProfit: undefined, exitPrice: undefined, positionSize: undefined, setupId: '', emotions: [], mistakes: [], notesBefore: '', notesAfter: ''
    });
    const [setups, setSetups] = useState<TradingSetup[]>([]);
    
    useEffect(() => {
        try {
            const savedSetups = localStorage.getItem('trading-setups');
            if (savedSetups) {
                setSetups(JSON.parse(savedSetups));
            }
        } catch(e) { console.error(e) }
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        const isNumberField = e.target instanceof HTMLInputElement && e.target.type === 'number';

        setFormData(prev => ({ 
            ...prev, 
            [name]: isNumberField ? (value === '' ? undefined : parseFloat(value)) : value 
        }));
    };

    const handleMultiSelect = (name: 'emotions' | 'mistakes', value: string) => {
        const currentValues = formData[name] || [];
        const newValues = currentValues.includes(value)
            ? currentValues.filter(v => v !== value)
            : [...currentValues, value];
        setFormData(prev => ({ ...prev, [name]: newValues }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const entryPrice = Number(formData.entryPrice);
        const exitPrice = Number(formData.exitPrice);
        const stopLoss = Number(formData.stopLoss);
        const takeProfit = Number(formData.takeProfit);
        const positionSize = Number(formData.positionSize || 1);
        const side = formData.side || 'Buy';

        if (isNaN(entryPrice) || isNaN(exitPrice) || isNaN(stopLoss) || isNaN(takeProfit)) {
             alert('لطفاً تمام قیمت‌ها را به درستی وارد کنید.');
             return;
        }

        const pnl = (exitPrice - entryPrice) * positionSize * (side === 'Buy' ? 1 : -1) * 100000; // Simplified PnL
        const rrDenominator = Math.abs(entryPrice - stopLoss);
        const riskRewardRatio = rrDenominator > 0 ? Math.abs(takeProfit - entryPrice) / rrDenominator : 0;
        
        let status: 'Win' | 'Loss' | 'Breakeven' = 'Breakeven';
        if (pnl > 0) status = 'Win';
        if (pnl < 0) status = 'Loss';

        const selectedSetup = setups.find(s => s.id === formData.setupId);

        const newEntry: JournalEntry = {
            id: new Date().toISOString(),
            date: new Date().toISOString(),
            symbol: formData.symbol || '',
            side: side,
            entryPrice: entryPrice,
            exitPrice: exitPrice,
            stopLoss: stopLoss,
            takeProfit: takeProfit,
            positionSize: positionSize,
            profitOrLoss: isNaN(pnl) ? 0 : pnl,
            status,
            riskRewardRatio: isFinite(riskRewardRatio) && !isNaN(riskRewardRatio) ? riskRewardRatio : 0,
            setupId: formData.setupId,
            setupName: selectedSetup?.name,
            emotions: formData.emotions || [],
            mistakes: formData.mistakes || [],
            notesBefore: formData.notesBefore || '',
            notesAfter: formData.notesAfter || '',
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
                            <input type="number" name="exitPrice" step="any" placeholder="قیمت خروج" required className="p-2 border rounded dark:bg-gray-700 dark:border-gray-600" value={formData.exitPrice === undefined ? '' : formData.exitPrice} onChange={handleChange}/>
                            <input type="number" name="stopLoss" step="any" placeholder="حد ضرر" required className="p-2 border rounded dark:bg-gray-700 dark:border-gray-600" value={formData.stopLoss === undefined ? '' : formData.stopLoss} onChange={handleChange}/>
                            <input type="number" name="takeProfit" step="any" placeholder="حد سود" required className="p-2 border rounded dark:bg-gray-700 dark:border-gray-600" value={formData.takeProfit === undefined ? '' : formData.takeProfit} onChange={handleChange}/>
                            <input type="number" name="positionSize" step="any" placeholder="حجم معامله" className="p-2 border rounded dark:bg-gray-700 dark:border-gray-600" value={formData.positionSize === undefined ? '' : formData.positionSize} onChange={handleChange}/>
                        </div>
                    </fieldset>
                    
                     {/* Psychological Analysis */}
                    <fieldset className="border p-4 rounded-md dark:border-gray-600">
                        <legend className="px-2 font-semibold text-sm">تحلیل روانشناسی و استراتژی</legend>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="relative">
                                <select name="setupId" value={formData.setupId || ''} onChange={handleChange} className="w-full p-2 border rounded appearance-none dark:bg-gray-700 dark:border-gray-600">
                                    <option value="">انتخاب ستاپ معاملاتی</option>
                                    {setups.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                </select>
                                <ChevronDown className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" />
                            </div>
                            {/* Simplified multi-select for now */}
                             <select name="emotions" value={formData.emotions?.[0] || ''} onChange={(e) => setFormData(p => ({...p, emotions: [e.target.value]}))} className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600">
                                <option value="">انتخاب احساسات</option>
                                {EMOTIONS_LIST.map(e => <option key={e} value={e}>{e}</option>)}
                            </select>
                            <select name="mistakes" value={formData.mistakes?.[0] || ''} onChange={(e) => setFormData(p => ({...p, mistakes: [e.target.value]}))} className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600">
                                <option value="">انتخاب اشتباهات</option>
                                {MISTAKES_LIST.map(m => <option key={m} value={m}>{m}</option>)}
                            </select>
                        </div>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                            <textarea name="notesBefore" rows={2} placeholder="یادداشت‌های قبل از معامله" value={formData.notesBefore} onChange={handleChange} className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"></textarea>
                            <textarea name="notesAfter" rows={2} placeholder="درس‌های آموخته‌شده بعد از معامله" value={formData.notesAfter} onChange={handleChange} className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"></textarea>
                        </div>
                    </fieldset>

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