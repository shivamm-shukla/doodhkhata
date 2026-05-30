import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, ChevronRight, Search, Users } from 'lucide-react';
import { useLanguage } from '../hooks/useLanguage';
import { useApp } from '../context/AppContext';
import { useData } from '../context/DataContext';
import { BottomSheet } from '../components/BottomSheet';
import { BalanceBadge } from '../components/BalanceBadge';
import { calculateCustomerBalance } from '../db/queries';
import { Customer } from '../db/index';

export function CustomersList() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { showToast, state: appState } = useApp();
  const { state, loadCustomers, createCustomer } = useData();
  const [showAddSheet, setShowAddSheet] = useState(false);
  const [search, setSearch] = useState('');
  const [balances, setBalances] = useState<Record<string, number>>({});

  useEffect(() => { loadCustomers(); }, []);

  useEffect(() => {
    async function loadBalances() {
      const active = state.customers.filter(c => c.isActive);
      const entries = await Promise.all(active.map(async c => [c.id, await calculateCustomerBalance(c.id)] as [string, number]));
      setBalances(Object.fromEntries(entries));
    }
    if (state.customers.length > 0) loadBalances();
  }, [state.customers]);

  const filtered = state.customers.filter(c => c.isActive).filter(c => c.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="pb-20 bg-gray-50 dark:bg-gray-900 min-h-screen">
      <div className="bg-green-700 dark:bg-green-900 pt-12 pb-4 px-4">
        <h1 className="text-white text-2xl font-bold">{t('customers')} 👥</h1>
        <p className="text-green-200 text-sm">{filtered.length} {t('activeCustomers')}</p>
      </div>

      {/* Search */}
      <div className="px-4 py-3 bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700">
        <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-700 rounded-xl px-3 py-2.5">
          <Search size={18} className="text-gray-400 shrink-0" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={t('searchCustomer')}
            className="flex-1 bg-transparent text-base text-gray-800 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none"
          />
        </div>
      </div>

      <div className="px-4 py-3 space-y-2">
        {filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-400 dark:text-gray-600">
            <Users size={56} className="mx-auto mb-4 opacity-40" />
            <p className="text-lg font-semibold text-gray-500 dark:text-gray-400 mb-1">{t('noEntries')}</p>
            <p className="text-sm mb-6 px-4">{t('tapPlusToAdd')}</p>
          </div>
        ) : (
          filtered.map(customer => {
            const balance = balances[customer.id] ?? 0;
            return (
              <button
                key={customer.id}
                onClick={() => navigate(`/customers/${customer.id}`)}
                className="w-full bg-white dark:bg-gray-800 rounded-2xl px-4 py-4 flex items-center gap-3 shadow-sm active:bg-gray-50 dark:active:bg-gray-700 text-left"
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 font-bold text-lg ${
                  balance > 0 ? 'bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400' : 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400'
                }`}>
                  {customer.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-gray-800 dark:text-white font-bold text-base truncate">{customer.name}</p>
                  {customer.phone && <p className="text-gray-400 dark:text-gray-500 text-sm">📞 {customer.phone}</p>}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <BalanceBadge balance={balance} />
                  <ChevronRight size={18} className="text-gray-300 dark:text-gray-600" />
                </div>
              </button>
            );
          })
        )}
      </div>

      <button
        onClick={() => setShowAddSheet(true)}
        className="fixed bottom-20 right-4 w-14 h-14 bg-green-700 text-white rounded-full shadow-lg flex items-center justify-center active:bg-green-800 z-20"
      >
        <Plus size={28} />
      </button>

      <BottomSheet isOpen={showAddSheet} onClose={() => setShowAddSheet(false)} title={t('addCustomer')}>
        <AddCustomerForm
          defaultRate={appState.defaultCustomerRate}
          onSave={async (data) => {
            try {
              await createCustomer({ ...data, isActive: true });
              showToast(t('savedSuccessfully'));
              setShowAddSheet(false);
            } catch {
              showToast(t('errorOccurred'), 'error');
            }
          }}
          onCancel={() => setShowAddSheet(false)}
        />
      </BottomSheet>
    </div>
  );
}

function AddCustomerForm({ defaultRate, onSave, onCancel }: { defaultRate: number; onSave: (data: { name: string; phone?: string; defaultRate: number }) => Promise<void>; onCancel: () => void }) {
  const { t } = useLanguage();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [rate, setRate] = useState(String(defaultRate));
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    await onSave({ name: name.trim(), phone: phone.trim() || undefined, defaultRate: parseFloat(rate) || defaultRate });
    setSaving(false);
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-base font-semibold text-gray-700 dark:text-gray-200 mb-1.5">{t('customerName')}</label>
        <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder={t('customerName')} autoFocus
          className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white rounded-xl px-3 py-3.5 text-base focus:outline-none focus:ring-2 focus:ring-green-500" />
      </div>
      <div>
        <label className="block text-base font-semibold text-gray-700 dark:text-gray-200 mb-1.5">
          {t('whatsappPhoneLabel')} <span className="text-gray-400 text-sm font-normal">({t('optional')})</span>
        </label>
        <input type="tel" inputMode="numeric" value={phone}
          onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
          placeholder="10 digit number"
          className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white rounded-xl px-3 py-3.5 text-base focus:outline-none focus:ring-2 focus:ring-green-500" />
        <p className="text-xs text-gray-400 mt-1">💬 {t('whatsappPhoneHelper')}</p>
      </div>
      <div>
        <label className="block text-base font-semibold text-gray-700 dark:text-gray-200 mb-1.5">{t('defaultRate')} (₹/L)</label>
        <input type="number" inputMode="decimal" value={rate} onChange={e => setRate(e.target.value)}
          className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white rounded-xl px-3 py-3.5 text-base focus:outline-none focus:ring-2 focus:ring-green-500" />
      </div>
      <div className="flex gap-3 pt-2">
        <button onClick={onCancel} className="flex-1 py-4 rounded-xl border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 text-base font-semibold">{t('cancel')}</button>
        <button onClick={handleSave} disabled={!name.trim() || saving}
          className="flex-1 py-4 rounded-xl bg-green-700 text-white text-base font-bold active:bg-green-800 disabled:opacity-60">
          {saving ? '...' : t('save')}
        </button>
      </div>
    </div>
  );
}
