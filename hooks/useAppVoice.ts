
import { useEffect, useRef, useState, useCallback } from 'react';
import { User, DomainCategory, SystemState } from '../types';
import { useTts } from './useTts';

const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
};

export const useAppVoice = (tts: ReturnType<typeof useTts>, user: User | null, viewMode: string, onUpdateUser: (user: User) => void, activeProjectName?: string, domainFocus?: DomainCategory) => {
    const [isActivating, setIsActivating] = useState(false);
    const hasGreetedRef = useRef(false);
    const isSilenced = user?.isSilenced || false;

    const playOrientation = useCallback(() => {
        if (!user) return;
        
        const timeOfDayGreeting = getGreeting();
        let briefing = "";

        if (user.is_first_login) {
            briefing = `
                ${timeOfDayGreeting}, ${user.name.split(' ')[0]}. Your sovereign vault is initialized. 
                System confirms Ultra-tier authorization. Rate limits are optimized for high-fidelity synthesis.
                SynapseForge operates on a formal Verification Gate system. 
                The IP and Patent modules will remain in standby until the Numerical Abstraction Layer confirms your design is physically viable. 
                I have identified several geometric optimization paths based on your previous work profile.
                DeVinci is online. What shall we build today?
            `;
            
            // Visual cues synced with orientation
            setTimeout(() => window.dispatchEvent(new CustomEvent('forge-highlight', { detail: 'structural' })), 6500);
            setTimeout(() => window.dispatchEvent(new CustomEvent('forge-highlight', { detail: 'logic' })), 8500);
            setTimeout(() => window.dispatchEvent(new CustomEvent('forge-highlight', { detail: 'sovereignty' })), 10500);

            setTimeout(() => {
                onUpdateUser({ ...user, is_first_login: false });
                window.dispatchEvent(new CustomEvent('forge-status', { detail: 'ACTIVE_LISTENING' }));
            }, 18000);
        } else if (activeProjectName && domainFocus) {
            briefing = `${timeOfDayGreeting}, Richard. Your vault for '${activeProjectName}' is initialized. 
            I have successfully mapped the ${domainFocus} constraints to the Numerical Abstraction Layer. 
            Proactive Suggestion mode is engaged. The Forge is ready.`;
        } else {
            briefing = `${timeOfDayGreeting}. The Forge is initialized. Ultra-tier authorization verified. We are ready to innovate.`;
        }
        
        tts.speak(briefing, 'Zephyr');
    }, [user, tts, onUpdateUser, activeProjectName, domainFocus]);

    useEffect(() => {
        // Trigger greeting only when entering the 'app' workspace and after auth/legal
        if (user && viewMode === 'app' && !hasGreetedRef.current && user.hasAcceptedLegal) {
            hasGreetedRef.current = true;
            setIsActivating(true);
            
            if (isSilenced) {
                setIsActivating(false);
                return;
            }

            const timer = setTimeout(() => {
                playOrientation();
                setIsActivating(false);
            }, 1500);

            return () => clearTimeout(timer);
        }
    }, [user, viewMode, user?.hasAcceptedLegal, isSilenced, playOrientation]);

    // Handle Admin overrides for voice
    useEffect(() => {
        const handleReplay = () => playOrientation();
        const handleSkip = () => {
            tts.stop();
            window.dispatchEvent(new CustomEvent('forge-status', { detail: 'ACTIVE_LISTENING' }));
        };

        window.addEventListener('forge-voice-replay', handleReplay);
        window.addEventListener('forge-voice-skip', handleSkip);

        return () => {
            window.removeEventListener('forge-voice-replay', handleReplay);
            window.removeEventListener('forge-voice-skip', handleSkip);
        };
    }, [playOrientation, tts]);

    return { isActivating, replayOrientation: playOrientation };
};
