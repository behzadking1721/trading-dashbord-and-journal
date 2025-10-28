import React, { useState } from 'react';
import { Plus, Trash2, X } from 'lucide-react';
import type { TradingSetup } from '../../types';

const MISTAKES_LIST = ['نادیده گرفتن چک‌لیست', 'ورود بدون ستاپ', 'جابجا کردن حد ضرر', 'ریسک بیش از حد', 'خروج زودهنگام (ترس)', 'خروج دیرهنگام (طمع)'];

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
                <div className="flex justify-between items-center p-4 border-b dark:border-gray-700"><h2 className="text-xl font-bold">{setup.id.startsWith('new') ? 'ستاپ معاملاتی جدید' : 'ویرایش ستاپ معاملاتی'}</h2><button onClick={onClose} className="p-1 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"><X/></button></div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
                    <input type="text" placeholder="نام ستاپ" required value={currentSetup.name} onChange={e => setCurrentSetup({...currentSetup, name: e.target.value})} className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600" />
                    <textarea placeholder="توضیحات" value={currentSetup.description} onChange={e => setCurrentSetup({...currentSetup, description: e.target.value})} className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600" rows={2}></textarea>
                    
                    <details className="border rounded-md dark:border-gray-600">
                        <summary className="p-4 cursor-pointer font-semibold text-md list-none">
                            مقادیر پیش‌فرض (اختیاری)
                        </summary>
                        <div className="p-4 border-t dark:border-gray-600 space-y-4">
                            <input type="number" step="0.1" placeholder="نسبت ریسک به ریوارد پیش‌فرض" value={currentSetup.defaultRiskRewardRatio === undefined ? '' : currentSetup.defaultRiskRewardRatio} onChange={e => setCurrentSetup({...currentSetup, defaultRiskRewardRatio: e.target.value ? parseFloat(e.target.value) : undefined})} className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600" />
                            <div>
                                <label className="block text-sm font-medium mb-1">تگ‌های پیش‌فرض</label>
                                <div className="flex flex-wrap items-center gap-2 p-2 border rounded dark:bg-gray-700 dark:border-gray-600">{currentSetup.defaultTags?.map(tag => (<div key={tag} className="flex items-center gap-1 bg-indigo-500 text-white text-xs px-2 py-1 rounded-full">{tag}<button type="button" onClick={() => handleRemoveTag(tag)}><X size={14} /></button></div>))}<input type="text" value={tagInput} onChange={e => setTagInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddTag())} placeholder="افزودن تگ..." className="bg-transparent focus:outline-none flex-grow" /></div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">اشتباهات رایج پیش‌فرض</label>
                                <div className="flex flex-wrap gap-2">{MISTAKES_LIST.map(mistake => (<button key={mistake} type="button" onClick={() => handleMultiSelect('defaultMistakes', mistake)} className={`px-3 py-1.5 text-xs rounded-full border transition-colors ${currentSetup.defaultMistakes?.includes(mistake) ? 'bg-red-500 border-red-500 text-white' : 'bg-gray-200 dark:bg-gray-700'}`}>{mistake}</button>))}</div>
                            </div>
                        </div>
                    </details>
                    
                    <details className="border rounded-md dark:border-gray-600">
                        <summary className="p-4 cursor-pointer font-semibold text-md list-none">
                           چک‌لیست
                        </summary>
                         <div className="p-4 border-t dark:border-gray-600 space-y-3">
                            <div className="space-y-2 max-h-48 overflow-y-auto pr-2">{currentSetup.checklist.map(item => (<div key={item.id} className="flex items-center justify-between text-sm bg-gray-100 dark:bg-gray-700/50 p-2 rounded"><span>{item.text}</span><button type="button" onClick={() => handleDeleteItem(item.id)} className="p-1 text-red-500 opacity-50 hover:opacity-100"><Trash2 size={14} /></button></div>))}</div>
                            <div className="flex gap-2"><input type="text" value={newItemText} onChange={e => setNewItemText(e.target.value)} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddItem())} placeholder="آیتم جدید چک‌لیست" className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600" /><button type="button" onClick={handleAddItem} className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">افزودن</button></div>
                        </div>
                    </details>

                    <div className="flex justify-end gap-3 pt-4 border-t dark:border-gray-700 mt-auto"><button type="button" onClick={onClose} className="px-4 py-2 rounded bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500">انصراف</button><button type="submit" className="px-4 py-2 rounded bg-indigo-500 text-white hover:bg-indigo-600">ذخیره ستاپ</button></div>
                 </form>
            </div>
        </div>
    );
};

export default SetupFormModal;
