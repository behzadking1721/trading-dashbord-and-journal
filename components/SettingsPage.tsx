import React, { useState, useEffect, useRef } from 'react';
import { Save, Plus, Trash2, Edit, CheckCircle, Settings as SettingsIcon, LayoutDashboard, Database, Upload, Download, Bell, X, Edit3, Newspaper, BarChart3, Calendar } from 'lucide-react';
import type { TradingSetup, TradingChecklistItem, WidgetVisibility, JournalEntry, NotificationSettings, RiskSettings, JournalFormSettings, FormFieldSetting, JournalFormField, CalendarPageVisibility } from '../types';
import { WIDGET_DEFINITIONS, JOURNAL_FORM_FIELDS } from '../constants';
import { getJournalEntries, addJournalEntry } from '../db';


const STORAGE_KEY_SETUPS = 'trading-setups';
const STORAGE_KEY_WIDGET_VISIBILITY = 'dashboard-widget-visibility';
const STORAGE_KEY_NOTIFICATION_SETTINGS = 'notification-settings';
const STORAGE_KEY_RISK_SETTINGS = 'risk-management-settings';
const STORAGE_KEY_FORM_SETTINGS = 'journal-form-settings';
const STORAGE_KEY_CALENDAR_PAGE_VISIBILITY = 'calendar-page-visibility';
const MISTAKES_LIST = ['نادیده گرفتن چک‌لیست', 'ورود بدون ستاپ', 'جابجا کردن حد ضرر', 'ریسک بیش از حد', 'خروج زودهنگام (ترس)', 'خروج دیرهنگام (طمع)'];
const EMOTIONS_BEFORE = ['مطمئن', 'منظم', 'مضطرب', 'هیجانی'];
const ENTRY_REASONS = ['ستاپ تکنیکال', 'خبر', 'دنبال کردن ترند', 'ترس از دست دادن (FOMO)', 'انتقام'];
const EMOTIONS_AFTER = ['رضایت', 'پشیمانی', 'شک', 'هیجان‌زده'];


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


