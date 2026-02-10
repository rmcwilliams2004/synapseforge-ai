
import React from 'react';
import { AnalysisResult } from '../../types';
import { Section } from './Section';
import { usePatentGenerator } from '../../hooks/usePatentGenerator';

interface PatentModuleProps {
    result: AnalysisResult;
    patentGenerator: ReturnType<typeof usePatentGenerator>;
    isViewer: boolean;
}

export const PatentModule: React.FC<PatentModuleProps> = ({ result, patentGenerator, isViewer }) => {
    const { patent, isGenerating, draftPatent } = patentGenerator;

    return (
        <Section id="patent_application" title="IP & Patent Drafting">
            <div className="space-y-6">
                {!patent && !isGenerating && (
                    <div className="bg-indigo-900/20 border border-indigo-500/30 p-6 rounded-lg text-center">
                        <p className="text-indigo-200 mb-4 text-sm">Convert your reverse engineering analysis into a structured intellectual property disclosure. Our AI drafts legal claims, backgrounds, and identifies novelty points.</p>
                        <button
                            onClick={() => draftPatent(result)}
                            disabled={isViewer}
                            className="w-full md:w-auto px-8 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-bold transition flex items-center justify-center gap-3 shadow-lg shadow-indigo-500/20 disabled:opacity-50"
                        >
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            Generate AI Patent Draft
                        </button>
                    </div>
                )}

                {isGenerating && (
                    <div className="bg-white dark:bg-gray-800/50 p-12 rounded-lg border border-gray-200 dark:border-gray-700 text-center animate-pulse">
                        <div className="flex justify-center mb-4">
                            <svg className="animate-spin h-10 w-10 text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                        </div>
                        <p className="text-indigo-400 font-bold text-lg">Synthesizing IP Claims...</p>
                        <p className="text-sm text-gray-500 mt-2 font-mono">Analyzing prior art vs. current novelty vectors...</p>
                    </div>
                )}

                {patent && (
                    <div className="space-y-6 bg-white dark:bg-gray-800/30 p-6 rounded-lg border border-gray-700 animate-fade-in">
                        <div className="border-b border-gray-700 pb-4">
                            <span className="text-[10px] uppercase tracking-widest text-indigo-400 font-black mb-1 block">Provisional Patent Draft</span>
                            <h4 className="text-2xl font-bold text-white">{patent.title}</h4>
                            <p className="text-sm text-gray-400 mt-3 italic leading-relaxed">{patent.abstract}</p>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-gray-900/50 p-4 rounded-lg border border-indigo-900/30">
                                <h5 className="font-bold text-sm text-brand-cyan mb-3 flex items-center gap-2">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>
                                    Novelty Points
                                </h5>
                                <ul className="space-y-2 text-xs text-gray-300">
                                    {patent.novelty_points.map((p, i) => (
                                        <li key={i} className="flex items-start gap-2">
                                            <span className="text-indigo-500 font-bold">•</span>
                                            <span>{p}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            <div className="bg-gray-900/50 p-4 rounded-lg border border-indigo-900/30">
                                <h5 className="font-bold text-sm text-brand-cyan mb-3 flex items-center gap-2">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6 6 0 1 0-6 6 6 6 0 0 0 6-6Zm0 0a6 6 0 1 1 6 6 6 6 0 0 1-6-6ZM11.25 15.75h.008v.008h-.008v-.008Zm0-3h.008v.008h-.008v-.008ZM12 11.25a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Z" /></svg>
                                    Inventive Step
                                </h5>
                                <p className="text-xs text-gray-300 leading-relaxed">{patent.inventive_step_rationale}</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h5 className="font-bold text-sm text-gray-200 uppercase tracking-wider flex items-center gap-2">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 text-indigo-400"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" /></svg>
                                Technical Claims
                            </h5>
                            {patent.independent_claims.map((claim, i) => (
                                <div key={i} className="group relative">
                                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-600 group-hover:w-1.5 transition-all"></div>
                                    <div className="pl-4 py-2">
                                        <span className="text-[10px] font-bold text-indigo-500 uppercase">Independent Claim {i+1}</span>
                                        <p className="text-sm text-gray-300 mt-1 leading-relaxed">{claim}</p>
                                    </div>
                                </div>
                            ))}
                            {patent.dependent_claims && patent.dependent_claims.map((claim, i) => (
                                <div key={i} className="pl-6 border-l border-gray-700 py-1">
                                     <span className="text-[10px] font-bold text-gray-500 uppercase">Dependent Claim {i+1}</span>
                                     <p className="text-xs text-gray-400 mt-1 leading-relaxed">{claim}</p>
                                </div>
                            ))}
                        </div>
                        
                        <div className="pt-4 border-t border-gray-700 flex justify-end gap-3">
                            <button className="text-xs font-bold text-gray-400 hover:text-white transition">Copy to Clipboard</button>
                            <button className="text-xs font-bold text-indigo-400 hover:text-indigo-300 transition">Export Legal PDF</button>
                        </div>
                    </div>
                )}
            </div>
        </Section>
    );
};
