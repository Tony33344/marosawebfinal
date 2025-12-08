import React, { useMemo } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { useTranslation } from 'react-i18next';
import { useFeatureFlag } from '../../hooks/useFeatureFlag';
import { Download, Copy, Check } from 'lucide-react';

interface UPNQRCodeProps {
  // Recipient info
  recipientName: string;
  recipientIBAN: string;
  recipientReference?: string;
  
  // Payment details
  amount: number;
  purpose: string;
  paymentCode?: string; // Default: OTHR
  
  // Optional
  dueDate?: string;
  orderId?: string;
  
  // Display options
  size?: number;
  showDetails?: boolean;
}

/**
 * UPN QR Code Generator for Slovenian Bank Transfers
 * Generates a QR code compatible with Slovenian banking apps
 * 
 * Format based on EPC QR code standard used in Slovenia
 */
export const UPNQRCode: React.FC<UPNQRCodeProps> = ({
  recipientName,
  recipientIBAN,
  recipientReference = '',
  amount,
  purpose,
  paymentCode = 'OTHR',
  dueDate,
  orderId,
  size = 200,
  showDetails = true
}) => {
  const { t } = useTranslation();
  const enabled = useFeatureFlag('upn_qr_code');
  const [copied, setCopied] = React.useState(false);

  // Generate UPN QR code data string
  const qrData = useMemo(() => {
    // Clean IBAN (remove spaces)
    const cleanIBAN = recipientIBAN.replace(/\s/g, '');
    
    // Format amount (2 decimal places, no currency symbol)
    const formattedAmount = amount.toFixed(2);
    
    // Build EPC QR code format
    // This is compatible with most Slovenian banking apps
    const lines = [
      'BCD',                          // Service Tag
      '002',                          // Version
      '1',                            // Character set (UTF-8)
      'SCT',                          // Identification (SEPA Credit Transfer)
      '',                             // BIC (optional for Slovenia)
      recipientName.substring(0, 70), // Recipient name (max 70 chars)
      cleanIBAN,                      // Recipient IBAN
      `EUR${formattedAmount}`,        // Amount with currency
      paymentCode,                    // Purpose code
      recipientReference,             // Creditor reference
      purpose.substring(0, 140),      // Remittance info (max 140 chars)
      ''                              // Beneficiary to originator info (optional)
    ];
    
    return lines.join('\n');
  }, [recipientName, recipientIBAN, amount, purpose, paymentCode, recipientReference]);

  // Copy IBAN to clipboard
  const copyIBAN = async () => {
    try {
      await navigator.clipboard.writeText(recipientIBAN.replace(/\s/g, ''));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy IBAN:', err);
    }
  };

  // Download QR code as image
  const downloadQR = () => {
    const svg = document.getElementById('upn-qr-code');
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      canvas.width = size;
      canvas.height = size;
      ctx?.drawImage(img, 0, 0);
      
      const link = document.createElement('a');
      link.download = `upn-qr-${orderId || 'payment'}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    };

    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  };

  if (!enabled) {
    return null;
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        {t('payment.upnQrTitle', 'Plačilo z UPN QR kodo')}
      </h3>
      
      <div className="flex flex-col md:flex-row gap-6">
        {/* QR Code */}
        <div className="flex flex-col items-center">
          <div className="bg-white p-4 rounded-lg border-2 border-gray-100">
            <QRCodeSVG
              id="upn-qr-code"
              value={qrData}
              size={size}
              level="M"
              includeMargin={true}
              bgColor="#ffffff"
              fgColor="#000000"
            />
          </div>
          
          <button
            onClick={downloadQR}
            className="mt-3 flex items-center gap-2 text-sm text-brown-600 hover:text-brown-700"
          >
            <Download className="w-4 h-4" />
            {t('payment.downloadQR', 'Prenesi QR kodo')}
          </button>
        </div>

        {/* Payment Details */}
        {showDetails && (
          <div className="flex-1 space-y-4">
            <p className="text-sm text-gray-600">
              {t('payment.upnQrInstructions', 'Skenirajte QR kodo z vašo mobilno bančno aplikacijo za hitro plačilo.')}
            </p>

            <div className="space-y-3 text-sm">
              <div>
                <span className="text-gray-500">{t('payment.recipient', 'Prejemnik')}:</span>
                <p className="font-medium text-gray-900">{recipientName}</p>
              </div>

              <div>
                <span className="text-gray-500">IBAN:</span>
                <div className="flex items-center gap-2">
                  <p className="font-mono font-medium text-gray-900">{recipientIBAN}</p>
                  <button
                    onClick={copyIBAN}
                    className="p-1 hover:bg-gray-100 rounded"
                    title={t('payment.copyIBAN', 'Kopiraj IBAN')}
                  >
                    {copied ? (
                      <Check className="w-4 h-4 text-green-500" />
                    ) : (
                      <Copy className="w-4 h-4 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <span className="text-gray-500">{t('payment.amount', 'Znesek')}:</span>
                <p className="font-medium text-gray-900 text-lg">{amount.toFixed(2)} €</p>
              </div>

              <div>
                <span className="text-gray-500">{t('payment.purpose', 'Namen')}:</span>
                <p className="font-medium text-gray-900">{purpose}</p>
              </div>

              {recipientReference && (
                <div>
                  <span className="text-gray-500">{t('payment.reference', 'Referenca')}:</span>
                  <p className="font-mono font-medium text-gray-900">{recipientReference}</p>
                </div>
              )}

              {dueDate && (
                <div>
                  <span className="text-gray-500">{t('payment.dueDate', 'Rok plačila')}:</span>
                  <p className="font-medium text-gray-900">{dueDate}</p>
                </div>
              )}
            </div>

            <div className="mt-4 p-3 bg-amber-50 rounded-lg">
              <p className="text-xs text-amber-800">
                {t('payment.upnQrNote', 'Opomba: Po plačilu boste prejeli potrditev na e-pošto. Naročilo bo odposlano po prejemu plačila.')}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * Pre-configured UPN QR for Kmetija Maroša
 */
export const MarosaUPNQRCode: React.FC<{
  amount: number;
  orderId: string;
  purpose?: string;
}> = ({ amount, orderId, purpose }) => {
  return (
    <UPNQRCode
      recipientName="Kmetija Maroša"
      recipientIBAN="SI56 0510 0801 5831 183" // Replace with actual IBAN
      recipientReference={`SI00 ${orderId}`}
      amount={amount}
      purpose={purpose || `Naročilo ${orderId}`}
      orderId={orderId}
      size={180}
      showDetails={true}
    />
  );
};

export default UPNQRCode;
