import React, { useState } from 'react';
import { MessageCircle, Copy, X } from 'lucide-react';
import { useLanguage } from '../hooks/useLanguage';
import { openWhatsApp } from '../utils/whatsapp';

interface WhatsAppPromptProps {
  isOpen: boolean;
  onClose: () => void;
  customerName: string;
  phone?: string;
  message: string;
}

export function WhatsAppPrompt({ isOpen, onClose, customerName, phone, message }: WhatsAppPromptProps) {
  const { t } = useLanguage();
  const [manualPhone, setManualPhone] = useState('');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const effectivePhone = phone || manualPhone;
  const hasValidPhone = effectivePhone.replace(/\D/g, '').length === 10;

  const handleSend = () => {
    openWhatsApp(effectivePhone, message);
    onClose();
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(message);
    setCopied(true);
    setTimeout(onClose, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg p-5 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center shrink-0">
              <MessageCircle size={20} className="text-green-700" />
            </div>
            <div>
              <p className="font-bold text-gray-800 text-base">{t('whatsappSendNow')}</p>
              <p className="text-sm text-gray-500">{customerName}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center text-gray-400 active:text-gray-600">
            <X size={20} />
          </button>
        </div>

        {/* Phone input if not saved */}
        {!phone && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('whatsappEnterNumber')}</label>
            <input
              type="tel"
              inputMode="numeric"
              value={manualPhone}
              onChange={e => setManualPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
              placeholder="10 digit number"
              className="w-full border border-gray-300 rounded-xl px-3 py-3 text-base focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-3">
          {hasValidPhone ? (
            <button
              onClick={handleSend}
              className="flex-1 py-4 rounded-xl bg-green-700 text-white text-base font-semibold flex items-center justify-center gap-2 active:bg-green-800"
            >
              <MessageCircle size={18} />
              {t('whatsappYes')}
            </button>
          ) : (
            <button
              onClick={handleCopy}
              className="flex-1 py-4 rounded-xl bg-green-700 text-white text-base font-semibold flex items-center justify-center gap-2 active:bg-green-800"
            >
              <Copy size={18} />
              {copied ? t('whatsappSent') : t('whatsappCopyMessage')}
            </button>
          )}
          <button
            onClick={onClose}
            className="flex-1 py-4 rounded-xl border border-gray-300 text-gray-700 text-base font-semibold active:bg-gray-50"
          >
            {t('whatsappLater')}
          </button>
        </div>
      </div>
    </div>
  );
}
