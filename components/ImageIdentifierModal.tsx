import React from 'react';
import { Modal } from './Modal';
import { ImageIdentificationResult } from '../types';

interface ImageIdentifierModalProps {
    isOpen: boolean;
    onClose: () => void;
    isLoading: boolean;
    error: string | null;
    result: ImageIdentificationResult | null;
}

export const ImageIdentifierModal: React.FC<ImageIdentifierModalProps> = ({ isOpen, onClose, isLoading, error, result }) => {
    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="AI Image Identification & Research"
            confirmText="Close"
            onConfirm={onClose}
            cancelText={null}
        >
            <div className="space-y-4">
                {isLoading && (
                    <div className="flex flex-col items-center justify-center gap-4 text-center p-8">
                        <svg className="animate-spin h-10 w-10 text-brand-cyan" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <p className="text-brand-light font-semibold">Identifying & Researching...</p>
                        <p className="text-gray-400 text-sm">The AI is analyzing your image and searching the web for information.</p>
                    </div>
                )}
                {error && (
                    <div className="p-4 bg-red-900/30 border border-red-600 rounded-lg text-red-300">
                        <h4 className="font-bold mb-2">An Error Occurred</h4>
                        <p>{error}</p>
                    </div>
                )}
                {result && !isLoading && (
                    <div className="animate-fade-in space-y-4">
                        <div>
                            <img src={result.imageUrl} alt="Uploaded for identification" className="w-full h-auto max-h-64 object-contain rounded-lg bg-gray-900/50 p-1 border border-gray-600" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-brand-cyan mb-2">Summary</h3>
                            <p className="text-gray-300 whitespace-pre-wrap">{result.summary}</p>
                        </div>
                        {result.sources && result.sources.length > 0 && (
                            <div>
                                <h3 className="text-lg font-semibold text-brand-cyan mb-2">Sources</h3>
                                <ul className="list-disc pl-5 space-y-2 text-sm">
                                    {result.sources.map((source, index) => (
                                        <li key={index}>
                                            <a href={source.web?.uri} target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:underline hover:text-cyan-300 transition-colors">
                                                {source.web?.title || source.web?.uri}
                                            </a>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </Modal>
    );
};