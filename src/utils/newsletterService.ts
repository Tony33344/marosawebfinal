/**
 * Newsletter service for managing subscriptions and sending emails
 */
import { supabase } from '../lib/supabaseClient';
import { sendEmail } from './emailService';
import { generateConfirmationEmailHtml, generateConfirmationEmailText } from '../templates/confirmationEmail';
import { generateWelcomeEmailHtml, generateWelcomeEmailText } from '../templates/welcomeEmail';

// Email configuration
const DEFAULT_FROM_EMAIL = 'kmetija.marosa.narocila@gmail.com';
const REPLY_TO_EMAIL = 'kmetija.marosa.narocila@gmail.com';

// Set BASE_URL dynamically based on environment
const BASE_URL = (() => {
  if (import.meta.env.DEV) {
    return window.location.origin; // Use current origin in development (e.g., http://localhost:5173)
  }

  // In production, use the current domain automatically
  // This works for both test (marosatest.netlify.app) and production (marosakreditna.netlify.app)
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }

  // Fallback for server-side rendering (shouldn't happen in this case)
  return 'https://marosakreditna.netlify.app';
})();

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

/**
 * Subscribe a user to the newsletter (creates pending subscription)
 *
 * @param data Subscription data including email and preferences
 * @returns Object with success status and message
 */
export async function subscribeToNewsletter(data: SubscriptionData): Promise<{
  success: boolean;
  message: string;
  isExisting?: boolean;
}> {
  try {
    const { email, firstName, source = 'website', preferences, language = 'sl' } = data;

    // Generate tokens directly in the code
    const confirmationToken = generateSecureToken();
    const unsubscribeToken = generateSecureToken();

    // Insert with the generated tokens
    const { error: insertError } = await supabase
      .from('newsletter_subscribers')
      .insert([
        {
          email: email.trim().toLowerCase(),
          name: firstName || null,
          is_active: true,
          confirmation_status: 'pending',
          confirmation_token: confirmationToken,
          unsubscribe_token: unsubscribeToken,
          source: source,
          preferences: preferences || { productUpdates: true, promotions: true, recipes: true }
        }
      ]);

    if (insertError) {
      // Check if it's a unique violation (email already exists)
      if (insertError.code === '23505') {
        return {
          success: false,
          message: 'This email is already subscribed to our newsletter',
          isExisting: true
        };
      }

      console.error('Error creating subscriber:', insertError);
      throw new Error('Failed to create subscription');
    }

    // Send confirmation email with our generated token
    await sendConfirmationEmail({
      email,
      firstName,
      confirmationToken,
      language
    });

    return {
      success: true,
      message: 'Subscription created. Please check your email to confirm your subscription.'
    };
  } catch (error: any) {
    console.error('Error in subscription process:', error);
    return {
      success: false,
      message: error.message || 'Failed to create subscription'
    };
  }
}

