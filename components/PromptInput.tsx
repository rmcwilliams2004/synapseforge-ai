import React, { useRef, useState, useCallback, useEffect, useMemo } from 'react';
import { Faction, FactionId, User, InnovatorId } from '../types';
import { UseSetupAssistant } from '../hooks/useSetupAssistant';
import { ENGINEERING_PHILOSOPHIES } from '../constants';
import { RoiEditorModal } from './RoiEditorModal';
import { usePromptValidator } from '../hooks/usePromptValidator';
import { InnovatorSelector } from './InnovatorSelector';
import { transcribeAudio } from '../services/geminiService';

interface PromptInputProps {
  projectName: string;
  onProjectNameChange: (name: string) => void;
  prompt: string;
  onPromptChange: (prompt: string) => void;
  tags: string[];
  onTagsChange: (tags: string[]) => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  files: File[];
  onFilesChange: (files: File[]) => void;
  onEngage: () => void;
  isLoading: boolean;
  onClearFiles: () => void;
  isReady: boolean;
  authenticatedUser: User;
  setupAssistant: UseSetupAssistant;
  onApplyFactionSuggestion: (factionId: FactionId) => void;
  onReanalyzeWithFaction: () => void;
  selectedFaction: Faction | null;
  activeVersionFactionId: FactionId | undefined;
  promptValidator: ReturnType<typeof usePromptValidator>;
  selectedInnovatorId?: InnovatorId;
  onSelectInnovator: (id: InnovatorId) => void;
  isDeepThought: boolean;
  onToggleDeepThought: (active: boolean) => void;
}

const FileIcon = ({ type }: { type: string }) => {
    if (type.startsWith('image/')) return <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-cyan-400"><path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" /></svg>;
    if (type.startsWith('video/')) return <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-purple-400"><path strokeLinecap="round" strokeLinejoin="round" d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72V10.5Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 18h11.25a2.25 2.25 0 0 0 2.25-2.25V8.25A2.25 2.25 0 0 0 15 6H3.75A2.25 2.25 0 0 0 1.5 8.25v7.5A2.25 2.25 0 0 0 3.75 18Z" /></svg>;
    return <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-gray-400"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" /></svg>;
};

const TagInput = ({ tags, onTagsChange, disabled }: { tags: string[]; onTagsChange: (tags: string[]) => void; disabled: boolean; }) => {
    const [inputValue, setInputValue] = useState('');

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            const newTag = inputValue.trim();
            if (newTag && !tags.includes(newTag)) {
                onTagsChange([...tags, newTag]);
            }
            setInputValue('');
        }
    };

    const removeTag = (indexToRemove: number) => {
        onTagsChange(tags.filter((_, index) => index !== indexToRemove));
    };

    return (
        <div>
             <div className="flex flex-wrap gap-2 mb-2">
                {tags.map((tag, index) => (
                    <div key={index} className="flex items-center gap-1 px-2 py-1 text-xs rounded-full bg-purple-600/50 text-purple-200">
                        {tag}
                        <button onClick={() => !disabled && removeTag(index)} disabled={disabled} className="text-purple-200 hover:text-white disabled:cursor-not-allowed">
                            &times;
                        </button>
                    </div>
                ))}
            </div>
            <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Add tags (e.g., consumer electronics)..."
                className="w-full p-2 bg-gray-900/50 border-2 border-gray-700 rounded-lg text-gray-300 focus:ring-2 focus:ring-brand-cyan focus:border-brand-cyan transition disabled:opacity-50"
                disabled={disabled}
            />
        </div>
    );
};

