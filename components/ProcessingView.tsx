import React, { useEffect, useState } from 'react';
import { PROCESSING_MESSAGES, PROCESSING_DURATION_MS } from '../constants';
import VireoBird from './VireoBird';

interface ProcessingViewProps {
  onComplete: () => void;
}

const ProcessingView: React.FC<ProcessingViewProps> = ({ onComplete }) => {
  const [messageIndex, setMessageIndex] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Message cycling
    const messageInterval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % PROCESSING_MESSAGES.length);
    }, 2000);

    // Progress bar and completion
    const startTime = Date.now();
    const progressInterval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const newProgress = Math.min((elapsed / PROCESSING_DURATION_MS) * 100, 100);
      setProgress(newProgress);

      if (elapsed >= PROCESSING_DURATION_MS) {
        clearInterval(messageInterval);
        clearInterval(progressInterval);
        onComplete();
      }
    }, 50);

    return () => {
      clearInterval(messageInterval);
      clearInterval(progressInterval);
    };
  }, [onComplete]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] w-full max-w-2xl mx-auto p-8 animate-fade-in">
      <div className="relative mb-12">
        {/* Decorative elements behind bird */}
        <div className="absolute -top-10 -left-10 w-20 h-20 bg-vireo-yellow rounded-full opacity-50 blur-xl animate-pulse"></div>
        <div className="absolute -bottom-10 -right-10 w-24 h-24 bg-vireo-pink rounded-full opacity-30 blur-xl animate-pulse delay-75"></div>

        <VireoBird isCooking className="scale-150" />
      </div>

      <h2 className="text-3xl font-bold text-vireo-dark mb-4 text-center min-h-[80px] transition-all duration-300 dark:text-white">
        {PROCESSING_MESSAGES[messageIndex]}
      </h2>

      <div className="w-full max-w-md bg-gray-200 rounded-full h-4 overflow-hidden shadow-inner mt-4 dark:bg-gray-700">
        <div
          className="bg-gradient-to-r from-vireo-teal to-vireo-purple h-full rounded-full transition-all duration-75 ease-linear"
          style={{ width: `${progress}%` }}
        />
      </div>

      <p className="mt-4 text-gray-500 font-medium animate-pulse dark:text-gray-400">
        {Math.round(progress)}%
      </p>
    </div>
  );
};

export default ProcessingView;
