import React, { useState, useEffect, useRef } from 'react';
import { Save, Plus, Trash2, Edit, CheckCircle, Settings as SettingsIcon, LayoutDashboard, Database, Upload, Download, Bell } from 'lucide-react';
import type { TradingSetup, TradingChecklistItem, WidgetVisibility, JournalEntry, NotificationSettings, RiskSettings } from '../types';
import { WIDGET_DEFINITIONS } from '../constants';
import { getJournalEntries, addJournalEntry } from '../db';


const STORAGE_KEY_SETUPS = 'trading-setups';
const STORAGE_KEY_WIDGET_VISIBILITY = 'dashboard-widget-visibility';
const STORAGE_KEY_NOTIFICATION_SETTINGS = 'notification-settings';
const STORAGE_KEY_RISK_SETTINGS = 'risk-management-settings';


const SettingsPage: React.FC = () => {
    // State for Risk Management
    const [riskSettings, setRiskSettings] = useState<RiskSettings>({
        accountBalance: 10000,
        strategy: 'fixed_percent',
        fixedPercent: { risk: 1 },
        antiMartingale: { baseRisk: 1, increment: 0.5, maxRisk: 4 }
    });
    const [saved, setSaved] = useState(false);

    // State for Trading Setups
    const [setups, setSetups] = useState<TradingSetup[]>([]);
    const [editingSetup, setEditingSetup] = useState<TradingSetup | null>(null);

    // State for Widget Management
    const [widgetVisibility, setWidgetVisibility] = useState<WidgetVisibility>({});
    
    // State for Notification settings
    const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
        globalEnable: true,
        priceAlerts: true,
        newsAlerts: true,
    });

    // Ref for file input
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        try {
            // Load risk settings
            const savedRisk = localStorage.getItem(STORAGE_KEY_RISK_SETTINGS);
            if(savedRisk) setRiskSettings(JSON.parse(savedRisk));
            
            // Legacy support for old settings
            if(!savedRisk) {
                const legacyBalance = localStorage.getItem('accountBalance');
                const legacyRisk = localStorage.getItem('maxRiskPerTrade');
                if(legacyBalance || legacyRisk) {
                    setRiskSettings(prev => ({
                        ...prev,
                        accountBalance: legacyBalance ? parseFloat(legacyBalance) : prev.accountBalance,
                        fixedPercent: { risk: legacyRisk ? parseFloat(legacyRisk) : prev.fixedPercent.risk }
                    }))
                }
            }


            // Load trading setups
            const savedSetups = localStorage.getItem(STORAGE_KEY_SETUPS);
            if (savedSetups) {
                setSetups(JSON.parse(savedSetups));
            }

            // Load widget visibility
            const savedVisibility = localStorage.getItem(STORAGE_KEY_WIDGET_VISIBILITY);
            const initialVisibility: WidgetVisibility = savedVisibility ? JSON.parse(savedVisibility) : {};
            // Ensure all widgets have a default value
            Object.keys(WIDGET_DEFINITIONS).forEach(key => {
                if (initialVisibility[key] === undefined) {
                    initialVisibility[key] = true;
                }
            });
            setWidgetVisibility(initialVisibility);

            // Load notification settings
            const savedNotificationSettings = localStorage.getItem(STORAGE_KEY_NOTIFICATION_SETTINGS);
            if (savedNotificationSettings) {
                setNotificationSettings(JSON.parse(savedNotificationSettings));
            }


        } catch (error) {
            console.error("Could not access localStorage to get settings:", error);
        }
    }, []);

    const handleRiskSettingsChange = (field: string, value: any) => {
        const path = field.split('.');
        setRiskSettings(prev => {
            const newState = JSON.parse(JSON.stringify(prev)); // Deep copy
            let current = newState;
            for(let i = 0; i < path.length - 1; i++){
                current = current[path[i]];
            }
            current[path[path.length - 1]] = value;
            return newState;
        });
    }

    const handleSaveRisk = () => {
        try {
            localStorage.setItem(STORAGE_KEY_RISK_SETTINGS, JSON.stringify(riskSettings));
            // For Wallet Widget compatibility
            localStorage.setItem('accountBalance', riskSettings.accountBalance.toString());
            window.dispatchEvent(new StorageEvent('storage', { key: 'accountBalance' }));
            setSaved(true);
            setTimeout(() => setSaved(false), 2000);
        } catch (error) {
            console.error("Could not access localStorage to save settings:", error);
            alert("خطا در ذخیره تنظیمات. ممکن است دسترسی به حافظه مرورگر مسدود باشد.");
        }
    };
    
    // --- Trading Setup Functions ---
    const saveSetups = (updatedSetups: TradingSetup[]) => {
        try {
            localStorage.setItem(STORAGE_KEY_SETUPS, JSON.stringify(updatedSetups));
            setSetups(updatedSetups);
            window.dispatchEvent(new StorageEvent('storage', { key: STORAGE_KEY_SETUPS }));
        } catch(e) { console.error(e); }
    };
    
    const handleAddNewSetup = () => { setEditingSetup({ id: Date.now().toString(), name: '', description: '', category: 'تکنیکال', checklist: [], isActive: false }); };
    const handleSaveSetup = (setup: TradingSetup) => {
        const existingIndex = setups.findIndex(s => s.id === setup.id);
        const updatedSetups = [...setups];
        if (existingIndex > -1) updatedSetups[existingIndex] = setup;
        else updatedSetups.push(setup);
        saveSetups(updatedSetups);
        setEditingSetup(null);
    };
    const handleDeleteSetup = (id: string) => { if (window.confirm('آیا از حذف این ستاپ مطمئن هستید؟')) saveSetups(setups.filter(s => s.id !== id)); };
    const handleSetActive = (id: string) => { saveSetups(setups.map(s => ({ ...s, isActive: s.id === id }))); };
    
    // --- Widget Management Functions ---
    const handleVisibilityChange = (widgetKey: string, isVisible: boolean) => {
        const newVisibility = { ...widgetVisibility, [widgetKey]: isVisible };
        setWidgetVisibility(newVisibility);
        try {
            localStorage.setItem(STORAGE_KEY_WIDGET_VISIBILITY, JSON.stringify(newVisibility));
            window.dispatchEvent(new StorageEvent('storage', { key: STORAGE_KEY_WIDGET_VISIBILITY }));
        } catch (error) {
            console.error("Failed to save widget visibility", error);
        }
    };
    
    // --- Notification Management Functions ---
    const handleNotificationSettingChange = (key: keyof NotificationSettings, value: boolean) => {
        const newSettings = { ...notificationSettings, [key]: value };
        if (key === 'globalEnable' && !value) {
            newSettings.priceAlerts = false;
            newSettings.newsAlerts = false;
        }
        setNotificationSettings(newSettings);
        try {
            localStorage.setItem(STORAGE_KEY_NOTIFICATION_SETTINGS, JSON.stringify(newSettings));
        } catch (error) {
            console.error("Failed to save notification settings", error);
        }
    };

    // --- Data Management Functions ---
    const handleExport = async () => {
        try {
            const entries = await getJournalEntries();
            if (entries.length === 0) {
                alert('هیچ معامله‌ای برای خروجی گرفتن وجود ندارد.');
                return;
            }

            const headers = Object.keys(entries[0]);
            const csvRows = [headers.join(',')];

            for (const entry of entries) {
                const values = headers.map(header => {
                    const key = header as keyof JournalEntry;
                    let value = entry[key];
                    if (Array.isArray(value)) {
                        return `"${value.join(';')}"`;
                    }
                    if (typeof value === 'string') {
                        return `"${value.replace(/"/g, '""')}"`;
                    }
                    return value;
                });
                csvRows.push(values.join(','));
            }

            const csvString = csvRows.join('\n');
            const blob = new Blob([`\uFEFF${csvString}`], { type: 'text/csv;charset=utf-8;' });

            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', `trading-journal-export-${new Date().toISOString().split('T')[0]}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error("Failed to export journal:", error);
            alert("خطا در خروجی گرفتن از ژورنال.");
        }
    };

    const handleImportClick = () => {
        fileInputRef.current?.click();
    };

    const handleImportFile = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (e) => {
            const text = e.target?.result as string;
            if (!text) {
                alert('فایل خالی است یا قابل خواندن نیست.');
                return;
            }

            try {
                const rows = text.split(/\r?\n/).filter(row => row.trim() !== '');
                if (rows.length < 2) {
                    alert('فایل CSV باید حداقل شامل یک هدر و یک ردیف داده باشد.');
                    return;
                }

                const headers = rows[0].trim().split(',');
                let importedCount = 0;

                for (let i = 1; i < rows.length; i++) {
                    const values = rows[i].trim().split(','); // Note: This is a simple parser
                    const entryObj: { [key: string]: any } = {};
                    headers.forEach((header, index) => {
                         const value = values[index];
                         if (value?.startsWith('"') && value.endsWith('"')) {
                            entryObj[header] = value.substring(1, value.length - 1).replace(/""/g, '"');
                         } else {
                            entryObj[header] = value;
                         }
                    });

                    // Type conversion and validation
                     if (!entryObj.id || !entryObj.date || !entryObj.symbol) {
                        console.warn('Skipping invalid entry:', entryObj);
                        continue;
                    }

                    const typedEntry: JournalEntry = {
                        ...entryObj as any,
                        entryPrice: parseFloat(entryObj.entryPrice),
                        exitPrice: parseFloat(entryObj.exitPrice),
                        stopLoss: parseFloat(entryObj.stopLoss),
                        takeProfit: parseFloat(entryObj.takeProfit),
                        positionSize: parseFloat(entryObj.positionSize),
                        riskRewardRatio: parseFloat(entryObj.riskRewardRatio),
                        profitOrLoss: parseFloat(entryObj.profitOrLoss),
                        emotions: entryObj.emotions?.split(';') || [],
                        mistakes: entryObj.mistakes?.split(';') || [],
                    };
                    
                    await addJournalEntry(typedEntry);
                    importedCount++;
                }
                alert(`${importedCount} معامله با موفقیت وارد شد.`);
            } catch (err) {
                console.error("Error importing CSV:", err);
                alert('خطا در پردازش فایل CSV. لطفاً از فرمت صحیح فایل اطمینان حاصل کنید.');
            } finally {
                if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                }
            }
        };
        reader.readAsText(file);
    };

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-6">تنظیمات</h1>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Column 1 */}
                <div className="space-y-6">
                    {/* Risk Management Card */}
                    <div className="p-6 rounded-lg shadow-md bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border border-gray-200 dark:border-gray-700">
                        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2"><SettingsIcon size={20}/> مدیریت سرمایه و ریسک</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">موجودی حساب ($)</label>
                                <input type="number" value={riskSettings.accountBalance} onChange={e => handleRiskSettingsChange('accountBalance', parseFloat(e.target.value))} className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600" placeholder="مثال: 10000" />
                            </div>
                             <div>
                                <label className="block text-sm font-medium mb-1">استراتژی مدیریت حجم</label>
                                <select value={riskSettings.strategy} onChange={e => handleRiskSettingsChange('strategy', e.target.value)} className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600">
                                    <option value="fixed_percent">درصد ثابت</option>
                                    <option value="anti_martingale">افزایشی (ضد مارتینگل)</option>
                                </select>
                            </div>
                            {riskSettings.strategy === 'fixed_percent' && (
                                <div>
                                    <label className="block text-sm font-medium mb-1">درصد ریسک در هر معامله (%)</label>
                                    <input type="number" step="0.1" value={riskSettings.fixedPercent.risk} onChange={e => handleRiskSettingsChange('fixedPercent.risk', parseFloat(e.target.value))} className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600" placeholder="مثال: 1" />
                                </div>
                            )}
                             {riskSettings.strategy === 'anti_martingale' && (
                                <div className="space-y-3 p-3 border rounded-md dark:border-gray-600">
                                     <h4 className="text-xs font-semibold">تنظیمات استراتژی افزایشی</h4>
                                    <div>
                                        <label className="block text-xs font-medium mb-1">درصد ریسک پایه (%)</label>
                                        <input type="number" step="0.1" value={riskSettings.antiMartingale.baseRisk} onChange={e => handleRiskSettingsChange('antiMartingale.baseRisk', parseFloat(e.target.value))} className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium mb-1">افزایش ریسک بعد از هر برد (%)</label>
                                        <input type="number" step="0.1" value={riskSettings.antiMartingale.increment} onChange={e => handleRiskSettingsChange('antiMartingale.increment', parseFloat(e.target.value))} className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600" />
                                    </div>
                                     <div>
                                        <label className="block text-xs font-medium mb-1">حداکثر درصد ریسک (%)</label>
                                        <input type="number" step="0.1" value={riskSettings.antiMartingale.maxRisk} onChange={e => handleRiskSettingsChange('antiMartingale.maxRisk', parseFloat(e.target.value))} className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600" />
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="border-t border-gray-200 dark:border-gray-600 pt-4 mt-4">
                            <button onClick={handleSaveRisk} className="w-full flex items-center justify-center gap-2 bg-indigo-500 text-white px-4 py-2 rounded-lg shadow-md hover:bg-indigo-600 transition-colors">
                                <Save size={18} />
                                <span>{saved ? 'ذخیره شد!' : 'ذخیره تنظیمات ریسک'}</span>
                            </button>
                        </div>
                    </div>

                    {/* Notification Settings Card */}
                    <div className="p-6 rounded-lg shadow-md bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border border-gray-200 dark:border-gray-700">
                        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2"><Bell size={20}/> مدیریت اعلان‌ها</h2>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="font-semibold text-sm">فعال‌سازی کلی اعلان‌ها</p>
                                    <p className="text-xs text-gray-500">فعال یا غیرفعال کردن تمام هشدارها</p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" checked={notificationSettings.globalEnable} onChange={e => handleNotificationSettingChange('globalEnable', e.target.checked)} className="sr-only peer" />
                                    <div className="w-11 h-6 bg-gray-200 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-600"></div>
                                </label>
                            </div>
                            <div className={`flex items-center justify-between transition-opacity ${!notificationSettings.globalEnable ? 'opacity-50' : ''}`}>
                                <div>
                                    <p className="font-semibold text-sm">هشدار قیمت</p>
                                    <p className="text-xs text-gray-500">اعلان هنگام رسیدن قیمت به سطح مشخص</p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" checked={notificationSettings.priceAlerts} onChange={e => handleNotificationSettingChange('priceAlerts', e.target.checked)} disabled={!notificationSettings.globalEnable} className="sr-only peer" />
                                    <div className="w-11 h-6 bg-gray-200 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-600"></div>
                                </label>
                            </div>
                            <div className={`flex items-center justify-between transition-opacity ${!notificationSettings.globalEnable ? 'opacity-50' : ''}`}>
                                <div>
                                    <p className="font-semibold text-sm">هشدار رویدادهای اقتصادی</p>
                                    <p className="text-xs text-gray-500">یادآوری قبل از اخبار مهم</p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" checked={notificationSettings.newsAlerts} onChange={e => handleNotificationSettingChange('newsAlerts', e.target.checked)} disabled={!notificationSettings.globalEnable} className="sr-only peer" />
                                    <div className="w-11 h-6 bg-gray-200 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-600"></div>
                                </label>
                            </div>
                        </div>
                    </div>

                     {/* Widget Management Card */}
                    <div className="p-6 rounded-lg shadow-md bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border border-gray-200 dark:border-gray-700">
                        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2"><LayoutDashboard size={20}/> مدیریت ویجت‌های داشبورد</h2>
                        <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                           {Object.entries(WIDGET_DEFINITIONS).map(([key, { title, icon: Icon, description }]) => (
                               <div key={key} className="flex items-center justify-between">
                                   <div className="flex items-center gap-3">
                                       <Icon className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                                       <div>
                                           <p className="font-semibold text-sm">{title}</p>
                                           <p className="text-xs text-gray-500">{description}</p>
                                       </div>
                                   </div>
                                   <label className="relative inline-flex items-center cursor-pointer">
                                       <input type="checkbox" checked={widgetVisibility[key]} onChange={e => handleVisibilityChange(key, e.target.checked)} className="sr-only peer" />
                                       <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-600"></div>
                                   </label>
                               </div>
                           ))}
                        </div>
                    </div>
                </div>

                {/* Column 2 */}
                <div className="space-y-6">
                     {/* Data Management Card */}
                    <div className="p-6 rounded-lg shadow-md bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border border-gray-200 dark:border-gray-700">
                        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2"><Database size={20}/> مدیریت داده‌ها</h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                            از داده‌های ژورنال خود خروجی CSV بگیرید یا یک فایل پشتیبان را وارد کنید.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4">
                            <button onClick={handleExport} className="flex-1 flex items-center justify-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-lg shadow-md hover:bg-blue-600 transition-colors">
                                <Download size={18} />
                                <span>خروجی گرفتن (CSV)</span>
                            </button>
                            <button onClick={handleImportClick} className="flex-1 flex items-center justify-center gap-2 bg-green-500 text-white px-4 py-2 rounded-lg shadow-md hover:bg-green-600 transition-colors">
                                <Upload size={18} />
                                <span>وارد کردن (CSV)</span>
                            </button>
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleImportFile}
                                className="hidden"
                                accept=".csv"
                            />
                        </div>
                    </div>

                    {/* Trading Setups Card */}
                    <div className="p-6 rounded-lg shadow-md bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border border-gray-200 dark:border-gray-700">
                         <div className="flex justify-between items-center mb-4">
                            <h2 className="text-lg font-semibold">ستاپ‌های معاملاتی</h2>
                            <button onClick={handleAddNewSetup} className="flex items-center gap-2 bg-green-500 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-green-600 transition-colors">
                                <Plus size={16} />
                                <span>ستاپ جدید</span>
                            </button>
                        </div>
                        <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                            {setups.length > 0 ? setups.map(setup => (
                                 <div key={setup.id} className="p-3 rounded-md border dark:border-gray-600 flex justify-between items-center">
                                    <div>
                                        <p className="font-bold">{setup.name} {setup.isActive && <span className="text-green-500 text-xs">(فعال)</span>}</p>
                                        <p className="text-xs text-gray-500">{setup.category} - {setup.checklist.length} آیتم</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                         <button title="فعال سازی" onClick={() => handleSetActive(setup.id)} className={`p-2 rounded-full ${setup.isActive ? 'text-green-500' : 'text-gray-400 hover:text-green-500'}`}>
                                            <CheckCircle size={18} />
                                        </button>
                                         <button title="ویرایش" onClick={() => setEditingSetup(setup)} className="p-2 rounded-full text-gray-400 hover:text-blue-500">
                                            <Edit size={16} />
                                        </button>
                                        <button title="حذف" onClick={() => handleDeleteSetup(setup.id)} className="p-2 rounded-full text-gray-400 hover:text-red-500">
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                 </div>
                            )) : <p className="text-center text-sm text-gray-500 py-4">هنوز هیچ ستاپی ثبت نشده است.</p>}
                        </div>
                    </div>
                </div>
            </div>
            {editingSetup && <SetupFormModal setup={editingSetup} onSave={handleSaveSetup} onClose={() => setEditingSetup(null)} />}
        </div>
    );
};

