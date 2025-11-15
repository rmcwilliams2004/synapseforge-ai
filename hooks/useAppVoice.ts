import { useEffect, useRef } from 'react';
import { User } from '../types';
import { useTts } from './useTts';

const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
};

export const useAppVoice = (tts: ReturnType<typeof useTts>, user: User | null) => {
    const hasGreetedRef = useRef(false);

    useEffect(() => {
        if (user && !hasGreetedRef.current) {
            hasGreetedRef.current = true;
            
            // Wait a moment for the UI to settle before speaking
            setTimeout(() => {
                const greeting = `${getGreeting()}, Creator. Welcome to SynapseForge AI. I am ready to assist. You can use the voice commander in the bottom right, or begin a new analysis.`;
                tts.speak(greeting, 'Zephyr');
            }, 1500);
        }
    }, [user, tts]);
};
