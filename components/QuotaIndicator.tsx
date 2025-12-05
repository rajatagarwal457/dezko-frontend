import React from 'react';
import { Sparkles, Zap } from 'lucide-react';
import { FREE_GENERATION_LIMIT } from '../constants';

interface QuotaIndicatorProps {
    remainingGenerations: number;
    isPremium: boolean;
    onClick?: () => void;
}

const QuotaIndicator: React.FC<QuotaIndicatorProps> = ({
    remainingGenerations,
    isPremium,
    onClick
}) => {
    if (isPremium) {
        return (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-vireo-teal to-vireo-purple text-white rounded-full text-sm font-bold">
                <Sparkles className="w-4 h-4" />
                Premium
            </div>
        );
    }

    const isLow = remainingGenerations <= 2;
    const isEmpty = remainingGenerations <= 0;

    return (
        <button
            onClick={onClick}
            className={`
                flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-bold transition-all
                ${isEmpty
                    ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50'
                    : isLow
                        ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 hover:bg-yellow-200 dark:hover:bg-yellow-900/50'
                        : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }
            `}
            title={isEmpty ? 'Upgrade to continue' : `${remainingGenerations} of ${FREE_GENERATION_LIMIT} free videos left`}
        >
            <Zap className="w-4 h-4" />
            {isEmpty ? 'Upgrade' : `${remainingGenerations}/${FREE_GENERATION_LIMIT}`}
        </button>
    );
};

export default QuotaIndicator;