const SettingsPage: React.FC = () => {
    const [riskSettings, setRiskSettings] = useState<RiskSettings>({
        accountBalance: 10000,
        strategy: 'fixed_percent',
        fixedPercent: { risk: 1 },
        antiMartingale: { baseRisk: 1, increment: 0.5, maxRisk: 4 }
    });
    const [saved, setSaved] = useState(false);
    const [setups, setSetups] = useState<TradingSetup[]>([]);
    const [editingSetup, setEditingSetup] = useState<TradingSetup | null>(null);
    const [widgetVisibility, setWidgetVisibility] = useState<WidgetVisibility>({});
    const [calendarPageVisibility, setCalendarPageVisibility] = useState<CalendarPageVisibility>({
        calendar: true, newsFeed: true, livePrices: true
    });
    const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
        globalEnable: true, priceAlerts: true, newsAlerts: true, cryptoNewsAlerts: true, stockNewsAlerts: true,
    });
    const [formSettings, setFormSettings] = useState<JournalFormSettings>({});
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        try {
            // Load risk settings
            const savedRisk = localStorage.getItem(STORAGE_KEY_RISK_SETTINGS);
            if(savedRisk) setRiskSettings(JSON.parse(savedRisk));
            else {
                const legacyBalance = localStorage.getItem('accountBalance');
                const legacyRisk = localStorage.getItem('maxRiskPerTrade');
                if(legacyBalance || legacyRisk) {
                    setRiskSettings(prev => ({ ...prev, accountBalance: legacyBalance ? parseFloat(legacyBalance) : prev.accountBalance, fixedPercent: { risk: legacyRisk ? parseFloat(legacyRisk) : prev.fixedPercent.risk }}))
                }
            }
            // Load trading setups
            const savedSetups = localStorage.getItem(STORAGE_KEY_SETUPS);
            if (savedSetups) setSetups(JSON.parse(savedSetups));
            // Load widget visibility
            const savedVisibility = localStorage.getItem(STORAGE_KEY_WIDGET_VISIBILITY);
            const initialVisibility: WidgetVisibility = savedVisibility ? JSON.parse(savedVisibility) : {};
            Object.keys(WIDGET_DEFINITIONS).forEach(key => { if (initialVisibility[key] === undefined) initialVisibility[key] = true; });
            setWidgetVisibility(initialVisibility);
            // Load calendar page visibility
            const savedCalendarVisibility = localStorage.getItem(STORAGE_KEY_CALENDAR_PAGE_VISIBILITY);
            if(savedCalendarVisibility) setCalendarPageVisibility(JSON.parse(savedCalendarVisibility));
            // Load notification settings
            const savedNotificationSettings = localStorage.getItem(STORAGE_KEY_NOTIFICATION_SETTINGS);
            if (savedNotificationSettings) setNotificationSettings(JSON.parse(savedNotificationSettings));
            // Load form settings
            const savedFormSettings = localStorage.getItem(STORAGE_KEY_FORM_SETTINGS);
            const initialFormSettings: JournalFormSettings = savedFormSettings ? JSON.parse(savedFormSettings) : {};
            JOURNAL_FORM_FIELDS.forEach(field => { if (initialFormSettings[field.id] === undefined) initialFormSettings[field.id] = { isActive: true, defaultValue: undefined }; });
            setFormSettings(initialFormSettings);
        } catch (error) { console.error("Could not access localStorage to get settings:", error); }
    }, []);

    const handleRiskSettingsChange = (field: string, value: any) => { setRiskSettings(prev => { const newState = JSON.parse(JSON.stringify(prev)); setNestedValue(newState, field, value); return newState; }); };
    const handleSaveRisk = () => { try { localStorage.setItem(STORAGE_KEY_RISK_SETTINGS, JSON.stringify(riskSettings)); localStorage.setItem('accountBalance', riskSettings.accountBalance.toString()); window.dispatchEvent(new StorageEvent('storage', { key: 'accountBalance' })); setSaved(true); setTimeout(() => setSaved(false), 2000); } catch (error) { console.error("Could not save settings:", error); alert("خطا در ذخیره تنظیمات."); }};
    const saveSetups = (updatedSetups: TradingSetup[]) => { try { localStorage.setItem(STORAGE_KEY_SETUPS, JSON.stringify(updatedSetups)); setSetups(updatedSetups); window.dispatchEvent(new StorageEvent('storage', { key: STORAGE_KEY_SETUPS })); } catch(e) { console.error(e); }};
    const handleAddNewSetup = () => { setEditingSetup({ id: Date.now().toString(), name: '', description: '', category: 'تکنیکال', checklist: [], isActive: false, defaultTags: [], defaultMistakes: [] }); };
    const handleSaveSetup = (setup: TradingSetup) => { const existingIndex = setups.findIndex(s => s.id === setup.id); const updatedSetups = [...setups]; if (existingIndex > -1) updatedSetups[existingIndex] = setup; else updatedSetups.push(setup); saveSetups(updatedSetups); setEditingSetup(null); };
    const handleDeleteSetup = (id: string) => { if (window.confirm('آیا از حذف این ستاپ مطمئن هستید؟')) saveSetups(setups.filter(s => s.id !== id)); };
    const handleSetActive = (id: string) => { saveSetups(setups.map(s => ({ ...s, isActive: s.id === id }))); };
    const handleVisibilityChange = (widgetKey: string, isVisible: boolean) => { const newVisibility = { ...widgetVisibility, [widgetKey]: isVisible }; setWidgetVisibility(newVisibility); try { localStorage.setItem(STORAGE_KEY_WIDGET_VISIBILITY, JSON.stringify(newVisibility)); window.dispatchEvent(new StorageEvent('storage', { key: STORAGE_KEY_WIDGET_VISIBILITY })); } catch (error) { console.error("Failed to save widget visibility", error); }};
    const handleCalendarVisibilityChange = (key: keyof CalendarPageVisibility, isVisible: boolean) => { const newVisibility = { ...calendarPageVisibility, [key]: isVisible }; setCalendarPageVisibility(newVisibility); try { localStorage.setItem(STORAGE_KEY_CALENDAR_PAGE_VISIBILITY, JSON.stringify(newVisibility)); window.dispatchEvent(new StorageEvent('storage', { key: STORAGE_KEY_CALENDAR_PAGE_VISIBILITY })); } catch (error) { console.error("Failed to save calendar visibility", error); }};
    const handleNotificationSettingChange = (key: keyof NotificationSettings, value: boolean) => { const newSettings = { ...notificationSettings, [key]: value }; if (key === 'globalEnable' && !value) { Object.keys(newSettings).forEach(k => { if(k !== 'globalEnable') newSettings[k as keyof NotificationSettings] = false; }); } setNotificationSettings(newSettings); try { localStorage.setItem(STORAGE_KEY_NOTIFICATION_SETTINGS, JSON.stringify(newSettings)); } catch (error) { console.error("Failed to save notification settings", error); }};
    const handleFormSettingChange = (fieldId: JournalFormField, property: keyof FormFieldSetting, value: any) => { const newSettings = { ...formSettings, [fieldId]: { ...formSettings[fieldId], [property]: value } }; setFormSettings(newSettings); try { localStorage.setItem(STORAGE_KEY_FORM_SETTINGS, JSON.stringify(newSettings)); } catch (error) { console.error("Failed to save form settings", error); }};
    const handleExport = async () => {}; const handleImportClick = () => {}; const handleImportFile = (event: React.ChangeEvent<HTMLInputElement>) => {};
    const renderDefaultValueInput = (field: typeof JOURNAL_FORM_FIELDS[0]) => { const setting = formSettings[field.id]; if (!setting || !setting.isActive || field.type === 'special') return <div className="w-full h-9"></div>; const commonProps = { value: setting.defaultValue ?? '', onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => handleFormSettingChange(field.id, 'defaultValue', e.target.type === 'number' ? parseFloat(e.target.value) : e.target.value), className: "w-full p-2 border rounded text-xs dark:bg-gray-700 dark:border-gray-600", placeholder: field.placeholder, }; if (field.type === 'select') { let options: {value: string, label: string}[] = []; if (field.id === 'setupId') options = setups.map(s => ({ value: s.id, label: s.name })); if (field.id === 'psychology.emotionBefore') options = EMOTIONS_BEFORE.map(e => ({ value: e, label: e })); if (field.id === 'psychology.entryReason') options = ENTRY_REASONS.map(e => ({ value: e, label: e })); if (field.id === 'psychology.emotionAfter') options = EMOTIONS_AFTER.map(e => ({ value: e, label: e })); return ( <select {...commonProps}> <option value="">پیش‌فرض ندارد</option> {options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)} </select> ); } return <input type={field.type} step="any" {...commonProps} />; };

    const ToggleSwitch: React.FC<{checked: boolean; onChange: (checked: boolean) => void; disabled?: boolean;}> = ({ checked, onChange, disabled=false }) => (
        <label className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} disabled={disabled} className="sr-only peer" />
            <div className="w-11 h-6 bg-gray-200 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
        </label>
    );

    const SettingsSection: React.FC<{title: string; icon: React.ElementType; children: React.ReactNode}> = ({title, icon: Icon, children}) => (
        <div className="p-6 rounded-lg shadow-md bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2"><Icon size={20}/> {title}</h2>
            {children}
        </div>
    );
    
    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-6">تنظیمات</h1>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                <div className="space-y-6">
                     <SettingsSection title="شخصی‌سازی هاب خبری" icon={Calendar}>
                        <div className="space-y-3">
                            {[ {key: 'calendar', label: 'ویجت تقویم اقتصادی', icon: Calendar}, {key: 'newsFeed', label: 'ویجت فید اخبار', icon: Newspaper}, {key: 'livePrices', label: 'ویجت قیمت‌های زنده', icon: BarChart3}].map(item => (
                               <div key={item.key} className="flex items-center justify-between">
                                   <p className="font-semibold text-sm flex items-center gap-2"><item.icon size={16} /> {item.label}</p>
                                   <ToggleSwitch checked={calendarPageVisibility[item.key as keyof CalendarPageVisibility]} onChange={c => handleCalendarVisibilityChange(item.key as keyof CalendarPageVisibility, c)} />
                               </div>
                            ))}
                        </div>
                    </SettingsSection>
                    <SettingsSection title="تنظیمات فرم ثبت معامله" icon={Edit3}>
                        <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                           {JOURNAL_FORM_FIELDS.map((field) => (
                               <div key={field.id} className="grid grid-cols-[1fr_120px_50px] items-center gap-4">
                                   <p className="font-semibold text-sm">{field.label}</p>
                                   <div>{renderDefaultValueInput(field)}</div>
                                   <ToggleSwitch checked={formSettings[field.id]?.isActive ?? true} onChange={c => handleFormSettingChange(field.id, 'isActive', c)} />
                               </div>
                           ))}
                        </div>
                    </SettingsSection>
                    <SettingsSection title="مدیریت سرمایه و ریسک" icon={SettingsIcon}>
                        <div className="space-y-4">
                            <div><label className="block text-sm font-medium mb-1">موجودی حساب ($)</label><input type="number" value={riskSettings.accountBalance} onChange={e => handleRiskSettingsChange('accountBalance', parseFloat(e.target.value))} className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600" placeholder="مثال: 10000" /></div>
                            <div><label className="block text-sm font-medium mb-1">استراتژی مدیریت حجم</label><select value={riskSettings.strategy} onChange={e => handleRiskSettingsChange('strategy', e.target.value)} className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"><option value="fixed_percent">درصد ثابت</option><option value="anti_martingale">افزایشی (ضد مارتینگل)</option></select></div>
                            {riskSettings.strategy === 'fixed_percent' && (<div><label className="block text-sm font-medium mb-1">درصد ریسک در هر معامله (%)</label><input type="number" step="0.1" value={riskSettings.fixedPercent.risk} onChange={e => handleRiskSettingsChange('fixedPercent.risk', parseFloat(e.target.value))} className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600" placeholder="مثال: 1" /></div>)}
                            {riskSettings.strategy === 'anti_martingale' && (<div className="space-y-3 p-3 border rounded-md dark:border-gray-600"><h4 className="text-xs font-semibold">تنظیمات استراتژی افزایشی</h4><div><label className="block text-xs font-medium mb-1">درصد ریسک پایه (%)</label><input type="number" step="0.1" value={riskSettings.antiMartingale.baseRisk} onChange={e => handleRiskSettingsChange('antiMartingale.baseRisk', parseFloat(e.target.value))} className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600" /></div><div><label className="block text-xs font-medium mb-1">افزایش ریسک بعد از هر برد (%)</label><input type="number" step="0.1" value={riskSettings.antiMartingale.increment} onChange={e => handleRiskSettingsChange('antiMartingale.increment', parseFloat(e.target.value))} className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600" /></div><div><label className="block text-xs font-medium mb-1">حداکثر درصد ریسک (%)</label><input type="number" step="0.1" value={riskSettings.antiMartingale.maxRisk} onChange={e => handleRiskSettingsChange('antiMartingale.maxRisk', parseFloat(e.target.value))} className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600" /></div></div>)}
                        </div>
                        <div className="border-t border-gray-200 dark:border-gray-600 pt-4 mt-4"><button onClick={handleSaveRisk} className="w-full flex items-center justify-center gap-2 bg-indigo-500 text-white px-4 py-2 rounded-lg shadow-md hover:bg-indigo-600 transition-colors"><Save size={18} /><span>{saved ? 'ذخیره شد!' : 'ذخیره تنظیمات ریسک'}</span></button></div>
                    </SettingsSection>
                </div>

                <div className="space-y-6">
                    <SettingsSection title="مدیریت ویجت‌های داشبورد" icon={LayoutDashboard}>
                        <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                           {Object.entries(WIDGET_DEFINITIONS).map(([key, { title, icon: Icon, description }]) => (<div key={key} className="flex items-center justify-between"><div className="flex items-center gap-3"><Icon className="w-5 h-5 text-gray-500 dark:text-gray-400" /><div><p className="font-semibold text-sm">{title}</p><p className="text-xs text-gray-500">{description}</p></div></div><ToggleSwitch checked={widgetVisibility[key]} onChange={c => handleVisibilityChange(key, c)} /></div>))}
                        </div>
                    </SettingsSection>
                    <SettingsSection title="مدیریت اعلان‌ها" icon={Bell}>
                        <div className="space-y-4">
                           <div className="flex items-center justify-between"><div><p className="font-semibold text-sm">فعال‌سازی کلی اعلان‌ها</p><p className="text-xs text-gray-500">فعال یا غیرفعال کردن تمام هشدارها</p></div><ToggleSwitch checked={notificationSettings.globalEnable} onChange={c => handleNotificationSettingChange('globalEnable', c)} /></div>
                            {[ {key: 'priceAlerts', label: 'هشدار قیمت'}, {key: 'newsAlerts', label: 'هشدار رویدادهای اقتصادی'}, {key: 'cryptoNewsAlerts', label: 'اخبار فوری کریپتو'}, {key: 'stockNewsAlerts', label: 'اخبار فوری بورس جهانی'} ].map(item => (
                               <div key={item.key} className={`flex items-center justify-between transition-opacity ${!notificationSettings.globalEnable ? 'opacity-50' : ''}`}>
                                   <div><p className="font-semibold text-sm">{item.label}</p></div>
                                   <ToggleSwitch checked={!!notificationSettings[item.key as keyof NotificationSettings]} onChange={c => handleNotificationSettingChange(item.key as keyof NotificationSettings, c)} disabled={!notificationSettings.globalEnable} />
                               </div>
                            ))}
                        </div>
                    </SettingsSection>
                    <SettingsSection title="ستاپ‌های معاملاتی" icon={SettingsIcon}>
                        <div className="flex justify-between items-center mb-4"><h3 className="text-md font-semibold">لیست ستاپ‌ها</h3><button onClick={handleAddNewSetup} className="flex items-center gap-2 bg-green-500 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-green-600 transition-colors"><Plus size={16} /><span>ستاپ جدید</span></button></div>
                        <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                            {setups.length > 0 ? setups.map(setup => (<div key={setup.id} className="p-3 rounded-md border dark:border-gray-600 flex justify-between items-center"><div><p className="font-bold">{setup.name} {setup.isActive && <span className="text-green-500 text-xs">(فعال)</span>}</p><p className="text-xs text-gray-500">{setup.category} - {setup.checklist.length} آیتم</p></div><div className="flex items-center gap-2"><button title="فعال سازی" onClick={() => handleSetActive(setup.id)} className={`p-2 rounded-full ${setup.isActive ? 'text-green-500' : 'text-gray-400 hover:text-green-500'}`}><CheckCircle size={18} /></button><button title="ویرایش" onClick={() => setEditingSetup(setup)} className="p-2 rounded-full text-gray-400 hover:text-blue-500"><Edit size={16} /></button><button title="حذف" onClick={() => handleDeleteSetup(setup.id)} className="p-2 rounded-full text-gray-400 hover:text-red-500"><Trash2 size={16} /></button></div></div>)) : <p className="text-center text-sm text-gray-500 py-4">هنوز هیچ ستاپی ثبت نشده است.</p>}
                        </div>
                    </SettingsSection>
                </div>
            </div>
            {editingSetup && <SetupFormModal setup={editingSetup} onSave={handleSaveSetup} onClose={() => setEditingSetup(null)} />}
        </div>
    );
};

const SetupFormModal: React.FC<{setup: TradingSetup, onSave: (setup: TradingSetup) => void, onClose: () => void}> = ({ setup, onSave, onClose }) => {
    const [currentSetup, setCurrentSetup] = useState(setup);
    const [newItemText, setNewItemText] = useState('');
    const [tagInput, setTagInput] = useState('');

    const handleAddItem = () => { if (newItemText.trim()) { setCurrentSetup(prev => ({ ...prev, checklist: [...prev.checklist, { id: Date.now().toString(), text: newItemText }]})); setNewItemText(''); } };
    const handleDeleteItem = (id: string) => { setCurrentSetup(prev => ({ ...prev, checklist: prev.checklist.filter(item => item.id !== id)})); };
    const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); onSave(currentSetup); };

    const handleAddTag = () => { const trimmedTag = tagInput.trim(); if (trimmedTag && !currentSetup.defaultTags?.includes(trimmedTag)) { setCurrentSetup(prev => ({ ...prev, defaultTags: [...(prev.defaultTags || []), trimmedTag] })); } setTagInput(''); };
    const handleRemoveTag = (tagToRemove: string) => { setCurrentSetup(prev => ({ ...prev, defaultTags: (prev.defaultTags || []).filter(tag => tag !== tagToRemove) })); };
    const handleMultiSelect = (name: 'defaultMistakes', value: string) => setCurrentSetup(prev => ({ ...prev, [name]: (prev[name] || []).includes(value) ? (prev[name] || []).filter(v => v !== value) : [...(prev[name] || []), value] }));

    return (
         <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
                <div className="flex justify-between items-center p-4 border-b dark:border-gray-700"><h2 className="text-xl font-bold">{setup.id.startsWith('new') ? 'ستاپ معاملاتی جدید' : 'ویرایش ستاپ معاملاتی'}</h2><button onClick={onClose} className="p-1 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">&times;</button></div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
                    <input type="text" placeholder="نام ستاپ" required value={currentSetup.name} onChange={e => setCurrentSetup({...currentSetup, name: e.target.value})} className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600" />
                    <textarea placeholder="توضیحات" value={currentSetup.description} onChange={e => setCurrentSetup({...currentSetup, description: e.target.value})} className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600" rows={2}></textarea>
                    <div><h3 className="text-md font-semibold mb-2">مقادیر پیش‌فرض (اختیاری)</h3><div className="p-4 border rounded-md dark:border-gray-600 space-y-4"><input type="number" step="0.1" placeholder="نسبت ریسک به ریوارد پیش‌فرض" value={currentSetup.defaultRiskRewardRatio === undefined ? '' : currentSetup.defaultRiskRewardRatio} onChange={e => setCurrentSetup({...currentSetup, defaultRiskRewardRatio: e.target.value ? parseFloat(e.target.value) : undefined})} className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600" /><div><label className="block text-sm font-medium mb-1">تگ‌های پیش‌فرض</label><div className="flex flex-wrap items-center gap-2 p-2 border rounded dark:bg-gray-700 dark:border-gray-600">{currentSetup.defaultTags?.map(tag => (<div key={tag} className="flex items-center gap-1 bg-indigo-500 text-white text-xs px-2 py-1 rounded-full">{tag}<button type="button" onClick={() => handleRemoveTag(tag)}><X size={14} /></button></div>))}<input type="text" value={tagInput} onChange={e => setTagInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddTag())} placeholder="افزودن تگ..." className="bg-transparent focus:outline-none flex-grow" /></div></div><div><label className="block text-sm font-medium mb-1">اشتباهات رایج پیش‌فرض</label><div className="flex flex-wrap gap-2">{MISTAKES_LIST.map(mistake => (<button key={mistake} type="button" onClick={() => handleMultiSelect('defaultMistakes', mistake)} className={`px-3 py-1.5 text-xs rounded-full border transition-colors ${currentSetup.defaultMistakes?.includes(mistake) ? 'bg-red-500 border-red-500 text-white' : 'bg-gray-200 dark:bg-gray-700'}`}>{mistake}</button>))}</div></div></div></div>
                    <div><h3 className="text-md font-semibold mb-2">چک‌لیست</h3><div className="space-y-2 max-h-48 overflow-y-auto pr-2">{currentSetup.checklist.map(item => (<div key={item.id} className="flex items-center justify-between text-sm bg-gray-100 dark:bg-gray-700/50 p-2 rounded"><span>{item.text}</span><button type="button" onClick={() => handleDeleteItem(item.id)} className="p-1 text-red-500 opacity-50 hover:opacity-100"><Trash2 size={14} /></button></div>))}<div className="flex gap-2 mt-2"><input type="text" value={newItemText} onChange={e => setNewItemText(e.target.value)} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddItem())} placeholder="آیتم جدید چک‌لیست" className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600" /><button type="button" onClick={handleAddItem} className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">افزودن</button></div></div></div>
                    <div className="flex justify-end gap-3 pt-4 border-t dark:border-gray-700 mt-auto"><button type="button" onClick={onClose} className="px-4 py-2 rounded bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500">انصراف</button><button type="submit" className="px-4 py-2 rounded bg-indigo-500 text-white hover:bg-indigo-600">ذخیره ستاپ</button></div>
                 </form>
            </div>
        </div>
    );
};

export default SettingsPage;