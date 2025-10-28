import React from 'react';
import { Plus } from 'lucide-react';

interface FloatingActionButtonProps {
  onClick: () => void;
}

const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({ onClick }) => {
  return (
    <button
      onClick={onClick}
      title="ثبت سریع معامله"
      aria-label="ثبت سریع معامله جدید"
      className="fixed bottom-8 left-8 z-40 flex h-16 w-16 items-center justify-center rounded-full bg-indigo-600 text-white shadow-lg transition-transform duration-300 hover:scale-110 hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-300 dark:focus:ring-indigo-800"
    >
      <Plus className="h-8 w-8" />
    </button>
  );
};

export default FloatingActionButton;