const SetupFormModal: React.FC<{setup: TradingSetup, onSave: (setup: TradingSetup) => void, onClose: () => void}> = ({ setup, onSave, onClose }) => {
    const [currentSetup, setCurrentSetup] = useState(setup);
    const [newItemText, setNewItemText] = useState('');
    const handleAddItem = () => { if (newItemText.trim()) { setCurrentSetup(prev => ({ ...prev, checklist: [...prev.checklist, { id: Date.now().toString(), text: newItemText }]})); setNewItemText(''); } };
    const handleDeleteItem = (id: string) => { setCurrentSetup(prev => ({ ...prev, checklist: prev.checklist.filter(item => item.id !== id)})); };
    const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); onSave(currentSetup); };
    return (
         <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
                <div className="flex justify-between items-center p-4 border-b dark:border-gray-700">
                    <h2 className="text-xl font-bold">ویرایش ستاپ معاملاتی</h2>
                    <button onClick={onClose} className="p-1 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">&times;</button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
                    <input type="text" placeholder="نام ستاپ" required value={currentSetup.name} onChange={e => setCurrentSetup({...currentSetup, name: e.target.value})} className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600" />
                    <textarea placeholder="توضیحات" value={currentSetup.description} onChange={e => setCurrentSetup({...currentSetup, description: e.target.value})} className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600" rows={2}></textarea>
                    <div>
                        <h3 className="text-md font-semibold mb-2">چک‌لیست</h3>
                        <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                           {currentSetup.checklist.map(item => (
                               <div key={item.id} className="flex items-center justify-between text-sm bg-gray-100 dark:bg-gray-700/50 p-2 rounded">
                                   <span>{item.text}</span>
                                   <button type="button" onClick={() => handleDeleteItem(item.id)} className="p-1 text-red-500 opacity-50 hover:opacity-100">
                                       <Trash2 size={14} />
                                   </button>
                               </div>
                           ))}
                        </div>
                        <div className="flex gap-2 mt-2">
                             <input type="text" value={newItemText} onChange={e => setNewItemText(e.target.value)} placeholder="آیتم جدید چک‌لیست" className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600" />
                             <button type="button" onClick={handleAddItem} className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">افزودن</button>
                        </div>
                    </div>
                    <div className="flex justify-end gap-3 pt-4 border-t dark:border-gray-700 mt-auto">
                        <button type="button" onClick={onClose} className="px-4 py-2 rounded bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500">انصراف</button>
                        <button type="submit" className="px-4 py-2 rounded bg-indigo-500 text-white hover:bg-indigo-600">ذخیره ستاپ</button>
                    </div>
                 </form>
            </div>
        </div>
    );
};

export default SettingsPage;