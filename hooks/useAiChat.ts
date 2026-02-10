import { useState, useRef, useCallback } from 'react';
import { GoogleGenAI, Chat } from '@google/genai';
import { AiChatState, ChatMessage, LogEntry } from '../types';
import { parseApiError } from '../services/geminiService';

export const useAiChat = (addLog: (level: LogEntry['level'], message: string) => void) => {
    const [state, setState] = useState<AiChatState>('idle');
    const [history, setHistory] = useState<ChatMessage[]>([]);
    const [error, setError] = useState<string | null>(null);
    const chatSessionRef = useRef<Chat | null>(null);

    const startChat = useCallback((systemInstruction: string) => {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
        addLog('INFO', 'AI Chat session started.');
        chatSessionRef.current = ai.chats.create({
            model: 'gemini-3-flash-preview',
            config: { systemInstruction },
        });
        setHistory([]);
        setState('idle');
        setError(null);
    }, [addLog]);

    const endChat = useCallback(() => {
        addLog('INFO', 'AI Chat session ended.');
        chatSessionRef.current = null;
        setHistory([]);
        setState('idle');
        setError(null);
    }, [addLog]);

    const sendMessage = useCallback(async (message: string) => {
        if (!chatSessionRef.current || state === 'thinking') {
            return;
        }

        setState('thinking');
        setError(null);
        
        // Add user message to history immediately
        setHistory(prev => [...prev, { role: 'user', parts: [{ text: message }] }]);

        try {
            const response = await chatSessionRef.current.sendMessageStream({ message });
            
            let currentModelResponse = "";
            let modelMessageIndex = -1;

            for await (const chunk of response) {
                currentModelResponse += chunk.text;
                setHistory(prev => {
                    const newHistory = [...prev];
                    if (modelMessageIndex < 0) {
                        modelMessageIndex = newHistory.length;
                        newHistory.push({ role: 'model', parts: [{ text: currentModelResponse }] });
                    } else {
                        newHistory[modelMessageIndex] = { role: 'model', parts: [{ text: currentModelResponse }] };
                    }
                    return newHistory;
                });
            }
            addLog('INFO', 'AI Chat received a response.');
        } catch (e) {
            const errorMessage = parseApiError(e);
            setError(errorMessage);
            setState('error');
            addLog('ERROR', `AI Chat error: ${errorMessage}`);
        } finally {
            setState('idle');
        }
    }, [state, addLog]);

    return {
        state,
        history,
        error,
        startChat,
        endChat,
        sendMessage,
    };
};