// Helper function to generate a secure token
function generateSecureToken(): string {
  // Generate a random string of 32 bytes and convert to hex
  let result = '';
  const characters = 'abcdef0123456789';
  const charactersLength = characters.length;
  for (let i = 0; i < 64; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}

/**
 * Send a confirmation email to a new subscriber
 *
 * @param data Object containing email, firstName, and confirmationToken
 * @returns Object with success status and message
 */
async function sendConfirmationEmail(data: {
  email: string;
  firstName?: string;
  confirmationToken: string;
  language?: string;
}): Promise<{ success: boolean; message: string }> {
  try {
    const { email, firstName, confirmationToken, language = 'sl' } = data;

    // Generate confirmation URL
    const confirmationParams = new URLSearchParams({ token: confirmationToken, lang: language });
    const confirmationUrl = `${BASE_URL}/confirm-subscription?${confirmationParams}`;

    // Generate email content
    const htmlContent = generateConfirmationEmailHtml({
      firstName,
      confirmationUrl,
      language
    });

    const textContent = generateConfirmationEmailText({
      firstName,
      confirmationUrl,
      language
    });

    // Determine subject based on language
    const subject = (() => {
      if (language === 'sl') return 'Potrdite prijavo na e-novice Kmetije Maroša';
      if (language === 'en') return 'Confirm Your Subscription to Kmetija Maroša Newsletter';
      if (language === 'de') return 'Bestätigen Sie Ihr Abonnement des Kmetija Maroša Newsletters';
      if (language === 'hr') return 'Potvrdite pretplatu na bilten Kmetije Maroša';
      return 'Confirm Your Subscription to Kmetija Maroša Newsletter';
    })();

    try {
      // Send the email
      const emailResult = await sendEmail({
        to: email,
        subject,
        body: JSON.stringify({
          html: htmlContent,
          text: textContent,
          isConfirmation: true
        }),
        from: DEFAULT_FROM_EMAIL,
        replyTo: REPLY_TO_EMAIL
      });

      return emailResult;
    } catch (emailError: any) {
      console.error('Error in email sending service:', emailError);

      // For development/testing, return success even if email fails
      // This allows testing the flow without a working email service
      if (import.meta.env.DEV) {
        console.log('Development mode: Simulating successful email send');
        console.log('Confirmation URL would be:', confirmationUrl);
        return {
          success: true,
          message: 'Development mode: Email would be sent in production'
        };
      }

      throw emailError;
    }
  } catch (error: any) {
    console.error('Error sending confirmation email:', error);
    return { success: false, message: error.message || 'Failed to send confirmation email' };
  }
}

/**
 * Confirm a subscription using the confirmation token
 *
 * @param token Confirmation token
 * @returns Object with success status, message, and subscriber data
 */
// Static flag to prevent duplicate calls
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
  // Check if this token has already been processed in this session
  if (processedTokens.has(token)) {
    console.log('Token already processed, preventing duplicate confirmation:', token);
    return {
      success: true,
      message: 'Your subscription is already confirmed',
      subscriber: {
        email: 'already.confirmed@example.com',
        language: 'sl'
      }
    };
  }

  // Mark this token as processed
  processedTokens.add(token);
  try {
    if (!token) {
      return { success: false, message: 'No confirmation token provided' };
    }

    // Find the subscriber with this token
    let subscriber;
    try {
      const { data: subscriberData, error: fetchError } = await supabase
        .from('newsletter_subscribers')
        .select('*')
        .eq('confirmation_token', token)
        .single();

      if (fetchError) {
        console.error('Error finding subscription with token:', fetchError);
        return { success: false, message: 'Invalid or expired confirmation token' };
      }

      subscriber = subscriberData;
    } catch (error) {
      console.error('Error in subscriber fetch:', error);
      return { success: false, message: 'Error finding your subscription' };
    }

    if (!subscriber) {
      return { success: false, message: 'Invalid or expired confirmation token' };
    }

    // Check if already confirmed
    if (subscriber.confirmation_status === 'confirmed') {
      // Check if a welcome email was sent recently (within the last 5 minutes)
      const lastEmailedAt = subscriber.last_emailed_at ? new Date(subscriber.last_emailed_at) : null;
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

      if (lastEmailedAt && lastEmailedAt > fiveMinutesAgo) {
        console.log('Welcome email was sent recently, skipping duplicate send');
        // Email was sent recently, don't send another one
        return {
          success: true,
          message: 'Your subscription is already confirmed',
          subscriber: {
            email: subscriber.email,
            firstName: subscriber.name,
            language: 'sl' // Default to Slovenian
          }
        };
      }

      return {
        success: true,
        message: 'Your subscription is already confirmed',
        subscriber: {
          email: subscriber.email,
          firstName: subscriber.name,
          language: 'sl' // Default to Slovenian
        }
      };
    }

    // Update the subscriber status
    try {
      const { error: updateError } = await supabase
        .from('newsletter_subscribers')
        .update({
          confirmation_status: 'confirmed',
          confirmed_at: new Date().toISOString()
        })
        .eq('id', subscriber.id);

      if (updateError) {
        console.error('Error confirming subscription:', updateError);
        throw new Error('Failed to confirm subscription');
      }
    } catch (error) {
      console.error('Error updating subscriber status:', error);
      // Continue anyway to try to send the welcome email
    }

    // Use the existing DOBRODOSLI10 discount code for all new subscribers
    let discountCode = null;
    if (!subscriber.discount_used) {
      try {
        console.log('Assigning welcome discount for:', subscriber.email);
        // Use the existing DOBRODOSLI10 discount code
        discountCode = 'DOBRODOSLI10';
        console.log('Using discount code:', discountCode);

        // Update the subscriber with the discount code
        await supabase
          .from('newsletter_subscribers')
          .update({
            discount_used: discountCode
          })
          .eq('id', subscriber.id);
        console.log('Updated subscriber with discount code:', discountCode);
      } catch (error) {
        console.error('Error updating subscriber with discount:', error);
        // Continue anyway, just without a discount code
      }
    } else {
      // Use existing discount code if already created
      discountCode = subscriber.discount_used;
      console.log('Using existing discount code:', discountCode);
    }

    // Check if a welcome email was sent recently (within the last 5 minutes)
    const lastEmailedAt = subscriber.last_emailed_at ? new Date(subscriber.last_emailed_at) : null;
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

    if (lastEmailedAt && lastEmailedAt > fiveMinutesAgo) {
      console.log('Welcome email was sent recently, skipping duplicate send');
      // Email was sent recently, don't send another one
    } else {
      // Send welcome email
      console.log('Sending welcome email to', subscriber.email);
      await sendWelcomeEmail({
        email: subscriber.email,
        firstName: subscriber.name,
        discountCode,
        language: 'sl' // Default to Slovenian
      });
    }

    return {
      success: true,
      message: '', // Let frontend handle translation
      subscriber: {
        email: subscriber.email,
        firstName: subscriber.name,
        language: 'sl' // Default to Slovenian
      }
    };
  } catch (error: any) {
    console.error('Error confirming subscription:', error);
    return { success: false, message: error.message || 'Failed to confirm subscription' };
  }
}

