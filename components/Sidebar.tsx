import React, { useContext } from 'react';
import { Home, Book, Calendar, Settings, Sun, Moon, Sparkles, LayoutPanelLeft, BarChart3, FileText } from 'lucide-react';
import { ThemeContext } from '../contexts/ThemeContext';
import type { Theme } from '../types';

interface SidebarProps {
  currentPage: string;
}

const navItems = [
  { href: '/', icon: Home, label: 'داشبورد' },
  { href: '/journal', icon: Book, label: 'ژورنال معاملاتی' },
  { href: '/calendar', icon: Calendar, label: 'تقویم اقتصادی' },
  { href: '/performance', icon: BarChart3, label: 'تحلیل عملکرد' },
  { href: '/reports', icon: FileText, label: 'گزارش‌ها' },
  { href: '/settings', icon: Settings, label: 'تنظیمات' },
];

const ThemeIcon: React.FC<{ theme: Theme }> = ({ theme }) => {
    switch (theme) {
        case 'light': return <Sun className="w-5 h-5 text-yellow-500" />;
        case 'dark': return <Moon className="w-5 h-5 text-blue-300" />;
        case 'glass': return <Sparkles className="w-5 h-5 text-purple-400" />;
        default: return null;
    }
};

const Sidebar: React.FC<SidebarProps> = ({ currentPage }) => {
  const { theme, toggleTheme } = useContext(ThemeContext);

  return (
    <aside className="w-72 flex-shrink-0 bg-white/30 dark:bg-slate-900/50 backdrop-blur-lg border-l border-gray-200/20 dark:border-slate-700/50 flex flex-col p-6 shadow-2xl">
      <div className="flex items-center gap-3 mb-8 px-2">
        <LayoutPanelLeft className="w-7 h-7 text-indigo-500" />
        <h1 className="text-xl font-bold text-gray-800 dark:text-white">ترید ژورنال</h1>
      </div>
      <nav className="flex-grow">
        <ul>
          {navItems.map(item => (
            <li key={item.href}>
              <a
                href={`#${item.href}`}
                className={`flex items-center gap-4 p-4 my-2 rounded-2xl text-sm font-medium transition-colors ${
                  currentPage === item.href
                    ? 'bg-indigo-500 text-white shadow-lg'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-700/50'
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span>{item.label}</span>
              </a>
            </li>
          ))}
        </ul>
      </nav>
      <div className="mt-auto">
        <button
          onClick={toggleTheme}
          className="w-full flex items-center justify-center gap-4 p-4 rounded-2xl hover:bg-gray-200 dark:hover:bg-slate-700/50 transition-colors"
          title="تغییر تم"
        >
          <ThemeIcon theme={theme} />
          <span className="text-sm">تغییر تم</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;