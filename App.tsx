import React, { useState, useMemo, useCallback, useEffect, lazy, Suspense } from 'react';
import type { Theme } from './types';
import { ThemeContext } from './contexts/ThemeContext';
import Sidebar from './components/Sidebar';
import { RefreshCw } from 'lucide-react';

const Dashboard = lazy(() => import('./components/Dashboard'));
const JournalPage = lazy(() => import('./components/JournalPage'));
const CalendarPage = lazy(() => import('./components/CalendarPage'));
const SettingsPage = lazy(() => import('./components/SettingsPage'));


const pages: { [key: string]: React.LazyExoticComponent<React.FC<any>> } = {
  '/': Dashboard,
  '/journal': JournalPage,
  '/calendar': CalendarPage,
  '/settings': SettingsPage,
};

const App: React.FC = () => {
  const [theme, setTheme] = useState<Theme>('dark');
  const [currentPage, setCurrentPage] = useState(window.location.hash.substring(1) || '/');

  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem('dashboard-theme') as Theme | null;
      if (savedTheme) {
        setTheme(savedTheme);
      }
    } catch (error) {
      console.error("Could not access localStorage to get theme:", error);
    }

    const handleHashChange = () => {
      setCurrentPage(window.location.hash.substring(1) || '/');
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);
  
  const toggleTheme = useCallback(() => {
    setTheme(prevTheme => {
        const themes: Theme[] = ['light', 'dark', 'glass'];
        const currentIndex = themes.indexOf(prevTheme);
        const nextTheme = themes[(currentIndex + 1) % themes.length];
        try {
          localStorage.setItem('dashboard-theme', nextTheme);
        } catch (error) {
          console.error("Could not access localStorage to set theme:", error);
        }
        return nextTheme;
    });
  }, []);

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

  const themeContextValue = useMemo(() => ({ theme, toggleTheme }), [theme, toggleTheme]);
  const CurrentPageComponent = pages[currentPage] || pages['/'];

  return (
    <ThemeContext.Provider value={themeContextValue}>
      <div className={`flex min-h-screen transition-colors duration-300 bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200`}>
        <Sidebar currentPage={currentPage} />
        <main className="flex-grow">
          <Suspense fallback={
            <div className="w-full h-screen flex items-center justify-center">
              <RefreshCw className="w-10 h-10 animate-spin text-indigo-500" />
            </div>
          }>
            <CurrentPageComponent />
          </Suspense>
        </main>
      </div>
    </ThemeContext.Provider>
  );
};

export default App;