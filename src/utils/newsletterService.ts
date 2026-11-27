/**
 * Newsletter service — all subscriber operations go through the
 * `newsletter` edge function; the newsletter_subscribers table has no
 * public access at all.
 */
import { supabase } from '../lib/supabaseClient';

interface SubscriptionData {
  email: string;
  firstName?: string;
  source?: string;
  preferences?: {
    productUpdates?: boolean;
    promotions?: boolean;
    recipes?: boolean;
  };
  language?: string;
}

async function callNewsletter(body: Record<string, unknown>): Promise<any> {
  const { data, error } = await supabase.functions.invoke('newsletter', { body });
  if (error) {
    const detail = (error as any)?.context?.error;
    throw new Error(typeof detail === 'string' ? detail : error.message);
  }
  return data;
}

/**
 * Subscribe a user to the newsletter (creates pending subscription)
 */
export async function subscribeToNewsletter(data: SubscriptionData): Promise<{
  success: boolean;
  message: string;
  isExisting?: boolean;
}> {
  try {
    const result = await callNewsletter({ action: 'subscribe', ...data });
    if (result.isExisting) {
      return {
        success: false,
        message: 'This email is already subscribed to our newsletter',
        isExisting: true
      };
    }
    return { success: result.success, message: result.message ?? 'Subscription created' };
  } catch (error: any) {
    console.error('Error in subscription process:', error);
    return { success: false, message: error.message || 'Failed to create subscription' };
  }
}

// Static flag to prevent duplicate confirm calls (React StrictMode double-effects)
const processedTokens = new Set<string>();

export async function confirmSubscription(token: string): Promise<{
  success: boolean;
  message: string;
  subscriber?: {
    email: string;
    firstName?: string;
    language?: string;
  };
}> {
  if (processedTokens.has(token)) {
    return {
      success: true,
      message: 'Your subscription is already confirmed',
      subscriber: { email: 'already.confirmed@example.com', language: 'sl' }
    };
  }
  processedTokens.add(token);

  try {
    if (!token) return { success: false, message: 'No confirmation token provided' };
    const result = await callNewsletter({ action: 'confirm', token });
    return {
      success: result.success,
      message: result.message ?? '',
      subscriber: result.subscriber,
    };
  } catch (error: any) {
    console.error('Error confirming subscription:', error);
    return { success: false, message: error.message || 'Failed to confirm subscription' };
  }
}

export async function unsubscribeFromNewsletter(token: string): Promise<{
  success: boolean;
  message: string;
  email?: string;
}> {
  try {
    if (!token) return { success: false, message: 'No unsubscribe token provided' };
    const result = await callNewsletter({ action: 'unsubscribe', token });
    return {
      success: result.success,
      message: result.message ?? '',
      email: result.email,
    };
  } catch (error: any) {
    console.error('Error unsubscribing from newsletter:', error);
    return { success: false, message: error.message || 'Failed to unsubscribe from newsletter' };
  }
}

export async function updateSubscriberPreferences(
  token: string,
  preferences: {
    productUpdates?: boolean;
    promotions?: boolean;
    recipes?: boolean;
  }
): Promise<{
  success: boolean;
  message: string;
}> {
  try {
    if (!token) return { success: false, message: 'No token provided' };
    const result = await callNewsletter({ action: 'update-preferences', token, preferences });
    return { success: result.success, message: result.message ?? '' };
  } catch (error: any) {
    console.error('Error updating preferences:', error);
    return { success: false, message: error.message || 'Failed to update preferences' };
  }
}
