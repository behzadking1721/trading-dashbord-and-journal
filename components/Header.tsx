import React, { useState, useEffect, Suspense, lazy } from 'react';
import { Clock, Bell, Sun, Moon, Sparkles } from 'lucide-react';
import type { Theme } from '../types';
import { useAppContext } from '../contexts/AppContext';

const AlertsManager = lazy(() => import('./AlertsManager'));

interface HeaderProps {
    title: string;
}

const ThemeIcon: React.FC<{ theme: Theme }> = ({ theme }) => {
    switch (theme) {
        case 'light': return <Sun className="w-5 h-5 text-yellow-500" />;
        case 'dark': return <Moon className="w-5 h-5 text-blue-300" />;
        case 'glass': return <Sparkles className="w-5 h-5 text-purple-400" />;
        default: return null;
    }
};

const Header: React.FC<HeaderProps> = ({ title }) => {
    const [isAlertsModalOpen, setIsAlertsModalOpen] = useState(false);
    const [time, setTime] = useState(new Date());
    const { theme, toggleTheme } = useAppContext();

    useEffect(() => {
        const timerId = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(timerId);
    }, []);

    return (
        <>
            <header className="flex-shrink-0 flex justify-between items-center gap-4 p-4 sm:p-6 border-b border-black/10 dark:border-white/10 bg-white/20 dark:bg-slate-900/40 backdrop-blur-lg">
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold">{title}</h1>
                </div>
                <div className="flex items-center gap-2 sm:gap-4">
                    <div className="hidden sm:flex items-center gap-3 p-2 pr-4 rounded-lg bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm border border-gray-200/50 dark:border-slate-700/50">
                         <div className="text-right">
                            <p className="font-semibold text-xs">{time.toLocaleDateString('fa-IR-u-nu-latn', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
                            <p className="text-lg font-mono tracking-wider">{time.toLocaleTimeString('fa-IR-u-nu-latn', { timeZone: 'Asia/Tehran' })}</p>
                        </div>
                         <Clock className="w-8 h-8 text-indigo-500" />
                    </div>
                     <button 
                        onClick={() => setIsAlertsModalOpen(true)} 
                        className="p-3 sm:p-4 rounded-lg bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm border border-gray-200/50 dark:border-slate-700/50 hover:bg-gray-200/50 dark:hover:bg-slate-700/50" 
                        title="هشدارها"
                     >
                        <Bell className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-500"/>
                    </button>
                    <button
                      onClick={toggleTheme}
                      className="p-3 sm:p-4 rounded-lg bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm border border-gray-200/50 dark:border-slate-700/50 hover:bg-gray-200/50 dark:hover:bg-slate-700/50"
                      title="تغییر تم"
                    >
                      <ThemeIcon theme={theme} />
                    </button>
                </div>
            </header>
             <Suspense fallback={null}>
              {isAlertsModalOpen && <AlertsManager isOpen={isAlertsModalOpen} onClose={() => setIsAlertsModalOpen(false)} />}
            </Suspense>
        </>
    );
};

export default Header;