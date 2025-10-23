import React, { useState, useCallback } from 'react';
import { RefreshCw } from 'lucide-react';
import { GHAZALS } from '../../data/hafez';

const HafezFortuneWidget: React.FC = () => {
    const [fortune, setFortune] = useState(() => GHAZALS[Math.floor(Math.random() * GHAZALS.length)]);

    const getNewFortune = useCallback(() => {
        let newFortune;
        // Ensure the new fortune is different from the current one, if possible
        if (GHAZALS.length > 1) {
            do {
                const randomIndex = Math.floor(Math.random() * GHAZALS.length);
                newFortune = GHAZALS[randomIndex];
            } while (newFortune === fortune);
        } else {
            newFortune = GHAZALS[0];
        }
        setFortune(newFortune);
    }, [fortune]);

    return (
        <div className="space-y-3">
             <div className="p-3 bg-gray-100 dark:bg-gray-700/50 rounded-lg">
                <p className="text-sm whitespace-pre-wrap leading-relaxed text-center font-serif">{fortune.poem}</p>
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
                <strong className="font-semibold">تعبیر:</strong> {fortune.interpretation}
            </div>
            <button
                onClick={getNewFortune}
                className="w-full flex items-center justify-center gap-2 text-xs py-1.5 text-indigo-500 hover:bg-indigo-100 dark:hover:bg-gray-700 rounded-md"
            >
                <RefreshCw size={12} />
                فال جدید
            </button>
        </div>
    );
};

export default HafezFortuneWidget;