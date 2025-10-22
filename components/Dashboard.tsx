import React, { useState, useEffect, Suspense } from 'react';
import { Responsive, WidthProvider } from 'react-grid-layout';
import type { Layout, Layouts } from 'react-grid-layout';
import { openDB } from 'idb';
import type { StoredLayouts, WidgetVisibility } from '../types';
import Card from './shared/Card';
import { initialLayouts, WIDGETS, WIDGET_DEFINITIONS } from '../constants';
import { RefreshCw, RefreshCcw } from 'lucide-react';

const ResponsiveGridLayout = WidthProvider(Responsive);

const STORAGE_KEY_WIDGET_VISIBILITY = 'dashboard-widget-visibility';

let dbPromise: ReturnType<typeof openDB> | null = null;
const getLayoutDb = () => {
    if (!dbPromise) {
        dbPromise = openDB('dashboard-db', 1, {
            upgrade(db) {
                if (!db.objectStoreNames.contains('layouts')) {
                    db.createObjectStore('layouts');
                }
            },
        });
    }
    return dbPromise;
};

const Dashboard: React.FC = () => {
  const [layouts, setLayouts] = useState<Layouts>(initialLayouts);
  const [isClient, setIsClient] = useState(false);
  const [visibleWidgetKeys, setVisibleWidgetKeys] = useState<string[]>(Object.keys(WIDGETS));

  const updateVisibleWidgets = () => {
    try {
        const savedVisibility = localStorage.getItem(STORAGE_KEY_WIDGET_VISIBILITY);
        if (savedVisibility) {
            const visibilitySettings: WidgetVisibility = JSON.parse(savedVisibility);
            const visibleKeys = Object.keys(WIDGETS).filter(key => visibilitySettings[key] !== false); // Default to true if not specified
            setVisibleWidgetKeys(visibleKeys);
        } else {
            // If no settings, all are visible by default
            setVisibleWidgetKeys(Object.keys(WIDGETS));
        }
    } catch (error) {
        console.error("Failed to load widget visibility, showing all.", error);
        setVisibleWidgetKeys(Object.keys(WIDGETS));
    }
  };


  useEffect(() => {
    setIsClient(true);
    
    updateVisibleWidgets(); // Initial load

    const loadLayout = async () => {
      try {
        const db = await getLayoutDb();
        const savedLayouts = await db.get('layouts', 'userLayout');
        if (savedLayouts) {
          setLayouts(savedLayouts);
        }
      } catch (error) {
        console.error("Failed to load layout from IndexedDB", error);
        setLayouts(initialLayouts);
      }
    };
    loadLayout();

    // Listen for changes from the settings page
    const handleStorageChange = (event: StorageEvent) => {
        if (event.key === STORAGE_KEY_WIDGET_VISIBILITY) {
            updateVisibleWidgets();
        }
    };
    window.addEventListener('storage', handleStorageChange);

    return () => {
        window.removeEventListener('storage', handleStorageChange);
    };

  }, []);

  const handleLayoutChange = (layout: Layout[], allLayouts: Layouts) => {
    setLayouts(allLayouts);
    saveLayout(allLayouts as StoredLayouts);
  };

  const saveLayout = async (layoutsToSave: StoredLayouts) => {
    try {
      const db = await getLayoutDb();
      await db.put('layouts', layoutsToSave, 'userLayout');
    } catch (error) {
      console.error("Failed to save layout to IndexedDB", error);
    }
  };

  const resetLayout = () => {
    setLayouts(initialLayouts);
    saveLayout(initialLayouts as StoredLayouts);
  };

  if (!isClient) {
    return null; 
  }

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold">داشبورد</h1>
          <button
              onClick={resetLayout}
              className="flex items-center gap-2 text-sm px-3 py-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              title="بازنشانی چیدمان"
            >
              <RefreshCcw className="w-4 h-4" />
              <span>بازنشانی چیدمان</span>
        </button>
      </div>
      <ResponsiveGridLayout
        className="layout"
        layouts={layouts}
        breakpoints={{ lg: 1200, md: 996, sm: 768 }}
        cols={{ lg: 12, md: 10, sm: 6 }}
        rowHeight={30}
        onLayoutChange={handleLayoutChange}
        isDraggable={true}
        isResizable={true}
        draggableHandle=".drag-handle"
      >
        {visibleWidgetKeys.map((key) => {
          const WidgetComponent = WIDGETS[key];
          const def = WIDGET_DEFINITIONS[key];
          if (!WidgetComponent || !def) return null;
          return (
            <div key={key}>
              <Card title={def.title} icon={def.icon}>
                 <Suspense fallback={<div className="flex items-center justify-center h-full"><RefreshCw className="animate-spin" /></div>}>
                    <WidgetComponent />
                 </Suspense>
              </Card>
            </div>
          );
        })}
      </ResponsiveGridLayout>
    </div>
  );
};

export default Dashboard;