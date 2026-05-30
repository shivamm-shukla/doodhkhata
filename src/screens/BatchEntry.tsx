import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, X } from 'lucide-react';
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

  const clearLitres = (idx: number) => {
    setRows(prev => prev.map((row, i) => i === idx ? { ...row, litres: '' } : row));
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
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #064e2e 0%, #166534 40%, #15803d 100%)' }}>
      {/* Glass Header */}
      <div className="pt-12 pb-5 px-4">
        <button onClick={() => navigate(-1)} className="mb-4 flex items-center gap-1.5 text-white/80 active:text-white">
          <ArrowLeft size={20} />
          <span className="text-base">{t('home')}</span>
        </button>
        <h1 className="text-white text-2xl font-bold">{t('batchEntry')}</h1>
        <p className="text-green-200 text-sm mt-0.5">{t('customers')}</p>
      </div>

      {/* Content card */}
      <div
        className="mx-3 rounded-3xl pb-6 overflow-hidden"
        style={{
          background: 'rgba(255,255,255,0.12)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,0.25)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
        }}
      >
        {/* Date Picker */}
        <div className="px-4 pt-4 pb-3 border-b border-white/10">
          <div className="flex items-center gap-3">
            <label className="text-white/80 text-sm font-medium shrink-0">{t('date')}:</label>
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              className="flex-1 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-white/40"
              style={{
                background: 'rgba(255,255,255,0.15)',
                border: '1px solid rgba(255,255,255,0.25)',
                color: 'white',
              }}
            />
          </div>
        </div>

        {/* Summary pill */}
        {filledCount > 0 && (
          <div className="px-4 py-2.5">
            <div
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-semibold text-white"
              style={{ background: 'rgba(255,255,255,0.2)' }}
            >
              <span>✅</span>
              <span>{filledCount} {t('customers')} · {totalLitres.toFixed(2)}L</span>
            </div>
          </div>
        )}

        {/* Customer Rows */}
        <div className="px-3 py-2 space-y-2">
          {rows.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-5xl mb-4">👥</div>
              <p className="text-white/80 text-lg font-medium mb-2">
                {lang === 'hi' ? 'कोई ग्राहक नहीं' : 'No customers yet'}
              </p>
              <p className="text-white/50 text-sm mb-6">
                {lang === 'hi' ? 'पहले ग्राहक टैब से ग्राहक जोड़ें' : 'Add customers from the Customers tab first'}
              </p>
              <button
                onClick={() => navigate('/customers')}
                className="inline-flex items-center gap-2 px-6 py-3 bg-white text-green-700 rounded-2xl font-semibold text-base"
              >
                {t('addCustomer')}
              </button>
            </div>
          ) : (
            rows.map((row, idx) => {
              const hasValue = row.litres !== '' && !isNaN(parseFloat(row.litres)) && parseFloat(row.litres) > 0;
              return (
                <div
                  key={row.customer.id}
                  className="flex items-center gap-3 px-3 py-3 rounded-2xl transition-all"
                  style={{
                    background: hasValue ? 'rgba(255,255,255,0.22)' : 'rgba(255,255,255,0.10)',
                    border: hasValue ? '1px solid rgba(255,255,255,0.45)' : '1px solid rgba(255,255,255,0.15)',
                  }}
                >
                  {/* Avatar */}
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 font-bold text-base"
                    style={{
                      background: hasValue ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.2)',
                      color: hasValue ? '#166534' : 'rgba(255,255,255,0.8)',
                    }}
                  >
                    {row.customer.name.charAt(0).toUpperCase()}
                  </div>

                  {/* Name + rate */}
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-semibold text-base truncate">{row.customer.name}</p>
                    <p className="text-white/50 text-xs">₹{row.customer.defaultRate}/L</p>
                  </div>

                  {/* Litres input */}
                  <div className="w-24 shrink-0">
                    <input
                      type="number"
                      inputMode="decimal"
                      value={row.litres}
                      onChange={e => updateLitres(idx, e.target.value)}
                      placeholder="0"
                      className="w-full rounded-xl px-2 py-2.5 text-base text-right font-semibold focus:outline-none focus:ring-2 focus:ring-white/60 placeholder-white/30"
                      style={{
                        background: 'rgba(255,255,255,0.15)',
                        border: '1px solid rgba(255,255,255,0.3)',
                        color: 'white',
                      }}
                    />
                  </div>

                  {/* Clear / check button */}
                  <button
                    onClick={() => hasValue ? clearLitres(idx) : undefined}
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-all ${
                      hasValue
                        ? 'active:scale-90'
                        : 'opacity-30 cursor-default'
                    }`}
                    style={{
                      background: hasValue ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.1)',
                    }}
                    disabled={!hasValue}
                  >
                    {hasValue
                      ? <X size={16} strokeWidth={2.5} style={{ color: '#dc2626' }} />
                      : <Check size={16} strokeWidth={2} style={{ color: 'rgba(255,255,255,0.5)' }} />
                    }
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Fixed Save Button — sits ABOVE BottomNav (bottom-16 = 64px, nav is 56px) */}
      <div className="fixed bottom-16 left-0 right-0 max-w-lg mx-auto px-4 z-40">
        <button
          onClick={handleSave}
          disabled={saving || filledCount === 0}
          className="w-full py-4 text-base font-bold rounded-2xl transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
          style={{
            background: filledCount > 0
              ? 'linear-gradient(135deg, #16a34a, #15803d)'
              : 'rgba(255,255,255,0.2)',
            color: 'white',
            boxShadow: filledCount > 0 ? '0 4px 20px rgba(21,128,61,0.5)' : 'none',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            border: '1px solid rgba(255,255,255,0.3)',
          }}
        >
          {saving
            ? '...'
            : filledCount > 0
            ? `${t('save')} (${filledCount} ${t('customers')})`
            : t('enterLitres')
          }
        </button>
      </div>

      {/* Bottom spacer so content isn't hidden under fixed button + nav */}
      <div className="h-32" />
    </div>
  );
}
