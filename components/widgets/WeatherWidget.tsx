import React, { useState, useEffect, useCallback } from 'react';
import { Thermometer, Wind, Droplets, Compass, RefreshCw, AlertTriangle, BarChart2, Home, MapPin } from 'lucide-react';

// --- INTERFACES & TYPES ---
interface WeatherData {
    city: string;
    temp: number;
    condition: string;
    humidity: number;
    windSpeed: number;
    windDirection: string;
    pressure: number;
}

// --- API & DATA HELPERS ---
const API_CITY = 'تهران'; // Hardcoded for this implementation

// --- ANALYSIS FUNCTIONS ---
const getWeatherAlert = (data: WeatherData): string | null => {
    const conditionLower = data.condition.toLowerCase();
    if (conditionLower.includes('باران') || conditionLower.includes('طوفان') || conditionLower.includes('مه')) {
        return 'شرایط جوی نامساعد ممکن است بر پایداری اینترنت یا برق تأثیر بگذارد. آمادگی لازم را داشته باشید.';
    }
    return null;
};

const getMarketAnalysis = (data: WeatherData): string | null => {
    if (data.temp > 35 || data.temp < -5) {
        return 'دمای شدید می‌تواند باعث نوسان در تقاضای بازارهای انرژی (نفت و گاز) شود.';
    }
    const conditionLower = data.condition.toLowerCase();
     if (conditionLower.includes('طوفان') || conditionLower.includes('یخبندان')) {
        return 'شرایط جوی سخت ممکن است بر زنجیره تأمین کالاهای کشاورزی و انرژی تأثیرگذار باشد.';
    }
    return 'شرایط جوی فعلی تأثیر قابل توجهی بر بازارهای اصلی ندارد.';
};

const getTraderRecommendation = (data: WeatherData): string | null => {
    if (data.temp > 40 || data.temp < 0) {
        return 'دما در محدوده نرمال نیست. برای حفظ تمرکز، کار از خانه و بررسی هشدارهای محلی توصیه می‌شود.';
    }
    if (data.humidity > 85) {
        return 'رطوبت بالا ممکن است بر عملکرد تجهیزات الکترونیکی تأثیر بگذارد. از تهویه مناسب اطمینان حاصل کنید.';
    }
    return null;
};


// --- UI COMPONENTS ---
const SkeletonLoader: React.FC = () => (
    <div className="flex items-center justify-center h-full animate-pulse">
        <div className="w-full space-y-3">
            <div className="flex justify-between items-center">
                <div className="h-5 bg-gray-300 dark:bg-gray-600 rounded w-1/3"></div>
                <div className="h-8 bg-gray-300 dark:bg-gray-600 rounded w-1/4"></div>
            </div>
            <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-full"></div>
            <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-4/5"></div>
        </div>
    </div>
);

const InfoRow: React.FC<{ icon: React.ElementType, label: string, value: React.ReactNode }> = ({ icon: Icon, label, value }) => (
    <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
            <Icon size={16} />
            <span>{label}</span>
        </div>
        <span className="font-semibold font-mono">{value}</span>
    </div>
);

const AnalysisSection: React.FC<{ icon: React.ElementType, title: string, content: string | null, colorClass: string }> = ({ icon: Icon, title, content, colorClass }) => {
    if (!content) return null;
    return (
        <div className={`mt-4 p-3 rounded-lg border-l-4 ${colorClass.replace('text-', 'border-').replace('500', '500/80')} ${colorClass.replace('text-', 'bg-').replace('500', '500/10')}`}>
            <h4 className={`flex items-center gap-2 text-sm font-bold ${colorClass}`}>
                <Icon size={16} />
                {title}
            </h4>
            <p className="text-xs mt-1">{content}</p>
        </div>
    );
}

// --- MAIN WIDGET ---
const WeatherWidget: React.FC = () => {
    const [weather, setWeather] = useState<WeatherData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchWeather = useCallback(async () => {
        setLoading(true);
        setError(null);

        if (!process.env.API_KEY) {
            setError('کلید API برای سرویس هواشناسی تنظیم نشده است.');
            setLoading(false);
            return;
        }

        try {
            const response = await fetch(`https://one-api.ir/weather/?token=${process.env.API_KEY}&action=current&city=${API_CITY}`);
            const data = await response.json();

            if (data.status !== 200 || !data.result) {
                throw new Error(data.message || 'خطا در دریافت اطلاعات از سرور هواشناسی.');
            }
            
            const result = data.result;
            setWeather({
                city: result.name,
                temp: Math.round(result.main.temp),
                condition: result.weather.text,
                humidity: result.main.humidity,
                windSpeed: result.wind.speed,
                windDirection: result.wind.deg_text,
                pressure: result.main.pressure,
            });
        } catch (e: any) {
            setError(e.message || 'خطا در ارتباط با سرور. اتصال اینترنت خود را بررسی کنید.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchWeather();
    }, [fetchWeather]);

    if (loading) {
        return <div className="h-full flex items-center justify-center"><SkeletonLoader /></div>;
    }
    
    if (error) {
        return (
            <div className="h-full flex flex-col items-center justify-center text-center">
                <AlertTriangle className="w-8 h-8 text-red-500 mb-2" />
                <p className="text-sm text-red-500">{error}</p>
                <button onClick={fetchWeather} className="mt-3 text-xs flex items-center gap-2 bg-indigo-500 text-white px-3 py-1 rounded hover:bg-indigo-600">
                    <RefreshCw size={12}/>
                    تلاش مجدد
                </button>
            </div>
        );
    }

    if (!weather) {
        return null;
    }
    
    const alert = getWeatherAlert(weather);
    const marketAnalysis = getMarketAnalysis(weather);
    const recommendation = getTraderRecommendation(weather);

    return (
        <div className="space-y-3">
             <div className="flex justify-between items-center">
                <div>
                    <div className="flex items-center gap-2">
                        <MapPin size={18} className="text-gray-500" />
                        <p className="font-bold text-lg">{weather.city}</p>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{weather.condition}</p>
                </div>
                <p className="text-4xl font-bold font-mono">{weather.temp}°C</p>
            </div>
            
            <div className="space-y-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                 <InfoRow icon={Wind} label="باد" value={`${weather.windSpeed} km/h از ${weather.windDirection}`} />
                 <InfoRow icon={Droplets} label="رطوبت" value={`${weather.humidity}%`} />
                 <InfoRow icon={Compass} label="فشار هوا" value={`${weather.pressure} hPa`} />
            </div>

            <AnalysisSection icon={AlertTriangle} title="هشدار" content={alert} colorClass="text-red-500" />
            <AnalysisSection icon={BarChart2} title="تحلیل بازار" content={marketAnalysis} colorClass="text-blue-500" />
            <AnalysisSection icon={Home} title="توصیه" content={recommendation} colorClass="text-green-500" />

        </div>
    );
};

export default WeatherWidget;