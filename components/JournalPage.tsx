import React, { useState, useEffect, useCallback } from 'react';
import type { JournalEntry } from '../types';
import { addJournalEntry, getJournalEntries, deleteJournalEntry } from '../db';
import { Plus, Trash2, TrendingUp, TrendingDown, Edit } from 'lucide-react';

const JournalPage: React.FC = () => {
    const [entries, setEntries] = useState<JournalEntry[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    
    const loadEntries = useCallback(async () => {
        try {
            const storedEntries = await getJournalEntries();
            setEntries(storedEntries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
        } catch (error) {
            console.error("Failed to load journal entries from DB:", error);
            // Optionally, set an error state here to show a message to the user
        }
    }, []);

    useEffect(() => {
        loadEntries();
    }, [loadEntries]);

    const handleDelete = async (id: string) => {
        if (window.confirm('آیا از حذف این آیتم مطمئن هستید؟')) {
            try {
                await deleteJournalEntry(id);
                await loadEntries(); // Refresh the list
            } catch (error) {
                console.error("Failed to delete journal entry:", error);
                alert("خطا در حذف معامله. لطفا دوباره تلاش کنید.");
            }
        }
    };

    const handleSave = async () => {
        await loadEntries();
    };

    return (
        <div className="p-6 h-full flex flex-col">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">ژورنال معاملات</h1>
                <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 bg-indigo-500 text-white px-4 py-2 rounded-lg shadow-md hover:bg-indigo-600 transition-colors">
                    <Plus size={18} />
                    <span>ثبت معامله جدید</span>
                </button>
            </div>

            <div className="flex-grow overflow-auto rounded-lg shadow-md border border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
                <table className="w-full text-sm text-right">
                    <thead className="text-xs text-gray-500 uppercase bg-gray-50 dark:bg-gray-700/50">
                        <tr>
                            <th className="px-4 py-3">تاریخ</th>
                            <th className="px-4 py-3">نماد</th>
                            <th className="px-4 py-3">جهت</th>
                            <th className="px-4 py-3">نتیجه</th>
                            <th className="px-4 py-3">سود/ضرر</th>
                             <th className="px-4 py-3">استراتژی</th>
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
                                <td className={`px-4 py-3 font-bold ${entry.status === 'Win' ? 'text-green-500' : entry.status === 'Loss' ? 'text-red-500' : 'text-gray-500'}`}>
                                    {entry.status === 'Win' ? 'سود' : entry.status === 'Loss' ? 'ضرر' : 'سر به سر'}
                                </td>
                                <td className={`px-4 py-3 font-mono font-bold ${entry.profitOrLoss >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                    ${typeof entry.profitOrLoss === 'number' && !isNaN(entry.profitOrLoss) ? entry.profitOrLoss.toFixed(2) : '0.00'}
                                </td>
                                <td className="px-4 py-3">{entry.strategy}</td>
                                <td className="px-4 py-3">
                                    <button onClick={() => handleDelete(entry.id)} className="p-2 text-gray-500 hover:text-red-500 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600">
                                        <Trash2 size={16} />
                                    </button>
                                </td>
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan={7} className="text-center py-10 text-gray-500">
                                    هیچ معامله‌ای ثبت نشده است.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {isModalOpen && <JournalFormModal onClose={() => setIsModalOpen(false)} onSave={handleSave} />}
        </div>
    );
};

const JournalFormModal: React.FC<{ onClose: () => void; onSave: () => void; }> = ({ onClose, onSave }) => {
    const [formData, setFormData] = useState({
        symbol: '', side: 'Buy', entryPrice: '', stopLoss: '', takeProfit: '', exitPrice: ''
    });
    const [posSize, setPosSize] = useState(0);

    const calculatePositionSize = () => {
        try {
            const balance = parseFloat(localStorage.getItem('accountBalance') || '10000');
            const riskPercent = parseFloat(localStorage.getItem('maxRiskPerTrade') || '1');
            const entry = parseFloat(formData.entryPrice);
            const sl = parseFloat(formData.stopLoss);

            if (isNaN(balance) || isNaN(riskPercent) || isNaN(entry) || isNaN(sl) || entry === sl) {
                alert('لطفا مقادیر موجودی، ریسک، قیمت ورود و حد ضرر را به درستی وارد کنید.');
                setPosSize(0);
                return;
            }

            const riskAmount = balance * (riskPercent / 100);
            const slDistance = Math.abs(entry - sl);
            
            if (slDistance === 0) {
                 setPosSize(0);
                 return;
            }
            
            const pipValuePerLot = 10;
            const requiredPositionSize = riskAmount / (slDistance * pipValuePerLot * 10000);
            setPosSize(parseFloat(requiredPositionSize.toFixed(2)));
        } catch(error) {
            console.error("Could not calculate position size:", error);
            alert("خطا در محاسبه حجم. ممکن است دسترسی به حافظه مرورگر مسدود باشد.");
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const entryPrice = parseFloat(formData.entryPrice);
        const exitPrice = parseFloat(formData.exitPrice);
        const stopLoss = parseFloat(formData.stopLoss);
        const takeProfit = parseFloat(formData.takeProfit);

        if (isNaN(entryPrice) || isNaN(exitPrice) || isNaN(stopLoss) || isNaN(takeProfit)) {
            alert('لطفاً تمام قیمت‌ها را به درستی وارد کنید.');
            return;
        }

        const pnl = (exitPrice - entryPrice) * posSize * (formData.side === 'Buy' ? 1 : -1) * 100000;
        const rrDenominator = Math.abs(entryPrice - stopLoss);
        const riskRewardRatio = rrDenominator > 0 ? Math.abs(takeProfit - entryPrice) / rrDenominator : 0;
        
        let status: 'Win' | 'Loss' | 'Breakeven' = 'Breakeven';
        if (pnl > 0) status = 'Win';
        if (pnl < 0) status = 'Loss';

        const newEntry: JournalEntry = {
            id: new Date().toISOString(),
            date: new Date().toISOString(),
            symbol: formData.symbol,
            side: formData.side as 'Buy' | 'Sell',
            entryPrice,
            exitPrice,
            stopLoss,
            takeProfit,
            positionSize: posSize,
            profitOrLoss: isNaN(pnl) ? 0 : pnl,
            status,
            riskRewardRatio: isFinite(riskRewardRatio) && !isNaN(riskRewardRatio) ? riskRewardRatio : 0,
            strategy: 'استراتژی نمونه',
            preTradeThoughts: '',
            postTradeThoughts: '',
        };
        
        try {
            await addJournalEntry(newEntry);
            onSave();
            onClose();
        } catch (error) {
            console.error("Failed to save journal entry:", error);
            alert("خطا در ذخیره معامله. لطفا دوباره تلاش کنید.");
        }
    };
    
    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl p-6 relative">
                <button onClick={onClose} className="absolute top-4 left-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1 rounded-full">&times;</button>
                <h2 className="text-xl font-bold mb-4">ثبت معامله جدید</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <input type="text" placeholder="نماد (e.g., EURUSD)" required className="p-2 border rounded dark:bg-gray-700 dark:border-gray-600" value={formData.symbol} onChange={e => setFormData({...formData, symbol: e.target.value.toUpperCase()})} />
                        <select className="p-2 border rounded dark:bg-gray-700 dark:border-gray-600" value={formData.side} onChange={e => setFormData({...formData, side: e.target.value})}>
                            <option value="Buy">خرید (Buy)</option>
                            <option value="Sell">فروش (Sell)</option>
                        </select>
                        <input type="number" step="any" placeholder="قیمت ورود" required className="p-2 border rounded dark:bg-gray-700 dark:border-gray-600" value={formData.entryPrice} onChange={e => setFormData({...formData, entryPrice: e.target.value})}/>
                        <input type="number" step="any" placeholder="قیمت خروج" required className="p-2 border rounded dark:bg-gray-700 dark:border-gray-600" value={formData.exitPrice} onChange={e => setFormData({...formData, exitPrice: e.target.value})}/>
                        <input type="number" step="any" placeholder="حد ضرر" required className="p-2 border rounded dark:bg-gray-700 dark:border-gray-600" value={formData.stopLoss} onChange={e => setFormData({...formData, stopLoss: e.target.value})}/>
                        <input type="number" step="any" placeholder="حد سود" required className="p-2 border rounded dark:bg-gray-700 dark:border-gray-600" value={formData.takeProfit} onChange={e => setFormData({...formData, takeProfit: e.target.value})}/>
                    </div>
                    <div className="p-3 rounded-lg bg-gray-100 dark:bg-gray-700/50 flex items-center justify-between">
                         <button type="button" onClick={calculatePositionSize} className="bg-blue-500 text-white px-3 py-1.5 rounded-md text-sm hover:bg-blue-600">محاسبه حجم</button>
                         <div className="text-left">
                            <span className="text-sm">حجم پوزیشن محاسبه شده:</span>
                            <span className="font-bold font-mono text-lg ml-2">{posSize}</span>
                            <span className="text-xs">لات</span>
                         </div>
                    </div>
                    <div className="flex justify-end gap-3 pt-4">
                        <button type="button" onClick={onClose} className="px-4 py-2 rounded bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500">انصراف</button>
                        <button type="submit" className="px-4 py-2 rounded bg-indigo-500 text-white hover:bg-indigo-600">ذخیره</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default JournalPage;