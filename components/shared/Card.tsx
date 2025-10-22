import React from 'react';

interface CardProps {
  title: string;
  children: React.ReactNode;
  icon?: React.ElementType;
}

const Card: React.FC<CardProps> = ({ title, children, icon: Icon }) => {
  return (
    <div className="w-full h-full flex flex-col rounded-lg shadow-md bg-white dark:bg-gray-800 glass-card transition-colors duration-300 overflow-hidden">
      <div className="flex items-center justify-between p-3 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
            {Icon && <Icon className="w-4 h-4 text-gray-500 dark:text-gray-400" />}
            <h2 className="font-semibold text-sm">{title}</h2>
        </div>
      </div>
      <div className="p-4 flex-grow overflow-auto">
        {children}
      </div>
    </div>
  );
};

export default Card;