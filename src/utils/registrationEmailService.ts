import { supabase } from '../lib/supabaseClient';

/**
 * Send welcome email after registration.
 * The send-registration-email edge function verifies the user actually
 * just registered before sending — it can't be used as a mail relay.
 */
export async function sendRegistrationConfirmationEmail(data: {
  email: string;
  fullName?: string;
  userId: string;
  language?: string;
}): Promise<{ success: boolean; message: string }> {
  try {
    const { data: result, error } = await supabase.functions.invoke('send-registration-email', {
      body: {
        userId: data.userId,
        fullName: data.fullName,
        language: data.language ?? 'sl',
      },
    });

    if (error || !result?.success) {
      console.error('Registration email failed:', error ?? result);
      return { success: false, message: 'Failed to send welcome email' };
    }

    return { success: true, message: 'Welcome email sent' };
  } catch (error: any) {
    console.error('Error sending welcome email:', error);
    return { success: false, message: error.message || 'Failed to send welcome email' };
  }
}
