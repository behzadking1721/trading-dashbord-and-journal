import React, { useState, useEffect } from 'react';
import { Sun, Cloud, CloudRain, CloudSnow, RefreshCw, MapPin, AlertCircle } from 'lucide-react';

const MOCK_WEATHER_DATA = {
    'Tehran': { temp: 32, condition: 'آفتابی', icon: Sun },
    'London': { temp: 18, condition: 'ابری', icon: Cloud },
    'New York': { temp: 25, condition: 'بارانی', icon: CloudRain },
    'Tokyo': { temp: 28, condition: 'آفتابی', icon: Sun },
    'Default': { temp: 22, condition: 'کمی ابری', icon: Sun }
};
const MOCK_CITIES = Object.keys(MOCK_WEATHER_DATA).filter(c => c !== 'Default');

interface WeatherState {
    city: string;
    temp: number;
    condition: string;
    icon: React.ElementType;
}

const WeatherWidget: React.FC = () => {
    const [weather, setWeather] = useState<WeatherState | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchWeather = () => {
        setLoading(true);
        setError(null);
        navigator.geolocation.getCurrentPosition(
            (position) => {
                // In a real app, you would use position.coords.latitude and position.coords.longitude
                // to call a weather API. Here, we'll just pick a random mock city.
                const randomCity = MOCK_CITIES[Math.floor(Math.random() * MOCK_CITIES.length)];
                const data = MOCK_WEATHER_DATA[randomCity as keyof typeof MOCK_WEATHER_DATA];
                setWeather({
                    city: randomCity,
                    ...data
                });
                setLoading(false);
            },
            (err) => {
                setError('امکان دسترسی به موقعیت مکانی وجود ندارد. لطفاً دسترسی را فعال کنید.');
                // Fallback to default mock data
                setWeather({
                    city: 'پیش‌فرض',
                    ...MOCK_WEATHER_DATA['Default']
                });
                setLoading(false);
            },
            { timeout: 10000 }
        );
    };

    useEffect(() => {
        fetchWeather();
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-24">
                <RefreshCw className="w-6 h-6 animate-spin text-gray-500" />
            </div>
        );
    }
    
     if (error && !weather) {
        return (
            <div className="flex flex-col items-center justify-center h-24 text-center">
                 <AlertCircle className="w-6 h-6 text-red-500 mb-2" />
                <p className="text-sm text-red-500">{error}</p>
                 <button onClick={fetchWeather} className="mt-2 text-xs text-indigo-500 hover:underline">تلاش مجدد</button>
            </div>
        );
    }

    if (!weather) {
        return null;
    }

    const Icon = weather.icon;

    return (
        <div className="flex justify-between items-center">
            <div>
                <div className="flex items-center gap-2">
                    <MapPin size={16} className="text-gray-500" />
                    <p className="font-semibold">{weather.city}</p>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400">{weather.condition}</p>
            </div>
            <div className="flex items-center gap-2">
                <p className="text-3xl font-bold font-mono">{weather.temp}°</p>
                <Icon size={32} className="text-yellow-500" />
            </div>
        </div>
    );
};

export default WeatherWidget;
