import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Ticket, Check, X, AlertCircle } from 'lucide-react';
import { validateDiscountCode } from '../utils/discountUtils';
import { DiscountCodeDisplay } from './DiscountCodeDisplay';

interface DiscountCode {
  id: number;
  code: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  min_order_amount: number | null;
  max_uses: number | null;
  current_uses: number;
  valid_from: string;
  valid_until: string | null;
  is_active: boolean;
  calculatedDiscount?: number;
}

interface DiscountCodeInputProps {
  orderTotal?: number;
  subtotal?: number; // Alias for orderTotal - some pages use this prop name
  onApply: (discountCode: DiscountCode | null) => void;
  onDiscountChange?: (discountAmount: number) => void;
  currentDiscount?: DiscountCode | null; // For controlled component usage
}

export function DiscountCodeInput({ orderTotal, subtotal, onApply, onDiscountChange, currentDiscount }: DiscountCodeInputProps) {
  // Support both orderTotal and subtotal prop names
  const total = orderTotal ?? subtotal ?? 0;
  const { t } = useTranslation();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [appliedCode, setAppliedCode] = useState<DiscountCode | null>(currentDiscount ?? null);

  // Sync with external currentDiscount prop if provided
  useEffect(() => {
    if (currentDiscount !== undefined) {
      setAppliedCode(currentDiscount);
    }
  }, [currentDiscount]);

  const handleApplyCode = async () => {
    if (!code.trim()) {
      setError(t('checkout.discount.emptyCode'));
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Use the validation function from discountUtils
      const result = await validateDiscountCode(code.trim().toUpperCase(), total);

      if (!result.valid) {
        // Map the generic error messages to translated ones
        if (result.message?.includes('Invalid')) {
          setError(t('checkout.discount.invalidCode'));
        } else if (result.message?.includes('Expired')) {
          setError(t('checkout.discount.expiredCode'));
        } else if (result.message?.includes('Maximum uses')) {
          setError(t('checkout.discount.maxUsesReached'));
        } else if (result.message?.includes('Minimum order')) {
          setError(t('checkout.discount.minOrderAmount', {
            amount: result.message.match(/[\d.]+/)?.[0] || '0'
          }));
        } else {
          setError(t('checkout.discount.error'));
        }
        return;
      }

      // Use the discount data from the validation result
      const discountData: DiscountCode = {
        ...result.discountData,
        calculatedDiscount: result.discountAmount
      };

      setAppliedCode(discountData);
      onApply(discountData);

      // Call onDiscountChange with the calculated discount amount
      if (onDiscountChange) {
        onDiscountChange(result.discountAmount);
      }
    } catch (err) {
      console.error('Error applying discount code:', err);
      setError(t('checkout.discount.error'));
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveCode = () => {
    setAppliedCode(null);
    setCode('');
    onApply(null);

    // Reset discount amount to 0
    if (onDiscountChange) {
      onDiscountChange(0);
    }
  };

  return (
    <div className="mt-6 border border-amber-200 rounded-lg p-4 bg-amber-50">
      <div className="flex items-center mb-4">
        <Ticket className="w-5 h-5 text-amber-600 mr-2" />
        <h3 className="text-lg font-medium text-amber-800">
          <DiscountCodeDisplay type="title" />
        </h3>
      </div>

      {appliedCode ? (
        <div className="bg-green-50 border border-green-200 rounded-md p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Check className="w-5 h-5 text-green-500 mr-2" />
              <div>
                <p className="text-green-700 font-medium">{appliedCode.code}</p>
                <p className="text-green-600 text-sm">
                  {appliedCode.discount_type === 'percentage'
                    ? t('checkout.discount.percentOff', { percent: appliedCode.discount_value })
                    : t('checkout.discount.amountOff', {
                        amount: appliedCode.discount_value.toFixed(2),
                      })}
                </p>
              </div>
            </div>
            <button
              type="button"
              className="text-gray-400 hover:text-gray-500"
              onClick={handleRemoveCode}
              aria-label={t('checkout.discount.remove')}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="flex space-x-2">
            <input
              type="text"
              className="shadow-sm focus:ring-amber-500 focus:border-amber-500 block w-full sm:text-sm border-gray-300 rounded-md uppercase"
              placeholder={t('checkout.discount.placeholder', 'Enter discount code')}
              value={code}
              onChange={(e) => setCode(e.target.value)}
            />
            <button
              type="button"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-amber-600 hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500"
              onClick={handleApplyCode}
              disabled={loading}
            >
              {loading
                ? <DiscountCodeDisplay type="applying" />
                : <DiscountCodeDisplay type="apply" />
              }
            </button>
          </div>

          {error && (
            <div className="mt-2 flex items-center text-sm text-red-600">
              <AlertCircle className="w-4 h-4 mr-1" />
              {error}
            </div>
          )}
        </>
      )}
    </div>
  );
}
