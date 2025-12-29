import { useState, useEffect } from 'react';
import { getActiveBannerDiscount, TimeLimitedDiscount } from '../services/discountService';

/**
 * Hook to manage time-limited offers
 * @returns Object containing the active discount and loading state
 */
export function useTimeLimitedOffer() {
  const [discount, setDiscount] = useState<TimeLimitedDiscount | null>(null);
  const [loading, setLoading] = useState(true);
  const [dismissed, setDismissed] = useState(false);

  // Check if the offer has been dismissed before
  useEffect(() => {
    const isDismissed = localStorage.getItem('limited_offer_dismissed') === 'true';
    if (isDismissed) {
      setDismissed(true);
    }
  }, []);

  // Fetch active discount on mount
  useEffect(() => {
    const fetchDiscount = async () => {
      try {
        setLoading(true);
        const activeDiscount = await getActiveBannerDiscount();

        // If no active discount is found, create a fallback for testing
        if (!activeDiscount && import.meta.env.DEV) {
          console.log('No active discount found, using fallback for testing');

          // Create a fallback discount that expires in 7 days
          // Create dates in 2025
          const currentDate = new Date();
          const year2025Date = new Date(currentDate);
          year2025Date.setFullYear(2025);

          const futureDate = new Date(currentDate);
          futureDate.setFullYear(2025);
          futureDate.setMonth(futureDate.getMonth() + 1); // Add 1 month

          const fallbackDiscount: TimeLimitedDiscount = {
            id: '0b1b22f4-e423-41bd-8f91-ac1e6399ebcd',
            code: 'BREZPOSTNINE',
            description: 'Brezplačna poštnina',
            discount_type: 'fixed',
            discount_value: 3.90,
            min_order_amount: 20.00,
            max_uses: null,
            current_uses: 0,
            valid_from: year2025Date.toISOString(),
            valid_until: futureDate.toISOString(),
            is_active: true,
            banner_text: 'Dobrodošli! Uporabite kodo BREZPOSTNINE za €3.90 popusta pri nakupu nad €20!',
            show_in_banner: true,
            banner_start_time: year2025Date.toISOString(),
            banner_end_time: futureDate.toISOString()
          };

          setDiscount(fallbackDiscount);
        } else {
          setDiscount(activeDiscount);
        }
      } catch (err) {
        console.error('Error fetching active discount:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDiscount();
  }, []);

  // Handle dismissing the offer
  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem('limited_offer_dismissed', 'true');
  };

  // Reset the dismissed state (for testing)
  const resetDismissed = () => {
    setDismissed(false);
    localStorage.removeItem('limited_offer_dismissed');
  };

  return {
    discount,
    loading,
    dismissed,
    handleDismiss,
    resetDismissed
  };
}
