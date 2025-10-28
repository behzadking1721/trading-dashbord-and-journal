import React from 'react';

interface CardProps {
  title: string;
  children: React.ReactNode;
  icon?: React.ElementType;
}

const Card: React.FC<CardProps> = ({ title, children, icon: Icon }) => {
  return (
    <div className="w-full flex flex-col rounded-xl shadow-lg bg-white/20 dark:bg-slate-800/30 glass-card transition-colors duration-300 overflow-hidden border border-white/30 dark:border-slate-700/50">
      <div className="flex items-center justify-between p-2.5 border-b border-black/10 dark:border-white/10">
        <div className="flex items-center gap-2">
            {Icon && <Icon className="w-3.5 h-3.5 text-gray-700 dark:text-gray-300" />}
            <h2 className="font-bold text-xs text-gray-900 dark:text-gray-100">{title}</h2>
        </div>
      </div>
      <div className="p-2.5 flex-grow overflow-auto">
        {children}
      </div>
    </div>
  );
};

export default Card;