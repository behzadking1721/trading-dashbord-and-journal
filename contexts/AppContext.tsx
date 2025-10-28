import React, { createContext, useState, useCallback, useMemo, useEffect, ReactNode, useContext } from 'react';
import type { AppMode, AppContextType } from '../types';

const APP_MODE_KEY = 'dashboard-app-mode';

export const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [appMode, setAppMode] = useState<AppMode>('simple');

    useEffect(() => {
        try {
            const savedMode = localStorage.getItem(APP_MODE_KEY) as AppMode | null;
            if (savedMode && (savedMode === 'simple' || savedMode === 'advanced')) {
                setAppMode(savedMode);
            }
        } catch (error) {
            console.error("Could not access localStorage to get app mode:", error);
        }
    }, []);

    const handleSetAppMode = useCallback((mode: AppMode) => {
        setAppMode(mode);
        try {
            localStorage.setItem(APP_MODE_KEY, mode);
        } catch (error) {
            console.error("Could not access localStorage to set app mode:", error);
        }
    }, []);

    const value = useMemo(() => ({ appMode, setAppMode: handleSetAppMode }), [appMode, handleSetAppMode]);

    return (
        <AppContext.Provider value={value}>
            {children}
        </AppContext.Provider>
    );
};

export const useAppContext = () => {
    const context = useContext(AppContext);
    if (context === undefined) {
        throw new Error('useAppContext must be used within an AppProvider');
    }
    return context;
};
