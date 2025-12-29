import { supabase } from '../lib/supabaseClient';

/**
 * Interface for time-limited discount data
 */
export interface TimeLimitedDiscount {
  id: string;
  code: string;
  description: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  min_order_amount: number | null;
  max_uses: number | null;
  current_uses: number;
  valid_from: string;
  valid_until: string;
  is_active: boolean;
  category?: string;
  product_id?: string;
  product_name?: string;
  // Banner-related fields
  banner_text?: string;
  show_in_banner?: boolean;
  banner_start_time?: string;
  banner_end_time?: string;
}

/**
 * Fetches active time-limited discounts from the database
 * @returns Array of active time-limited discounts
 */
export async function fetchActiveBannerDiscounts(): Promise<TimeLimitedDiscount[]> {
  try {
    const now = new Date().toISOString();

    // Query for active discounts that are valid now, have show_in_banner set to true,
    // and are within the banner display time window
    const { data, error } = await supabase
      .from('discount_codes')
      .select('*')
      .eq('is_active', true)
      .eq('show_in_banner', true)
      .lte('valid_from', now)
      .gte('valid_until', now)
      .order('valid_until', { ascending: true });

    if (error) {
      console.error('Error fetching active banner discounts:', error);

      // If we're in development mode, return a hardcoded discount for testing
      return [];
    }

    // Further filter based on banner_start_time and banner_end_time if they exist
    const bannerDiscounts = data.filter(discount => {
      // If banner times are not set, fall back to the discount validity period
      const bannerStartTime = discount.banner_start_time || discount.valid_from;
      const bannerEndTime = discount.banner_end_time || discount.valid_until;

      const currentDate = new Date();
      // Check if current time is within the banner display window
      return new Date(bannerStartTime) <= currentDate && new Date(bannerEndTime) >= currentDate;
    });

    return bannerDiscounts;
  } catch (err) {
    console.error('Unexpected error fetching active banner discounts:', err);
    return [];
  }
}

/**
 * Gets the most relevant discount to show in the banner
 * @returns The most relevant discount or null if none are available
 */
export async function getActiveBannerDiscount(): Promise<TimeLimitedDiscount | null> {
  const discounts = await fetchActiveBannerDiscounts();
  return discounts.length > 0 ? discounts[0] : null;
}