export const PromptInput = ({ 
  projectName, 
  onProjectNameChange, 
  prompt, 
  onPromptChange, 
  tags,
  onTagsChange,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  files, 
  onFilesChange, 
  onEngage, 
  isLoading, 
  onClearFiles,
  isReady,
  authenticatedUser,
  setupAssistant,
  onApplyFactionSuggestion,
  onReanalyzeWithFaction,
  selectedFaction,
  activeVersionFactionId,
  promptValidator,
  selectedInnovatorId,
  onSelectInnovator,
  isDeepThought,
  onToggleDeepThought
}: PromptInputProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [roiEditorState, setRoiEditorState] = useState<{ isOpen: boolean; file: File | null; fileIndex: number | null }>({ isOpen: false, file: null, fileIndex: null });
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const isViewer = authenticatedUser.role === 'Viewer';
  const { validationResult, isChecking, checkPrompt, clearValidation, error: validationError } = promptValidator;

  const canReanalyze = selectedFaction && activeVersionFactionId && selectedFaction.id !== activeVersionFactionId;

  const handleOpenRoiEditor = (file: File, index: number) => {
      setRoiEditorState({ isOpen: true, file, fileIndex: index });
  };

  const handleCropComplete = (croppedFiles: File[]) => {
      if (roiEditorState.fileIndex !== null) {
          const newFiles = [...files];
          newFiles.splice(roiEditorState.fileIndex, 1, ...croppedFiles);
          onFilesChange(newFiles);
      }
      setRoiEditorState({ isOpen: false, file: null, fileIndex: null });
  };

  const handleClearAllFiles = () => {
    onClearFiles();
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  // Audio Transcription Feature: Uses gemini-3-flash-preview
  const startRecording = async () => {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;
        audioChunksRef.current = [];

        mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
                audioChunksRef.current.push(event.data);
            }
        };

        mediaRecorder.onstop = async () => {
            const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
            setIsTranscribing(true);
            try {
                const reader = new FileReader();
                reader.readAsDataURL(audioBlob);
                reader.onloadend = async () => {
                    const base64Audio = (reader.result as string).split(',')[1];
                    const transcription = await transcribeAudio({
                        inlineData: { data: base64Audio, mimeType: 'audio/webm' }
                    });
                    if (transcription) {
                        onPromptChange(prompt ? `${prompt}\n\n${transcription}` : transcription);
                    }
                };
            } catch (err) {
                console.error("Transcription failed", err);
            } finally {
                setIsTranscribing(false);
                stream.getTracks().forEach(track => track.stop());
            }
        };

        mediaRecorder.start();
        setIsRecording(true);
    } catch (err) {
        console.error("Microphone access denied", err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
        mediaRecorderRef.current.stop();
        setIsRecording(false);
    }
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const isUndo = (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'z';
      const isRedo = (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'y';
      const isMacRedo = event.metaKey && event.shiftKey && event.key.toLowerCase() === 'z';

      if (isUndo && !event.shiftKey) {
        event.preventDefault();
        if (canUndo) onUndo();
      } else if (isRedo || isMacRedo) {
        event.preventDefault();
        if (canRedo) onRedo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [canUndo, canRedo, onUndo, onRedo]);
  
  useEffect(() => {
    checkPrompt(prompt);
  }, [prompt, checkPrompt]);
  
  useEffect(() => {
    return () => clearValidation();
  }, [clearValidation]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles: File[] = Array.from(e.target.files);
      onFilesChange([...files, ...newFiles]);
    }
  };

  const handleDragEvents = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    handleDragEvents(e);
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true);
    }
  }, [handleDragEvents]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    handleDragEvents(e);
    setIsDragging(false);
  }, [handleDragEvents]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    handleDragEvents(e);
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        const droppedFiles: File[] = Array.from(e.dataTransfer.files);
        onFilesChange([...files, ...droppedFiles]);
    }
  }, [handleDragEvents, files, onFilesChange]);

  const recommendedFaction = useMemo(() => {
    if (!setupAssistant.suggestions) return null;
    return ENGINEERING_PHILOSOPHIES.find(f => f.id === setupAssistant.suggestions.recommendedFactionId);
  }, [setupAssistant.suggestions]);

  return (
    <div className="space-y-4">
      <div>
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-xl font-semibold text-brand-light">2. Project Details & Concept</h2>
          <div className="flex items-center gap-3">
            {/* Deep Thought Mode: Activates thinkingBudget logic */}
            <button
                onClick={() => onToggleDeepThought(!isDeepThought)}
                disabled={isLoading || isViewer}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition-all duration-300 border ${
                    isDeepThought 
                    ? 'bg-purple-900/40 border-purple-400 text-purple-200 shadow-[0_0_15px_rgba(168,85,247,0.4)]' 
                    : 'bg-gray-800 border-gray-600 text-gray-400 hover:border-purple-500/50'
                }`}
                title="Deep Thought Mode: Activates gemini-3-pro-preview with 32k thinking tokens for extreme reasoning."
            >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={`w-4 h-4 ${isDeepThought ? 'animate-pulse' : ''}`}><path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 0 0 1.5-.189m-1.5.189a6.01 6.01 0 0 1-1.5-.189m3.75 7.478a12.06 12.06 0 0 1-4.5 0m3.75 2.383a14.406 14.406 0 0 1-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 1 0-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" /></svg>
                {isDeepThought ? 'DEEP THOUGHT ACTIVE' : 'DEEP THOUGHT'}
            </button>

            <div className="h-4 w-px bg-gray-700 mx-1"></div>

            <button onClick={onUndo} disabled={!canUndo || isLoading || isViewer} className="p-2 text-gray-400 rounded-md hover:bg-gray-700 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition" title="Undo (Ctrl+Z)">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M9 15 3 9m0 0 6-6M3 9h12a6 6 0 0 1 0 12h-3" /></svg>
            </button>
            <button onClick={onRedo} disabled={!canRedo || isLoading || isViewer} className="p-2 text-gray-400 rounded-md hover:bg-gray-700 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition" title="Redo (Ctrl+Y)">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="m15 15 6-6m0 0-6-6m6 6H9a6 6 0 0 0 0 12h3" /></svg>
            </button>
          </div>
        </div>
         <input
          type="text"
          value={projectName}
          onChange={(e) => onProjectNameChange(e.target.value)}
          placeholder="Enter a name for your project..."
          className="w-full p-3 mb-3 bg-gray-800 border-2 border-gray-700 rounded-lg text-gray-300 focus:ring-2 focus:ring-brand-cyan focus:border-brand-cyan transition disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
          disabled={isLoading || isViewer}
        />
        <div className="relative group">
            <textarea
              id="tour-step-2"
              value={prompt}
              onChange={(e) => onPromptChange(e.target.value)}
              placeholder="Describe your design. You can also hold the microphone button to dictate requirements."
              className="w-full h-48 p-3 bg-gray-800 border-2 border-gray-700 rounded-lg text-gray-300 focus:ring-2 focus:ring-brand-cyan focus:border-brand-cyan transition disabled:opacity-50 disabled:cursor-not-allowed resize-none"
              disabled={isLoading || isViewer}
            />
            {/* Audio Transcription Microphone Tool */}
            <div className="absolute bottom-3 right-3 flex items-center gap-2">
                {isTranscribing && (
                    <span className="flex items-center gap-2 text-xs font-mono text-cyan-400 animate-pulse bg-gray-900/80 px-2 py-1 rounded">
                        <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                        TRANSCRIBING...
                    </span>
                )}
                <button
                    onMouseDown={startRecording}
                    onMouseUp={stopRecording}
                    onMouseLeave={stopRecording}
                    disabled={isLoading || isViewer || isTranscribing}
                    className={`p-3 rounded-full transition-all duration-200 shadow-lg ${
                        isRecording 
                        ? 'bg-red-600 text-white scale-110 animate-pulse' 
                        : 'bg-gray-700 text-gray-300 hover:bg-cyan-600 hover:text-white'
                    } disabled:opacity-50`}
                    title="Dictate engineering requirements (Direct Audio Transcription)"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 0 0 6-6v-1.5m-6 7.5a6 6 0 0 1-6-6v-1.5m12 0v-1.5a6 6 0 0 0-6-6v1.5m-6 0v-1.5a6 6 0 0 1 6-6v1.5m0 0v1.5m0-1.5a6 6 0 0 0-6 6v1.5m6-7.5a6 6 0 0 1 6 6v1.5" /></svg>
                </button>
            </div>
        </div>

        {(isChecking || validationResult || validationError) && (
          <div className={`mt-4 p-3 rounded-lg animate-fade-in flex items-start gap-3 ${validationError ? 'bg-red-900/30 border-red-700' : 'bg-gray-800/50 border-gray-700'}`}>
            {isChecking ? (
                <svg className="animate-spin h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
            ) : validationError ? (
                 <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" /></svg>
            ) : validationResult?.isClear ? (
                 <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>
            ) : (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" /></svg>
            )}
            <div>
              <h4 className="text-sm font-semibold text-gray-300">
                {isChecking ? 'Checking prompt clarity...' : validationError ? 'Validation Failed' : validationResult?.isClear ? 'Prompt is clear' : 'Prompt could be improved'}
              </h4>
              {validationError ? (
                 <p className="text-sm text-red-300/80 mt-1">{validationError}</p>
              ) : (validationResult && !validationResult.isClear && validationResult.suggestion && (
                <p className="text-sm text-yellow-300/80 mt-1">Suggestion: {validationResult.suggestion}</p>
              ))}
            </div>
          </div>
        )}

        <div className="mt-3">
            <TagInput tags={tags} onTagsChange={onTagsChange} disabled={isLoading || isViewer} />
        </div>
      </div>

      <InnovatorSelector 
          selectedId={selectedInnovatorId}
          onSelect={onSelectInnovator}
          disabled={isLoading || isViewer}
      />

      {(setupAssistant.isLoading || setupAssistant.suggestions || setupAssistant.error) && (
        <div className="p-4 bg-gray-800/50 border border-gray-700 rounded-lg animate-fade-in">
          <h3 className="text-md font-semibold text-brand-light mb-2 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-purple-400"><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456Z" /></svg>
            AI-Powered Setup Assistant
          </h3>
          {setupAssistant.isLoading && <p className="text-sm text-gray-400">Analyzing concept for suggestions...</p>}
          {setupAssistant.error && <p className="text-sm text-red-400">{setupAssistant.error}</p>}
          {setupAssistant.suggestions && recommendedFaction && (
            <div className="space-y-3">
              <div>
                <h4 className="text-sm font-semibold text-gray-300">Recommended Lens:</h4>
                <button onClick={() => onApplyFactionSuggestion(recommendedFaction.id)} className="text-left w-full p-2 mt-1 bg-cyan-900/40 border border-brand-cyan rounded-lg hover:bg-cyan-900/60 transition">
                  <p className="font-bold text-brand-cyan">{recommendedFaction.name}</p>
                  <p className="text-xs text-gray-300">{recommendedFaction.philosophy}</p>
                </button>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-gray-300">Suggested Tags:</h4>
                <div className="flex flex-wrap gap-2 mt-1">
                  {setupAssistant.suggestions.suggestedTags.map(tag => (
                    <button key={tag} onClick={() => onTagsChange(Array.from(new Set([...tags, tag])))} className="px-2 py-1 text-xs rounded-full bg-purple-600/50 text-purple-200 hover:bg-purple-600/80 transition">
                      + {tag}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      <div>
        <h2 className="text-xl font-semibold text-brand-light mb-3">3. Multimedia Input (Images, Videos, PDFs)</h2>
        <div
          id="tour-step-3"
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragEvents}
          onDrop={handleDrop}
          onClick={() => !(isLoading || isViewer) && fileInputRef.current?.click()}
          className={`relative flex flex-col items-center justify-center p-4 border-2 border-dashed rounded-lg transition
            ${isDragging ? 'border-brand-cyan bg-cyan-900/30' : 'border-gray-600 bg-gray-800'}
            ${(isLoading || isViewer) ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-gray-500'}`
          }
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            multiple
            accept="image/*,video/*,application/pdf"
            className="hidden"
            disabled={isLoading || isViewer}
          />
          {files.length === 0 ? (
            <div className="text-center py-4">
              <div className="flex gap-4 justify-center mb-2">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10 text-cyan-400">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
                </svg>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10 text-purple-400">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72V10.5Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 18h11.25a2.25 2.25 0 0 0 2.25-2.25V8.25A2.25 2.25 0 0 0 15 6H3.75A2.25 2.25 0 0 0 1.5 8.25v7.5A2.25 2.25 0 0 0 3.75 18Z" />
                </svg>
              </div>
              <p className="text-sm text-gray-400">Drag & drop files (Photos, Videos, PDFs) or click to browse</p>
              <p className="text-xs text-gray-500 mt-1">Video understanding and photo analysis powered by gemini-3-pro-preview.</p>
            </div>
          ) : (
            <div className="w-full text-left">
              <div className="flex justify-between items-center mb-2">
                <h4 className="text-sm font-semibold text-brand-light">Input Files:</h4>
                <button 
                  onClick={(e) => { e.stopPropagation(); handleClearAllFiles(); }} 
                  className="text-xs text-gray-400 hover:text-white disabled:opacity-50" 
                  title="Clear all files"
                  disabled={isLoading || isViewer}
                  >
                  Clear
                </button>
              </div>
              <ul className="text-xs space-y-1 max-h-36 overflow-y-auto pr-2">
                {files.map((file, index) => (
                   <li key={index} className="flex items-center justify-between gap-2 p-1 bg-gray-700/50 rounded group">
                        <div className="flex items-center gap-2 min-w-0">
                            <FileIcon type={file.type} />
                            <span className="truncate flex-1" title={file.name}>{file.name}</span>
                            {file.name.startsWith('roi_') && <span className="text-xs text-cyan-400 font-semibold flex-shrink-0">[ROI]</span>}
                        </div>
                        {file.type.startsWith('image/') && !file.name.startsWith('roi_') && !isViewer && (
                            <button
                                onClick={(e) => { e.stopPropagation(); handleOpenRoiEditor(file, index); }}
                                className="text-[10px] py-0.5 px-2 bg-gray-600 rounded hover:bg-gray-500 transition-transform active:scale-95 flex-shrink-0 opacity-0 group-hover:opacity-100"
                                disabled={isLoading}
                                title="Target a specific part of the photo for analysis"
                            >
                                Targeted ROI
                            </button>
                        )}
                    </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
       <RoiEditorModal 
          isOpen={roiEditorState.isOpen}
          file={roiEditorState.file}
          onClose={() => setRoiEditorState({ isOpen: false, file: null, fileIndex: null })}
          onCropComplete={handleCropComplete}
      />
      <div className="flex items-stretch gap-2">
        <button
          id="tour-step-4"
          onClick={onEngage}
          disabled={!isReady || isLoading || isViewer}
          className={`flex-grow py-3 px-4 text-white font-bold rounded-lg text-lg transition active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 ${
              isDeepThought 
              ? 'bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 shadow-[0_0_20px_rgba(168,85,247,0.3)]' 
              : 'bg-brand-cyan hover:bg-cyan-500'
          }`}
        >
          {isLoading ? (
            <>
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>{isDeepThought ? 'Deep Thinking In Progress...' : 'Synthesizing (Omni-Innovator)...'}</span>
            </>
          ) : (
            <>
            {isDeepThought && <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6 animate-pulse"><path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 0 0 1.5-.189m-1.5.189a6.01 6.01 0 0 1-1.5-.189m3.75 7.478a12.06 12.06 0 0 1-4.5 0m3.75 2.383a14.406 14.406 0 0 1-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 1 0-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" /></svg>}
            {validationResult && !validationResult.isClear && !isViewer && (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-yellow-300" title="Prompt could be improved"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" /></svg>
            )}
            {isViewer ? "Viewing Mode" : (isDeepThought ? "Engage Deep Thought Synthesis" : "Engage SynapseForge AI")}
            </>
          )}
        </button>
        <button
            onClick={onReanalyzeWithFaction}
            disabled={!canReanalyze || isLoading || isViewer}
            className="py-3 px-4 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-500 transition active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
            title={canReanalyze ? `Apply '${selectedFaction?.name}' and re-run analysis` : 'Select a different faction to enable re-analysis'}
        >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0 0 11.667 0l3.181-3.183m-4.991-2.691V5.25a3.375 3.375 0 0 0-3.375-3.375H8.25a3.375 3.375 0 0 0-3.375 3.375v4.992" /></svg>
            Apply Lens
        </button>
      </div>
    </div>
  );
};