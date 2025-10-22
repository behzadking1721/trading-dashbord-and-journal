
import React from 'react';
import { HardDrive, Database, Upload, Download } from 'lucide-react';

const SystemStatusWidget: React.FC = () => {
  return (
    <div className="space-y-4 text-xs">
      <div className="flex items-center gap-2">
        <Database size={16} className="text-green-500" />
        <span>وضعیت IndexedDB:</span>
        <span className="font-semibold">متصل</span>
      </div>
      <div className="flex items-center gap-2">
        <HardDrive size={16} className="text-blue-500" />
        <span>فضای استفاده شده:</span>
        <span className="font-semibold">2.4 MB</span>
      </div>
      <div className="flex justify-around mt-4">
        <button className="flex items-center gap-1 p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700">
            <Download size={14} /> خروجی
        </button>
        <button className="flex items-center gap-1 p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700">
            <Upload size={14} /> ورودی
        </button>
      </div>
    </div>
  );
};

export default SystemStatusWidget;
