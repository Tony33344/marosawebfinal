import { supabase } from '../lib/supabaseClient';

/**
 * Creates a welcome discount code in the database
 * @param email The email address of the user
 * @returns The discount code or null if there was an error
 */
export async function createWelcomeDiscount(email: string): Promise<string | null> {
  try {
    // Generate a unique discount code based on email
    const discountCode = `WELCOME10_${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    
    // Create a new discount code in the database
    const { error } = await supabase
      .from('discount_codes')
      .insert([
        {
          code: discountCode,
          discount_type: 'percentage',
          discount_value: 10,
          min_order_amount: null,
          max_uses: 1,
          current_uses: 0,
          valid_from: new Date().toISOString(),
          valid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // Valid for 30 days
          is_active: true,
          description: 'Welcome discount for new subscribers',
          user_email: email
        }
      ]);

    if (error) {
      console.error('Error creating welcome discount:', error);
      return null;
    }

    return discountCode;
  } catch (err) {
    console.error('Unexpected error creating welcome discount:', err);
    return null;
  }
}

/**
 * Validates a discount code
 * @param code The discount code to validate
 * @param orderTotal The total order amount
 * @returns An object with the validation result
 */
export async function validateDiscountCode(code: string, orderTotal: number): Promise<{
  valid: boolean;
  message?: string;
  discountAmount?: number;
  discountPercent?: number;
  discountData?: any;
}> {
  try {
    // Validation runs server-side in the validate_discount_code RPC —
    // the discount_codes table is not readable by public clients.
    const { data, error } = await supabase.rpc('validate_discount_code', {
      p_code: code.trim().toUpperCase(),
      p_order_total: orderTotal,
    });

    if (error || !data) {
      return { valid: false, message: 'Error validating discount code' };
    }

    return data;
  } catch (err) {
    console.error('Error validating discount code:', err);
    return { valid: false, message: 'Error validating discount code' };
  }
}

/**
 * Applies a discount code (increments the usage count)
 * @param code The discount code to apply
 * @returns Whether the operation was successful
 */
export async function applyDiscountCode(code: string): Promise<boolean> {
  try {
    // Get the current discount code
    const { data, error: fetchError } = await supabase
      .from('discount_codes')
      .select('current_uses')
      .eq('code', code.trim().toUpperCase())
      .single();

    if (fetchError) {
      return false;
    }

    // Increment the usage count
    const { error: updateError } = await supabase
      .from('discount_codes')
      .update({ current_uses: (data.current_uses || 0) + 1 })
      .eq('code', code.trim().toUpperCase());

    if (updateError) {
      return false;
    }

    return true;
  } catch (err) {
    console.error('Error applying discount code:', err);
    return false;
  }
}
