

import React from 'react';

interface ManualModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const Section = ({ title, children }: { title: string, children: React.ReactNode }) => (
    <div className="mb-6">
        <h3 className="text-xl font-bold text-brand-cyan mb-3 pb-2 border-b-2 border-cyan-800/50">{title}</h3>
        <div className="space-y-3 text-gray-300 leading-relaxed">{children}</div>
    </div>
);

export const UserManualModal = ({ isOpen, onClose }: ManualModalProps) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 animate-fade-in" style={{ animationDuration: '0.3s' }} onClick={onClose}>
            <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl h-[90vh] flex flex-col border-2 border-gray-600" onClick={e => e.stopPropagation()}>
                <header className="flex justify-between items-center p-4 border-b border-gray-700 flex-shrink-0">
                    <h2 className="text-2xl font-bold text-brand-light">User Manual</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition text-3xl font-bold">&times;</button>
                </header>
                <main className="flex-1 p-6 overflow-y-auto">
                    <Section title="1. Introduction">
                        <p>SynapseForge AI is a powerful platform designed for reverse engineering, product analysis, and innovation. It leverages Google's advanced AI models to deconstruct a product concept from a simple description and optional files (images, schematics) into a comprehensive suite of technical documentation, analysis, and creative proposals.</p>
                    </Section>
                    {/* Fix: Wrapped content inside Section component */}
                    <Section title="2. Getting Started: The Analysis Workflow">
                        <div>
                            <h4 className="font-semibold text-brand-light mb-1">Step 1: Select an Analytical Lens</h4>
                            <p>The "Engineering Philosophy" you choose is the most crucial first step. It attunes the AI to a specific mindset, fundamentally altering its analysis and suggestions.
                                <ul className="list-disc pl-6 mt-2">
                                    <li><strong>Advanced Materials & Processes:</strong> Focuses on cutting-edge, high-performance solutions, pushing the boundaries of what's possible.</li>
                                    <li><strong>Pragmatic & Production-Oriented:</strong> Prioritizes cost-effectiveness, reliability, and manufacturability at scale using proven methods.</li>
                                    <li><strong>Systems & Automation:</strong> Views the product as an integrated system of hardware, software, and electronics, focusing on smart features and automation.</li>
                                </ul>
                            </p>
                        </div>
                         <div>
                            <h4 className="font-semibold text-brand-light mb-1">Step 2: Define Your Project</h4>
                            <p>Give your analysis a clear <strong>Project Name</strong>. In the <strong>Concept</strong> text area, describe the product you want to analyze. The more detail you provide, the more accurate and insightful the AI's report will be. Mention key features, intended use, and any known components.</p>
                        </div>
                         <div>
                            <h4 className="font-semibold text-brand-light mb-1">Step 3: Upload Files (Optional)</h4>
                            <p>For a much deeper analysis, upload relevant files. You can drag-and-drop or click to browse. Supported formats include images (PNG, JPG) and PDFs. This is highly effective for analyzing physical objects from photos or deconstructing existing technical documents.</p>
                        </div>
                         <div>
                            <h4 className="font-semibold text-brand-light mb-1">Step 4: Engage the AI</h4>
                            <p>Once your inputs are ready, click the <strong>"Engage SynapseForge AI"</strong> button. The platform will send your query to the AI, which will generate a complete analysis report. This may take a moment.</p>
                        </div>
                    </Section>
                    {/* Fix: Wrapped content inside Section component */}
                    <Section title="3. Understanding the Analysis Report">
                        <p>The generated report is a rich, multi-section document:</p>
                        <ul className="list-disc pl-6 mt-2 space-y-2">
                            <li><strong>Executive Summary:</strong> A high-level overview of the findings.</li>
                            <li><strong>AI Visualizations:</strong> You can generate a 3D exploded view animation and a 2D technical drawing blueprint of the product for enhanced understanding.</li>
                            <li><strong>Faction Rationale:</strong> A breakdown of Pros and Cons, explaining how the product aligns (or conflicts) with the chosen engineering philosophy.</li>
                            <li><strong>Material Suggestions:</strong> Recommendations for materials, complete with technical properties and rationale.</li>
                            <li><strong>AI System Suggestions:</strong> Innovative proposals for subsystems or features. You can click <strong>"Incorporate"</strong> to automatically add a suggestion to your prompt and re-run the analysis, iteratively improving the design.</li>
                            <li><strong>Full Documentation Suite:</strong> The report includes detailed sections for Technical Specifications, Manufacturing Processes, Risk Assessments, Cost Estimates, and a Bill of Materials (BOM).</li>
                        </ul>
                    </Section>
                     {/* Fix: Wrapped content inside Section component */}
                    <Section title="4. Project & Version Management">
                        <p>Your work is automatically saved. The Project Manager allows you to organize and revisit your analyses.</p>
                        <ul className="list-disc pl-6 mt-2 space-y-2">
                            <li><strong>Projects:</strong> Each time you start a major new analysis, you can create a "New Project". You can search through all your projects by name or by keywords found within their analysis results.</li>
                            <li><strong>Versions:</strong> Every successful analysis, including iterative improvements made by incorporating suggestions, is saved as a new version within the active project. This creates a complete, chronological history of your design process.</li>
                            <li><strong>Viewing & Reverting:</strong> You can view any previous version or choose to "Revert", which copies an old version's data into a new version, allowing you to branch off from an earlier point in your design.</li>
                        </ul>
                    </Section>
                     {/* Fix: Wrapped content inside Section component */}
                    <Section title="5. DeVinci: Your AI Engineering Partner">
                        <p>Click "Discuss with DeVinci" in the report to launch a real-time, voice-based conversational AI. DeVinci is primed with the full context of your current analysis. You can use it to brainstorm ideas, ask clarifying questions, and explore creative possibilities in a natural, spoken dialogue.</p>
                    </Section>
                    {/* Fix: Wrapped content inside Section component */}
                    <Section title="6. Exporting Your Work">
                        <p>When your analysis is complete, click the <strong>"Export Full Report"</strong> button. This generates a professional, multi-page PDF document containing the entire analysis, including the AI-generated technical drawing, perfect for sharing, archiving, or presentations.</p>
                    </Section>
                </main>
            </div>
        </div>
    );
};