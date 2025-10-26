import React from 'react';

interface CardProps {
  title: string;
  children: React.ReactNode;
  icon?: React.ElementType;
}

const Card: React.FC<CardProps> = ({ title, children, icon: Icon }) => {
  return (
    <div className="w-full h-full flex flex-col rounded-2xl shadow-lg bg-white/30 dark:bg-slate-800/40 glass-card transition-colors duration-300 overflow-hidden border border-white/20 dark:border-slate-700/60">
      <div className="card-drag-handle flex items-center justify-between p-4 border-b border-gray-200/40 dark:border-slate-700/60 cursor-move">
        <div className="flex items-center gap-3">
            {Icon && <Icon className="w-5 h-5 text-gray-700 dark:text-gray-300" />}
            <h2 className="font-bold text-base text-gray-900 dark:text-gray-100">{title}</h2>
        </div>
      </div>
      <div className="p-4 flex-grow overflow-auto">
        {children}
      </div>
    </div>
  );
};

export default Card;