import React, { createContext, useState, useCallback, useContext } from 'react';
import { AlertCircle, CheckCircle, Info } from 'lucide-react';

interface NotificationMessage {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
}

interface NotificationContextType {
  addNotification: (message: string, type: NotificationMessage['type']) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

const NotificationToast: React.FC<NotificationMessage & { onDismiss: (id: number) => void }> = ({ id, message, type, onDismiss }) => {
  const baseClasses = "max-w-sm w-full bg-white dark:bg-gray-800 shadow-lg rounded-lg pointer-events-auto ring-1 ring-black ring-opacity-5 overflow-hidden animate-fade-in-right";
  
  const typeInfo = {
    info: { color: 'border-blue-500', icon: <Info className="text-blue-500" /> },
    success: { color: 'border-green-500', icon: <CheckCircle className="text-green-500" /> },
    error: { color: 'border-red-500', icon: <AlertCircle className="text-red-500" /> },
  };

  return (
    <div className={`${baseClasses} border-l-4 ${typeInfo[type].color}`} onClick={() => onDismiss(id)}>
      <div className="p-4 flex items-center gap-3">
        <div className="flex-shrink-0">{typeInfo[type].icon}</div>
        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{message}</p>
      </div>
    </div>
  );
};

const NotificationContainer: React.FC<{ 
    notifications: NotificationMessage[];
    onDismiss: (id: number) => void;
}> = ({ notifications, onDismiss }) => {
  return (
    <div className="fixed top-6 right-6 z-[100] space-y-3">
      {notifications.map(notif => (
        <NotificationToast key={notif.id} {...notif} onDismiss={onDismiss} />
      ))}
    </div>
  );
};

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<NotificationMessage[]>([]);

  const removeNotification = useCallback((id: number) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const addNotification = useCallback((message: string, type: NotificationMessage['type'] = 'info') => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      removeNotification(id);
    }, 5000);
  }, [removeNotification]);

  return (
    <NotificationContext.Provider value={{ addNotification }}>
      {children}
      <NotificationContainer notifications={notifications} onDismiss={removeNotification} />
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};
