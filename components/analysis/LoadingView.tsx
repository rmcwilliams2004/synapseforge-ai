import React, { useState, useEffect } from 'react';

const LOADING_MESSAGES = [
  "Initializing Neural Forge...",
  "Deciphering Structural Topology...",
  "Mapping Material Spectrogram...",
  "Synthesizing Manufacturing Workflow...",
  "Analyzing Stress & Fatigue Vectors...",
  "Calibrating Tolerances & Clearances...",
  "Optimizing Supply Chain Logistics...",
  "Compiling Documentation Suite...",
  "Finalizing Analytical Report...",
];

export const LoadingView = () => {
  const [progress, setProgress] = useState(0);
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    // Progress simulation logic
    // Moves fast initially, then slows down as it approaches 95%
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 95) return prev;
        const increment = Math.max(0.1, (100 - prev) / 40);
        return Math.min(95, prev + increment);
      });
    }, 150);

    // Message cycling logic
    const messageInterval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % LOADING_MESSAGES.length);
    }, 2500);

    return () => {
      clearInterval(interval);
      clearInterval(messageInterval);
    };
  }, []);

  return (
    <div className="bg-white dark:bg-gray-900 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-12 h-full flex items-center justify-center relative overflow-hidden transition-colors duration-300">
      {/* Decorative background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-brand-cyan/10 rounded-full blur-3xl pointer-events-none"></div>
      
      <div className="flex flex-col items-center justify-center gap-8 text-center max-w-md w-full relative z-10">
        <div className="relative">
            <svg className="animate-spin h-16 w-16 text-brand-cyan" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-[10px] font-black text-brand-cyan">{Math.floor(progress)}%</span>
            </div>
        </div>

        <div className="space-y-4 w-full">
            <div>
                <p className="text-xl font-bold text-gray-900 dark:text-brand-light animate-fade-in">
                    Analyzing Concept...
                </p>
                <div className="h-6 mt-1">
                     <p key={messageIndex} className="text-brand-cyan text-sm font-mono font-semibold uppercase tracking-wider animate-slide-in-up">
                        {LOADING_MESSAGES[messageIndex]}
                    </p>
                </div>
            </div>

            {/* Progress Bar Track */}
            <div className="w-full h-3 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden border border-gray-300 dark:border-gray-700 shadow-inner">
                <div 
                    className="h-full bg-gradient-to-r from-cyan-600 to-brand-cyan transition-all duration-300 ease-out relative"
                    style={{ width: `${progress}%` }}
                >
                    {/* Glowing tip */}
                    <div className="absolute right-0 top-0 bottom-0 w-4 bg-white/30 blur-sm"></div>
                </div>
            </div>
            
            <p className="text-gray-500 dark:text-gray-400 text-xs leading-relaxed">
              The SynapseForge AI is evaluating your design through the analytical lens of the selected philosophy. Generating technical documentation and BOM.
            </p>
        </div>
      </div>
    </div>
  );
};
