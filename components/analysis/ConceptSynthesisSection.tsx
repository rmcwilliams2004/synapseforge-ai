import React, { useState } from 'react';
import { Section } from './Section';
import { CommentButton } from './AnalysisButtons';
import { AnalysisResult, GeneratedImage } from '../../types';

interface ConceptSynthesisSectionProps {
    result: AnalysisResult;
    inspirationalImages: GeneratedImage[];
    onRemoveInspirationalImage: (id: string) => void;
    onRequestInspirationalImage: (prompt: string, aspectRatio: string) => void;
    onToggleImageReportInclusion: (id: string) => void;
    commentCounts: Record<string, number>;
    toggleComments: (sectionId: string, sectionTitle: string) => void;
    activeSection: string | null;
}

export const ConceptSynthesisSection: React.FC<ConceptSynthesisSectionProps> = ({
    result,
    inspirationalImages,
    onRemoveInspirationalImage,
    onRequestInspirationalImage,
    onToggleImageReportInclusion,
    commentCounts,
    toggleComments,
    activeSection
}) => {
    const [conceptPrompt, setConceptPrompt] = useState('');
    const [selectedAspectRatio, setSelectedAspectRatio] = useState('16:9');

    const handleInspirationalImageRequest = () => {
        const finalPrompt = conceptPrompt.trim() || `Technical render of ${result.product_name}`;
        onRequestInspirationalImage(finalPrompt, selectedAspectRatio);
    };

    return (
        <Section 
            id="concept_images" 
            title="Concept Synthesis" 
            actions={
                <CommentButton 
                    sectionId="concept_images" 
                    sectionTitle="Concept Images" 
                    count={commentCounts['concept_images'] || 0} 
                    onToggle={toggleComments} 
                    isOpen={activeSection === 'concept_images'} 
                />
            }
        >
            <div className="space-y-6">
                {/* Generation Control Bar */}
                <div className="flex flex-col md:flex-row gap-4 bg-gray-50 dark:bg-slate-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700">
                    <input 
                        type="text" 
                        value={conceptPrompt} 
                        onChange={(e) => setConceptPrompt(e.target.value)}
                        placeholder={`Visualize ${result.product_name} architecture...`}
                        className="flex-1 bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-lg px-4 py-2 text-sm text-gray-800 dark:text-gray-200"
                    />
                    <select 
                        value={selectedAspectRatio} 
                        onChange={(e) => setSelectedAspectRatio(e.target.value)}
                        className="bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-lg px-3 py-2 text-xs font-bold text-gray-700 dark:text-gray-300"
                    >
                        <option value="16:9">16:9 Cinematic</option>
                        <option value="9:16">9:16 Vertical</option>
                        <option value="1:1">1:1 Square</option>
                    </select>
                    <button 
                        onClick={handleInspirationalImageRequest}
                        className="px-6 py-2 bg-brand-cyan text-white font-bold rounded-lg hover:bg-cyan-600 transition-all shadow-sm flex items-center gap-2"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" /></svg>
                        Synthesize
                    </button>
                </div>

                {/* Dynamic Image Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {inspirationalImages.map((img) => (
                        <div key={img.id} className="relative group rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 aspect-video bg-gray-100 dark:bg-slate-900 shadow-sm">
                            {img.isLoading ? (
                                <div className="absolute inset-0 flex flex-col items-center justify-center space-y-2">
                                    <div className="w-8 h-8 border-4 border-brand-cyan border-t-transparent rounded-full animate-spin" />
                                    <span className="text-[10px] uppercase font-black tracking-widest text-gray-400">Processing...</span>
                                </div>
                            ) : (
                                <>
                                    <img src={img.url || ''} alt={img.prompt} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                                    {/* Hover Actions Overlay */}
                                    <div className="absolute inset-0 bg-slate-900/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                                        <button 
                                            onClick={() => onRemoveInspirationalImage(img.id)} 
                                            className="p-2 bg-red-500/20 text-red-500 border border-red-500/50 rounded-full hover:bg-red-500 hover:text-white transition-colors"
                                            title="Purge Image"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" /></svg>
                                        </button>
                                        <button 
                                            onClick={() => onToggleImageReportInclusion(img.id)} 
                                            className={`p-2 rounded-full border transition-colors ${img.includeInReport ? 'bg-brand-cyan text-white border-brand-cyan' : 'bg-slate-700/50 text-slate-300 border-slate-600 hover:bg-brand-cyan/20'}`}
                                            title={img.includeInReport ? "Locked in Report" : "Include in Report"}
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" /></svg>
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </Section>
    );
};
