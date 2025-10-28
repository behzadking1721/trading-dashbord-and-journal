import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import type { JournalEntry, TradingSetup, TradeOutcome, RiskSettings, EmotionBefore, EntryReason, EmotionAfter, JournalFormSettings, JournalFormField, PsychologyOptions } from '../../types';
import { addJournalEntry, getJournalEntries, getAllTags } from '../../db';
import { Wand2, Info, XCircle, Brain, Star, UploadCloud, X, Check } from 'lucide-react';

const MISTAKES_LIST = ['نادیده گرفتن چک‌لیست', 'ورود بدون ستاپ', 'جابجا کردن حد ضرر', 'ریسک بیش از حد', 'خروج زودهنگام (ترس)', 'خروج دیرهنگام (طمع)'];
const PSYCHOLOGY_OPTIONS_KEY = 'psychology-options';
const DEFAULT_PSYCHOLOGY_OPTIONS: PsychologyOptions = {
    emotionsBefore: ['مطمئن', 'منظم', 'مضطرب', 'هیجانی'],
    entryReasons: ['ستاپ تکنیکال', 'خبر', 'دنبال کردن ترند', 'ترس از دست دادن (FOMO)', 'انتقام'],
    emotionsAfter: ['رضایت', 'پشیمانی', 'شک', 'هیجان‌زده'],
};


interface FormState extends Omit<Partial<JournalEntry>, 'outcome'> {
    outcome?: TradeOutcome;
    manualExitPrice?: number;
}

const DRAFT_KEY = 'journal_form_draft';
const STORAGE_KEY_FORM_SETTINGS = 'journal-form-settings';
const STORAGE_KEY_RISK_SETTINGS = 'risk-management-settings';