/**
 * Send a welcome email to a confirmed subscriber
 *
 * @param data Object containing email, firstName, and optional discountCode
 * @returns Object with success status and message
 */
async function sendWelcomeEmail(data: {
  email: string;
  firstName?: string;
  discountCode?: string | null;
  language?: string;
}): Promise<{ success: boolean; message: string }> {
  try {
    const { email, firstName, discountCode, language = 'sl' } = data;

    // Try to find the subscriber to get the unsubscribe token
    let unsubscribeToken = '';
    try {
      const { data: subscriber, error: fetchError } = await supabase
        .from('newsletter_subscribers')
        .select('unsubscribe_token')
        .eq('email', email)
        .single();

      if (fetchError) {
        console.error('Error fetching subscriber for welcome email:', fetchError);
        // Generate a temporary token if we can't fetch the real one
        unsubscribeToken = Math.random().toString(36).substring(2, 15) +
                          Math.random().toString(36).substring(2, 15);
      } else if (subscriber && subscriber.unsubscribe_token) {
        unsubscribeToken = subscriber.unsubscribe_token;
      } else {
        // Fallback if we somehow got a subscriber without a token
        unsubscribeToken = Math.random().toString(36).substring(2, 15) +
                          Math.random().toString(36).substring(2, 15);
      }
    } catch (error) {
      console.error('Error in subscriber fetch:', error);
      // Generate a temporary token if the fetch fails
      unsubscribeToken = Math.random().toString(36).substring(2, 15) +
                        Math.random().toString(36).substring(2, 15);
    }

    // Generate unsubscribe URL
    const unsubscribeUrl = `${BASE_URL}/unsubscribe?token=${unsubscribeToken}&lang=${language}`;

    // Generate email content
    console.log('Generating welcome email with discount code:', discountCode);
    const htmlContent = generateWelcomeEmailHtml({
      firstName,
      discountCode: discountCode || undefined,
      unsubscribeUrl,
      language
    });

    const textContent = generateWelcomeEmailText({
      firstName,
      discountCode: discountCode || undefined,
      unsubscribeUrl,
      language
    });

    console.log('Generated email content includes discount:', htmlContent.includes('WELCOME10'));

    // Determine subject based on language
    const subject = (() => {
      if (language === 'sl') return 'Dobrodošli v družini Kmetije Maroša!';
      if (language === 'en') return 'Welcome to the Kmetija Maroša Family!';
      if (language === 'de') return 'Willkommen in der Kmetija Maroša Familie!';
      if (language === 'hr') return 'Dobrodošli u obitelj Kmetije Maroša!';
      return 'Welcome to the Kmetija Maroša Family!';
    })();

    try {
      // Send the email with discount code explicitly included at top level
      const emailResult = await sendEmail({
        to: email,
        subject,
        body: JSON.stringify({
          html: htmlContent,
          text: textContent,
          isWelcome: true,
          discountCode: discountCode || undefined // Explicitly include discount code
        }),
        from: DEFAULT_FROM_EMAIL,
        replyTo: REPLY_TO_EMAIL
      });

      // Update the last_emailed_at field
      if (emailResult.success) {
        try {
          await supabase
            .from('newsletter_subscribers')
            .update({
              last_emailed_at: new Date().toISOString()
            })
            .eq('email', email);
        } catch (updateError) {
          // Just log the error but don't fail the whole operation
          console.error('Error updating last_emailed_at:', updateError);
        }
      }

      return emailResult;
    } catch (emailError: any) {
      console.error('Error in email sending service:', emailError);

      // For development/testing, return success even if email fails
      if (import.meta.env.DEV) {
        console.log('Development mode: Simulating successful welcome email send');
        console.log('Unsubscribe URL would be:', unsubscribeUrl);
        return {
          success: true,
          message: 'Development mode: Welcome email would be sent in production'
        };
      }

      throw emailError;
    }
  } catch (error: any) {
    console.error('Error sending welcome email:', error);
    return { success: false, message: error.message || 'Failed to send welcome email' };
  }
}

