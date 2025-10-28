import React, { useState, useMemo, useCallback, useEffect, lazy, Suspense } from 'react';
import type { Theme, PriceAlert, NewsAlert, NotificationSettings, JournalEntry } from './types';
import { ThemeContext } from './contexts/ThemeContext';
import { NotificationProvider, useNotification } from './contexts/NotificationContext';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import { RefreshCw } from 'lucide-react';
import { getAlerts, updateAlertStatus } from './db';
import FloatingActionButton from './components/FloatingActionButton';

const Dashboard = lazy(() => import('./components/Dashboard'));
const JournalPage = lazy(() => import('./components/JournalPage'));
const CalendarPage = lazy(() => import('./components/CalendarPage'));
const SettingsPage = lazy(() => import('./components/SettingsPage'));
const PerformanceAnalyticsPage = lazy(() => import('./components/PerformanceAnalyticsPage'));
const ReportsPage = lazy(() => import('./components/ReportsPage'));
const JournalFormModal = lazy(() => import('./components/journal/JournalFormModal'));


const pages: { [key: string]: React.LazyExoticComponent<React.FC<any>> } = {
  '/': Dashboard,
  '/journal': JournalPage,
  '/calendar': CalendarPage,
  '/settings': SettingsPage,
  '/performance': PerformanceAnalyticsPage,
  '/reports': ReportsPage,
};

const PAGE_TITLES: { [key: string]: string } = {
    '/': 'داشبورد',
    '/journal': 'ژورنال معاملاتی',
    '/calendar': 'تقویم اقتصادی',
    '/settings': 'تنظیمات',
    '/performance': 'تحلیل عملکرد',
    '/reports': 'گزارش‌ها',
};


const AppContent: React.FC = () => {
  const [currentPage, setCurrentPage] = useState(window.location.hash.substring(1) || '/');
  const { addNotification } = useNotification();
  const [isJournalModalOpen, setIsJournalModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<JournalEntry | null>(null);

  const handleOpenJournalModal = useCallback((entry: JournalEntry | null) => {
      setEditingEntry(entry);
      setIsJournalModalOpen(true);
  }, []);

  const handleCloseJournalModal = useCallback(() => {
      setIsJournalModalOpen(false);
      setEditingEntry(null);
  }, []);
  
  const handleSaveJournal = useCallback(() => {
      handleCloseJournalModal();
  }, [handleCloseJournalModal]);


  useEffect(() => {
    const handleHashChange = () => {
      setCurrentPage(window.location.hash.substring(1) || '/');
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  useEffect(() => {
        const checkAlerts = async () => {
            let settings: NotificationSettings;
            try {
                settings = JSON.parse(localStorage.getItem('notification-settings') || 'null') || { globalEnable: true, newsAlerts: true };
            } catch (e) {
                settings = { globalEnable: true, newsAlerts: true };
            }

            if (!settings.globalEnable) {
                return;
            }
            
            const activeAlerts = await getAlerts('active');
            const now = new Date();

            for (const alert of activeAlerts) {
                if (alert.type === 'news' && settings.newsAlerts) {
                    const newsAlert = alert as NewsAlert;
                    const eventTime = new Date(newsAlert.eventTime);
                    const diffMinutes = (eventTime.getTime() - now.getTime()) / (1000 * 60);

                    if (diffMinutes > 0 && diffMinutes <= newsAlert.triggerBeforeMinutes) {
                        addNotification(`رویداد: ${newsAlert.newsTitle} تا ${Math.ceil(diffMinutes)} دقیقه دیگر.`, 'info');
                        await updateAlertStatus(alert.id, 'triggered');
                    }
                }
            }
        };

        const interval = setInterval(checkAlerts, 5000); // Check every 5 seconds
        return () => clearInterval(interval);
    }, [addNotification]);


  const CurrentPageComponent = pages[currentPage] || pages['/'];
  const pageTitle = PAGE_TITLES[currentPage] || 'داشبورد';

  const pageProps: { onOpenModal?: (entry: JournalEntry | null) => void } = {};
  if (currentPage === '/' || currentPage === '/journal') {
      pageProps.onOpenModal = handleOpenJournalModal;
  }

  return (
    <>
      <Sidebar currentPage={currentPage} />
      <div className="flex flex-col flex-1 overflow-hidden">
          <Header title={pageTitle} />
          <main className="flex-1 min-w-0 overflow-y-auto">
            <Suspense fallback={
              <div className="w-full h-full flex items-center justify-center">
                <RefreshCw className="w-10 h-10 animate-spin text-indigo-500" />
              </div>
            }>
              <CurrentPageComponent {...pageProps} />
            </Suspense>
          </main>
      </div>
       <FloatingActionButton onClick={() => handleOpenJournalModal(null)} />
        {isJournalModalOpen && (
            <Suspense fallback={null}>
                <JournalFormModal
                    key={editingEntry?.id || 'new-fab'}
                    onClose={handleCloseJournalModal}
                    onSave={handleSaveJournal}
                    entry={editingEntry}
                />
            </Suspense>
        )}
    </>
  );
};


const App: React.FC = () => {
  const [theme, setTheme] = useState<Theme>('dark');
  
  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem('dashboard-theme') as Theme | null;
      if (savedTheme) {
        setTheme(savedTheme);
      }
    } catch (error) {
      console.error("Could not access localStorage to get theme:", error);
    }
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

  return (
    <ThemeContext.Provider value={themeContextValue}>
      <NotificationProvider>
          <div className={`flex h-screen overflow-hidden transition-colors duration-300 text-gray-800 dark:text-gray-200`}>
              <AppContent />
          </div>
      </NotificationProvider>
    </ThemeContext.Provider>
  );
};

export default App;