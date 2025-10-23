import React, { useState, useEffect, useCallback, lazy, Suspense, useMemo, useRef } from 'react';
import type { JournalEntry, TradingSetup, TradeOutcome, RiskSettings, EmotionBefore, EntryReason, EmotionAfter, JournalFormSettings, JournalFormField } from '../types';
import { addJournalEntry, getJournalEntries, deleteJournalEntry, getAllTags, getEntriesBySymbol } from '../db';
import { Plus, Trash2, TrendingUp, TrendingDown, ChevronDown, LineChart, Sparkles, RefreshCw, Brain, Camera, UploadCloud, XCircle, Edit2, Check, ExternalLink, AlertTriangle, X, Wand2, Info } from 'lucide-react';

const AIAnalysisModal = lazy(() => import('./AIAnalysisModal'));

const MISTAKES_LIST = ['نادیده گرفتن چک‌لیست', 'ورود بدون ستاپ', 'جابجا کردن حد ضرر', 'ریسک بیش از حد', 'خروج زودهنگام (ترس)', 'خروج دیرهنگام (طمع)'];
const EMOTIONS_BEFORE: EmotionBefore[] = ['مطمئن', 'منظم', 'مضطرب', 'هیجانی'];
const ENTRY_REASONS: EntryReason[] = ['ستاپ تکنیکال', 'خبر', 'دنبال کردن ترند', 'ترس از دست دادن (FOMO)', 'انتقام'];
const EMOTIONS_AFTER: EmotionAfter[] = ['رضایت', 'پشیمانی', 'شک', 'هیجان‌زده'];

