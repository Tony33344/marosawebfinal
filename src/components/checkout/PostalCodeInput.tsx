import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { getCityFromPostalCode, isValidSlovenianPostalCode } from '../../data/slovenianPostalCodes';
import { useFeatureFlag } from '../../hooks/useFeatureFlag';
import { Check, AlertCircle } from 'lucide-react';

interface PostalCodeInputProps {
  postalCode: string;
  city: string;
  onPostalCodeChange: (postalCode: string) => void;
  onCityChange: (city: string) => void;
  postalCodeError?: string;
  cityError?: string;
  disabled?: boolean;
  required?: boolean;
}

/**
 * PostalCodeInput component with auto-fill city functionality
 * Controlled by the 'postal_code_autofill' feature flag
 */
export const PostalCodeInput: React.FC<PostalCodeInputProps> = ({
  postalCode,
  city,
  onPostalCodeChange,
  onCityChange,
  postalCodeError,
  cityError,
  disabled = false,
  required = true
}) => {
  const { t } = useTranslation();
  const autofillEnabled = useFeatureFlag('postal_code_autofill');
  const [autoFilled, setAutoFilled] = useState(false);
  const [isValidating, setIsValidating] = useState(false);

  // Auto-fill city when postal code changes
  useEffect(() => {
    if (!autofillEnabled) return;
    
    const cleanCode = postalCode.replace(/\s/g, '').trim();
    
    if (cleanCode.length === 4) {
      setIsValidating(true);
      
      // Small delay for UX
      const timer = setTimeout(() => {
        const foundCity = getCityFromPostalCode(cleanCode);
        if (foundCity) {
          onCityChange(foundCity);
          setAutoFilled(true);
        } else {
          setAutoFilled(false);
        }
        setIsValidating(false);
      }, 300);

      return () => clearTimeout(timer);
    } else {
      setAutoFilled(false);
    }
  }, [postalCode, autofillEnabled, onCityChange]);

  const handlePostalCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 4);
    onPostalCodeChange(value);
    setAutoFilled(false);
  };

  const isValid = postalCode.length === 4 && isValidSlovenianPostalCode(postalCode);
  const showSuccess = autofillEnabled && isValid && autoFilled && !isValidating;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Postal Code Input */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {t('checkout.postalCode', 'Poštna številka')}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
        <div className="relative">
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            value={postalCode}
            onChange={handlePostalCodeChange}
            disabled={disabled}
            placeholder="1000"
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-brown-500 focus:border-transparent ${
              postalCodeError 
                ? 'border-red-500' 
                : showSuccess 
                  ? 'border-green-500' 
                  : 'border-gray-300'
            } ${disabled ? 'bg-gray-100' : ''}`}
            maxLength={4}
            aria-label={t('checkout.postalCodeAriaLabel', 'Enter 4-digit postal code')}
          />
          {/* Status indicators */}
          {autofillEnabled && postalCode.length === 4 && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              {isValidating && (
                <div className="w-4 h-4 border-2 border-brown-500 border-t-transparent rounded-full animate-spin" />
              )}
              {showSuccess && (
                <Check className="w-5 h-5 text-green-500" />
              )}
              {!isValidating && postalCode.length === 4 && !isValid && (
                <AlertCircle className="w-5 h-5 text-amber-500" />
              )}
            </div>
          )}
        </div>
        {postalCodeError && (
          <p className="mt-1 text-sm text-red-500">{postalCodeError}</p>
        )}
        {!isValid && postalCode.length === 4 && !postalCodeError && (
          <p className="mt-1 text-sm text-amber-600">
            {t('checkout.postalCodeNotFound', 'Poštna številka ni v bazi - vnesite mesto ročno')}
          </p>
        )}
      </div>

      {/* City Input */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {t('checkout.city', 'Mesto')}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
        <div className="relative">
          <input
            type="text"
            value={city}
            onChange={(e) => {
              onCityChange(e.target.value);
              setAutoFilled(false);
            }}
            disabled={disabled}
            placeholder={t('checkout.cityPlaceholder', 'Ljubljana')}
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-brown-500 focus:border-transparent ${
              cityError 
                ? 'border-red-500' 
                : autoFilled && autofillEnabled
                  ? 'border-green-500 bg-green-50' 
                  : 'border-gray-300'
            } ${disabled ? 'bg-gray-100' : ''}`}
            aria-label={t('checkout.cityAriaLabel', 'Enter city name')}
          />
          {autoFilled && autofillEnabled && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <span className="text-xs text-green-600 bg-green-100 px-2 py-0.5 rounded">
                {t('checkout.autoFilled', 'Samodejno')}
              </span>
            </div>
          )}
        </div>
        {cityError && (
          <p className="mt-1 text-sm text-red-500">{cityError}</p>
        )}
      </div>
    </div>
  );
};

export default PostalCodeInput;
