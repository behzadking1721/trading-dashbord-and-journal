import React, { useState, useEffect } from 'react';
import { Bell, Trash2, X } from 'lucide-react';
import type { Alert, PriceAlert, NewsAlert } from '../types';
import { getAlerts, deleteAlert } from '../db';
import { useNotification } from '../contexts/NotificationContext';

interface AlertsManagerProps {
    isOpen: boolean;
    onClose: () => void;
}

const AlertsManager: React.FC<AlertsManagerProps> = ({ isOpen, onClose }) => {
    const [activeAlerts, setActiveAlerts] = useState<Alert[]>([]);
    const [triggeredAlerts, setTriggeredAlerts] = useState<Alert[]>([]);
    const [loading, setLoading] = useState(true);
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
                    <h2 className="text-xl font-bold flex items-center gap-2"><Bell /> هشدارها</h2>
                    <button onClick={onClose} className="p-1 rounded-full text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600"><X size={20} /></button>
                </div>
                <div className="p-6 overflow-y-auto">
                    <AlertsList active={activeAlerts} triggered={triggeredAlerts} onDelete={handleDelete} loading={loading} />
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

export default AlertsManager;