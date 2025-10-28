import React, { useState, useEffect, useRef, lazy, Suspense } from 'react';
import { Save, Plus, Trash2, Edit, CheckCircle, Settings as SettingsIcon, LayoutDashboard, Database, Upload, Download, Bell, Edit3, RefreshCw, SlidersHorizontal, Brain, Clock, AlertTriangle, Palette, Shield } from 'lucide-react';
import type { TradingSetup, WidgetVisibility, JournalEntry, NotificationSettings, RiskSettings, JournalFormSettings, FormFieldSetting, JournalFormField, PsychologyOptions, SettingsTab, AccentColor } from '../../types';
import { WIDGET_DEFINITIONS, JOURNAL_FORM_FIELDS } from '../../constants';
import { getJournalEntries, addJournalEntry, deleteJournalEntry } from '../../db';
import { useNotification } from '../contexts/NotificationContext';
import { useAppContext } from '../contexts/AppContext';
import Card from './shared/Card';

const SetupFormModal = lazy(() => import('./settings/SetupFormModal'));

const STORAGE_KEY_SETUPS = 'trading-setups';
const STORAGE_KEY_WIDGET_VISIBILITY = 'dashboard-widget-visibility';
const STORAGE_KEY_NOTIFICATION_SETTINGS = 'notification-settings';
const STORAGE_KEY_RISK_SETTINGS = 'risk-management-settings';
const STORAGE_KEY_FORM_SETTINGS = 'journal-form-settings';
const PSYCHOLOGY_OPTIONS_KEY = 'psychology-options';

const DEFAULT_PSYCHOLOGY_OPTIONS: PsychologyOptions = {
    emotionsBefore: ['مطمئن', 'منظم', 'مضطرب', 'هیجانی'],
    entryReasons: ['ستاپ تکنیکال', 'خبر', 'دنبال کردن ترند', 'ترس از دست دادن (FOMO)', 'انتقام'],
    emotionsAfter: ['رضایت', 'پشیمانی', 'شک', 'هیجان‌زده'],
};

// Helper to set nested properties
const setNestedValue = (obj: any, path: string, value: any) => {
    const keys = path.split('.');
    let current = obj;
    for (let i = 0; i < keys.length - 1; i++) {
        if (current[keys[i]] === undefined) {
            current[keys[i]] = {};
        }
        current = current[keys[i]];
    }
    current[keys[keys.length - 1]] = value;
};

const PsychologyManager: React.FC<{ title: string; items: string[]; onAdd: (item: string) => void; onRemove: (item: string) => void; }> = ({ title, items, onAdd, onRemove }) => {
    const [newItem, setNewItem] = useState('');
    const handleAdd = () => { if (newItem.trim()) { onAdd(newItem.trim()); setNewItem(''); } };
    return (
        <div>
            <label className="block text-sm font-medium mb-1">{title}</label>
            <div className="flex flex-wrap gap-2 p-2 border rounded-md dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 min-h-[40px]">
                {items.map(item => (
                    <div key={item} className="flex items-center gap-1 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-800 dark:text-indigo-200 text-xs px-2 py-1 rounded-full">
                        {item}
                        <button type="button" onClick={() => onRemove(item)} className="text-indigo-500 hover:text-indigo-700 dark:hover:text-indigo-300"><Trash2 size={12} /></button>
                    </div>
                ))}
            </div>
            <div className="flex gap-2 mt-2">
                <input type="text" value={newItem} onChange={e => setNewItem(e.target.value)} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAdd())} placeholder="افزودن آیتم جدید..." className="w-full p-2 border rounded text-xs dark:bg-gray-700 dark:border-gray-600" />
                <button type="button" onClick={handleAdd} className="p-2 bg-green-500 text-white rounded hover:bg-green-600"><Plus size={16} /></button>
            </div>
        </div>
    );
};

const ToggleSwitch: React.FC<{checked: boolean; onChange: (checked: boolean) => void; disabled?: boolean;}> = ({ checked, onChange, disabled=false }) => (
    <label className="relative inline-flex items-center cursor-pointer"><input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} disabled={disabled} className="sr-only peer" /><div className="w-11 h-6 bg-gray-200 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div></label>
);


