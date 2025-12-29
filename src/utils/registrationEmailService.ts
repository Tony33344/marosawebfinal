import { sendEmail } from './emailService';
import { generateRegistrationConfirmationEmailHtml, generateRegistrationConfirmationEmailText } from '../templates/registrationConfirmationEmail';

const DEFAULT_FROM_EMAIL = 'kmetija.marosa.narocila@gmail.com';
const REPLY_TO_EMAIL = 'kmetija.marosa.narocila@gmail.com';
// Set BASE_URL dynamically based on environment
const BASE_URL = (() => {
  if (import.meta.env.DEV) {
    if (typeof window !== 'undefined') {
      return window.location.origin;
    }
    return 'http://localhost:5173';
  }

  // In production, use the current domain automatically
  // This works for both test (marosatest.netlify.app) and production (marosakreditna.netlify.app)
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }

  // Fallback for server-side rendering
  return 'https://marosakreditna.netlify.app';
})();

/**
 * Send simple welcome email after registration (like newsletter)
 * @param data Object containing email, fullName, and userId
 * @returns Object with success status and message
 */
export async function sendRegistrationConfirmationEmail(data: {
  email: string;
  fullName?: string;
  userId: string;
  language?: string;
}): Promise<{ success: boolean; message: string }> {
  try {
    const { email, fullName, language = 'sl' } = data;

    // Generate simple welcome email content (no confirmation needed)
    const htmlContent = generateRegistrationConfirmationEmailHtml({
      fullName,
      confirmationUrl: `${BASE_URL}/login`, // Just link to login page
      language
    });

    const textContent = generateRegistrationConfirmationEmailText({
      fullName,
      confirmationUrl: `${BASE_URL}/login`,
      language
    });

    // Determine subject based on language
    const subject = (() => {
      if (language === 'sl') return 'Dobrodošli na Kmetiji Maroša!';
      if (language === 'en') return 'Welcome to Kmetija Maroša!';
      if (language === 'de') return 'Willkommen bei Kmetija Maroša!';
      if (language === 'hr') return 'Dobrodošli u Kmetiju Maroša!';
      return 'Dobrodošli na Kmetiji Maroša!';
    })();

    try {
      // Send the email using the same service as newsletter
      const emailResult = await sendEmail({
        to: email,
        subject,
        body: JSON.stringify({
          html: htmlContent,
          text: textContent,
          isWelcome: true
        }),
        from: DEFAULT_FROM_EMAIL,
        replyTo: REPLY_TO_EMAIL
      });

      return emailResult;
    } catch (emailError: any) {
      console.error('Error in email sending service:', emailError);

      // For development/testing, return success even if email fails
      if (import.meta.env.DEV) {
        console.log('Development mode: Simulating successful email send');
        return {
          success: true,
          message: 'Development mode: Email would be sent in production'
        };
      }

      throw emailError;
    }
  } catch (error: any) {
    console.error('Error sending welcome email:', error);
    return {
      success: false,
      message: error.message || 'Failed to send welcome email'
    };
  }
}
