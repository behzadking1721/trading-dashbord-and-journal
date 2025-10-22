import React, { useState, useEffect } from 'react';
import { Bell, Trash2, X, Plus } from 'lucide-react';
import type { Alert, PriceAlert, NewsAlert, PriceAlertCondition } from '../types';
import { getAlerts, addAlert, deleteAlert } from '../db';
import { useNotification } from '../contexts/NotificationContext';
import { SYMBOLS } from './widgets/PriceChartWidget'; // Reuse symbols list

interface AlertsManagerProps {
    isOpen: boolean;
    onClose: () => void;
}

const AlertsManager: React.FC<AlertsManagerProps> = ({ isOpen, onClose }) => {
    const [activeAlerts, setActiveAlerts] = useState<Alert[]>([]);
    const [triggeredAlerts, setTriggeredAlerts] = useState<Alert[]>([]);
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState<'active' | 'create'>('active');
    const { addNotification } = useNotification();

    const fetchAlerts = async () => {
        setLoading(true);
        const all = await getAlerts();
        setActiveAlerts(all.filter(a => a.status === 'active'));
        setTriggeredAlerts(all.filter(a => a.status === 'triggered'));
        setLoading(false);
    };

    useEffect(() => {
        if (isOpen) {
            fetchAlerts();
        }
    }, [isOpen]);

    const handleDelete = async (id: string) => {
        await deleteAlert(id);
        addNotification('هشدار با موفقیت حذف شد.', 'success');
        fetchAlerts();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center p-4 border-b dark:border-gray-700">
                    <h2 className="text-xl font-bold flex items-center gap-2"><Bell /> مدیریت هشدارها</h2>
                    <button onClick={onClose} className="p-1 rounded-full text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600"><X size={20} /></button>
                </div>
                <div className="flex border-b dark:border-gray-700">
                    <button onClick={() => setTab('active')} className={`flex-1 p-3 text-sm font-semibold ${tab === 'active' ? 'text-indigo-500 border-b-2 border-indigo-500' : 'text-gray-500'}`}>هشدارهای فعال</button>
                    <button onClick={() => setTab('create')} className={`flex-1 p-3 text-sm font-semibold ${tab === 'create' ? 'text-indigo-500 border-b-2 border-indigo-500' : 'text-gray-500'}`}>ایجاد هشدار قیمت</button>
                </div>
                <div className="p-6 overflow-y-auto">
                    {tab === 'active' ? (
                        <AlertsList active={activeAlerts} triggered={triggeredAlerts} onDelete={handleDelete} loading={loading} />
                    ) : (
                        <CreatePriceAlertForm onSuccess={() => { setTab('active'); fetchAlerts(); }} />
                    )}
                </div>
            </div>
        </div>
    );
};

const PriceAlertItem: React.FC<{ alert: PriceAlert; onDelete: (id: string) => void }> = ({ alert, onDelete }) => (
    <div className="flex items-center justify-between p-3 rounded-lg bg-gray-100 dark:bg-gray-700/50">
        <div>
            <p className="font-bold">{alert.symbol || 'نامشخص'}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
                اگر قیمت به {alert.condition === 'crosses_above' ? 'بالای' : 'پایین'} <span className="font-mono">{alert.targetPrice || '?'}</span> رسید.
            </p>
        </div>
        <button onClick={() => onDelete(alert.id)} className="p-2 text-gray-400 hover:text-red-500"><Trash2 size={16} /></button>
    </div>
);

const NewsAlertItem: React.FC<{ alert: NewsAlert; onDelete: (id: string) => void }> = ({ alert, onDelete }) => (
    <div className="flex items-center justify-between p-3 rounded-lg bg-gray-100 dark:bg-gray-700/50">
        <div>
            <p className="font-bold">{alert.newsTitle || 'رویداد نامشخص'}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
                {alert.triggerBeforeMinutes || '?'} دقیقه قبل از رویداد در {new Date(alert.eventTime).toLocaleTimeString('fa-IR')}
            </p>
        </div>
        <button onClick={() => onDelete(alert.id)} className="p-2 text-gray-400 hover:text-red-500"><Trash2 size={16} /></button>
    </div>
);


const AlertsList: React.FC<{ active: Alert[], triggered: Alert[], onDelete: (id: string) => void, loading: boolean }> = ({ active, triggered, onDelete, loading }) => {
    if (loading) return <div>در حال بارگذاری...</div>;
    
    const renderAlert = (alert: Alert) => {
        if (alert.type === 'price') {
            return <PriceAlertItem key={alert.id} alert={alert as PriceAlert} onDelete={onDelete} />;
        }
        if (alert.type === 'news') {
            return <NewsAlertItem key={alert.id} alert={alert as NewsAlert} onDelete={onDelete} />;
        }
        return null;
    };

    return (
        <div className="space-y-4">
            {active.length === 0 && triggered.length === 0 ? <p className="text-center text-gray-500">هیچ هشداری ثبت نشده است.</p> : null}
            {active.length > 0 && <div className="space-y-2">{active.map(renderAlert)}</div>}
            {triggered.length > 0 && (
                <div>
                    <h3 className="text-sm font-semibold text-gray-400 my-4 border-b dark:border-gray-600 pb-1">هشدار های فعال شده</h3>
                    <div className="space-y-2 opacity-60">{triggered.map(renderAlert)}</div>
                </div>
            )}
        </div>
    );
};

const CreatePriceAlertForm: React.FC<{ onSuccess: () => void }> = ({ onSuccess }) => {
    const [symbol, setSymbol] = useState(SYMBOLS[0]);
    const [condition, setCondition] = useState<PriceAlertCondition>('crosses_above');
    const [targetPrice, setTargetPrice] = useState('');
    const { addNotification } = useNotification();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const price = parseFloat(targetPrice);
        if (isNaN(price) || price <= 0) {
            addNotification('لطفاً قیمت معتبری وارد کنید.', 'error');
            return;
        }

        const newAlert: PriceAlert = {
            id: `price-${symbol}-${Date.now()}`,
            type: 'price',
            status: 'active',
            createdAt: new Date().toISOString(),
            symbol,
            condition,
            targetPrice: price
        };

        await addAlert(newAlert);
        addNotification(`هشدار قیمت برای ${symbol} ثبت شد.`, 'success');
        onSuccess();
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                 <div>
                    <label className="block text-sm font-medium mb-1">نماد</label>
                    <select value={symbol} onChange={e => setSymbol(e.target.value)} className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600">
                        {SYMBOLS.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                </div>
                 <div>
                    <label className="block text-sm font-medium mb-1">شرط</label>
                    <select value={condition} onChange={e => setCondition(e.target.value as PriceAlertCondition)} className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600">
                        <option value="crosses_above">عبور به بالا</option>
                        <option value="crosses_below">عبور به پایین</option>
                    </select>
                </div>
                 <div>
                    <label className="block text-sm font-medium mb-1">قیمت هدف</label>
                    <input type="number" step="any" value={targetPrice} onChange={e => setTargetPrice(e.target.value)} required placeholder="1.2345" className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600" />
                </div>
            </div>
            <button type="submit" className="w-full flex items-center justify-center gap-2 bg-indigo-500 text-white px-4 py-2 rounded-lg shadow-md hover:bg-indigo-600 transition-colors">
                <Plus size={18} />
                <span>ثبت هشدار</span>
            </button>
        </form>
    );
};

export default AlertsManager;