import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Check } from 'lucide-react';
import { useLanguage } from '../hooks/useLanguage';
import { useApp } from '../context/AppContext';
import { useData } from '../context/DataContext';
import { Customer } from '../db/index';
import { todayString } from '../utils/format';

interface BatchRow {
  customer: Customer;
  litres: string;
}

export function BatchEntry() {
  const { t, lang } = useLanguage();
  const navigate = useNavigate();
  const { showToast, state: appState } = useApp();
  const { state, loadCustomers, createDeliveryEntry } = useData();

  const [rows, setRows] = useState<BatchRow[]>([]);
  const [date, setDate] = useState(todayString());
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadCustomers();
  }, []);

  useEffect(() => {
    const active = state.customers.filter(c => c.isActive);
    setRows(active.map(c => ({ customer: c, litres: '' })));
  }, [state.customers]);

  const updateLitres = (idx: number, value: string) => {
    setRows(prev => prev.map((row, i) => i === idx ? { ...row, litres: value } : row));
  };

  const totalLitres = rows.reduce((sum, r) => {
    const l = parseFloat(r.litres);
    return sum + (isNaN(l) ? 0 : l);
  }, 0);

  const filledCount = rows.filter(r => r.litres !== '' && !isNaN(parseFloat(r.litres)) && parseFloat(r.litres) > 0).length;

  const handleSave = async () => {
    const toSave = rows.filter(r => r.litres !== '' && !isNaN(parseFloat(r.litres)) && parseFloat(r.litres) > 0);
    if (toSave.length === 0) {
      showToast(t('noEntries'), 'error');
      return;
    }
    setSaving(true);
    try {
      for (const row of toSave) {
        await createDeliveryEntry({
          type: 'customer',
          partyId: row.customer.id,
          date,
          litres: parseFloat(row.litres),
          rate: row.customer.defaultRate,
        });
      }
      showToast(t('batchSaved'));
      navigate(-1);
    } catch {
      showToast(t('errorOccurred'), 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="pb-32 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="bg-green-700 pt-12 pb-4 px-4">
        <button onClick={() => navigate(-1)} className="mb-4 flex items-center gap-1 text-white opacity-80">
          <ArrowLeft size={20} />
          <span className="text-base">{t('home')}</span>
        </button>
        <h1 className="text-white text-2xl font-bold">{t('batchEntry')}</h1>
        <p className="text-green-200 text-sm mt-1">{t('customers')}</p>
      </div>

      {/* Date Picker */}
      <div className="px-4 py-3 bg-white border-b border-gray-100">
        <div className="flex items-center gap-3">
          <label className="text-base font-medium text-gray-700 shrink-0">{t('date')}:</label>
          <input
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            className="flex-1 border border-gray-300 rounded-xl px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>
      </div>

      {/* Summary */}
      {filledCount > 0 && (
        <div className="px-4 py-2 bg-green-50 border-b border-green-100">
          <p className="text-green-700 text-sm font-medium">
            {filledCount} {t('customers')} · Total: {totalLitres.toFixed(2)}L
          </p>
        </div>
      )}

      {/* Customer Rows */}
      <div className="px-4 py-3 space-y-2">
        {rows.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <div className="text-5xl mb-4">👥</div>
            <p className="text-lg font-medium text-gray-500 mb-2">
              {lang === 'hi' ? 'कोई ग्राहक नहीं' : 'No customers yet'}
            </p>
            <p className="text-sm mb-6">
              {lang === 'hi' ? 'पहले ग्राहक टैब से ग्राहक जोड़ें' : 'Add customers from the Customers tab first'}
            </p>
            <button
              onClick={() => navigate('/customers')}
              className="inline-flex items-center gap-2 px-6 py-3 bg-green-700 text-white rounded-2xl font-semibold text-base"
            >
              {t('addCustomer')}
            </button>
          </div>
        ) : (
          rows.map((row, idx) => (
            <div key={row.customer.id} className="bg-white rounded-2xl px-4 py-3 flex items-center gap-3 shadow-sm">
              <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center shrink-0">
                <span className="text-green-700 font-bold">
                  {row.customer.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-gray-800 font-semibold text-base truncate">{row.customer.name}</p>
                <p className="text-gray-400 text-sm">₹{row.customer.defaultRate}/L</p>
              </div>
              <div className="w-28 shrink-0">
                <input
                  type="number"
                  inputMode="decimal"
                  value={row.litres}
                  onChange={e => updateLitres(idx, e.target.value)}
                  placeholder={t('enterLitres')}
                  className="w-full border border-gray-300 rounded-xl px-3 py-2 text-base text-right focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              {row.litres && parseFloat(row.litres) > 0 && (
                <div className="text-green-700 shrink-0">
                  <Check size={18} strokeWidth={2.5} />
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Fixed Save Button */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 pb-safe z-20">
        <button
          onClick={handleSave}
          disabled={saving || filledCount === 0}
          className="w-full py-4 bg-green-700 text-white text-lg font-bold rounded-2xl active:bg-green-800 disabled:opacity-60"
        >
          {saving ? '...' : `${t('save')} (${filledCount} ${t('customers')})`}
        </button>
      </div>
    </div>
  );
}