const SettingsPage: React.FC = () => {
    const [activeTab, setActiveTab] = useState<SettingsTab>('personalization');
    const { appMode, setAppMode, theme, toggleTheme, accentColor, setAccentColor } = useAppContext();
    const [riskSettings, setRiskSettings] = useState<RiskSettings>({
        accountBalance: 10000,
        strategy: 'fixed_percent',
        fixedPercent: { risk: 1 },
        antiMartingale: { baseRisk: 1, increment: 0.5, maxRisk: 4 }
    });
    const [setups, setSetups] = useState<TradingSetup[]>([]);
    const [editingSetup, setEditingSetup] = useState<TradingSetup | null>(null);
    const [widgetVisibility, setWidgetVisibility] = useState<WidgetVisibility>({});
    const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
        globalEnable: true, newsAlerts: true, cryptoNewsAlerts: true, stockNewsAlerts: true,
    });
    const [formSettings, setFormSettings] = useState<JournalFormSettings>({});
    const [psychologyOptions, setPsychologyOptions] = useState<PsychologyOptions>(DEFAULT_PSYCHOLOGY_OPTIONS);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { addNotification } = useNotification();
    const [isExporting, setIsExporting] = useState(false);
    const [isImporting, setIsImporting] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [deleteConfirmationText, setDeleteConfirmationText] = useState('');


    useEffect(() => {
        try {
            const savedRisk = localStorage.getItem(STORAGE_KEY_RISK_SETTINGS);
            if (savedRisk) setRiskSettings(JSON.parse(savedRisk));
            
            const savedSetups = localStorage.getItem(STORAGE_KEY_SETUPS);
            if (savedSetups) setSetups(JSON.parse(savedSetups));
            
            const savedVisibility = localStorage.getItem(STORAGE_KEY_WIDGET_VISIBILITY);
            const initialVisibility: WidgetVisibility = savedVisibility ? JSON.parse(savedVisibility) : {};
            Object.keys(WIDGET_DEFINITIONS).forEach(key => { if (initialVisibility[key] === undefined) initialVisibility[key] = true; });
            setWidgetVisibility(initialVisibility);

            const savedNotificationSettings = localStorage.getItem(STORAGE_KEY_NOTIFICATION_SETTINGS);
            if (savedNotificationSettings) setNotificationSettings(JSON.parse(savedNotificationSettings));
            
            const savedFormSettings = localStorage.getItem(STORAGE_KEY_FORM_SETTINGS);
            const initialFormSettings: JournalFormSettings = savedFormSettings ? JSON.parse(savedFormSettings) : {};
            JOURNAL_FORM_FIELDS.forEach(field => { if (initialFormSettings[field.id] === undefined) initialFormSettings[field.id] = { isActive: true, defaultValue: undefined }; });
            setFormSettings(initialFormSettings);

            const savedPsychologyOptions = localStorage.getItem(PSYCHOLOGY_OPTIONS_KEY);
            if (savedPsychologyOptions) setPsychologyOptions(JSON.parse(savedPsychologyOptions));

        } catch (error) { console.error("Could not access localStorage to get settings:", error); }
    }, []);

    const handleSaveRisk = () => { try { localStorage.setItem(STORAGE_KEY_RISK_SETTINGS, JSON.stringify(riskSettings)); localStorage.setItem('accountBalance', riskSettings.accountBalance.toString()); window.dispatchEvent(new StorageEvent('storage', { key: 'accountBalance' })); addNotification('تنظیمات ریسک ذخیره شد.', 'success'); } catch (error) { console.error("Could not save settings:", error); addNotification("خطا در ذخیره تنظیمات ریسک.", 'error'); }};
    const saveSetups = (updatedSetups: TradingSetup[]) => { try { localStorage.setItem(STORAGE_KEY_SETUPS, JSON.stringify(updatedSetups)); setSetups(updatedSetups); window.dispatchEvent(new StorageEvent('storage', { key: STORAGE_KEY_SETUPS })); } catch(e) { console.error(e); }};
    const handleAddNewSetup = () => { setEditingSetup({ id: Date.now().toString(), name: '', description: '', category: 'تکنیکال', checklist: [], isActive: false, defaultTags: [], defaultMistakes: [] }); };
    const handleSaveSetup = (setup: TradingSetup) => { const existingIndex = setups.findIndex(s => s.id === setup.id); const updatedSetups = [...setups]; if (existingIndex > -1) updatedSetups[existingIndex] = setup; else updatedSetups.push(setup); saveSetups(updatedSetups); setEditingSetup(null); addNotification('ستاپ معاملاتی ذخیره شد.', 'success');};
    const handleDeleteSetup = (id: string) => { if (window.confirm('آیا از حذف این ستاپ مطمئن هستید؟')) {saveSetups(setups.filter(s => s.id !== id)); addNotification('ستاپ معاملاتی حذف شد.', 'info'); }};
    const handleSetActive = (id: string) => { saveSetups(setups.map(s => ({ ...s, isActive: s.id === id }))); addNotification('ستاپ فعال تغییر کرد.', 'info'); };
    const handleVisibilityChange = (widgetKey: string, isVisible: boolean) => { const newVisibility = { ...widgetVisibility, [widgetKey]: isVisible }; setWidgetVisibility(newVisibility); try { localStorage.setItem(STORAGE_KEY_WIDGET_VISIBILITY, JSON.stringify(newVisibility)); window.dispatchEvent(new StorageEvent('storage', { key: STORAGE_KEY_WIDGET_VISIBILITY })); } catch (error) { console.error("Failed to save widget visibility", error); }};
    const handleNotificationSettingChange = (key: keyof NotificationSettings, value: boolean) => { const newSettings = { ...notificationSettings, [key]: value }; if (key === 'globalEnable' && !value) { Object.keys(newSettings).forEach(k => { if(k !== 'globalEnable') newSettings[k as keyof NotificationSettings] = false; }); } setNotificationSettings(newSettings); try { localStorage.setItem(STORAGE_KEY_NOTIFICATION_SETTINGS, JSON.stringify(newSettings)); addNotification('تنظیمات اعلان‌ها ذخیره شد.', 'success'); } catch (error) { console.error("Failed to save notification settings", error); }};
    const handleFormSettingChange = (fieldId: JournalFormField, property: keyof FormFieldSetting, value: any) => { const newSettings = { ...formSettings, [fieldId]: { ...(formSettings[fieldId] || { isActive: true }), [property]: value } }; setFormSettings(newSettings); try { localStorage.setItem(STORAGE_KEY_FORM_SETTINGS, JSON.stringify(newSettings)); } catch (error) { console.error("Failed to save form settings", error); }};
    const handlePsychologyOptionChange = (key: keyof PsychologyOptions, items: string[]) => { const newOptions = { ...psychologyOptions, [key]: items }; setPsychologyOptions(newOptions); try { localStorage.setItem(PSYCHOLOGY_OPTIONS_KEY, JSON.stringify(newOptions)); } catch (e) { console.error(e); }};
    const handleExport = async () => { setIsExporting(true); try { const entries = await getJournalEntries(); if (entries.length === 0) { addNotification('هیچ معامله‌ای برای خروجی گرفتن وجود ندارد.', 'info'); return; } const jsonString = JSON.stringify(entries, null, 2); const blob = new Blob([jsonString], { type: 'application/json' }); const href = URL.createObjectURL(blob); const link = document.createElement('a'); link.href = href; const date = new Date().toISOString().split('T')[0]; link.download = `trading_journal_backup_${date}.json`; document.body.appendChild(link); link.click(); document.body.removeChild(link); URL.revokeObjectURL(href); addNotification('داده‌های ژورنال با موفقیت استخراج شد.', 'success'); } catch (error) { console.error("Export failed:", error); addNotification('خطا در خروجی گرفتن از داده‌ها.', 'error'); } finally { setIsExporting(false); }};
    const handleImportClick = () => { fileInputRef.current?.click(); };
    const handleImportFile = (event: React.ChangeEvent<HTMLInputElement>) => { const file = event.target.files?.[0]; if (!file) return; setIsImporting(true); const reader = new FileReader(); reader.onload = async (e) => { try { const text = e.target?.result; if (typeof text !== 'string') throw new Error('File content is not readable.'); const data = JSON.parse(text); if (!Array.isArray(data) || data.some(item => typeof item.id !== 'string' || typeof item.date !== 'string')) throw new Error('فایل نامعتبر است یا فرمت درستی ندارد.'); for (const entry of data as JournalEntry[]) { await addJournalEntry(entry); } addNotification(`${data.length} معامله با موفقیت وارد شد.`, 'success'); } catch (error: any) { console.error("Import failed:", error); addNotification(error.message || 'خطا در وارد کردن فایل.', 'error'); } finally { setIsImporting(false); if(event.target) event.target.value = ''; } }; reader.onerror = () => { addNotification('خطا در خواندن فایل.', 'error'); setIsImporting(false); }; reader.readAsText(file); };
    
    const handleConfirmDeleteAllData = async () => {
        if (deleteConfirmationText !== 'حذف') {
            addNotification('متن تایید اشتباه است.', 'error');
            return;
        }
        try {
            const entries = await getJournalEntries();
            for (const entry of entries) {
                await deleteJournalEntry(entry.id);
            }
            addNotification('تمام داده‌های ژورنال با موفقیت پاک شد.', 'success');
        } catch (error) {
            addNotification('خطا در پاک کردن داده‌ها.', 'error');
        } finally {
            setIsDeleteModalOpen(false);
            setDeleteConfirmationText('');
        }
    };
    
    const renderDefaultValueInput = (field: typeof JOURNAL_FORM_FIELDS[0]) => { const setting = formSettings[field.id]; const isNotConfigurable = field.type === 'special' || ['tags', 'mistakes', 'notesBefore', 'notesAfter', 'imageUrl'].includes(field.id); if (!setting || !setting.isActive || isNotConfigurable) return <div className="w-full h-9 bg-gray-100 dark:bg-gray-700/50 rounded-md" title="این فیلد مقدار پیش‌فرض ندارد"></div>; const commonProps = { value: setting.defaultValue ?? '', onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => handleFormSettingChange(field.id, 'defaultValue', e.target.type === 'number' ? parseFloat(e.target.value) : e.target.value), className: "w-full p-2 border rounded text-xs dark:bg-gray-700 dark:border-gray-600", placeholder: field.placeholder, }; if (field.type === 'select') { let options: {value: string, label: string}[] = []; if (field.id === 'setupId') options = setups.map(s => ({ value: s.id, label: s.name })); if (field.id === 'psychology.emotionBefore') options = psychologyOptions.emotionsBefore.map(e => ({ value: e, label: e })); if (field.id === 'psychology.entryReason') options = psychologyOptions.entryReasons.map(e => ({ value: e, label: e })); if (field.id === 'psychology.emotionAfter') options = psychologyOptions.emotionsAfter.map(e => ({ value: e, label: e })); return ( <select {...commonProps}> <option value="">پیش‌فرض ندارد</option> {options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)} </select> ); } return <input type={field.type} step="any" {...commonProps} />; };
    
    const tabs: { id: SettingsTab; label: string; icon: React.ElementType }[] = [
        { id: 'personalization', label: 'شخصی‌سازی', icon: Palette },
        { id: 'dashboard', label: 'داشبورد', icon: LayoutDashboard },
        { id: 'journal', label: 'ژورنال', icon: Edit3 },
        { id: 'risk', label: 'مدیریت ریسک', icon: Shield },
        { id: 'data', label: 'مدیریت داده‌ها', icon: Database },
    ];
    
    const accentColorOptions: { name: AccentColor, bg: string }[] = [
        { name: 'indigo', bg: 'bg-indigo-500' },
        { name: 'blue', bg: 'bg-blue-500' },
        { name: 'green', bg: 'bg-green-500' },
        { name: 'red', bg: 'bg-red-500' },
        { name: 'purple', bg: 'bg-purple-500' },
    ];

    const renderContent = () => {
        switch (activeTab) {
            case 'personalization': return (<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                 <Card title="حالت برنامه" icon={SettingsIcon}>
                    <div className="flex items-center justify-between">
                        <div><p className="font-semibold text-sm">حالت پیشرفته</p><p className="text-xs text-gray-500 dark:text-gray-400">ویجت‌ها و صفحات تحلیلی بیشتر را فعال کنید.</p></div>
                        <ToggleSwitch checked={appMode === 'advanced'} onChange={(isChecked) => setAppMode(isChecked ? 'advanced' : 'simple')} />
                    </div>
                 </Card>
                 <Card title="تنظیمات ظاهری" icon={Palette}>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <p className="font-semibold text-sm">تم برنامه</p>
                            <button onClick={toggleTheme} className="px-3 py-1.5 rounded-lg bg-gray-200 dark:bg-gray-700 text-sm font-semibold">{ { light: 'روشن', dark: 'تاریک', glass: 'شیشه‌ای' }[theme] }</button>
                        </div>
                        <div className="flex items-center justify-between">
                            <p className="font-semibold text-sm">رنگ اصلی</p>
                            <div className="flex items-center gap-2">
                                {accentColorOptions.map(opt => (
                                    <button key={opt.name} onClick={() => setAccentColor(opt.name)} className={`w-6 h-6 rounded-full ${opt.bg} transition-transform hover:scale-110 ${accentColor === opt.name ? 'ring-2 ring-offset-2 dark:ring-offset-gray-800 ring-white' : ''}`}></button>
                                ))}
                            </div>
                        </div>
                    </div>
                 </Card>
                 <Card title="مدیریت اعلان‌ها" icon={Bell}>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between"><div><p className="font-semibold text-sm">فعال‌سازی کلی اعلان‌ها</p></div><ToggleSwitch checked={notificationSettings.globalEnable} onChange={c => handleNotificationSettingChange('globalEnable', c)} /></div>
                        <div className={`flex items-center justify-between transition-opacity ${!notificationSettings.globalEnable ? 'opacity-50' : ''}`}><div><p className="font-semibold text-sm">هشدار رویدادهای اقتصادی</p></div><ToggleSwitch checked={!!notificationSettings.newsAlerts} onChange={c => handleNotificationSettingChange('newsAlerts', c)} disabled={!notificationSettings.globalEnable} /></div>
                    </div>
                 </Card>
                 <Card title="تنظیمات زمان‌بندی" icon={Clock}>
                     <div className="space-y-4">
                        <div><label className="block text-sm font-medium mb-1">منطقه زمانی</label><input type="text" defaultValue="Asia/Tehran" disabled className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 bg-gray-100 dark:bg-gray-700/50 cursor-not-allowed" /></div>
                        <div className="grid grid-cols-2 gap-4">
                            <div><label className="block text-sm font-medium mb-1">شروع روز معاملاتی</label><input type="time" defaultValue="09:00" className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600" /></div>
                            <div><label className="block text-sm font-medium mb-1">پایان روز معاملاتی</label><input type="time" defaultValue="18:00" className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600" /></div>
                        </div>
                     </div>
                 </Card>
            </div>);
            case 'dashboard': return (<div className="max-w-4xl mx-auto"><Card title="مدیریت ویجت‌های داشبورد" icon={LayoutDashboard}>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">ویجت‌هایی که می‌خواهید در صفحه اصلی داشبورد نمایش داده شوند را انتخاب کنید.</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[60vh] overflow-y-auto pr-2">
                    {Object.entries(WIDGET_DEFINITIONS).map(([key, { title, icon: Icon, description }]) => (<div key={key} className="flex items-center justify-between p-3 border rounded-lg dark:border-gray-700"><div className="flex items-center gap-3"><Icon className="w-5 h-5 text-gray-500 dark:text-gray-400 flex-shrink-0" /><div><p className="font-semibold text-sm">{title}</p><p className="text-xs text-gray-500">{description}</p></div></div><ToggleSwitch checked={widgetVisibility[key] !== false} onChange={c => handleVisibilityChange(key, c)} /></div>))}
                </div>
            </Card></div>);
            case 'journal': return (<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-6">
                    <Card title="ستاپ‌های معاملاتی" icon={SettingsIcon}>
                        <div className="flex justify-between items-center mb-4"><h3 className="text-md font-semibold">لیست ستاپ‌ها</h3><button onClick={handleAddNewSetup} className="flex items-center gap-2 bg-green-500 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-green-600 transition-colors"><Plus size={16} /><span>ستاپ جدید</span></button></div>
                        <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                            {setups.length > 0 ? setups.map(setup => (<div key={setup.id} className="p-3 rounded-md border dark:border-gray-600 flex justify-between items-center"><div><p className="font-bold">{setup.name} {setup.isActive && <span className="text-green-500 text-xs">(فعال)</span>}</p><p className="text-xs text-gray-500">{setup.category} - {setup.checklist.length} آیتم</p></div><div className="flex items-center gap-2"><button title="فعال سازی" onClick={() => handleSetActive(setup.id)} className={`p-2 rounded-full ${setup.isActive ? 'text-green-500' : 'text-gray-400 hover:text-green-500'}`}><CheckCircle size={18} /></button><button title="ویرایش" onClick={() => setEditingSetup(setup)} className="p-2 rounded-full text-gray-400 hover:text-blue-500"><Edit size={16} /></button><button title="حذف" onClick={() => handleDeleteSetup(setup.id)} className="p-2 rounded-full text-gray-400 hover:text-red-500"><Trash2 size={16} /></button></div></div>)) : <p className="text-center text-sm text-gray-500 py-4">هنوز هیچ ستاپی ثبت نشده است.</p>}
                        </div>
                    </Card>
                    <Card title="مرکز مدیریت روانشناسی" icon={Brain}>
                        <div className="space-y-4">
                            <PsychologyManager title="احساسات قبل از معامله" items={psychologyOptions.emotionsBefore} onAdd={item => handlePsychologyOptionChange('emotionsBefore', [...psychologyOptions.emotionsBefore, item])} onRemove={item => handlePsychologyOptionChange('emotionsBefore', psychologyOptions.emotionsBefore.filter(i => i !== item))} />
                            <PsychologyManager title="انگیزه‌های ورود به معامله" items={psychologyOptions.entryReasons} onAdd={item => handlePsychologyOptionChange('entryReasons', [...psychologyOptions.entryReasons, item])} onRemove={item => handlePsychologyOptionChange('entryReasons', psychologyOptions.entryReasons.filter(i => i !== item))} />
                            <PsychologyManager title="احساسات بعد از معامله" items={psychologyOptions.emotionsAfter} onAdd={item => handlePsychologyOptionChange('emotionsAfter', [...psychologyOptions.emotionsAfter, item])} onRemove={item => handlePsychologyOptionChange('emotionsAfter', psychologyOptions.emotionsAfter.filter(i => i !== item))} />
                        </div>
                    </Card>
                </div>
                <Card title="شخصی‌سازی فیلدهای فرم ژورنال" icon={Edit3}>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">فیلدهای فرم ثبت معامله را مدیریت کنید. فیلدهای غیرفعال در فرم نمایش داده نخواهند شد.</p>
                    <div className="space-y-2 max-h-[70vh] overflow-y-auto">
                        <div className="grid grid-cols-[1fr,auto,1fr] gap-x-4 gap-y-2 items-center text-xs font-semibold uppercase text-gray-400 px-2"><span>فیلد</span><span>فعال</span><span>مقدار پیش‌فرض</span></div>
                        {JOURNAL_FORM_FIELDS.map(field => (
                            <div key={field.id} className="grid grid-cols-[1fr,auto,1fr] gap-x-4 gap-y-2 items-center p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700/50">
                                <label htmlFor={`toggle-${field.id}`} className="font-semibold text-sm cursor-pointer">{field.label}</label>
                                <ToggleSwitch checked={formSettings[field.id]?.isActive !== false} onChange={c => handleFormSettingChange(field.id, 'isActive', c)} />
                                <div className={`${formSettings[field.id]?.isActive !== false ? '' : 'opacity-50'}`}>{renderDefaultValueInput(field)}</div>
                            </div>
                        ))}
                    </div>
                </Card>
            </div>);
            case 'risk': return(<div className="max-w-2xl mx-auto space-y-6">
                <Card title="استراتژی مدیریت ریسک" icon={Shield}>
                    <div className="space-y-4">
                        <div><label className="block text-sm font-medium mb-1">موجودی حساب ($)</label><input type="number" value={riskSettings.accountBalance} onChange={e => setRiskSettings(p => ({ ...p, accountBalance: parseFloat(e.target.value) || 0 }))} className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600" /></div>
                        <div><label className="block text-sm font-medium mb-1">استراتژی</label><select value={riskSettings.strategy} onChange={e => setRiskSettings(p => ({ ...p, strategy: e.target.value as any }))} className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"><option value="fixed_percent">درصد ثابت</option><option value="anti_martingale">ضد مارتینگل</option></select></div>
                        {riskSettings.strategy === 'fixed_percent' && <div><label className="block text-sm font-medium mb-1">درصد ریسک در هر معامله</label><input type="number" step="0.1" value={riskSettings.fixedPercent.risk} onChange={e => setRiskSettings(p => ({ ...p, fixedPercent: { ...p.fixedPercent, risk: parseFloat(e.target.value) || 0 } }))} className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600" /></div>}
                        {riskSettings.strategy === 'anti_martingale' && <div className="space-y-2 p-3 border rounded-md dark:border-gray-600">
                            <h4 className="font-semibold">تنظیمات ضد مارتینگل</h4>
                            <div><label className="block text-xs font-medium mb-1">ریسک پایه (%)</label><input type="number" step="0.1" value={riskSettings.antiMartingale.baseRisk} onChange={e => setRiskSettings(p => ({ ...p, antiMartingale: { ...p.antiMartingale, baseRisk: parseFloat(e.target.value) || 0 } }))} className="w-full p-2 border rounded text-xs dark:bg-gray-700 dark:border-gray-600" /></div>
                            <div><label className="block text-xs font-medium mb-1">افزایش به ازای هر برد متوالی (%)</label><input type="number" step="0.1" value={riskSettings.antiMartingale.increment} onChange={e => setRiskSettings(p => ({ ...p, antiMartingale: { ...p.antiMartingale, increment: parseFloat(e.target.value) || 0 } }))} className="w-full p-2 border rounded text-xs dark:bg-gray-700 dark:border-gray-600" /></div>
                            <div><label className="block text-xs font-medium mb-1">حداکثر ریسک (%)</label><input type="number" step="0.1" value={riskSettings.antiMartingale.maxRisk} onChange={e => setRiskSettings(p => ({ ...p, antiMartingale: { ...p.antiMartingale, maxRisk: parseFloat(e.target.value) || 0 } }))} className="w-full p-2 border rounded text-xs dark:bg-gray-700 dark:border-gray-600" /></div>
                        </div>}
                        <button onClick={handleSaveRisk} className="w-full flex items-center justify-center gap-2 bg-indigo-500 text-white py-2 rounded-lg hover:bg-indigo-600"><Save size={16} />ذخیره تنظیمات ریسک</button>
                    </div>
                </Card>
            </div>);
            case 'data': return (<div className="max-w-2xl mx-auto space-y-6">
                <Card title="پشتیبان‌گیری و بازیابی" icon={Database}>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">از داده‌های ژورنال خود خروجی JSON بگیرید یا فایل پشتیبان را وارد کنید.</p>
                    <div className="flex gap-4">
                        <button onClick={handleExport} disabled={isExporting || isImporting} className="flex-1 flex items-center justify-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-lg shadow-md hover:bg-blue-600 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed">{isExporting ? <RefreshCw size={18} className="animate-spin" /> : <Download size={18} />}<span>{isExporting ? 'در حال استخراج...' : 'خروجی گرفتن'}</span></button>
                        <button onClick={handleImportClick} disabled={isExporting || isImporting} className="flex-1 flex items-center justify-center gap-2 bg-green-500 text-white px-4 py-2 rounded-lg shadow-md hover:bg-green-600 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed">{isImporting ? <RefreshCw size={18} className="animate-spin" /> : <Upload size={18} />}<span>{isImporting ? 'در حال وارد کردن...' : 'وارد کردن'}</span></button>
                        <input type="file" ref={fileInputRef} onChange={handleImportFile} accept=".json" className="hidden" />
                    </div>
                </Card>
                <Card title="ناحیه خطر" icon={AlertTriangle}>
                     <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">این عملیات غیرقابل بازگشت هستند. لطفا با احتیاط کامل اقدام کنید.</p>
                     <button onClick={() => setIsDeleteModalOpen(true)} className="w-full bg-red-600 text-white px-4 py-2 rounded-lg shadow-md hover:bg-red-700 transition-colors">
                        پاک کردن تمام داده‌های ژورنال
                    </button>
                </Card>
            </div>);
        }
    }
    
    return (
        <div className="p-6 h-full flex flex-col">
            <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold">مرکز کنترل و شخصی‌سازی</h1>
                    <p className="text-gray-500 dark:text-gray-400">داشبورد، ژورنال و ابزارهای خود را از اینجا مدیریت کنید.</p>
                </div>
            </header>
             <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
                <nav className="-mb-px flex space-x-6 overflow-x-auto" aria-label="Tabs">
                    {tabs.map(tab => (
                        <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`whitespace-nowrap flex items-center gap-2 py-3 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === tab.id ? `border-indigo-500 text-indigo-600 dark:text-indigo-400` : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:hover:text-gray-300 dark:hover:border-gray-600'}`}>
                           <tab.icon size={16} /> {tab.label}
                        </button>
                    ))}
                </nav>
            </div>
            <div className="flex-grow overflow-y-auto">
                {renderContent()}
            </div>
            {editingSetup && (
                <Suspense fallback={null}>
                    <SetupFormModal setup={editingSetup} onSave={handleSaveSetup} onClose={() => setEditingSetup(null)} />
                </Suspense>
            )}
            {isDeleteModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setIsDeleteModalOpen(false)}>
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md" onClick={e => e.stopPropagation()}>
                        <div className="p-6 text-center">
                            <AlertTriangle className="mx-auto h-12 w-12 text-red-500" />
                            <h3 className="mt-4 text-lg font-bold">آیا کاملاً مطمئن هستید؟</h3>
                            <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                                <p>این عمل تمام داده‌های ژورنال شما را برای همیشه پاک می‌کند. این داده‌ها به هیچ وجه قابل بازیابی نخواهند بود.</p>
                                <p className="mt-4 font-semibold">برای تایید، لطفاً عبارت <strong className="font-mono text-red-600 dark:text-red-400">حذف</strong> را در کادر زیر وارد کنید.</p>
                            </div>
                            <input
                                type="text"
                                value={deleteConfirmationText}
                                onChange={(e) => setDeleteConfirmationText(e.target.value)}
                                className="w-full p-2 mt-4 border rounded text-center dark:bg-gray-700 dark:border-gray-600"
                                aria-label="متن تایید حذف"
                            />
                        </div>
                        <div className="flex justify-end gap-3 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-b-lg">
                            <button
                                type="button"
                                onClick={() => {
                                    setIsDeleteModalOpen(false);
                                    setDeleteConfirmationText('');
                                }}
                                className="px-4 py-2 rounded bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500"
                            >
                                انصراف
                            </button>
                            <button
                                type="button"
                                onClick={handleConfirmDeleteAllData}
                                disabled={deleteConfirmationText !== 'حذف'}
                                className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                            >
                                تایید و حذف
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SettingsPage;