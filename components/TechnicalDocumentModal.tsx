

import React from 'react';

interface TechDocModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// FIX: The Section component requires a `children` prop.
// Usages of this component were being invoked as self-closing tags,
// which has been corrected to wrap the content to provide the required `children` prop.
const Section = ({ title, children }: { title: string, children: React.ReactNode }) => (
    <div className="mb-6">
        <h3 className="text-xl font-bold text-brand-cyan mb-3 pb-2 border-b-2 border-cyan-800/50">{title}</h3>
        <div className="space-y-3 text-gray-300 leading-relaxed text-sm">{children}</div>
    </div>
);

// FIX: The Code component requires a `children` prop.
// Usages of this component were being invoked as self-closing tags,
// which has been corrected to wrap the content to provide the required `children` prop.
const Code = ({ children }: { children: React.ReactNode }) => (
    <code className="bg-gray-900 text-cyan-400 p-1 rounded-md text-xs font-mono">{children}</code>
);

export const TechnicalDocumentModal = ({ isOpen, onClose }: TechDocModalProps) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 animate-fade-in" style={{ animationDuration: '0.3s' }} onClick={onClose}>
            <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl h-[90vh] flex flex-col border-2 border-gray-600" onClick={e => e.stopPropagation()}>
                <header className="flex justify-between items-center p-4 border-b border-gray-700 flex-shrink-0">
                    <h2 className="text-2xl font-bold text-brand-light">Platform Technical Document</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition text-3xl font-bold">&times;</button>
                </header>
                <main className="flex-1 p-6 overflow-y-auto">
                    {/* FIX: Wrapped content inside Section component to provide required 'children' prop. */}
                    <Section title="1. Overview">
                        <p>SynapseForge AI is a single-page application (SPA) built with modern frontend technologies. It provides a user interface for interacting with a suite of Google Gemini AI models to perform complex reverse engineering and product analysis tasks. The application is designed to be fully client-side, with all state management and API interactions handled directly by the browser.</p>
                    </Section>
                    {/* FIX: Wrapped content inside Section component to provide required 'children' prop. */}
                    <Section title="2. Core Technologies">
                        <ul className="list-disc pl-6">
                            <li><strong>Frontend Framework:</strong> React 19 with TypeScript for robust, type-safe component development.</li>
                            {/* FIX: Wrapped content inside Code component to provide required 'children' prop. */}
                            <li><strong>AI SDK:</strong> <Code>@google/genai</Code> JavaScript SDK for all interactions with the Gemini API.</li>
                            <li><strong>Styling:</strong> Tailwind CSS for rapid, utility-first UI development.</li>
                            <li><strong>PDF Generation:</strong> jsPDF and jsPDF-AutoTable for client-side generation of PDF reports.</li>
                        </ul>
                    </Section>
                    {/* FIX: Wrapped content inside Section component to provide required 'children' prop. */}
                    <Section title="3. AI Model Integration">
                      <>
                        <p>The platform orchestrates multiple Gemini models, each selected for its specific strengths:</p>
                        <ul className="list-disc pl-6 mt-2 space-y-2">
                            {/* FIX: Wrapped content inside Code component to provide required 'children' prop. */}
                            <li><strong>Core Analysis (<Code>gemini-2.5-flash</Code>):</strong> This model is the workhorse of the application. It receives the user's prompt, faction philosophy, and any file data. A detailed system instruction and a rigid JSON response schema are used to guide the model into producing the structured, multi-part analysis report.</li>
                            {/* FIX: Wrapped content inside Code component to provide required 'children' prop. */}
                            <li><strong>2D Drawing Generation (<Code>imagen-4.0-generate-001</Code>):</strong> Used for generating the technical blueprint. A specialized prompt is constructed to request orthographic and isometric views in a clean, black-and-white CAD style.</li>
                            {/* FIX: Wrapped content inside Code component to provide required 'children' prop. */}
                            <li><strong>Video Animation (<Code>veo-2.0-generate-001</Code>):</strong> Generates the 3D exploded view animation. This is an asynchronous operation; the application polls the Gemini API until the video is ready for download.</li>
                            {/* FIX: Wrapped content inside Code component to provide required 'children' prop. */}
                            <li><strong>Conversational AI (<Code>gemini-2.5-flash-native-audio-preview-09-2025</Code>):</strong> Powers the real-time, low-latency DeVinci voice assistant. It uses the Live API to stream microphone input and receive audio output and transcriptions, enabling a natural conversational experience.</li>
                        </ul>
                      </>
                    </Section>
                    {/* FIX: Wrapped content inside Section component to provide required 'children' prop. */}
                    <Section title="4. Architecture & State Management">
                      <>
                        <p>The application follows a component-based architecture with state managed via React Hooks.</p>
                         <ul className="list-disc pl-6 mt-2 space-y-2">
                           <li><strong>Custom Hooks:</strong> Logic is encapsulated in custom hooks to promote reusability and separation of concerns.
                                <ul>
                                   {/* FIX: Wrapped content inside Code component to provide required 'children' prop. */}
                                   <li><Code>useProjects</Code>: Manages the lifecycle of projects and versions, including all interactions with <Code>localStorage</Code>.</li>
                                   {/* FIX: Wrapped content inside Code component to provide required 'children' prop. */}
                                   <li><Code>useAnalysis</Code>: Handles the state for a single analysis run (loading, error, result).</li>
                                   {/* FIX: Wrapped content inside Code component to provide required 'children' prop. */}
                                   <li><Code>useVideoGenerator</Code> &amp; <Code>useDrawingGenerator</Code>: Manage the state for their respective asynchronous generation tasks.</li>
                                   {/* FIX: Wrapped content inside Code component to provide required 'children' prop. */}
                                   <li><Code>useDeVinci</Code>: Encapsulates all logic for the complex Live API connection, audio processing, and state management for the voice conversation.</li>
                                   {/* FIX: Wrapped content inside Code component to provide required 'children' prop. */}
                                   <li><Code>useAnalysisPersistence</Code>: Manages the temporary saving of an in-progress analysis to <Code>localStorage</Code> for session resumption.</li>
                                </ul>
                           </li>
                           {/* FIX: Wrapped content inside Code component to provide required 'children' prop. */}
                           <li><strong>Service Layer:</strong> API calls are abstracted into a service layer (<Code>geminiService.ts</Code>, <Code>pdfService.ts</Code>) to keep components clean and focused on the UI.</li>
                           {/* FIX: Wrapped content inside Code component to provide required 'children' prop. */}
                           <li><strong>Data Flow:</strong> User input from components like <Code>FactionSelector</Code> and <Code>PromptInput</Code> is collected in the main <Code>App.tsx</Code> component. On "Engage", the <Code>useAnalysis</Code> hook calls the <Code>geminiService</Code>, awaits the response, and updates the state. This new state then flows down to the <Code>AnalysisDisplay</Code> and <Code>ResultView</Code> components for rendering.</li>
                           {/* FIX: Wrapped content inside Code component to provide required 'children' prop. */}
                           <li><strong>Local Persistence:</strong> The app uses the browser's <Code>localStorage</Code> for all data persistence. Project data is stored under one key, while the session-resume data is stored under a separate key.</li>
                        </ul>
                      </>
                    </Section>
                </main>
            </div>
        </div>
    );
};
