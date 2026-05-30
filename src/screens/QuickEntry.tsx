import React, { useState, useEffect } from 'react';
import { useLanguage } from '../hooks/useLanguage';
import { useApp } from '../context/AppContext';
import { useData } from '../context/DataContext';
import { getAllCustomers, getAllSuppliers, calculateCustomerBalance } from '../db/queries';
import { Customer, Supplier } from '../db/index';
import { todayString } from '../utils/format';
import { WhatsAppPrompt } from '../components/WhatsAppPrompt';
import { buildDeliveryMessage, buildPaymentMessage } from '../utils/whatsapp';

interface QuickEntryProps {
  onClose: () => void;
  defaultPartyType?: 'customer' | 'supplier';
}

export function QuickEntry({ onClose, defaultPartyType = 'customer' }: QuickEntryProps) {
  const { t, lang } = useLanguage();
  const { state: appState, showToast } = useApp();
  const { createDeliveryEntry, createPaymentEntry } = useData();

  const [partyType, setPartyType] = useState<'customer' | 'supplier'>(defaultPartyType);
  const [entryType, setEntryType] = useState<'delivery' | 'payment'>('delivery');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [selectedPartyId, setSelectedPartyId] = useState('');
  const [litres, setLitres] = useState('');
  const [rate, setRate] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(todayString());
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [whatsAppData, setWhatsAppData] = useState<{ message: string; phone?: string; name: string } | null>(null);

  useEffect(() => {
    async function load() {
      const [c, s] = await Promise.all([getAllCustomers(), getAllSuppliers()]);
      setCustomers(c.filter(x => x.isActive));
      setSuppliers(s.filter(x => x.isActive));
    }
    load();
  }, []);

  useEffect(() => {
    if (entryType === 'delivery') {
      const defaultRate = partyType === 'customer'
        ? appState.defaultCustomerRate
        : appState.defaultSupplierRate;
      setRate(String(defaultRate));
    }
    setSelectedPartyId('');
  }, [partyType, entryType]);

  useEffect(() => {
    if (entryType === 'delivery' && litres && rate) {
      const calc = parseFloat(litres) * parseFloat(rate);
      setAmount(isNaN(calc) ? '' : calc.toFixed(2));
    }
  }, [litres, rate, entryType]);

  const parties = partyType === 'customer' ? customers : suppliers;

  const handleSave = async () => {
    if (!selectedPartyId) {
      showToast(partyType === 'customer' ? t('selectCustomer') : t('selectSupplier'), 'error');
      return;
    }

    setSaving(true);
    try {
      if (entryType === 'delivery') {
        if (!litres || !rate) {
          showToast(t('errorOccurred'), 'error');
          setSaving(false);
          return;
        }
        await createDeliveryEntry({
          type: partyType,
          partyId: selectedPartyId,
          date,
          litres: parseFloat(litres),
          rate: parseFloat(rate),
          note: note || undefined,
        });
      } else {
        if (!amount) {
          showToast(t('errorOccurred'), 'error');
          setSaving(false);
          return;
        }
        await createPaymentEntry({
          type: partyType,
          partyId: selectedPartyId,
          date,
          amount: parseFloat(amount),
          note: note || undefined,
        });
      }
      showToast(t('savedSuccessfully'));

      if (partyType === 'customer') {
        const customer = customers.find(c => c.id === selectedPartyId);
        if (customer) {
          const balance = await calculateCustomerBalance(selectedPartyId);
          const msg = entryType === 'delivery'
            ? buildDeliveryMessage({ lang, customerName: customer.name, date, litres: parseFloat(litres), rate: parseFloat(rate), amount: parseFloat(litres) * parseFloat(rate), balance })
            : buildPaymentMessage({ lang, customerName: customer.name, paymentAmount: parseFloat(amount), balance });
          setWhatsAppData({ message: msg, phone: customer.phone, name: customer.name });
          setSaving(false);
          return;
        }
      }
      onClose();
    } catch (err) {
      showToast(t('errorOccurred'), 'error');
    } finally {
      setSaving(false);
    }
  };

  if (whatsAppData) {
    return (
      <WhatsAppPrompt
        isOpen={true}
        onClose={() => { setWhatsAppData(null); onClose(); }}
        customerName={whatsAppData.name}
        phone={whatsAppData.phone}
        message={whatsAppData.message}
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* Party Type Toggle */}
      <div className="flex rounded-xl overflow-hidden border border-gray-200">
        <button
          onClick={() => setPartyType('customer')}
          className={`flex-1 py-3 text-base font-semibold transition-colors ${
            partyType === 'customer' ? 'bg-green-700 text-white' : 'bg-white text-gray-600'
          }`}
        >
          {t('customers')}
        </button>
        <button
          onClick={() => setPartyType('supplier')}
          className={`flex-1 py-3 text-base font-semibold transition-colors ${
            partyType === 'supplier' ? 'bg-green-700 text-white' : 'bg-white text-gray-600'
          }`}
        >
          {t('suppliers')}
        </button>
      </div>

      {/* Entry Type Toggle */}
      <div className="flex rounded-xl overflow-hidden border border-gray-200">
        <button
          onClick={() => setEntryType('delivery')}
          className={`flex-1 py-3 text-base font-semibold transition-colors ${
            entryType === 'delivery' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600'
          }`}
        >
          {t('deliveryEntry')}
        </button>
        <button
          onClick={() => setEntryType('payment')}
          className={`flex-1 py-3 text-base font-semibold transition-colors ${
            entryType === 'payment' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600'
          }`}
        >
          {t('paymentEntry')}
        </button>
      </div>

      {/* Party Select */}
      <div>
        <label className="block text-base font-medium text-gray-700 mb-1">
          {partyType === 'customer' ? t('selectCustomer') : t('selectSupplier')}
        </label>
        <select
          value={selectedPartyId}
          onChange={e => setSelectedPartyId(e.target.value)}
          className="w-full border border-gray-300 rounded-xl px-3 py-3 text-base bg-white focus:outline-none focus:ring-2 focus:ring-green-500"
        >
          <option value="">-- {partyType === 'customer' ? t('selectCustomer') : t('selectSupplier')} --</option>
          {parties.map(p => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      </div>

      {/* Delivery Fields */}
      {entryType === 'delivery' && (
        <>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-base font-medium text-gray-700 mb-1">{t('litres')}</label>
              <input
                type="number"
                inputMode="decimal"
                value={litres}
                onChange={e => setLitres(e.target.value)}
                placeholder="0"
                className="w-full border border-gray-300 rounded-xl px-3 py-3 text-base focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div>
              <label className="block text-base font-medium text-gray-700 mb-1">{t('rate')}</label>
              <input
                type="number"
                inputMode="decimal"
                value={rate}
                onChange={e => setRate(e.target.value)}
                placeholder="0"
                className="w-full border border-gray-300 rounded-xl px-3 py-3 text-base focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-base font-medium text-gray-700 mb-1">{t('amount')}</label>
            <div className="w-full border border-gray-200 rounded-xl px-3 py-3 text-base bg-gray-50 text-gray-700 font-semibold">
              ₹{amount || '0'}
            </div>
          </div>
        </>
      )}

      {/* Payment Fields */}
      {entryType === 'payment' && (
        <div>
          <label className="block text-base font-medium text-gray-700 mb-1">{t('amount')}</label>
          <input
            type="number"
            inputMode="decimal"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            placeholder="0"
            className="w-full border border-gray-300 rounded-xl px-3 py-3 text-base focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>
      )}

      {/* Date */}
      <div>
        <label className="block text-base font-medium text-gray-700 mb-1">{t('date')}</label>
        <input
          type="date"
          value={date}
          onChange={e => setDate(e.target.value)}
          className="w-full border border-gray-300 rounded-xl px-3 py-3 text-base focus:outline-none focus:ring-2 focus:ring-green-500"
        />
      </div>

      {/* Note */}
      <div>
        <label className="block text-base font-medium text-gray-700 mb-1">
          {t('note')} <span className="text-gray-400 text-sm">({t('optional')})</span>
        </label>
        <input
          type="text"
          value={note}
          onChange={e => setNote(e.target.value)}
          placeholder={t('note')}
          className="w-full border border-gray-300 rounded-xl px-3 py-3 text-base focus:outline-none focus:ring-2 focus:ring-green-500"
        />
      </div>

      {/* Buttons */}
      <div className="flex gap-3 pt-2">
        <button
          onClick={onClose}
          className="flex-1 py-4 rounded-xl border border-gray-300 text-gray-700 text-base font-semibold active:bg-gray-50"
        >
          {t('cancel')}
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex-1 py-4 rounded-xl bg-green-700 text-white text-base font-semibold active:bg-green-800 disabled:opacity-60"
        >
          {saving ? '...' : t('save')}
        </button>
      </div>
    </div>
  );
}
