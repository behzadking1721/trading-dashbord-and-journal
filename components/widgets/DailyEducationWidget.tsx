
import React from 'react';
import { Lightbulb } from 'lucide-react';

const DailyEducationWidget: React.FC = () => {
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 mb-2">
        <Lightbulb size={18} className="text-yellow-400" />
        <h4 className="font-semibold text-sm">نکته معاملاتی روز</h4>
      </div>
      <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
        هرگز بیش از آنچه آماده از دست دادن آن هستید، ریسک نکنید. مدیریت سرمایه کلید بقا و موفقیت بلندمدت در بازارهای مالی است. همیشه قبل از ورود به معامله، حد ضرر خود را مشخص کنید.
      </p>
    </div>
  );
};

export default DailyEducationWidget;
