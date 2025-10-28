import React from 'react';

interface CardProps {
  title: string;
  children: React.ReactNode;
  icon?: React.ElementType;
}

const Card: React.FC<CardProps> = ({ title, children, icon: Icon }) => {
  return (
    <div className="w-full flex flex-col rounded-xl shadow-xl bg-white/50 dark:bg-slate-800/60 glass-card transition-colors duration-300 overflow-hidden border border-white/30 dark:border-slate-700/50 relative">
      {/* Colored top bar */}
      <div className="absolute top-0 left-0 right-0 h-1.5 bg-indigo-500"></div>

      {/* Header */}
      <div className="flex items-center justify-between pt-4 pb-2 px-4 bg-white/10 dark:bg-black/10">
        <div className="flex items-center gap-2.5">
            {Icon && <Icon className="w-4 h-4 text-indigo-500" />}
            <h2 className="font-bold text-sm text-gray-900 dark:text-gray-100">{title}</h2>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 pt-3 flex-grow overflow-auto">
        {children}
      </div>
    </div>
  );
};

export default Card;