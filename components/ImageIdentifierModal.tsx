import React from 'react';
import { Modal } from './Modal';
import { ImageIdentificationResult } from '../types';
import { Loader2, Search } from 'lucide-react';
import { usePlaceholderImage } from '../hooks/usePlaceholderImage';

interface ImageIdentifierModalProps {
    isOpen: boolean;
    onClose: () => void;
    isLoading: boolean;
    error: string | null;
    result: ImageIdentificationResult | null;
}

export const ImageIdentifierModal: React.FC<ImageIdentifierModalProps> = ({ isOpen, onClose, isLoading, error, result }) => {
    const placeholderUrl = usePlaceholderImage();

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
                    <div className="flex flex-col items-center justify-center gap-6 text-center p-12 bg-gray-900/40 rounded-3xl border border-gray-800 border-dashed relative overflow-hidden">
                        {/* Shimmer background */}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-brand-cyan/5 to-transparent animate-shimmer -translate-x-full"></div>
                        
                        <div className="relative">
                            <div className="absolute -inset-4 border border-brand-cyan/20 rounded-full animate-pulse-active scale-125 opacity-20"></div>
                            <div className="p-4 bg-brand-cyan/10 rounded-2xl relative">
                                <Search className="w-10 h-10 text-brand-cyan animate-pulse" />
                                <div className="absolute top-0 right-0">
                                    <Loader2 className="w-5 h-5 text-brand-cyan animate-spin" />
                                </div>
                            </div>
                        </div>
                        
                        <div>
                            <p className="text-brand-cyan font-black uppercase tracking-[0.2em] animate-breathe">Identifying & Researching...</p>
                            <p className="text-gray-500 text-xs mt-2 max-w-[200px]">The AI is performing a visual analysis and indexing web sources.</p>
                        </div>
                    </div>
                )}
                {error && (
                    <div className="p-4 bg-red-900/30 border border-red-600 rounded-lg text-red-300 animate-fade-in">
                        <h4 className="font-bold mb-2">An Error Occurred</h4>
                        <p>{error}</p>
                    </div>
                )}
                {result && !isLoading && (
                    <div className="animate-fade-in space-y-4">
                        {result.imageUrl && (
                            <div className="relative group overflow-hidden rounded-xl border border-gray-600 bg-gray-900/50 p-1 shadow-2xl transition-all duration-500 hover:border-brand-cyan/50">
                                <div className="aspect-video relative w-full overflow-hidden rounded-lg bg-gray-800 flex items-center justify-center">
                                    {/* Placeholder state */}
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        {placeholderUrl ? (
                                            <img src={placeholderUrl} alt="Loading..." className="w-full h-full object-cover opacity-30 animate-pulse" />
                                        ) : (
                                            <Loader2 className="w-8 h-8 text-gray-600 animate-spin" />
                                        )}
                                        <Loader2 className="absolute w-8 h-8 text-brand-cyan animate-spin" />
                                    </div>
                                    <img 
                                        src={result.imageUrl} 
                                        alt="Uploaded for identification" 
                                        loading="lazy"
                                        className="relative z-10 w-full h-full object-contain transition-transform duration-700 ease-out group-hover:scale-105 opacity-0" 
                                        onLoad={(e) => {
                                            const target = e.target as HTMLImageElement;
                                            target.classList.remove('opacity-0');
                                            target.previousElementSibling?.classList.add('hidden');
                                        }}
                                    />
                                </div>
                                <div className="absolute inset-0 bg-brand-cyan/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl pointer-events-none z-20"></div>
                            </div>
                        )}
                        <div>
                            <h3 className="text-sm font-black text-brand-cyan uppercase tracking-widest mb-3 flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-brand-cyan animate-pulse"></div>
                                AI Analysis Summary
                            </h3>
                            <div className="p-5 bg-gray-900/60 rounded-2xl border border-gray-700 shadow-inner">
                                <p className="text-gray-300 whitespace-pre-wrap text-sm leading-relaxed">{result.summary}</p>
                            </div>
                        </div>
                        {result.sources && result.sources.length > 0 && (
                            <div>
                                <h3 className="text-sm font-black text-gray-500 uppercase tracking-widest mb-3">Verification Sources</h3>
                                <ul className="space-y-2">
                                    {result.sources.map((source, index) => (
                                        <li key={index} className="group">
                                            <a href={source.web?.uri} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-3 bg-gray-800/40 rounded-xl border border-gray-700 hover:border-brand-cyan/50 hover:bg-gray-800 transition-all group">
                                                <span className="text-gray-300 text-xs group-hover:text-white truncate pr-4">
                                                    {source.web?.title || source.web?.uri}
                                                </span>
                                                <svg className="w-4 h-4 text-gray-600 group-hover:text-brand-cyan transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
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