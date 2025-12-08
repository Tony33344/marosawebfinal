import React from 'react';
import { useTranslation } from 'react-i18next';
import { Shield, Lock, Truck, RefreshCw, CreditCard, Award } from 'lucide-react';
import { useFeatureFlag } from '../../hooks/useFeatureFlag';

interface TrustBadgeProps {
  icon: React.ReactNode;
  title: string;
  description?: string;
}

const TrustBadge: React.FC<TrustBadgeProps> = ({ icon, title, description }) => (
  <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-100">
    <div className="flex-shrink-0 text-green-600">
      {icon}
    </div>
    <div>
      <div className="font-medium text-green-800 text-sm">{title}</div>
      {description && (
        <div className="text-xs text-green-600">{description}</div>
      )}
    </div>
  </div>
);

/**
 * Trust badges component for checkout page
 * Displays security and quality assurance badges
 * Controlled by 'trust_badges' feature flag
 */
export const TrustBadges: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const { t } = useTranslation();
  const enabled = useFeatureFlag('trust_badges');

  if (!enabled) return null;

  const badges = [
    {
      icon: <Lock className="w-5 h-5" />,
      title: t('checkout.trust.securePayment', 'Varno plačilo'),
      description: t('checkout.trust.securePaymentDesc', '256-bit SSL šifriranje')
    },
    {
      icon: <Shield className="w-5 h-5" />,
      title: t('checkout.trust.dataProtection', 'Zaščita podatkov'),
      description: t('checkout.trust.dataProtectionDesc', 'GDPR skladno')
    },
    {
      icon: <Truck className="w-5 h-5" />,
      title: t('checkout.trust.freeShipping', 'Brezplačna dostava'),
      description: t('checkout.trust.freeShippingDesc', 'Nad 50€ naročila')
    },
    {
      icon: <RefreshCw className="w-5 h-5" />,
      title: t('checkout.trust.easyReturns', 'Enostavno vračilo'),
      description: t('checkout.trust.easyReturnsDesc', '14 dni garancija')
    }
  ];

  if (compact) {
    return (
      <div className="flex flex-wrap justify-center gap-4 py-4 border-t border-gray-200">
        {badges.slice(0, 3).map((badge, index) => (
          <div 
            key={index}
            className="flex items-center gap-2 text-green-700 text-sm"
          >
            {badge.icon}
            <span>{badge.title}</span>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="mt-6 space-y-3">
      <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
        {t('checkout.trust.title', 'Zakaj kupovati pri nas?')}
      </h4>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {badges.map((badge, index) => (
          <TrustBadge key={index} {...badge} />
        ))}
      </div>
    </div>
  );
};

/**
 * Payment method logos
 */
export const PaymentMethodLogos: React.FC = () => {
  const { t } = useTranslation();
  const enabled = useFeatureFlag('payment_logos');

  if (!enabled) return null;

  return (
    <div className="mt-4 pt-4 border-t border-gray-200">
      <p className="text-xs text-gray-500 text-center mb-2">
        {t('checkout.acceptedPayments', 'Sprejemamo')}
      </p>
      <div className="flex justify-center items-center gap-4 opacity-70">
        <CreditCard className="w-8 h-8 text-gray-400" aria-label="Credit Cards" />
        {/* Visa, Mastercard logos could be added as images */}
        <div className="text-xs font-bold text-blue-800 bg-blue-100 px-2 py-1 rounded">VISA</div>
        <div className="text-xs font-bold text-red-800 bg-red-100 px-2 py-1 rounded">MasterCard</div>
        <div className="text-xs font-bold text-green-800 bg-green-100 px-2 py-1 rounded">Banka</div>
      </div>
    </div>
  );
};

/**
 * Quality guarantee badge
 */
export const QualityGuarantee: React.FC = () => {
  const { t } = useTranslation();
  const enabled = useFeatureFlag('quality_guarantee');

  if (!enabled) return null;

  return (
    <div className="mt-4 p-4 bg-amber-50 rounded-lg border border-amber-200">
      <div className="flex items-start gap-3">
        <Award className="w-8 h-8 text-amber-600 flex-shrink-0" />
        <div>
          <h4 className="font-semibold text-amber-900">
            {t('checkout.quality.title', 'Garancija kakovosti')}
          </h4>
          <p className="text-sm text-amber-800 mt-1">
            {t('checkout.quality.description', 
              'Vsi naši izdelki so naravni, lokalno pridelani in ročno pripravljeni. ' +
              'Če niste zadovoljni, vam vrnemo denar.'
            )}
          </p>
        </div>
      </div>
    </div>
  );
};

/**
 * Secure checkout header
 */
export const SecureCheckoutHeader: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="flex items-center justify-center gap-2 py-2 bg-green-600 text-white text-sm">
      <Lock className="w-4 h-4" />
      <span>{t('checkout.secureCheckout', 'Varna blagajna')}</span>
      <span className="text-green-200">|</span>
      <Shield className="w-4 h-4" />
      <span>{t('checkout.sslProtected', 'SSL zaščiteno')}</span>
    </div>
  );
};

export default TrustBadges;
