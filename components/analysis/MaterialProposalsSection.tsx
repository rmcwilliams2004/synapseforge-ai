import React from 'react';
import { Section } from './Section';
import { CommentButton } from './AnalysisButtons';
import { AnalysisResult } from '../../types';

interface MaterialProposalsSectionProps {
    result: AnalysisResult;
    suggestionExplorer: { explore: (term: string, context: string) => void };
    commentCounts: Record<string, number>;
    toggleComments: (sectionId: string, sectionTitle: string) => void;
    activeSection: string | null;
}

export const MaterialProposalsSection: React.FC<MaterialProposalsSectionProps> = ({
    result,
    suggestionExplorer,
    commentCounts,
    toggleComments,
    activeSection
}) => {
    return (
        <Section id="ai_suggestions" title="Material & System Proposals" actions={<CommentButton sectionId="ai_suggestions" sectionTitle="Suggestions" count={commentCounts['ai_suggestions'] || 0} onToggle={toggleComments} isOpen={activeSection === 'ai_suggestions'} />}>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {result.material_suggestions.map((mat, i) => (
                    <div key={i} className="p-4 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-gray-700 rounded-lg group">
                        <div className="flex justify-between items-start mb-2">
                            <h4 className="font-bold text-gray-900 dark:text-white">{mat.name}</h4>
                            <button 
                                onClick={() => suggestionExplorer.explore(mat.name, result.executive_summary)}
                                className="text-xs text-brand-cyan hover:underline opacity-0 group-hover:opacity-100 transition-opacity focus:outline-none focus:ring-2 focus:ring-brand-cyan focus:ring-offset-2 dark:focus:ring-offset-slate-800 rounded px-1"
                            >
                                Explore
                            </button>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">{mat.rationale}</p>
                        <div className="grid grid-cols-2 gap-x-4 text-[10px] uppercase font-bold text-gray-400">
                            <div>Strength: <span className="text-gray-700 dark:text-gray-200">{mat.properties.tensile_strength}</span></div>
                            <div>Density: <span className="text-gray-700 dark:text-gray-200">{mat.properties.density}</span></div>
                        </div>
                    </div>
                ))}
            </div>
        </Section>
    );
};