const JournalPage: React.FC = () => {
    const [entries, setEntries] = useState<JournalEntry[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isAnalysisModalOpen, setIsAnalysisModalOpen] = useState(false);
    const [editingEntry, setEditingEntry] = useState<JournalEntry | null>(null);
    
    const loadEntries = useCallback(async () => {
        try {
            const storedEntries = await getJournalEntries();
            setEntries(storedEntries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
        } catch (e) {
            console.error("Failed to load journal entries from DB:", e);
        }
    }, []);

    useEffect(() => {
        loadEntries();
    }, [loadEntries]);

    const handleOpenModal = (entry: JournalEntry | null = null) => {
        setEditingEntry(entry);
        setIsModalOpen(true);
    }

    const handleDelete = async (id: string) => {
        if (window.confirm('آیا از حذف این آیتم مطمئن هستید؟')) {
            try {
                await deleteJournalEntry(id);
                await loadEntries(); 
            } catch (e) {
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
                    <button onClick={() => handleOpenModal()} className="flex items-center gap-2 bg-indigo-500 text-white px-4 py-2 rounded-lg shadow-md hover:bg-indigo-600 transition-colors">
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
                            <th className="px-4 py-3">تگ‌ها</th>
                            <th className="px-4 py-3">سود/ضرر</th>
                            <th className="px-4 py-3">عملیات</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {entries.length > 0 ? entries.map(entry => (
                            <tr key={entry.id} className="hover:bg-gray-100/50 dark:hover:bg-gray-700/50">
                                <td className="px-4 py-3 font-mono">{new Date(entry.date).toLocaleDateString('fa-IR')}</td>
                                <td className="px-4 py-3 font-semibold">{entry.symbol?.toUpperCase() || '-'}</td>
                                <td className={`px-4 py-3 flex items-center gap-2 ${entry.side === 'Buy' ? 'text-green-500' : entry.side === 'Sell' ? 'text-red-500' : ''}`}>
                                    {entry.side === 'Buy' ? <TrendingUp size={16} /> : entry.side === 'Sell' ? <TrendingDown size={16} /> : null}
                                    {entry.side === 'Buy' ? 'خرید' : entry.side === 'Sell' ? 'فروش' : '-'}
                                </td>
                                <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{entry.setupName || '-'}</td>
                                <td className="px-4 py-3">
                                    <div className="flex flex-wrap gap-1 max-w-xs">
                                        {entry.tags?.map(tag => (
                                            <span key={tag} className="px-2 py-0.5 text-xs bg-gray-200 dark:bg-gray-600 rounded-full">{tag}</span>
                                        ))}
                                    </div>
                                </td>
                                 <td className={`px-4 py-3 font-mono font-bold ${entry.profitOrLoss == null ? '' : entry.profitOrLoss >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                    {entry.profitOrLoss != null ? `$${entry.profitOrLoss.toFixed(2)}` : <span className="text-blue-500">باز</span>}
                                </td>
                                <td className="px-4 py-3 flex items-center gap-1">
                                    {entry.imageUrl && (
                                        <a href={entry.imageUrl} target="_blank" rel="noopener noreferrer" className="p-2 text-gray-500 hover:text-indigo-500 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600" title="مشاهده تصویر">
                                            <Camera size={16} />
                                        </a>
                                    )}
                                    {entry.entryPrice && (
                                        <button onClick={() => showTradeOnChart(entry)} className="p-2 text-gray-500 hover:text-indigo-500 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600" title="نمایش روی چارت">
                                            <LineChart size={16} />
                                        </button>
                                    )}
                                     <button onClick={() => handleOpenModal(entry)} className="p-2 text-gray-500 hover:text-blue-500 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600" title="ویرایش">
                                        <Edit2 size={16} />
                                    </button>
                                    <button onClick={() => handleDelete(entry.id)} className="p-2 text-gray-500 hover:text-red-500 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600" title="حذف">
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

            {isModalOpen && <JournalFormModal key={editingEntry?.id || 'new'} onClose={() => setIsModalOpen(false)} onSave={handleSave} entry={editingEntry} />}
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


interface FormState extends Omit<Partial<JournalEntry>, 'outcome'> {
    outcome?: TradeOutcome;
    manualExitPrice?: number;
}

const DRAFT_KEY = 'journal_form_draft';
const STORAGE_KEY_FORM_SETTINGS = 'journal-form-settings';

const initialEmptyState: FormState = {
    date: new Date().toISOString(),
    symbol: '',
    entryPrice: undefined,
    stopLoss: undefined,
    takeProfit: undefined,
    positionSize: undefined,
    setupId: '',
    tags: [],
    psychology: {},
    mistakes: [],
    notesBefore: '',
    notesAfter: '',
    outcome: 'Manual Exit',
    manualExitPrice: undefined,
    imageUrl: undefined,
};

// Helper to set nested properties
const setNestedValue = (obj: any, path: string, value: any) => {
    const keys = path.split('.');
    let current = obj;
    for (let i = 0; i < keys.length - 1; i++) {
        if (current[keys[i]] === undefined || typeof current[keys[i]] !== 'object' || current[keys[i]] === null) {
            current[keys[i]] = {};
        }
        current = current[keys[i]];
    }
    current[keys[keys.length - 1]] = value;
};


const JournalFormModal: React.FC<{ onClose: () => void; onSave: () => void; entry: JournalEntry | null; }> = ({ onClose, onSave, entry }) => {
    const [formSettings, setFormSettings] = useState<JournalFormSettings>({});
    
    const getInitialState = useCallback((): FormState => {
        if (entry) {
            return {
                ...initialEmptyState,
                ...entry,
                manualExitPrice: entry.outcome === 'Manual Exit' && entry.exitPrice ? entry.exitPrice : undefined,
            };
        }

        const stateFromDefaults: FormState = { ...initialEmptyState, psychology: {} };
        Object.keys(formSettings).forEach(key => {
            const fieldKey = key as JournalFormField;
            const setting = formSettings[fieldKey];
            if (setting?.isActive && setting.defaultValue !== undefined) {
                setNestedValue(stateFromDefaults, fieldKey, setting.defaultValue);
            }
        });
        return stateFromDefaults;
    }, [entry, formSettings]);
    
    const [formData, setFormData] = useState<FormState>(initialEmptyState);
    const [draftLoaded, setDraftLoaded] = useState(false);
    
    const [manualSide, setManualSide] = useState<'Buy' | 'Sell' | null>(entry?.side || null);
    const [setups, setSetups] = useState<TradingSetup[]>([]);
    const [riskSettings, setRiskSettings] = useState<RiskSettings | null>(null);
    const PSYCHO_ANALYSIS_LS_KEY = 'journal-form-psycho-analysis-open';
    const [isPsychoAnalysisOpen, setIsPsychoAnalysisOpen] = useState(() => {
        try { return localStorage.getItem(PSYCHO_ANALYSIS_LS_KEY) === 'true'; } catch { return false; }
    });
    const entryPriceRef = useRef<HTMLInputElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [tagInput, setTagInput] = useState('');
    const [allTags, setAllTags] = useState<string[]>([]);
    const [slSuggestion, setSlSuggestion] = useState<number | null>(null);

    useEffect(() => {
        const loadInitialData = async () => {
             try {
                const savedFormSettings = localStorage.getItem(STORAGE_KEY_FORM_SETTINGS);
                setFormSettings(savedFormSettings ? JSON.parse(savedFormSettings) : {});

                const savedSetups = localStorage.getItem('trading-setups');
                if (savedSetups) setSetups(JSON.parse(savedSetups));
                
                const savedRiskSettings = localStorage.getItem('risk-management-settings');
                 if (savedRiskSettings) {
                    setRiskSettings(JSON.parse(savedRiskSettings));
                } else {
                    const defaultSettings: RiskSettings = { accountBalance: 10000, strategy: 'fixed_percent', fixedPercent: { risk: 1 }, antiMartingale: { baseRisk: 1, increment: 0.5, maxRisk: 4 }};
                    setRiskSettings(defaultSettings);
                }
                const existingTags = await getAllTags();
                setAllTags(existingTags);
            } catch(e) { console.error(e) }
        };
        loadInitialData();
        entryPriceRef.current?.focus();
        
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSubmit(e);
        }
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    useEffect(() => {
        const initialState = getInitialState();
        if (!entry) {
            const savedDraft = localStorage.getItem(DRAFT_KEY);
            if (savedDraft) {
                setFormData(JSON.parse(savedDraft));
                setDraftLoaded(true);
            } else {
                 setFormData(initialState);
            }
        } else {
            setFormData(initialState);
        }
    }, [entry, formSettings, getInitialState]);

    useEffect(() => {
        if (!entry) {
             try {
                 localStorage.setItem(DRAFT_KEY, JSON.stringify(formData));
            } catch (e) { console.warn("Could not save draft to localStorage.", e); }
        }
    }, [formData, entry]);


    const detectedSide = useMemo<'Buy' | 'Sell' | null>(() => {
        const { entryPrice, stopLoss, takeProfit } = formData;
        if (entryPrice == null || stopLoss == null || takeProfit == null) return null;
        if (takeProfit > entryPrice && stopLoss < entryPrice) return 'Buy';
        if (takeProfit < entryPrice && stopLoss > entryPrice) return 'Sell';
        return null;
    }, [formData.entryPrice, formData.stopLoss, formData.takeProfit]);

    const effectiveSide = manualSide || detectedSide;

    const calculations = useMemo(() => {
        const { entryPrice, stopLoss, takeProfit, positionSize = 1 } = formData;
        if (entryPrice == null || stopLoss == null || takeProfit == null || !riskSettings || !effectiveSide) {
            return { rr: 'N/A', riskPercent: 'N/A', potentialPnl: 'N/A', isValid: false };
        }
        
        const riskDistance = Math.abs(entryPrice - stopLoss);
        const rewardDistance = Math.abs(takeProfit - entryPrice);
        
        if (riskDistance === 0) return { rr: '∞', riskPercent: 'N/A', potentialPnl: '∞', isValid: false };

        const rr = rewardDistance / riskDistance;
        const pnl = rewardDistance * positionSize * 100000 * (effectiveSide === 'Buy' ? 1 : -1);
        const riskAmount = riskDistance * positionSize * 100000;
        const riskPercent = (riskAmount / riskSettings.accountBalance) * 100;
        
        const isValid = (effectiveSide === 'Buy' && takeProfit > entryPrice && stopLoss < entryPrice) ||
                        (effectiveSide === 'Sell' && takeProfit < entryPrice && stopLoss > entryPrice);
        
        return {
            rr: rr.toFixed(2),
            riskPercent: `${riskPercent.toFixed(2)}%`,
            potentialPnl: `$${pnl.toFixed(2)}`,
            isValid: isValid
        };
    }, [formData, riskSettings, effectiveSide]);

     const suggestedTags = useMemo(() => {
        const suggestions = new Set<string>();
        if (calculations.isValid && parseFloat(calculations.rr) >= 3) {
            suggestions.add('ریسک به ریوارد بالا');
        }
        if (formData.symbol?.toLowerCase().includes('usd')) {
            suggestions.add('جفت ارز اصلی');
        }
        if (formData.symbol?.toLowerCase().includes('jpy')) {
            suggestions.add('ین ژاپن');
        }
        const currentUTCHour = new Date().getUTCHours();
        if (currentUTCHour >= 13 && currentUTCHour < 22) {
            suggestions.add('جلسه نیویورک');
        }
        return Array.from(suggestions).filter(t => !formData.tags?.includes(t));
    }, [formData.symbol, calculations.rr, formData.tags]);

    useEffect(() => {
        if (!formData.setupId) return;

        const selectedSetup = setups.find(s => s.id === formData.setupId);
        if (!selectedSetup) return;

        const updates: Partial<FormState> = {};
        if (selectedSetup.defaultTags) {
            updates.tags = Array.from(new Set([...(formData.tags || []), ...selectedSetup.defaultTags]));
        }
        if (selectedSetup.defaultMistakes) {
            updates.mistakes = Array.from(new Set([...(formData.mistakes || []), ...selectedSetup.defaultMistakes]));
        }
        
        setFormData(prev => ({ ...prev, ...updates }));

        if (selectedSetup.defaultRiskRewardRatio && formData.entryPrice != null && formData.stopLoss != null && effectiveSide) {
            const riskDistance = Math.abs(formData.entryPrice - formData.stopLoss);
            const rewardDistance = riskDistance * selectedSetup.defaultRiskRewardRatio;
            const newTakeProfit = effectiveSide === 'Buy' 
                ? formData.entryPrice + rewardDistance 
                : formData.entryPrice - rewardDistance;
            
            setFormData(prev => ({ ...prev, takeProfit: newTakeProfit }));
        }

    }, [formData.setupId, effectiveSide, setups, formData.entryPrice, formData.stopLoss, formData.tags, formData.mistakes]);

    useEffect(() => {
        const getSuggestion = async () => {
            if (!formData.symbol || formData.symbol.length < 4) {
                setSlSuggestion(null);
                return;
            }
            const symbolEntries = await getEntriesBySymbol(formData.symbol);
            if (symbolEntries.length < 3) {
                setSlSuggestion(null);
                return;
            }

            const totalSlDistance = symbolEntries.reduce((sum, entry) => {
                const distance = Math.abs((entry.entryPrice || 0) - (entry.stopLoss || 0));
                return sum + distance;
            }, 0);

            const avgSlDistance = totalSlDistance / symbolEntries.length;
            
            const isForex = ['usd', 'eur', 'gbp', 'jpy', 'chf', 'cad', 'aud', 'nzd'].some(c => formData.symbol!.toLowerCase().includes(c));
            const pips = avgSlDistance * (formData.symbol!.toLowerCase().includes('jpy') ? 100 : 10000);

            setSlSuggestion(isForex ? pips : avgSlDistance);
        };

        const debounce = setTimeout(getSuggestion, 300);
        return () => clearTimeout(debounce);

    }, [formData.symbol]);

    const applySlSuggestion = () => {
        if (slSuggestion == null || formData.entryPrice == null || !effectiveSide) return;

        const isJpyPair = formData.symbol!.toLowerCase().includes('jpy');
        const distance = slSuggestion / (isJpyPair ? 100 : 10000);

        const newStopLoss = effectiveSide === 'Buy' 
            ? formData.entryPrice - distance 
            : formData.entryPrice + distance;
        
        setFormData(prev => ({ ...prev, stopLoss: newStopLoss }));
    };

    const togglePsychoAnalysis = () => setIsPsychoAnalysisOpen(p => !p);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        const isNumberField = e.target instanceof HTMLInputElement && e.target.type === 'number';
        setFormData(prev => ({ ...prev, [name]: isNumberField ? (value === '' ? undefined : parseFloat(value)) : value }));
    };
    
    const handlePsychologyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, psychology: { ...prev.psychology, [name]: value } }));
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.size > 2 * 1024 * 1024) {
            alert("حجم تصویر باید کمتر از ۲ مگابایت باشد.");
            return;
        }
        const reader = new FileReader();
        reader.onloadend = () => setFormData(prev => ({ ...prev, imageUrl: reader.result as string }));
        reader.readAsDataURL(file);
    };

    const handleMultiSelect = (name: 'mistakes', value: string) => setFormData(prev => ({ ...prev, [name]: (prev[name] || []).includes(value) ? (prev[name] || []).filter(v => v !== value) : [...(prev[name] || []), value] }));

    const handleAddTag = (tag: string) => {
        const trimmedTag = tag.trim();
        if (trimmedTag && !formData.tags?.includes(trimmedTag)) {
            setFormData(prev => ({ ...prev, tags: [...(prev.tags || []), trimmedTag] }));
        }
        setTagInput('');
    };

    const handleRemoveTag = (tagToRemove: string) => setFormData(prev => ({ ...prev, tags: (prev.tags || []).filter(tag => tag !== tagToRemove) }));

    const handleTagInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            handleAddTag(tagInput);
        }
    };
    
    const handleDiscardDraft = () => {
        if (window.confirm('آیا از حذف پیش‌نویس مطمئن هستید؟')) {
            try { localStorage.removeItem(DRAFT_KEY); } catch(e) { console.error(e) }
            setFormData(getInitialState());
            setDraftLoaded(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent | KeyboardEvent) => {
        e.preventDefault();
        
        if (formSettings.symbol?.isActive && !formData.symbol) {
            alert('نماد الزامی است.');
            return;
        }

        const pricesProvided = formData.entryPrice != null && formData.stopLoss != null && formData.takeProfit != null;
        if (formSettings.entryPrice?.isActive && pricesProvided && (!effectiveSide || !calculations.isValid)) {
            alert('اطلاعات قیمت‌ها نامعتبر است (مثلاً حد سود یا ضرر در سمت اشتباه قیمت ورود است).');
            return;
        }

        const isOutcomeActive = formSettings.outcome?.isActive;
        const { outcome, manualExitPrice } = formData;
        let finalExitPrice: number | undefined;

        if (isOutcomeActive) {
            if(outcome === 'Take Profit') finalExitPrice = formData.takeProfit;
            else if(outcome === 'Stop Loss') finalExitPrice = formData.stopLoss;
            else if(outcome === 'Manual Exit') finalExitPrice = manualExitPrice;
            
            if (outcome === 'Manual Exit' && finalExitPrice === undefined) {
                alert('برای خروج دستی، قیمت خروج الزامی است.');
                return;
            }
        }
        
        let finalPnl: number | undefined;
        let status: JournalEntry['status'] | undefined;

        if (finalExitPrice !== undefined && formData.entryPrice !== undefined && effectiveSide) {
            const positionSize = formData.positionSize || 1;
            finalPnl = (finalExitPrice - formData.entryPrice) * positionSize * (effectiveSide === 'Buy' ? 1 : -1) * 100000;
            status = finalPnl > 0 ? 'Win' : finalPnl < 0 ? 'Loss' : 'Breakeven';
        }

        const newEntry: JournalEntry = {
            ...formData,
            id: entry?.id || new Date().toISOString(), 
            date: entry?.date || new Date().toISOString(),
            side: effectiveSide || undefined,
            exitPrice: finalExitPrice,
            profitOrLoss: finalPnl,
            status: status,
            riskRewardRatio: calculations.rr !== 'N/A' && calculations.rr !== '∞' ? parseFloat(calculations.rr) : undefined,
            setupName: setups.find(s => s.id === formData.setupId)?.name,
        };
        
        try {
            await addJournalEntry(newEntry);
            if (!entry) {
                try { localStorage.removeItem(DRAFT_KEY); } catch(e) { console.error(e) }
            }
            onSave();
            onClose();
        } catch (e) {
            console.error("Failed to save journal entry:", e);
            alert("خطا در ذخیره معامله. لطفا دوباره تلاش کنید.");
        }
    };
    
    const isSubmitDisabled = formSettings.entryPrice?.isActive && formData.entryPrice != null && (!effectiveSide || !calculations.isValid);

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col">
                <div className="flex justify-between items-center p-4 border-b dark:border-gray-700">
                    <h2 className="text-xl font-bold">{entry ? 'ویرایش معامله' : 'ثبت معامله هوشمند'}</h2>
                    <button onClick={onClose} className="p-1 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">&times;</button>
                </div>
                
                <form onSubmit={handleSubmit} className="flex-grow flex flex-col overflow-hidden">
                    <div className="flex items-center justify-around p-3 bg-gray-50 dark:bg-gray-700/50 border-b dark:border-gray-700 text-sm">
                        <div className="flex items-center gap-2">
                             <button type="button" onClick={() => setManualSide(effectiveSide === 'Buy' ? 'Sell' : 'Buy')} className={`flex items-center gap-1 font-bold p-1 rounded-md ${effectiveSide === 'Buy' ? 'text-green-500' : effectiveSide === 'Sell' ? 'text-red-500' : 'text-gray-500'}`} title="تغییر جهت دستی">
                                {effectiveSide === 'Buy' ? <TrendingUp size={16}/> : effectiveSide === 'Sell' ? <TrendingDown size={16}/> : <ExternalLink size={16}/>}
                                <span>{effectiveSide || '...'}</span>
                                {manualSide && <span className="text-xs font-normal text-gray-400">(دستی)</span>}
                            </button>
                        </div>
                        <span><strong className="ml-1">R/R:</strong>{calculations.rr}</span>
                        <span><strong className="ml-1">ریسک:</strong>{calculations.riskPercent}</span>
                        <span className={effectiveSide === 'Buy' ? 'text-green-500' : 'text-red-500'}><strong className="ml-1 text-gray-800 dark:text-gray-200">PnL:</strong>{calculations.potentialPnl}</span>
                        {isSubmitDisabled && <span title="مقادیر نامعتبر"><AlertTriangle size={16} className="text-red-500" /></span>}
                    </div>

                    <div className="p-6 space-y-4 overflow-y-auto">
                         {draftLoaded && (
                            <div className="flex items-center justify-center gap-2 p-2 bg-yellow-100 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-300 text-xs rounded-md">
                                <Info size={14} />
                                <span>پیش‌نویس قبلی شما بارگذاری شد.</span>
                                <button type="button" onClick={handleDiscardDraft} className="font-semibold hover:underline">حذف</button>
                            </div>
                        )}
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                           {formSettings.symbol?.isActive && <input type="text" name="symbol" placeholder="نماد" className="p-2 border rounded dark:bg-gray-700 dark:border-gray-600 md:col-span-1" value={formData.symbol || ''} onChange={handleChange} autoFocus />}
                           {formSettings.entryPrice?.isActive && <input ref={entryPriceRef} type="number" name="entryPrice" step="any" placeholder="قیمت ورود" className={`p-2 border rounded dark:bg-gray-700 dark:border-gray-600 ${isSubmitDisabled ? 'border-red-500' : ''}`} value={formData.entryPrice === undefined ? '' : formData.entryPrice} onChange={handleChange}/>}
                           {formSettings.stopLoss?.isActive && <div className="relative">
                                <input type="number" name="stopLoss" step="any" placeholder="حد ضرر" className={`p-2 border rounded dark:bg-gray-700 dark:border-gray-600 w-full ${isSubmitDisabled ? 'border-red-500' : ''}`} value={formData.stopLoss === undefined ? '' : formData.stopLoss} onChange={handleChange}/>
                                {slSuggestion !== null && (
                                     <div className="absolute -bottom-6 left-0 text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                                        <Wand2 size={12} className="text-indigo-400"/>
                                        <span>میانگین SL: {slSuggestion.toFixed(1)} پیپ.</span>
                                        <button type="button" onClick={applySlSuggestion} className="text-indigo-500 hover:underline">اعمال</button>
                                    </div>
                                )}
                            </div>}
                           {formSettings.takeProfit?.isActive && <input type="number" name="takeProfit" step="any" placeholder="حد سود" className={`p-2 border rounded dark:bg-gray-700 dark:border-gray-600 ${isSubmitDisabled ? 'border-red-500' : ''}`} value={formData.takeProfit === undefined ? '' : formData.takeProfit} onChange={handleChange}/>}
                           {formSettings.positionSize?.isActive && <input type="number" name="positionSize" step="any" placeholder="حجم (لات)" className="p-2 border rounded dark:bg-gray-700 dark:border-gray-600" value={formData.positionSize === undefined ? '' : formData.positionSize} onChange={handleChange}/>}
                        </div>

                        {formSettings.outcome?.isActive && <fieldset className="border p-4 rounded-md dark:border-gray-600">
                            <legend className="px-2 font-semibold text-sm">ثبت نتیجه معامله</legend>
                            <div className="grid grid-cols-2 gap-4">
                                 <select name="outcome" className="p-2 border rounded dark:bg-gray-700 dark:border-gray-600" value={formData.outcome || ''} onChange={handleChange}>
                                    <option value="Manual Exit">خروج دستی</option>
                                    <option value="Take Profit">حد سود</option>
                                    <option value="Stop Loss">حد ضرر</option>
                                </select>
                                {formData.outcome === 'Manual Exit' && (
                                    <input type="number" name="manualExitPrice" step="any" placeholder="قیمت خروج" className="p-2 border rounded dark:bg-gray-700 dark:border-gray-600" value={formData.manualExitPrice === undefined ? '' : formData.manualExitPrice} onChange={handleChange}/>
                                )}
                            </div>
                        </fieldset>}
                        
                        {formSettings.imageUrl?.isActive && <div className="border border-dashed dark:border-gray-600 rounded-lg p-4 text-center">
                            {!formData.imageUrl ? (
                                <>
                                    <UploadCloud className="mx-auto h-12 w-12 text-gray-400" />
                                    <label htmlFor="file-upload" className="relative cursor-pointer rounded-md font-semibold text-indigo-600 hover:text-indigo-500">
                                        <span>آپلود تصویر</span>
                                        <input ref={fileInputRef} id="file-upload" name="file-upload" type="file" className="sr-only" accept="image/*" onChange={handleImageUpload} />
                                    </label>
                                    <p className="text-xs text-gray-500">PNG, JPG, GIF up to 2MB</p>
                                </>
                            ) : (
                                <div className="relative group">
                                    <img src={formData.imageUrl} alt="Preview" className="mx-auto max-h-40 rounded-lg" />
                                    <button onClick={() => setFormData(p => ({...p, imageUrl: undefined}))} className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity" title="حذف تصویر">
                                        <XCircle size={20} />
                                    </button>
                                </div>
                            )}
                        </div>}
                        
                         <div className="border rounded-md dark:border-gray-600">
                            <button type="button" onClick={togglePsychoAnalysis} className="flex justify-between items-center w-full p-4 text-right">
                                <div className="flex items-center gap-2"><Brain size={18} className="text-indigo-500" /><span className="font-semibold text-sm">تحلیل روانشناسی و استراتژی (اختیاری)</span></div>
                                <ChevronDown className={`w-5 h-5 transition-transform ${isPsychoAnalysisOpen ? 'rotate-180' : ''}`} />
                            </button>
                            {isPsychoAnalysisOpen && <div className="p-4 border-t dark:border-gray-600 space-y-4">
                                {formSettings.setupId?.isActive && <div><label className="block text-sm font-medium mb-2">ستاپ معاملاتی</label><select name="setupId" value={formData.setupId || ''} onChange={handleChange} className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"><option value="">انتخاب ستاپ</option>{setups.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></div>}
                                
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                     {formSettings['psychology.emotionBefore']?.isActive && <div><label className="block text-sm font-medium mb-1">احساس قبل از ورود</label><select name="emotionBefore" value={formData.psychology?.emotionBefore || ''} onChange={handlePsychologyChange} className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"><option value="">انتخاب کنید</option>{EMOTIONS_BEFORE.map(e => <option key={e} value={e}>{e}</option>)}</select></div>}
                                     {formSettings['psychology.entryReason']?.isActive && <div><label className="block text-sm font-medium mb-1">انگیزه ورود</label><select name="entryReason" value={formData.psychology?.entryReason || ''} onChange={handlePsychologyChange} className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"><option value="">انتخاب کنید</option>{ENTRY_REASONS.map(e => <option key={e} value={e}>{e}</option>)}</select></div>}
                                     {formSettings['psychology.emotionAfter']?.isActive && <div><label className="block text-sm font-medium mb-1">احساس بعد از خروج</label><select name="emotionAfter" value={formData.psychology?.emotionAfter || ''} onChange={handlePsychologyChange} className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"><option value="">انتخاب کنید</option>{EMOTIONS_AFTER.map(e => <option key={e} value={e}>{e}</option>)}</select></div>}
                                </div>

                                {formSettings.tags?.isActive && <div>
                                    <label className="block text-sm font-medium mb-2">تگ‌ها</label>
                                    <div className="flex flex-wrap items-center gap-2 p-2 border rounded dark:bg-gray-700 dark:border-gray-600">
                                        {formData.tags?.map(tag => (
                                            <div key={tag} className="flex items-center gap-1 bg-indigo-500 text-white text-xs px-2 py-1 rounded-full">
                                                {tag}
                                                <button type="button" onClick={() => handleRemoveTag(tag)}><X size={14} /></button>
                                            </div>
                                        ))}
                                        <input type="text" value={tagInput} onChange={(e) => setTagInput(e.target.value)} onKeyDown={handleTagInputKeyDown} placeholder="افزودن تگ..." className="bg-transparent focus:outline-none flex-grow" list="tag-suggestions" />
                                        <datalist id="tag-suggestions">{allTags.filter(t => !formData.tags?.includes(t) && t.toLowerCase().includes(tagInput.toLowerCase())).map(t => <option key={t} value={t} />)}</datalist>
                                    </div>
                                    {suggestedTags.length > 0 && <div className="flex flex-wrap gap-1 mt-2">
                                        <span className="text-xs text-gray-500">پیشنهاد هوشمند:</span>
                                        {suggestedTags.map(tag => ( <button key={tag} type="button" onClick={() => handleAddTag(tag)} className="px-2 py-0.5 text-xs bg-teal-100 dark:bg-teal-800 text-teal-700 dark:text-teal-200 rounded-full hover:bg-teal-200 dark:hover:bg-teal-700">{tag}</button>))}
                                    </div>}
                                </div>}
                                
                                {formSettings.mistakes?.isActive && <div><label className="block text-sm font-medium mb-2">اشتباهات</label><div className="flex flex-wrap gap-2">{MISTAKES_LIST.map(mistake => (<button key={mistake} type="button" onClick={() => handleMultiSelect('mistakes', mistake)} className={`px-3 py-1.5 text-xs rounded-full border transition-colors ${formData.mistakes?.includes(mistake) ? 'bg-red-500 border-red-500 text-white' : 'bg-gray-200 dark:bg-gray-700'}`}>{mistake}</button>))}</div></div>}
                                {(formSettings.notesBefore?.isActive || formSettings.notesAfter?.isActive) && <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {formSettings.notesBefore?.isActive && <textarea name="notesBefore" rows={2} placeholder="یادداشت‌های قبل از معامله" value={formData.notesBefore} onChange={handleChange} className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"></textarea>}
                                    {formSettings.notesAfter?.isActive && <textarea name="notesAfter" rows={2} placeholder="درس‌های آموخته‌شده بعد از معامله" value={formData.notesAfter} onChange={handleChange} className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"></textarea>}
                                </div>}
                            </div>}
                        </div>
                    </div>
                    
                    <div className="flex justify-end gap-3 p-4 mt-auto border-t dark:border-gray-700 bg-white/5 dark:bg-gray-800/5">
                        <button type="button" onClick={onClose} className="px-4 py-2 rounded bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500">انصراف</button>
                        <button type="submit" className="flex items-center gap-2 px-4 py-2 rounded bg-indigo-500 text-white hover:bg-indigo-600 disabled:bg-gray-400" disabled={isSubmitDisabled}>
                           <Check size={18}/> {entry ? 'ذخیره تغییرات' : 'ذخیره معامله'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};


export default JournalPage;