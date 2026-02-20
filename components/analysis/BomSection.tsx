import React from 'react';
import { Section } from './Section';
import { CommentButton } from './AnalysisButtons';
import { AnalysisResult, BillOfMaterials } from '../../types';

interface BomSectionProps {
    result: AnalysisResult;
    bomSourcing: { sourceItem: (item: BillOfMaterials) => void };
    commentCounts: Record<string, number>;
    toggleComments: (sectionId: string, sectionTitle: string) => void;
    activeSection: string | null;
}

export const BomSection: React.FC<BomSectionProps> = ({
    result,
    bomSourcing,
    commentCounts,
    toggleComments,
    activeSection
}) => {
    return (
        <Section id="bom" title="Bill of Materials" actions={<CommentButton sectionId="bom" sectionTitle="BOM" count={commentCounts['bom'] || 0} onToggle={toggleComments} isOpen={activeSection === 'bom'} />}>
            <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden shadow-sm">
                <table className="w-full text-left text-sm">
                    <thead className="bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-300 uppercase text-[10px] font-bold">
                        <tr>
                            <th className="px-4 py-3">Part #</th>
                            <th className="px-4 py-3">Name</th>
                            <th className="px-4 py-3">Qty</th>
                            <th className="px-4 py-3">Material</th>
                            <th className="px-4 py-3 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700 text-gray-800 dark:text-gray-200">
                        {result.billOfMaterials.map((item, idx) => (
                            <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-slate-800/50">
                                <td className="px-4 py-3 font-mono">{item.part_number}</td>
                                <td className="px-4 py-3 font-semibold">{item.name}</td>
                                <td className="px-4 py-3">{item.quantity}</td>
                                <td className="px-4 py-3">{item.material}</td>
                                <td className="px-4 py-3 text-right">
                                    <button 
                                        onClick={() => bomSourcing.sourceItem(item)}
                                        className="text-xs font-bold text-brand-cyan hover:underline"
                                    >
                                        Source
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </Section>
    );
};
