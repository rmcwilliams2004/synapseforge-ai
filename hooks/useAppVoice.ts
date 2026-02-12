import { useEffect, useRef, useState } from 'react';
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

    useEffect(() => {
        // Trigger greeting only when entering the 'app' workspace and after any potential onboarding is handled
        if (user && viewMode === 'app' && !hasGreetedRef.current) {
            hasGreetedRef.current = true;
            setIsActivating(true);
            
            if (isSilenced) {
                setIsActivating(false);
                return;
            }

            const timeOfDayGreeting = getGreeting();
            let briefing = "";

            if (user.is_first_login) {
                briefing = `
                    ${timeOfDayGreeting}, Creator. Welcome to the Synapse Forge. 
                    Your sovereign vault is now active and fully isolated. 
                    To ensure your intellectual property is mathematically sound, SynapseForge operates on a Verification Gate system. 
                    The IP and Patent modules will remain in standby until the Numerical Abstraction Layer confirms your design is physically viable. 
                    Once the NAL solves the geometry, I will notify you that the vault is ready for export.
                    Ready to forge.
                `;
                
                setTimeout(() => window.dispatchEvent(new CustomEvent('forge-highlight', { detail: 'structural' })), 6500);
                setTimeout(() => window.dispatchEvent(new CustomEvent('forge-highlight', { detail: 'logic' })), 8500);
                setTimeout(() => window.dispatchEvent(new CustomEvent('forge-highlight', { detail: 'sovereignty' })), 10500);

                setTimeout(() => {
                    onUpdateUser({ ...user, is_first_login: false });
                }, 15000);
            } else if (activeProjectName && domainFocus) {
                briefing = `${timeOfDayGreeting}, Creator. Your vault for '${activeProjectName}' is initialized. 
                I have successfully mapped the ${domainFocus} constraints to the Numerical Abstraction Layer and updated the material mesh tensors. 
                The Forge is awaiting your command.`;
            } else {
                briefing = `${timeOfDayGreeting}, Creator. The Forge is initialized and awaiting your command.`;
            }
            
            const speakTimer = setTimeout(() => {
                tts.speak(briefing, 'Zephyr');
            }, 800);

            const activationTimer = setTimeout(() => {
                setIsActivating(false);
            }, 12000); 

            return () => {
                clearTimeout(speakTimer);
                clearTimeout(activationTimer);
            };
        }
    }, [user, viewMode, tts, onUpdateUser, activeProjectName, domainFocus, isSilenced]);

    // --- State-Triggered System Feedback ---
    useEffect(() => {
        if (!user || isSilenced) return;

        const handleStatusChange = (e: any) => {
            const status = e.detail;
            let script = "";
            
            switch (status) {
                case SystemState.CALIBRATING:
                    script = "The NAL is currently reconciling your geometry with the material physical constants. One moment while I stabilize the lattice.";
                    break;
                case SystemState.DEEP_SOLVE:
                    script = "Performing a high-precision NAL convergence, Creator. This will take approximately five seconds to finalize the geometric integrity.";
                    break;
                case 'SOLVED':
                    script = "The math has converged, Creator. Structural integrity is confirmed. The IP Vault is now unlocked.";
                    break;
                case 'THROTTLED':
                    script = "I’ve paused background inference to preserve compute velocity for your manual overrides. Click Optimize when you are ready for a new suggestion.";
                    break;
                case 'LOCKED':
                    script = "Design committed. Design fingerprint generated. Commencing formal intellectual property synthesis.";
                    break;
                default:
                    return;
            }

            if (script) {
                window.dispatchEvent(new CustomEvent('forge-log', { detail: `[VOICE]: Queuing status update: "${status}"` }));
                tts.speak(script, 'Zephyr');
            }
        };

        const handleMilestone = (e: any) => {
            const milestone = e.detail;
            const script = `Innovation Milestone Achieved: ${milestone.title}. ${milestone.description}`;
            window.dispatchEvent(new CustomEvent('forge-log', { detail: `[VOICE]: Milestone triggered: ${milestone.id}` }));
            tts.speak(script, 'Kore');
        };

        window.addEventListener('forge-status', handleStatusChange);
        window.addEventListener('forge-milestone', handleMilestone);

        return () => {
            window.removeEventListener('forge-status', handleStatusChange);
            window.removeEventListener('forge-milestone', handleMilestone);
        };
    }, [user, isSilenced, tts]);

    return { isActivating };
};