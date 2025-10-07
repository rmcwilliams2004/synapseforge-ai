import React, { useLayoutEffect, useState, useRef } from 'react';

interface TourStep {
  targetId?: string;
  title: string;
  content: string;
  position?: 'top' | 'bottom' | 'center';
}

interface TourProps {
  isOpen: boolean;
  stepIndex: number;
  steps: readonly TourStep[];
  onClose: () => void;
  onNext: () => void;
  onPrev: () => void;
}

interface PopoverPosition {
  top: number;
  left: number;
}

export const Tour = ({ isOpen, stepIndex, steps, onClose, onNext, onPrev }: TourProps) => {
  const [popoverPosition, setPopoverPosition] = useState<PopoverPosition | null>(null);
  const currentStep = steps[stepIndex];
  const popoverRef = useRef<HTMLDivElement>(null);
  const [finalPosition, setFinalPosition] = useState(currentStep?.position || 'bottom');

  useLayoutEffect(() => {
    document.querySelectorAll('.tour-highlight').forEach(el => el.classList.remove('tour-highlight'));
    
    if (!isOpen || !currentStep) {
      return;
    }

    const popoverEl = popoverRef.current;

    if (currentStep.targetId) {
      const element = document.getElementById(currentStep.targetId);
      if (element && popoverEl) {
        element.classList.add('tour-highlight');
        element.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });

        const rect = element.getBoundingClientRect();
        const popoverRect = popoverEl.getBoundingClientRect();
        
        let position = currentStep.position || 'bottom';
        const offset = 15;

        // Check vertical bounds and flip if necessary to keep popover in viewport
        if (position === 'bottom' && rect.bottom + popoverRect.height + offset > window.innerHeight) {
          position = 'top';
        }
        if (position === 'top' && rect.top - popoverRect.height - offset < 0) {
          position = 'bottom';
        }
        
        setFinalPosition(position);

        const pos: PopoverPosition = { top: 0, left: 0 };
        if (position === 'top') {
          pos.top = rect.top - offset;
          pos.left = rect.left + rect.width / 2;
        } else {
          pos.top = rect.bottom + offset;
          pos.left = rect.left + rect.width / 2;
        }
        setPopoverPosition(pos);
      } else {
        setPopoverPosition(null);
      }
    } else {
      setPopoverPosition(null);
    }
  }, [isOpen, currentStep]);

  if (!isOpen) {
    return null;
  }

  const isFirstStep = stepIndex === 0;
  const isLastStep = stepIndex === steps.length - 1;

  const popoverStyle: React.CSSProperties = {};
  if (popoverPosition) {
    popoverStyle.top = `${popoverPosition.top}px`;
    popoverStyle.left = `${popoverPosition.left}px`;
    if (finalPosition === 'top') {
      popoverStyle.transform = 'translate(-50%, -100%)';
    } else {
      popoverStyle.transform = 'translateX(-50%)';
    }
  } else {
    popoverStyle.top = '50%';
    popoverStyle.left = '50%';
    popoverStyle.transform = 'translate(-50%, -50%)';
  }

  return (
    <>
      {!currentStep.targetId && <div className="tour-overlay" style={{ pointerEvents: 'auto' }} onClick={onClose} />}
      <div ref={popoverRef} className="tour-popover" style={popoverStyle}>
        {popoverPosition && <div className={`tour-popover-arrow ${finalPosition === 'top' ? 'bottom' : 'top'}`}></div>}
        <h3 className="text-xl font-bold text-brand-light mb-2">{currentStep.title}</h3>
        <p className="text-gray-300 mb-4">{currentStep.content}</p>
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-400">{stepIndex + 1} / {steps.length}</span>
          <div className="flex gap-2">
            {!isFirstStep && (
              <button onClick={onPrev} className="py-1 px-3 bg-gray-600 text-white font-semibold rounded-md hover:bg-gray-500 transition">
                Prev
              </button>
            )}
            <button onClick={isLastStep ? onClose : onNext} className="py-1 px-3 bg-brand-cyan text-white font-bold rounded-md hover:bg-cyan-500 transition">
              {isLastStep ? 'Finish' : 'Next'}
            </button>
          </div>
        </div>
        <button onClick={onClose} className="absolute top-2 right-2 text-gray-500 hover:text-white transition text-2xl font-bold">&times;</button>
      </div>
    </>
  );
};