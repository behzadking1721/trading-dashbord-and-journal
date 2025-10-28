import React, { createContext, useState, useCallback, useMemo, useEffect, ReactNode, useContext } from 'react';
import type { AppMode, AppContextType, Theme, AccentColor } from '../types';

const APP_MODE_KEY = 'dashboard-app-mode';
const THEME_KEY = 'dashboard-theme';
const ACCENT_COLOR_KEY = 'dashboard-accent-color';

const ACCENT_COLORS: Record<AccentColor, Record<number, string>> = {
  indigo: { 300: '#a5b4fc', 400: '#818cf8', 500: '#6366f1', 600: '#4f46e5', 700: '#4338ca', 800: '#3730a3' },
  blue: { 300: '#93c5fd', 400: '#60a5fa', 500: '#3b82f6', 600: '#2563eb', 700: '#1d4ed8', 800: '#1e40af' },
  green: { 300: '#86efac', 400: '#4ade80', 500: '#22c55e', 600: '#16a34a', 700: '#15803d', 800: '#166534' },
  red: { 300: '#fca5a5', 400: '#f87171', 500: '#ef4444', 600: '#dc2626', 700: '#b91c1c', 800: '#991b1b' },
  purple: { 300: '#d8b4fe', 400: '#c084fc', 500: '#a855f7', 600: '#9333ea', 700: '#7e22ce', 800: '#6b21a8' },
};

export const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [appMode, setAppMode] = useState<AppMode>('simple');
    const [theme, setTheme] = useState<Theme>('dark');
    const [accentColor, setAccentColor] = useState<AccentColor>('indigo');

    // Load initial settings from localStorage
    useEffect(() => {
        try {
            const savedMode = localStorage.getItem(APP_MODE_KEY) as AppMode | null;
            if (savedMode) setAppMode(savedMode);
            
            const savedTheme = localStorage.getItem(THEME_KEY) as Theme | null;
            if (savedTheme) setTheme(savedTheme);

            const savedAccent = localStorage.getItem(ACCENT_COLOR_KEY) as AccentColor | null;
            if (savedAccent) setAccentColor(savedAccent);
        } catch (error) {
            console.error("Could not access localStorage to get initial settings:", error);
        }
    }, []);

    const handleSetAppMode = useCallback((mode: AppMode) => {
        setAppMode(mode);
        try {
            localStorage.setItem(APP_MODE_KEY, mode);
        } catch (error) { console.error("Could not save app mode:", error); }
    }, []);

    const toggleTheme = useCallback(() => {
        setTheme(prevTheme => {
            const themes: Theme[] = ['light', 'dark', 'glass'];
            const currentIndex = themes.indexOf(prevTheme);
            const nextTheme = themes[(currentIndex + 1) % themes.length];
            try {
              localStorage.setItem(THEME_KEY, nextTheme);
            } catch (error) { console.error("Could not save theme:", error); }
            return nextTheme;
        });
      }, []);
    
    const handleSetAccentColor = useCallback((color: AccentColor) => {
        setAccentColor(color);
        try {
            localStorage.setItem(ACCENT_COLOR_KEY, color);
        } catch (error) { console.error("Could not save accent color:", error); }
    }, []);


    // Effect to apply theme classes to the root element
    useEffect(() => {
        const root = window.document.documentElement;
        root.classList.remove('light', 'dark', 'glass');
        root.classList.add(theme);
        if(theme === 'dark' || theme === 'glass') {
            root.classList.add('dark');
        } else {
            root.classList.remove('dark');
        }
    }, [theme]);

    // Effect to inject CSS overrides for accent color
    useEffect(() => {
        const styleId = 'dynamic-accent-color-styles';
        let styleElement = document.getElementById(styleId);
        if (!styleElement) {
            styleElement = document.createElement('style');
            styleElement.id = styleId;
            document.head.appendChild(styleElement);
        }
        const colorMap = ACCENT_COLORS[accentColor];
        styleElement.innerHTML = `
            .text-indigo-500 { color: ${colorMap[500]} !important; }
            .bg-indigo-500 { background-color: ${colorMap[500]} !important; }
            .border-indigo-500 { border-color: ${colorMap[500]} !important; }
            .bg-indigo-600 { background-color: ${colorMap[600]} !important; }
            .hover\\:bg-indigo-600:hover { background-color: ${colorMap[600]} !important; }
            .hover\\:bg-indigo-700:hover { background-color: ${colorMap[700]} !important; }
            .focus\\:ring-indigo-300:focus { --tw-ring-color: ${colorMap[300]} !important; }
            .dark .dark\\:focus\\:ring-indigo-800:focus { --tw-ring-color: ${colorMap[800]} !important; }
            .peer-checked\\:bg-indigo-600:checked { background-color: ${colorMap[600]} !important; }
            .text-indigo-400 { color: ${colorMap[400]} !important; }
            .text-indigo-600 { color: ${colorMap[600]} !important; }
            .dark\\:text-indigo-400 { color: ${colorMap[400]} !important; }
        `;
    }, [accentColor]);

    const value = useMemo(() => ({ 
        appMode, 
        setAppMode: handleSetAppMode,
        theme,
        toggleTheme,
        accentColor,
        setAccentColor: handleSetAccentColor
    }), [appMode, handleSetAppMode, theme, toggleTheme, accentColor, handleSetAccentColor]);

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