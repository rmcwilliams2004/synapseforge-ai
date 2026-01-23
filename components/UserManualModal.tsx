import React from 'react';

interface ManualModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const Section = ({ title, children }: { title: string, children?: React.ReactNode }) => (
    <div className="mb-6">
        <h3 className="text-xl font-bold text-brand-cyan mb-3 pb-2 border-b-2 border-cyan-800/50">{title}</h3>
        <div className="space-y-3 text-gray-300 leading-relaxed">{children}</div>
    </div>
);

const SubSection = ({ title, children }: { title: string, children?: React.ReactNode }) => (
    <div className="mb-4">
        <h4 className="font-semibold text-brand-light mb-1">{title}</h4>
        <div className="space-y-2 text-sm">{children}</div>
    </div>
);

export const UserManualModal = ({ isOpen, onClose }: ManualModalProps) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 animate-fade-in" style={{ animationDuration: '0.3s' }} onClick={onClose}>
            <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl h-[90vh] flex flex-col border-2 border-gray-600" onClick={e => e.stopPropagation()}>
                <header className="flex justify-between items-center p-4 border-b border-gray-700 flex-shrink-0">
                    <h2 className="text-2xl font-bold text-brand-light">User Manual (v21.0)</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition text-3xl font-bold">&times;</button>
                </header>
                <main className="flex-1 p-6 overflow-y-auto custom-scrollbar">
                    <Section title="1. Introduction">
                        <p>Welcome to SynapseForge AI, a full-stack platform for modern product development. It leverages Google's advanced Gemini 3 models to take you from initial concept to a fabrication-ready design, integrating reverse engineering, collaborative review, and automated manufacturing planning into a single, seamless workflow.</p>
                    </Section>

                    <Section title="2. Innovation War Room & Talent Scout">
                        <p>The **Innovation War Room** is a specialized high-stakes brainstorming environment designed to solve the most difficult technical bottlenecks by assembling a custom council of history's greatest minds.</p>
                        <SubSection title="The Talent Scout Recruitment">
                            <p>To initiate a War Room, go to the Project Manager and select <strong>"Brainstorm from PDF"</strong>. Upload a technical proposal, spec sheet, or current project report. The **AI Talent Scout** will immediately scan your document to identify three critical friction points: Theoretical Bottlenecks, Engineering Constraints, and Systemic Risks.</p>
                        </SubSection>
                        <SubSection title="Assembling the Council">
                            <p>Based on your document's specific challenges, the Scout recruits a 3-member **Advisory Council** from the board. For example, a project involving wireless energy might recruit Nikola Tesla as the 'Energy Architect', while a cost-scaling issue might bring in Elon Musk as the 'Empirical Optimizer'.</p>
                        </SubSection>
                        <SubSection title="Entering the War Room">
                            <p>Once your Council is assembled, click <strong>"Enter War Room"</strong>. This creates a dedicated project environment where you can engage these partners in Socratic dialogue, use their specific heuristics to refine your design, and explore their character-driven insights.</p>
                        </SubSection>
                    </Section>

                    <Section title="3. Interactive Analysis Report">
                      <p>The report is more than a static document; it's an interactive workspace.</p>
                      <SubSection title="AI Partner Synthesis">
                        <p>Every analysis includes direct insights from the **Innovation Board**. You can view the synthesis reasoning to understand the "Internal Monologue" of the engine as it deconstructs your design. Next to each partner card, use the <strong>"Enter Lab Session"</strong> button to launch a real-time voice conversation with that specific persona.</p>
                      </SubSection>
                      <SubSection title="Interactive Exploration">
                        <p>The AI provides material and system suggestions. Instead of re-running a full analysis, you can now click the <strong>"Explore"</strong> button next to any suggestion. This triggers a fast, low-cost AI call to generate a detailed explanation and a new visual concept.</p>
                      </SubSection>
                      <SubSection title="Live Costing Dashboard">
                        <p>Modify quantities and materials from the Bill of Materials and instantly recalculate the estimated product cost, providing immediate feedback on design trade-offs.</p>
                      </SubSection>
                    </Section>

                    <Section title="4. 3D CAD & Fabrication">
                      <SubSection title="3D CAD Viewer">
                        <p>Generate and open a high-performance, WebGL-based 3D viewer. You can rotate, pan, and zoom the assembly. Use the **Explode** tool to see internal components or the **Section** tool to cut through the geometry. The **Measure** tool allows for vertex-to-vertex dimension checking.</p>
                      </SubSection>
                      <SubSection title="Fabrication Planner">
                        <p>The **Forge Fabrication Planner** bridges the gap between design and factory. Select a process (CNC, 3D Printing, Sheet Metal) to receive a DFM check and process-specific data like G-Code. Use the toolpath visualizer to verify CNC paths before export.</p>
                      </SubSection>
                    </Section>

                    <Section title="5. Visual Documentation">
                        <SubSection title="Technical Blueprints">
                            <p>Request engineering drawings via text or by uploading a photo. The AI can convert a rough mobile sketch into a standardized, multiview blueprint with dimensions and tolerances.</p>
                        </SubSection>
                        <SubSection title="Photorealistic Video">
                             <p>Generate short video animations (via Veo) to visualize your product in action. Use an uploaded image as a starting frame to maintain consistency with your design.</p>
                        </SubSection>
                    </Section>

                    <Section title="6. Voice Operations">
                        <p>Launch the **Voice Commander** (Mic icon, bottom-right) to operate the application hands-free. You can command the AI to "Show the BOM section", "Generate a video of this", or "Download all drawings as a zip". The commander uses a direct neural link for low-latency responsiveness.</p>
                    </Section>
                </main>
            </div>
        </div>
    );
};
