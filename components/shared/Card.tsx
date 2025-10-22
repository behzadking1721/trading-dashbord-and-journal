
import React from 'react';
import { GripVertical } from 'lucide-react';

interface CardProps {
  title: string;
  children: React.ReactNode;
}

const Card: React.FC<CardProps> = ({ title, children }) => {
  return (
    <div className="w-full h-full flex flex-col rounded-lg shadow-md bg-white dark:bg-gray-800 glass-card transition-colors duration-300 overflow-hidden">
      <div className="flex items-center justify-between p-3 border-b border-gray-200 dark:border-gray-700 drag-handle cursor-move">
        <h2 className="font-semibold text-sm">{title}</h2>
        <GripVertical className="w-5 h-5 text-gray-400" />
      </div>
      <div className="p-4 flex-grow overflow-auto">
        {children}
      </div>
    </div>
  );
};

export default Card;
