
import React from 'react';
import { Bell, Clock } from 'lucide-react';

const AlarmsRemindersWidget: React.FC = () => {
    const alarms = [
        { icon: <Bell className="text-red-500" size={16} />, text: "خبر Non-Farm Payrolls", time: "2 ساعت دیگر" },
        { icon: <Clock className="text-blue-500" size={16} />, text: "شروع سشن نیویورک", time: "4 ساعت دیگر" },
        { icon: <Bell className="text-orange-500" size={16} />, text: "سخنرانی رئیس بانک مرکزی اروپا", time: "6 ساعت دیگر" },
    ];
  return (
    <div className="space-y-3">
        {alarms.map((alarm, index) => (
            <div key={index} className="flex items-center gap-3 text-xs">
                {alarm.icon}
                <div className="flex-grow">
                    <p className="font-semibold">{alarm.text}</p>
                    <p className="text-gray-500 dark:text-gray-400">{alarm.time}</p>
                </div>
            </div>
        ))}
    </div>
  );
};

export default AlarmsRemindersWidget;
