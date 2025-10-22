
import React, { useState } from 'react';
import { BookOpen, RefreshCw } from 'lucide-react';

const HAFEZ_QUOTES = [
  "یوسف گم گشته بازآید به کنعان غم مخور",
  "درخت دوستی بنشان که کام دل به بار آرد",
  "الا یا ایها الساقی ادر کأسا و ناولها",
  "ما آزموده‌ایم در این شهر بخت خویش",
];

const HafezFortuneWidget: React.FC = () => {
  const [quote, setQuote] = useState(HAFEZ_QUOTES[0]);

  const getNewQuote = () => {
    const newQuote = HAFEZ_QUOTES[Math.floor(Math.random() * HAFEZ_QUOTES.length)];
    setQuote(newQuote);
  };

  return (
    <div className="flex flex-col items-center justify-center h-full text-center">
      <BookOpen className="w-8 h-8 text-green-600 mb-4" />
      <p className="text-sm italic mb-4">"{quote}"</p>
      <button onClick={getNewQuote} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">
        <RefreshCw size={16} />
      </button>
    </div>
  );
};

export default HafezFortuneWidget;