const initialEmptyState: FormState = {
    date: new Date().toISOString(),
    symbol: '',
    entryPrice: undefined,
    stopLoss: undefined,
    takeProfit: undefined,
    positionSize: undefined,
    setupId: '',
    setupRating: 0,
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

const RiskAnalysisHeader: React.FC<{ calculations: any; effectiveSide: 'Buy' | 'Sell' | null }> = ({ calculations, effectiveSide }) => {
    const { rr, riskPercent, potentialPnl, isValid } = calculations;
    const riskValue = parseFloat(riskPercent);
    const rrValue = parseFloat(rr);

    const getRiskColor = (risk: number) => {
        if (isNaN(risk) || !isValid) return { bar: 'bg-gray-400', text: 'text-gray-500 dark:text-gray-400' };
        if (risk > 3) return { bar: 'bg-red-500', text: 'text-red-500' };
        if (risk > 1.5) return { bar: 'bg-yellow-500', text: 'text-yellow-500' };
        return { bar: 'bg-green-500', text: 'text-green-500' };
    };

    const riskColor = getRiskColor(riskValue);
    const riskBarWidth = isNaN(riskValue) || !isValid ? 0 : Math.min(riskValue * 20, 100); // Capped at 5% risk for visual max

    return (
        <div className="p-4 bg-gray-50 dark:bg-gray-700/50 border-b dark:border-gray-700 text-sm">
             <div className="flex items-center gap-2 mb-4">
                 <h3 className="text-md font-bold text-gray-800 dark:text-gray-200">تحلیل ریسک لحظه‌ای</h3>
                 <div className="relative group">
                    <Info size={16} className="text-gray-400 cursor-pointer" />
                    <div className="absolute bottom-full mb-2 -right-1/2 transform translate-x-1/2 w-64 p-2 text-xs text-white bg-gray-900 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                        محاسبات بر اساس لات استاندارد فارکس (۱۰۰،۰۰۰ واحد) است. برای سایر دارایی‌ها ممکن است دقیق نباشد.
                        <svg className="absolute text-gray-900 h-2 w-full left-0 top-full" x="0px" y="0px" viewBox="0 0 255 255"><polygon className="fill-current" points="0,0 127.5,127.5 255,0"/></svg>
                    </div>
                </div>
             </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-4">
                {/* Risk/Reward Visualizer */}
                <div className="space-y-1">
                    <div className="flex justify-between items-baseline">
                        <label className="font-semibold text-xs">ریسک به ریوارد</label>
                         <span className={`font-mono font-bold text-lg ${!isValid ? 'text-gray-400' : ''}`}>{isValid ? rr : 'N/A'}</span>
                    </div>
                    <div className={`flex h-6 w-full rounded-md overflow-hidden text-white text-xs font-bold items-center justify-center ${!isValid || isNaN(rrValue) ? 'bg-gray-300 dark:bg-gray-600' : ''}`}>
                        {isValid && !isNaN(rrValue) && rrValue > 0 && (
                            <>
                                <div className="bg-red-500 flex items-center justify-center h-full" style={{ flex: 1 }}>1 R</div>
                                <div className="bg-green-500 flex items-center justify-center h-full" style={{ flex: rrValue }}>{rrValue.toFixed(1)} R</div>
                            </>
                        )}
                    </div>
                </div>
                 {/* Risk % Gauge */}
                <div className="space-y-1">
                     <div className="flex justify-between items-baseline">
                        <label className="font-semibold text-xs">درصد ریسک</label>
                        <span className={`font-mono font-bold text-lg ${riskColor.text}`}>{riskPercent}</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-6 relative overflow-hidden">
                        <div className={`h-full rounded-full transition-all duration-300 ${riskColor.bar}`} style={{ width: `${riskBarWidth}%` }}></div>
                         <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white mix-blend-difference">
                           {riskPercent} از موجودی
                         </span>
                    </div>
                </div>
                {/* Potential P&L */}
                 <div className="space-y-1">
                     <div className="flex justify-between items-baseline">
                        <label className="font-semibold text-xs">سود/ضرر احتمالی</label>
                        <span className={`font-mono font-bold text-lg ${!isValid ? 'text-gray-400' : 'text-green-500'}`}>
                           {isValid ? potentialPnl : '$0.00'}
                        </span>
                    </div>
                    <div className="p-2 h-6 flex items-center justify-center bg-gray-200 dark:bg-gray-600 rounded-md">
                         <p className="text-xs text-gray-600 dark:text-gray-300">بر اساس رسیدن به حد سود</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

const StarRating: React.FC<{ rating: number; setRating: (rating: number) => void; }> = ({ rating, setRating }) => {
    const [hoverRating, setHoverRating] = useState(0);
    return (
        <div className="flex items-center gap-1 mt-1" onMouseLeave={() => setHoverRating(0)}>
            {[1, 2, 3, 4, 5].map((star) => (
                <button
                    type="button"
                    key={star}
                    className="text-yellow-400 focus:outline-none transition-transform transform hover:scale-125"
                    onClick={() => setRating(star === rating ? 0 : star)}
                    onMouseEnter={() => setHoverRating(star)}
                >
                    <Star size={24} fill={(hoverRating || rating) >= star ? 'currentColor' : 'none'} />
                </button>
            ))}
        </div>
    );
};


const JournalFormModal: React.FC<{ onClose: () => void; onSave: () => void; entry: JournalEntry | null; }> = ({ onClose, onSave, entry }) => {
    const [formSettings, setFormSettings] = useState<JournalFormSettings>({});
    
    const getInitialState = useCallback((): FormState => {
        // Priority 1: If editing an existing entry, use its data.
        if (entry) {
            return {
                ...initialEmptyState,
                ...entry,
                manualExitPrice: entry.outcome === 'Manual Exit' && entry.exitPrice ? entry.exitPrice : undefined,
            };
        }
    
        // Priority 2: If there's a draft for a new entry, use it.
        try {
            const draft = localStorage.getItem(DRAFT_KEY);
            if (draft) {
                const parsedDraft = JSON.parse(draft);
                if (!parsedDraft.psychology) parsedDraft.psychology = {}; // Ensure psychology object exists
                return parsedDraft;
            }
        } catch (e) {
            console.error("Failed to parse journal draft", e);
            localStorage.removeItem(DRAFT_KEY); // Clear corrupted draft
        }

        // Priority 3: If no entry and no draft, create state from default settings.
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
    const [initializationComplete, setInitializationComplete] = useState(false);
    
    const [manualSide, setManualSide] = useState<'Buy' | 'Sell' | null>(entry?.side || null);
    const [setups, setSetups] = useState<TradingSetup[]>([]);
    const [riskSettings, setRiskSettings] = useState<RiskSettings | null>(null);
    const PSYCHO_ANALYSIS_LS_KEY = 'journal-form-psycho-analysis-open';
    const [isPsychoAnalysisOpen, setIsPsychoAnalysisOpen] = useState(() => {
        try { return localStorage.getItem(PSYCHO_ANALYSIS_LS_KEY) === 'true'; } catch { return false; }
    });
    const [allTags, setAllTags] = useState<string[]>([]);
    const tagInputRef = useRef<HTMLInputElement>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(entry?.imageUrl || null);
    const [isSmartEntryOpen, setIsSmartEntryOpen] = useState(false);
    const [winStreak, setWinStreak] = useState(0);
    const [psychologyOptions, setPsychologyOptions] = useState<PsychologyOptions>(DEFAULT_PSYCHOLOGY_OPTIONS);


    const effectiveSide = useMemo(() => {
        if (formData.entryPrice != null && formData.stopLoss != null) {
            return formData.entryPrice > formData.stopLoss ? 'Buy' : 'Sell';
        }
        return manualSide;
    }, [formData.entryPrice, formData.stopLoss, manualSide]);

     const calculations = useMemo(() => {
        const { entryPrice, stopLoss, takeProfit, positionSize } = formData;
        const balance = riskSettings?.accountBalance || 0;

        if (entryPrice == null || stopLoss == null || takeProfit == null || positionSize == null || balance === 0 || effectiveSide === null) {
            return { rr: '0.00', riskPercent: '0.00%', potentialPnl: '$0.00', isValid: false };
        }

        const riskAmount = Math.abs(entryPrice - stopLoss) * positionSize * 100000;
        const rewardAmount = Math.abs(takeProfit - entryPrice) * positionSize * 100000;
        
        const isValid = riskAmount > 0 && rewardAmount > 0;
        if (!isValid) {
            return { rr: '0.00', riskPercent: '0.00%', potentialPnl: '$0.00', isValid: false };
        }

        const rr = rewardAmount / riskAmount;
        const riskPercent = (riskAmount / balance) * 100;

        return {
            rr: rr.toFixed(2),
            riskPercent: `${riskPercent.toFixed(2)}%`,
            potentialPnl: `$${rewardAmount.toFixed(2)}`,
            isValid: true,
        };
    }, [formData, riskSettings, effectiveSide]);


    const updateRiskSettings = useCallback(() => {
        try {
            const savedRisk = localStorage.getItem(STORAGE_KEY_RISK_SETTINGS);
            if(savedRisk) setRiskSettings(JSON.parse(savedRisk));
        } catch (error) { console.error("Could not load risk settings:", error); }
    }, []);

    useEffect(() => {
        // Load initial data for the form
        const loadInitialData = async () => {
            try {
                // Load Form Field Settings
                const savedFormSettings = localStorage.getItem(STORAGE_KEY_FORM_SETTINGS);
                const initialFormSettings = savedFormSettings ? JSON.parse(savedFormSettings) : {};
                setFormSettings(initialFormSettings);
                
                // Load Setups
                const savedSetups = localStorage.getItem('trading-setups');
                if (savedSetups) {
                    const parsedSetups = JSON.parse(savedSetups);
                    setSetups(parsedSetups);
                }
                
                // Load Risk Settings
                updateRiskSettings();
                
                // Load Psychology Options
                const savedPsychoOptions = localStorage.getItem(PSYCHOLOGY_OPTIONS_KEY);
                if (savedPsychoOptions) setPsychologyOptions(JSON.parse(savedPsychoOptions));

                // Load all tags for suggestions
                const tags = await getAllTags();
                setAllTags(tags);

                 // Load win streak for anti-martingale
                const entries = await getJournalEntries();
                const closedTrades = entries
                    .filter(e => e.status === 'Win' || e.status === 'Loss')
                    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
                let currentStreak = 0;
                for (const trade of closedTrades) {
                    if (trade.status === 'Win') {
                        currentStreak++;
                    } else {
                        break;
                    }
                }
                setWinStreak(currentStreak);

                setInitializationComplete(true);

            } catch (e) {
                console.error("Failed to load modal data", e);
            }
        };
        
        loadInitialData();
        
        // Listen for external changes to risk settings
        window.addEventListener('storage', updateRiskSettings);
        return () => window.removeEventListener('storage', updateRiskSettings);

    }, [entry, updateRiskSettings]);

    // This effect runs after all data is loaded to initialize the form state correctly
    useEffect(() => {
        if(initializationComplete) {
            setFormData(getInitialState());
        }
    }, [initializationComplete, getInitialState]);


    // Save draft on every change for new entries
    useEffect(() => {
        if (!entry && initializationComplete) {
            try { localStorage.setItem(DRAFT_KEY, JSON.stringify(formData)); } catch (e) { console.warn(e); }
        }
    }, [formData, entry, initializationComplete]);

    const handleInputChange = (field: keyof FormState | string, value: any) => {
        const newState = { ...formData };
        if (field.includes('.')) {
            setNestedValue(newState, field, value);
        } else {
            (newState as any)[field] = value;
        }
        setFormData(newState);
    };

    const isFieldActive = (fieldId: JournalFormField) => formSettings[fieldId]?.isActive !== false;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const newEntry: JournalEntry = {
            id: entry?.id || Date.now().toString(),
            date: new Date(formData.date!).toISOString(),
            symbol: formData.symbol,
            side: effectiveSide || undefined,
            entryPrice: formData.entryPrice,
            stopLoss: formData.stopLoss,
            takeProfit: formData.takeProfit,
            positionSize: formData.positionSize,
            outcome: formData.outcome,
            setupId: formData.setupId,
            setupName: setups.find(s => s.id === formData.setupId)?.name,
            setupRating: formData.setupRating,
            tags: formData.tags,
            mistakes: formData.mistakes,
            notesBefore: formData.notesBefore,
            notesAfter: formData.notesAfter,
            imageUrl: imagePreview || formData.imageUrl,
            psychology: formData.psychology,
        };

        if (newEntry.entryPrice && newEntry.stopLoss && newEntry.takeProfit) {
            const risk = Math.abs(newEntry.entryPrice - newEntry.stopLoss);
            const reward = Math.abs(newEntry.takeProfit - newEntry.entryPrice);
            if (risk > 0) {
                newEntry.riskRewardRatio = reward / risk;
            }
        }
        
        if (formData.outcome === 'Take Profit') {
            newEntry.exitPrice = formData.takeProfit;
        } else if (formData.outcome === 'Stop Loss') {
            newEntry.exitPrice = formData.stopLoss;
        } else if (formData.outcome === 'Manual Exit') {
            newEntry.exitPrice = formData.manualExitPrice;
        }

        if (newEntry.exitPrice && newEntry.entryPrice && newEntry.positionSize && newEntry.side) {
            const priceDiff = newEntry.exitPrice - newEntry.entryPrice;
            const pnl = newEntry.side === 'Buy' ? priceDiff : -priceDiff;
            newEntry.profitOrLoss = pnl * newEntry.positionSize * 100000; // Standard lot size
            
            if (Math.abs(newEntry.profitOrLoss) < 0.01) {
                newEntry.status = 'Breakeven';
            } else {
                newEntry.status = newEntry.profitOrLoss > 0 ? 'Win' : 'Loss';
            }
        } else {
            newEntry.profitOrLoss = undefined;
            newEntry.status = undefined;
        }
        
        try {
            await addJournalEntry(newEntry);
            if (!entry) { // Clear draft only on successful submission of new entry
                localStorage.removeItem(DRAFT_KEY);
            }
            onSave();
            onClose();
        } catch (error) {
            console.error("Failed to save entry:", error);
            alert("خطا در ذخیره سازی. لطفا کنسول را برای اطلاعات بیشتر چک کنید.");
        }
    };
    
    const handleTagClick = (tag: string) => {
        const newTags = formData.tags?.includes(tag)
            ? formData.tags.filter(t => t !== tag)
            : [...(formData.tags || []), tag];
        handleInputChange('tags', newTags);
    };

    const handleMistakeClick = (mistake: string) => {
        const newMistakes = formData.mistakes?.includes(mistake)
            ? formData.mistakes.filter(m => m !== mistake)
            : [...(formData.mistakes || []), mistake];
        handleInputChange('mistakes', newMistakes);
    };
    
    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onload = (event) => {
                setImagePreview(event.target?.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const applySmartEntry = () => {
        if (!riskSettings) return;

        let riskPercentToUse = riskSettings.fixedPercent.risk;
        if (riskSettings.strategy === 'anti_martingale') {
            const { baseRisk, increment, maxRisk } = riskSettings.antiMartingale;
            riskPercentToUse = Math.min(baseRisk + (winStreak * increment), maxRisk);
        }
        
        const riskAmount = (riskSettings.accountBalance * riskPercentToUse) / 100;
        const rr = formData.riskRewardRatio || 2; // Default to 2 if not set
        
        if (formData.entryPrice && formData.stopLoss && effectiveSide) {
            const riskPips = Math.abs(formData.entryPrice - formData.stopLoss);
            if (riskPips > 0) {
                 const lotSize = riskAmount / (riskPips * 100000);
                 handleInputChange('positionSize', parseFloat(lotSize.toFixed(2)));

                 const rewardPips = riskPips * rr;
                 const takeProfit = effectiveSide === 'Buy' 
                    ? formData.entryPrice + rewardPips
                    : formData.entryPrice - rewardPips;
                 handleInputChange('takeProfit', parseFloat(takeProfit.toFixed(5)));
            }
        }
        setIsSmartEntryOpen(false);
    };
    
    const onSetupChange = (setupId: string) => {
        handleInputChange('setupId', setupId);
        const selectedSetup = setups.find(s => s.id === setupId);
        if (selectedSetup) {
            if (selectedSetup.defaultRiskRewardRatio) handleInputChange('riskRewardRatio', selectedSetup.defaultRiskRewardRatio);
            if (selectedSetup.defaultTags) handleInputChange('tags', selectedSetup.defaultTags);
            if (selectedSetup.defaultMistakes) handleInputChange('mistakes', selectedSetup.defaultMistakes);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center p-4 border-b dark:border-gray-700">
                    <h2 className="text-xl font-bold">{entry ? 'ویرایش معامله' : 'ثبت معامله جدید'}</h2>
                    <button onClick={onClose} className="p-1 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"><XCircle size={24} /></button>
                </div>
                
                <RiskAnalysisHeader calculations={calculations} effectiveSide={effectiveSide} />

                <form onSubmit={handleSubmit} className="flex-grow overflow-y-auto">
                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {/* Column 1: Core Trade Data */}
                        <div className="space-y-4">
                            <h3 className="font-bold text-md border-b pb-2 dark:border-gray-600">اطلاعات اصلی</h3>
                            <div><label className="text-sm">تاریخ و زمان</label><input type="datetime-local" value={formData.date ? new Date(formData.date).toISOString().substring(0, 16) : ''} onChange={e => handleInputChange('date', new Date(e.target.value).toISOString())} className="w-full p-2 border rounded mt-1 dark:bg-gray-700 dark:border-gray-600" /></div>
                            
                            {isFieldActive('symbol') && (<div><label className="text-sm">نماد</label><input type="text" placeholder="EURUSD" required value={formData.symbol || ''} onChange={e => handleInputChange('symbol', e.target.value.toUpperCase())} className="w-full p-2 border rounded mt-1 dark:bg-gray-700 dark:border-gray-600" /></div>)}

                            <div className="flex items-center gap-4">
                                <label className="flex items-center gap-2 cursor-pointer"><input type="radio" name="side" value="Buy" checked={effectiveSide === 'Buy'} onChange={() => setManualSide('Buy')} disabled={formData.entryPrice != null && formData.stopLoss != null} className="form-radio text-green-500"/> خرید </label>
                                <label className="flex items-center gap-2 cursor-pointer"><input type="radio" name="side" value="Sell" checked={effectiveSide === 'Sell'} onChange={() => setManualSide('Sell')} disabled={formData.entryPrice != null && formData.stopLoss != null} className="form-radio text-red-500"/> فروش </label>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                                {isFieldActive('entryPrice') && (<div><label className="text-sm">قیمت ورود</label><input type="number" step="any" min="0" placeholder="1.2345" value={formData.entryPrice || ''} onChange={e => handleInputChange('entryPrice', parseFloat(e.target.value))} className="w-full p-2 border rounded mt-1 dark:bg-gray-700 dark:border-gray-600" /></div>)}
                                {isFieldActive('positionSize') && (<div><label className="text-sm">حجم (لات)</label><input type="number" step="0.01" min="0" placeholder="0.1" value={formData.positionSize || ''} onChange={e => handleInputChange('positionSize', parseFloat(e.target.value))} className="w-full p-2 border rounded mt-1 dark:bg-gray-700 dark:border-gray-600" /></div>)}
                            </div>
                           
                            <details className="border rounded-md dark:border-gray-600" open={isSmartEntryOpen} onToggle={(e) => setIsSmartEntryOpen((e.target as HTMLDetailsElement).open)}>
                                <summary className="p-3 cursor-pointer font-semibold text-sm list-none flex justify-between items-center">ورود هوشمند<Wand2 size={16} className="text-indigo-400" /></summary>
                                <div className="p-3 border-t dark:border-gray-600 space-y-3">
                                    <p className="text-xs text-gray-500">با تعیین ریسک به ریوارد، حجم و حد سود شما بر اساس تنظیمات ریسک‌تان محاسبه می‌شود.</p>
                                    <div><label className="text-xs">ریسک به ریوارد (R/R)</label><input type="number" step="0.1" min="0" value={formData.riskRewardRatio || ''} onChange={e => handleInputChange('riskRewardRatio', parseFloat(e.target.value))} className="w-full p-2 border rounded mt-1 dark:bg-gray-700 dark:border-gray-600" /></div>
                                    <button type="button" onClick={applySmartEntry} className="w-full text-sm bg-indigo-500 text-white py-2 rounded-md hover:bg-indigo-600">اعمال محاسبه</button>
                                </div>
                            </details>

                            <div className="grid grid-cols-2 gap-4">
                                {isFieldActive('stopLoss') && (<div><label className="text-sm">حد ضرر</label><input type="number" step="any" min="0" placeholder="1.2300" value={formData.stopLoss || ''} onChange={e => handleInputChange('stopLoss', parseFloat(e.target.value))} className="w-full p-2 border rounded mt-1 dark:bg-gray-700 dark:border-gray-600" /></div>)}
                                {isFieldActive('takeProfit') && (<div><label className="text-sm">حد سود</label><input type="number" step="any" min="0" placeholder="1.2500" value={formData.takeProfit || ''} onChange={e => handleInputChange('takeProfit', parseFloat(e.target.value))} className="w-full p-2 border rounded mt-1 dark:bg-gray-700 dark:border-gray-600" /></div>)}
                            </div>

                             {isFieldActive('outcome') && (
                                <div>
                                <label className="text-sm">نتیجه معامله</label>
                                <select value={formData.outcome || ''} onChange={e => handleInputChange('outcome', e.target.value)} className="w-full p-2 border rounded mt-1 dark:bg-gray-700 dark:border-gray-600">
                                    <option value="Take Profit">حد سود</option>
                                    <option value="Stop Loss">حد ضرر</option>
                                    <option value="Manual Exit">خروج دستی</option>
                                </select>
                                {formData.outcome === 'Manual Exit' && (
                                    <input type="number" step="any" min="0" placeholder="قیمت خروج دستی" value={formData.manualExitPrice || ''} onChange={e => handleInputChange('manualExitPrice', parseFloat(e.target.value))} className="w-full p-2 border rounded mt-2 dark:bg-gray-700 dark:border-gray-600" />
                                )}
                            </div>
                             )}
                        </div>

                        {/* Column 2: Analysis & Setup */}
                        <div className="space-y-4">
                            <h3 className="font-bold text-md border-b pb-2 dark:border-gray-600">تحلیل و ستاپ</h3>
                            {isFieldActive('setupId') && (
                                <div>
                                    <label className="text-sm">ستاپ معاملاتی</label>
                                    <select value={formData.setupId || ''} onChange={e => onSetupChange(e.target.value)} className="w-full p-2 border rounded mt-1 dark:bg-gray-700 dark:border-gray-600">
                                        <option value="">انتخاب ستاپ</option>
                                        {setups.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                    </select>
                                </div>
                            )}
                             {isFieldActive('setupId') && formData.setupId && (
                                <div>
                                    <label className="text-sm">امتیاز به ستاپ</label>
                                    <StarRating rating={formData.setupRating || 0} setRating={(r) => handleInputChange('setupRating', r)} />
                                </div>
                            )}
                            
                            {isFieldActive('tags') && (<div><label className="text-sm">تگ‌ها</label><div className="p-2 border rounded mt-1 dark:border-gray-600 flex flex-wrap gap-2">{allTags.map(tag => (<button type="button" key={tag} onClick={() => handleTagClick(tag)} className={`px-2 py-1 text-xs rounded-full ${formData.tags?.includes(tag) ? 'bg-indigo-500 text-white' : 'bg-gray-200 dark:bg-gray-600'}`}>{tag}</button>))}<input ref={tagInputRef} onKeyDown={e => {if (e.key === 'Enter') { e.preventDefault(); handleTagClick(tagInputRef.current!.value); tagInputRef.current!.value = ''; }}} type="text" placeholder="تگ جدید..." className="bg-transparent flex-grow focus:outline-none"/></div></div>)}
                            
                            {isFieldActive('mistakes') && (<div><label className="text-sm">اشتباهات</label><div className="p-2 border rounded mt-1 dark:border-gray-600 flex flex-wrap gap-2">{MISTAKES_LIST.map(mistake => (<button type="button" key={mistake} onClick={() => handleMistakeClick(mistake)} className={`px-2 py-1 text-xs rounded-full ${formData.mistakes?.includes(mistake) ? 'bg-red-500 text-white' : 'bg-gray-200 dark:bg-gray-600'}`}>{mistake}</button>))}</div></div>)}
                           
                            {isFieldActive('imageUrl') && (
                                <div>
                                    <label className="text-sm mb-1 block">تصویر چارت</label>
                                    <div className="relative p-4 border-2 border-dashed rounded-lg text-center dark:border-gray-600">
                                        <input type="file" accept="image/*" onChange={handleImageUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                                        {imagePreview ? (
                                            <>
                                                <img src={imagePreview} alt="Preview" className="mx-auto max-h-32 rounded" />
                                                <button type="button" onClick={() => setImagePreview(null)} className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full"><X size={12} /></button>
                                            </>
                                        ) : ( <div className="text-gray-400"><UploadCloud className="mx-auto h-8 w-8" /><p className="text-xs mt-1">فایل را بکشید یا برای انتخاب کلیک کنید</p></div>)}
                                    </div>
                                </div>
                            )}

                        </div>
                         {/* Column 3: Psychology */}
                        <div className="space-y-4">
                           <details className="border rounded-md dark:border-gray-600" open={isPsychoAnalysisOpen} onToggle={(e) => { const isOpen = (e.target as HTMLDetailsElement).open; setIsPsychoAnalysisOpen(isOpen); try { localStorage.setItem(PSYCHO_ANALYSIS_LS_KEY, isOpen.toString()); } catch (err) {} }}>
                               <summary className="p-3 cursor-pointer font-semibold text-md list-none flex justify-between items-center">
                                   تحلیل روانشناسی
                                   <Brain size={18} className="text-indigo-400" />
                               </summary>
                               <div className="p-3 border-t dark:border-gray-600 space-y-4">
                                   {isFieldActive('psychology.emotionBefore') && (<div><label className="text-sm">احساس قبل از ورود</label><select value={formData.psychology?.emotionBefore || ''} onChange={e => handleInputChange('psychology.emotionBefore', e.target.value)} className="w-full p-2 border rounded mt-1 dark:bg-gray-700 dark:border-gray-600"><option value="">-</option>{psychologyOptions.emotionsBefore.map(e => <option key={e} value={e}>{e}</option>)}</select></div>)}
                                   {isFieldActive('psychology.entryReason') && (<div><label className="text-sm">انگیزه ورود</label><select value={formData.psychology?.entryReason || ''} onChange={e => handleInputChange('psychology.entryReason', e.target.value)} className="w-full p-2 border rounded mt-1 dark:bg-gray-700 dark:border-gray-600"><option value="">-</option>{psychologyOptions.entryReasons.map(e => <option key={e} value={e}>{e}</option>)}</select></div>)}
                                   {isFieldActive('notesBefore') && (<div><label className="text-sm">یادداشت‌های قبل</label><textarea value={formData.notesBefore || ''} onChange={e => handleInputChange('notesBefore', e.target.value)} rows={3} className="w-full p-2 border rounded mt-1 dark:bg-gray-700 dark:border-gray-600"></textarea></div>)}
                                   <hr className="dark:border-gray-600"/>
                                   {isFieldActive('psychology.emotionAfter') && (<div><label className="text-sm">احساس بعد از خروج</label><select value={formData.psychology?.emotionAfter || ''} onChange={e => handleInputChange('psychology.emotionAfter', e.target.value)} className="w-full p-2 border rounded mt-1 dark:bg-gray-700 dark:border-gray-600"><option value="">-</option>{psychologyOptions.emotionsAfter.map(e => <option key={e} value={e}>{e}</option>)}</select></div>)}
                                   {isFieldActive('notesAfter') && (<div><label className="text-sm">یادداشت‌های بعد</label><textarea value={formData.notesAfter || ''} onChange={e => handleInputChange('notesAfter', e.target.value)} rows={3} className="w-full p-2 border rounded mt-1 dark:bg-gray-700 dark:border-gray-600"></textarea></div>)}
                               </div>
                           </details>
                        </div>
                    </div>
                     <div className="flex justify-end gap-3 p-4 border-t dark:border-gray-700 mt-auto bg-gray-50 dark:bg-gray-800/50 sticky bottom-0">
                        <button type="button" onClick={onClose} className="px-4 py-2 rounded bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500">انصراف</button>
                        <button type="submit" className="px-6 py-2 rounded bg-indigo-500 text-white hover:bg-indigo-600 flex items-center gap-2">
                            <Check size={18} />
                            {entry ? 'ذخیره تغییرات' : 'ثبت معامله'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default JournalFormModal;