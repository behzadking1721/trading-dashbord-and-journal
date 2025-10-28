import React, { useState, useEffect, useCallback } from 'react';
import { getJournalEntries } from '../../db';
import { AlertTriangle, BrainCircuit } from 'lucide-react';

interface AnalysisResult {
    [key: string]: number;
}

const SkeletonLoader = () => (
    <div className="animate-pulse space-y-3">
        {[...Array(4)].map((_, i) => (
            <div key={i} className="flex justify-between items-center">
                <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-2/5"></div>
                <div className="h-5 bg-gray-300 dark:bg-gray-600 rounded w-1/3"></div>
            </div>
        ))}
    </div>
);

const AnalysisList: React.FC<{ title: string, data: AnalysisResult, icon: React.ElementType }> = ({ title, data, icon: Icon }) => {
    const sortedData = Object.entries(data).sort(([, a], [, b]) => a - b);
    
    if (sortedData.length === 0) return null;

    return (
        <div>
            <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                <Icon size={16} className="text-gray-400" />
                {title}
            </h4>
            <div className="space-y-2 text-sm">
                {sortedData.map(([key, value]) => (
                    <div key={key} className="flex justify-between items-center">
                        <span className="text-gray-600 dark:text-gray-300">{key}</span>
                        <span className={`font-mono font-bold ${value >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                            {value >= 0 ? '+' : ''}${value.toFixed(2)}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
};

const PsychologyAnalysisWidget: React.FC = () => {
    const [mistakeAnalysis, setMistakeAnalysis] = useState<AnalysisResult>({});
    const [reasonAnalysis, setReasonAnalysis] = useState<AnalysisResult>({});
    const [loading, setLoading] = useState(true);

    const calculateAnalysis = useCallback(async () => {
        setLoading(true);
        try {
            const entries = await getJournalEntries();
            const closedTrades = entries.filter(e => e.profitOrLoss != null);

            const mistakePnl: AnalysisResult = {};
            const reasonPnl: AnalysisResult = {};

            for (const trade of closedTrades) {
                // Mistake Analysis
                if (trade.mistakes && trade.mistakes.length > 0) {
                    trade.mistakes.forEach(mistake => {
                        mistakePnl[mistake] = (mistakePnl[mistake] || 0) + trade.profitOrLoss!;
                    });
                }

                // Entry Reason Analysis
                const reason = trade.psychology?.entryReason;
                if (reason) {
                    reasonPnl[reason] = (reasonPnl[reason] || 0) + trade.profitOrLoss!;
                }
            }
            
            setMistakeAnalysis(mistakePnl);
            setReasonAnalysis(reasonPnl);

        } catch (error) {
            console.error("Failed to calculate psychology stats:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        window.addEventListener('journalUpdated', calculateAnalysis);
        calculateAnalysis();
        return () => {
            window.removeEventListener('journalUpdated', calculateAnalysis);
        };
    }, [calculateAnalysis]);

    if (loading) {
        return <SkeletonLoader />;
    }

    const hasMistakeData = Object.keys(mistakeAnalysis).length > 0;
    const hasReasonData = Object.keys(reasonAnalysis).length > 0;

    if (!hasMistakeData && !hasReasonData) {
        return (
            <div className="text-center text-xs text-gray-500 py-4 h-full flex items-center justify-center">
                برای نمایش تحلیل، اشتباهات و انگیزه‌های ورود را در ژورنال خود ثبت کنید.
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {hasMistakeData && (
                <AnalysisList 
                    title="هزینه اشتباهات"
                    data={mistakeAnalysis}
                    icon={AlertTriangle}
                />
            )}
             {hasMistakeData && hasReasonData && <hr className="border-gray-200 dark:border-gray-700" />}
            {hasReasonData && (
                <AnalysisList 
                    title="نتیجه بر اساس انگیزه"
                    data={reasonAnalysis}
                    icon={BrainCircuit}
                />
            )}
        </div>
    );
};

export default PsychologyAnalysisWidget;