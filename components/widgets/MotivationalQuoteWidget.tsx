
import React from 'react';
import { Quote } from 'lucide-react';

const MotivationalQuoteWidget: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center">
      <Quote className="w-8 h-8 text-indigo-500 mb-4" />
      <p className="text-sm italic">
        "موفقیت مجموعه‌ای از تلاش‌های کوچک است که هر روز و هر روز تکرار می‌شوند."
      </p>
    </div>
  );
};

export default MotivationalQuoteWidget;