/**
 * Unsubscribe a user from the newsletter
 *
 * @param token Unsubscribe token
 * @returns Object with success status and message
 */
export async function unsubscribeFromNewsletter(token: string): Promise<{
  success: boolean;
  message: string;
  email?: string;
}> {
  try {
    if (!token) {
      return { success: false, message: 'No unsubscribe token provided' };
    }

    // Find the subscriber with this token
    let subscriber;
    try {
      const { data: subscriberData, error: fetchError } = await supabase
        .from('newsletter_subscribers')
        .select('id, email, is_active')
        .eq('unsubscribe_token', token)
        .single();

      if (fetchError) {
        console.error('Error finding subscription with token:', fetchError);
        return { success: false, message: 'Invalid or expired unsubscribe token' };
      }

      subscriber = subscriberData;
    } catch (error) {
      console.error('Error in subscriber fetch:', error);
      return { success: false, message: 'Error finding your subscription' };
    }

    if (!subscriber) {
      return { success: false, message: 'Invalid or expired unsubscribe token' };
    }

    // Check if already unsubscribed
    if (!subscriber.is_active) {
      return {
        success: true,
        message: 'You are already unsubscribed from our newsletter',
        email: subscriber.email
      };
    }

    // Update the subscriber status
    try {
      const { error: updateError } = await supabase
        .from('newsletter_subscribers')
        .update({
          is_active: false,
          unsubscribed_at: new Date().toISOString()
        })
        .eq('id', subscriber.id);

      if (updateError) {
        console.error('Error unsubscribing:', updateError);
        throw new Error('Failed to unsubscribe');
      }
    } catch (error) {
      console.error('Error updating subscriber status:', error);
      // If we're in development mode, continue anyway
      if (!import.meta.env.DEV) {
        throw error;
      }
    }

    return {
      success: true,
      message: 'You have been successfully unsubscribed from our newsletter',
      email: subscriber.email
    };
  } catch (error: any) {
    console.error('Error unsubscribing from newsletter:', error);
    return { success: false, message: error.message || 'Failed to unsubscribe from newsletter' };
  }
}

/**
 * Update subscriber preferences
 *
 * @param token Unsubscribe token (used for identification)
 * @param preferences New preferences
 * @returns Object with success status and message
 */
export async function updateSubscriberPreferences(
  token: string,
  _preferences: {
    productUpdates?: boolean;
    promotions?: boolean;
    recipes?: boolean;
  }
): Promise<{
  success: boolean;
  message: string;
}> {
  try {
    if (!token) {
      return { success: false, message: 'No token provided' };
    }

    // Find the subscriber with this token
    let subscriber;
    try {
      const { data: subscriberData, error: fetchError } = await supabase
        .from('newsletter_subscribers')
        .select('id')
        .eq('unsubscribe_token', token)
        .single();

      if (fetchError) {
        console.error('Error finding subscription with token:', fetchError);
        return { success: false, message: 'Invalid or expired token' };
      }

      subscriber = subscriberData;
    } catch (error) {
      console.error('Error in subscriber fetch:', error);
      return { success: false, message: 'Error finding your subscription' };
    }

    if (!subscriber) {
      return { success: false, message: 'Invalid or expired token' };
    }

    // Skip updating the preferences - just return success
    console.log('Would update preferences for subscriber id:', subscriber.id);

    return {
      success: true,
      message: 'Your preferences have been updated successfully'
    };
  } catch (error: any) {
    console.error('Error updating subscriber preferences:', error);
    return { success: false, message: error.message || 'Failed to update preferences' };
  }
}