import React, { useState, useEffect } from 'react';
import type { TradingSetup } from '../../types';
import { ChevronDown } from 'lucide-react';

const STORAGE_KEY_SETUPS = 'trading-setups';
const STORAGE_KEY_CHECKLIST_STATE = 'trading-checklist-states';

const TradingChecklistWidget: React.FC = () => {
    const [setups, setSetups] = useState<TradingSetup[]>([]);
    const [activeSetup, setActiveSetup] = useState<TradingSetup | null>(null);
    const [checklistStates, setChecklistStates] = useState<{ [key: string]: boolean }>({});

    useEffect(() => {
        const loadData = () => {
             try {
                const savedSetups: TradingSetup[] = JSON.parse(localStorage.getItem(STORAGE_KEY_SETUPS) || '[]');
                setSetups(savedSetups);

                const savedStates = JSON.parse(localStorage.getItem(STORAGE_KEY_CHECKLIST_STATE) || '{}');
                setChecklistStates(savedStates);

                const currentlyActive = savedSetups.find(s => s.isActive) || savedSetups[0] || null;
                setActiveSetup(currentlyActive);
            } catch (error) {
                console.error("Failed to load setups from localStorage", error);
            }
        };

        window.addEventListener('storage', loadData); // Listen for changes from other tabs/windows
        loadData();

        return () => window.removeEventListener('storage', loadData);
    }, []);

    const handleSetupChange = (setupId: string) => {
        const newActiveSetup = setups.find(s => s.id === setupId);
        if (newActiveSetup) {
            setActiveSetup(newActiveSetup);
        }
    };

    const toggleItem = (itemId: string) => {
        if (!activeSetup) return;
        const key = `${activeSetup.id}-${itemId}`;
        const newStates = { ...checklistStates, [key]: !checklistStates[key] };
        setChecklistStates(newStates);
        try {
            localStorage.setItem(STORAGE_KEY_CHECKLIST_STATE, JSON.stringify(newStates));
        } catch (error) {
            console.error("Failed to save checklist state", error);
        }
    };

    const completionPercentage = activeSetup ? (activeSetup.checklist.filter(item => checklistStates[`${activeSetup.id}-${item.id}`]).length / activeSetup.checklist.length) * 100 : 0;

    return (
        <div className="h-full flex flex-col space-y-3">
            {setups.length > 0 && activeSetup ? (
                <>
                    <div className="relative">
                        <select
                            value={activeSetup.id}
                            onChange={(e) => handleSetupChange(e.target.value)}
                            className="w-full appearance-none bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md py-2 px-3 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                            {setups.map(setup => (
                                <option key={setup.id} value={setup.id}>{setup.name}</option>
                            ))}
                        </select>
                        <ChevronDown className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" />
                    </div>
                    
                    <div className="w-full bg-gray-200 rounded-full h-1.5 dark:bg-gray-700">
                        <div className="bg-indigo-500 h-1.5 rounded-full transition-all duration-300" style={{ width: `${completionPercentage}%` }}></div>
                    </div>

                    {activeSetup.checklist.map(item => (
                        <div key={item.id} className="flex items-center gap-3 text-sm cursor-pointer" onClick={() => toggleItem(item.id)}>
                            <input
                                type="checkbox"
                                checked={!!checklistStates[`${activeSetup.id}-${item.id}`]}
                                readOnly
                                className="w-4 h-4 text-indigo-600 bg-gray-100 border-gray-300 rounded focus:ring-indigo-500 dark:focus:ring-indigo-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                            />
                            <span className={`${!!checklistStates[`${activeSetup.id}-${item.id}`] ? 'line-through text-gray-500' : ''}`}>
                                {item.text}
                            </span>
                        </div>
                    ))}
                </>
            ) : (
                <div className="text-center text-gray-500 text-sm p-4 flex-grow flex flex-col justify-center">
                    <p>هیچ ستاپ معاملاتی تعریف نشده است.</p>
                    <a href="#/settings" className="text-indigo-500 hover:underline">برای شروع به صفحه تنظیمات بروید.</a>
                </div>
            )}
        </div>
    );
};

export default TradingChecklistWidget;