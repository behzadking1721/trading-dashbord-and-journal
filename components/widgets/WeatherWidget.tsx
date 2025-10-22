
import React from 'react';
import { Sun } from 'lucide-react';

const WeatherWidget: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center">
      <Sun className="w-16 h-16 text-yellow-400 mb-2" />
      <p className="text-3xl font-bold">28°C</p>
      <p className="text-gray-500 dark:text-gray-400">تهران - آفتابی</p>
    </div>
  );
};

export default WeatherWidget;
