import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

export const useForgeCredits = () => {
  const { user, updateProfile } = useAuth();
  const [isPricingOpen, setIsPricingOpen] = useState(false);

  const credits = user?.forgeCredits || 0;

  const openPricing = () => {
    setIsPricingOpen(true);
    window.dispatchEvent(new CustomEvent('open-pricing'));
  };

  const closePricing = () => {
    setIsPricingOpen(false);
  };

  const deductCredits = async (amount: number): Promise<boolean> => {
    if (!user) return false;
    if (credits < amount) {
      openPricing();
      return false;
    }

    try {
      updateProfile({
        forgeCredits: credits - amount
      });
      return true;
    } catch (error) {
      console.error('Failed to deduct credits:', error);
      return false;
    }
  };

  return {
    credits,
    deductCredits,
    openPricing,
    closePricing,
    isPricingOpen
  };
};
