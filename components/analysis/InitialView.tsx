import React from 'react';

export const InitialView = () => (
  <div className="bg-white dark:bg-gray-900 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-8 h-full flex flex-col items-center justify-center text-center animate-fade-in transition-colors duration-300">
    <svg className="w-16 h-16 text-brand-cyan mb-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2L2 7l10 5 10-5-10-5z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M2 17l10 5 10-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M2 12l10 5 10-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="12" cy="12" r="3" fill="currentColor" opacity="0.8"/>
    </svg>
    <h2 className="text-2xl font-bold text-gray-900 dark:text-brand-light mb-2">Welcome to SynapseForge AI</h2>
    <p className="text-gray-500 dark:text-gray-400 max-w-2xl">
      Your advanced platform for reverse engineering and product innovation. Transform a concept, image, or schematic into a comprehensive technical analysis.
    </p>
    <div className="mt-6 text-left bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg border border-gray-200 dark:border-gray-700 max-w-lg">
        <h3 className="font-semibold text-gray-800 dark:text-brand-light mb-2">How to Begin:</h3>
        <ol className="list-decimal list-inside text-sm text-gray-600 dark:text-gray-300 space-y-1">
            <li>Select an <span className="font-semibold text-brand-cyan">Analytical Lens</span> to set the AI's perspective.</li>
            <li>Provide a <span className="font-semibold text-brand-cyan">Project Name & Concept</span> description.</li>
            <li>(Optional) <span className="font-semibold text-brand-cyan">Upload files</span> like photos or schematics for deeper insight.</li>
            <li>Click <span className="font-semibold text-brand-cyan">"Engage SynapseForge AI"</span> to generate your report.</li>
        </ol>
    </div>
    <p className="text-xs text-gray-400 dark:text-gray-500 mt-4">For a detailed guide, open the "User Manual" from the header.</p>
  </div>
);