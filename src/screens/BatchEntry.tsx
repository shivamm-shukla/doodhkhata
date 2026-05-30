import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, X, MessageCircle } from 'lucide-react';
import { useLanguage } from '../hooks/useLanguage';
import { useApp } from '../context/AppContext';
import { useData } from '../context/DataContext';
import { Customer } from '../db/index';
import { todayString } from '../utils/format';
import { calculateCustomerBalance } from '../db/queries';
import { buildDeliveryMessage, openWhatsApp } from '../utils/whatsapp';

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
  // Post-save WhatsApp flow
  const [waQueue, setWaQueue] = useState<Array<{ name: string; phone: string; message: string }>>([]);
  const [waIndex, setWaIndex] = useState<number | null>(null);

  useEffect(() => { loadCustomers(); }, []);
  useEffect(() => {
    const active = state.customers.filter(c => c.isActive);
    setRows(active.map(c => ({ customer: c, litres: '' })));
  }, [state.customers]);

  const updateLitres = (idx: number, value: string) =>
    setRows(prev => prev.map((r, i) => i === idx ? { ...r, litres: value } : r));
  const clearLitres = (idx: number) =>
    setRows(prev => prev.map((r, i) => i === idx ? { ...r, litres: '' } : r));

  const totalLitres = rows.reduce((s, r) => s + (parseFloat(r.litres) || 0), 0);
  const filledCount = rows.filter(r => parseFloat(r.litres) > 0).length;

  const handleSave = async () => {
    const toSave = rows.filter(r => parseFloat(r.litres) > 0);
    if (toSave.length === 0) { showToast(t('noEntries'), 'error'); return; }
    setSaving(true);
    try {
      for (const row of toSave) {
        await createDeliveryEntry({ type: 'customer', partyId: row.customer.id, date, litres: parseFloat(row.litres), rate: row.customer.defaultRate });
      }
      showToast(t('batchSaved'));

      // Build WhatsApp queue for customers with phones
      const queue: Array<{ name: string; phone: string; message: string }> = [];
      for (const row of toSave) {
        if (row.customer.phone) {
          const balance = await calculateCustomerBalance(row.customer.id);
          const message = buildDeliveryMessage({ lang, customerName: row.customer.name, date, litres: parseFloat(row.litres), rate: row.customer.defaultRate, amount: parseFloat(row.litres) * row.customer.defaultRate, balance });
          queue.push({ name: row.customer.name, phone: row.customer.phone, message });
        }
      }
      if (queue.length > 0) {
        setWaQueue(queue);
        setWaIndex(0);
      } else {
        navigate(-1);
      }
    } catch {
      showToast(t('errorOccurred'), 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleWaNext = () => {
    const next = (waIndex ?? 0) + 1;
    if (next >= waQueue.length) { navigate(-1); } else { setWaIndex(next); }
  };

  const currentWa = waIndex !== null ? waQueue[waIndex] : null;

  return (
    <div className="pb-32 bg-gray-50 dark:bg-gray-900 min-h-screen">
      {/* Header */}
      <div className="bg-green-700 dark:bg-green-900 pt-12 pb-4 px-4">
        <button onClick={() => navigate(-1)} className="mb-3 flex items-center gap-1.5 text-white/80">
          <ArrowLeft size={20} /><span className="text-base">{t('home')}</span>
        </button>
        <h1 className="text-white text-2xl font-bold">{t('batchEntry')} 🥛</h1>
        <p className="text-green-200 text-sm mt-0.5">{t('customers')}</p>
      </div>

      {/* Date */}
      <div className="px-4 py-3 bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700">
        <div className="flex items-center gap-3">
          <label className="text-base font-semibold text-gray-700 dark:text-gray-200 shrink-0">{t('date')}:</label>
          <input type="date" value={date} onChange={e => setDate(e.target.value)}
            className="flex-1 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-xl px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-green-500" />
        </div>
      </div>

      {/* Summary */}
      {filledCount > 0 && (
        <div className="px-4 py-2.5 bg-green-50 dark:bg-green-900/20 border-b border-green-100 dark:border-green-900/40">
          <p className="text-green-700 dark:text-green-400 text-sm font-semibold">
            ✅ {filledCount} {t('customers')} · Total: {totalLitres.toFixed(2)}L
          </p>
        </div>
      )}

      {/* Rows */}
      <div className="px-4 py-3 space-y-2">
        {rows.length === 0 ? (
          <div className="text-center py-16 text-gray-400 dark:text-gray-600">
            <div className="text-5xl mb-4">👥</div>
            <p className="text-lg font-semibold text-gray-500 dark:text-gray-400 mb-2">
              {lang === 'hi' ? 'कोई ग्राहक नहीं' : 'No customers yet'}
            </p>
            <button onClick={() => navigate('/customers')}
              className="px-6 py-3 bg-green-700 text-white rounded-2xl font-semibold text-base">
              {t('addCustomer')}
            </button>
          </div>
        ) : rows.map((row, idx) => {
          const hasValue = parseFloat(row.litres) > 0;
          return (
            <div key={row.customer.id}
              className={`bg-white dark:bg-gray-800 rounded-2xl px-4 py-3.5 flex items-center gap-3 shadow-sm transition-all ${hasValue ? 'ring-2 ring-green-500 dark:ring-green-600' : ''}`}>
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 font-bold text-lg ${
                hasValue ? 'bg-green-700 text-white' : 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400'
              }`}>
                {row.customer.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-gray-800 dark:text-white font-bold text-base truncate">{row.customer.name}</p>
                <p className="text-gray-400 dark:text-gray-500 text-xs">₹{row.customer.defaultRate}/L
                  {hasValue && <span className="text-green-600 dark:text-green-400 ml-1">= ₹{(parseFloat(row.litres) * row.customer.defaultRate).toFixed(0)}</span>}
                </p>
              </div>
              <input
                type="number" inputMode="decimal"
                value={row.litres}
                onChange={e => updateLitres(idx, e.target.value)}
                placeholder="0"
                className="w-24 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-xl px-2 py-2.5 text-base text-right font-bold focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              <button
                onClick={() => hasValue && clearLitres(idx)}
                disabled={!hasValue}
                className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all ${
                  hasValue ? 'bg-red-100 dark:bg-red-900/40 active:scale-90' : 'bg-gray-100 dark:bg-gray-700 opacity-40 cursor-default'
                }`}
              >
                {hasValue
                  ? <X size={18} className="text-red-600 dark:text-red-400" />
                  : <Check size={18} className="text-gray-400 dark:text-gray-500" />
                }
              </button>
            </div>
          );
        })}
      </div>

      {/* Fixed Save Button — above BottomNav */}
      <div className="fixed bottom-16 left-0 right-0 max-w-lg mx-auto px-4 z-40">
        <button
          onClick={handleSave}
          disabled={saving || filledCount === 0}
          className="w-full py-5 bg-green-700 dark:bg-green-800 text-white text-lg font-bold rounded-2xl shadow-lg active:bg-green-800 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {saving ? '⏳ ...' : filledCount > 0
            ? `💾 ${t('save')} (${filledCount} ${t('customers')})`
            : `📝 ${t('enterLitres')}`}
        </button>
      </div>

      {/* WhatsApp prompt after batch save */}
      {currentWa && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-lg p-5 space-y-4">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-9 h-9 bg-green-100 dark:bg-green-900/40 rounded-xl flex items-center justify-center">
                <MessageCircle size={18} className="text-green-700 dark:text-green-400" />
              </div>
              <div>
                <p className="font-bold text-gray-800 dark:text-white">{t('whatsappSendNow')}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {waIndex! + 1} / {waQueue.length} · {currentWa.name}
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => { openWhatsApp(currentWa.phone, currentWa.message); handleWaNext(); }}
                className="flex-1 py-4 rounded-xl bg-green-700 text-white font-bold flex items-center justify-center gap-2 active:bg-green-800">
                <MessageCircle size={18} />{t('whatsappYes')}
              </button>
              <button onClick={handleWaNext}
                className="flex-1 py-4 rounded-xl border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-semibold">
                {t('whatsappLater')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
