
import React, { useState } from 'react';
import type { ChecklistItem } from '../../types';

const INITIAL_ITEMS: ChecklistItem[] = [
  { id: '1', text: 'بررسی اخبار High-impact', completed: true },
  { id: '2', text: 'تحلیل تایم‌فریم بالاتر', completed: true },
  { id: '3', text: 'تعیین حد ضرر', completed: false },
  { id: '4', text: 'نسبت R/R بزرگتر از 1.5', completed: false },
  { id: '5', text: 'حجم مطابق با مدیریت ریسک', completed: false },
];

const TradingChecklistWidget: React.FC = () => {
  const [items, setItems] = useState(INITIAL_ITEMS);

  const toggleItem = (id: string) => {
    setItems(items.map(item => item.id === id ? { ...item, completed: !item.completed } : item));
  };
  
  const completionPercentage = (items.filter(i => i.completed).length / items.length) * 100;

  return (
    <div className="space-y-3">
       <div className="w-full bg-gray-200 rounded-full h-1.5 dark:bg-gray-700">
            <div className="bg-indigo-500 h-1.5 rounded-full" style={{ width: `${completionPercentage}%` }}></div>
        </div>
      {items.map(item => (
        <div key={item.id} className="flex items-center gap-3 text-sm cursor-pointer" onClick={() => toggleItem(item.id)}>
          <input
            type="checkbox"
            checked={item.completed}
            readOnly
            className="w-4 h-4 text-indigo-600 bg-gray-100 border-gray-300 rounded focus:ring-indigo-500 dark:focus:ring-indigo-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
          />
          <span className={`${item.completed ? 'line-through text-gray-500' : ''}`}>
            {item.text}
          </span>
        </div>
      ))}
    </div>
  );
};

export default TradingChecklistWidget;
