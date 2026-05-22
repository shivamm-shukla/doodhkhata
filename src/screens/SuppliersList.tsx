import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, ChevronRight, Search, Truck } from 'lucide-react';
import { useLanguage } from '../hooks/useLanguage';
import { useApp } from '../context/AppContext';
import { useData } from '../context/DataContext';
import { BottomSheet } from '../components/BottomSheet';
import { BalanceBadge } from '../components/BalanceBadge';
import { calculateSupplierBalance } from '../db/queries';

export function SuppliersList() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { showToast, state: appState } = useApp();
  const { state, loadSuppliers, createSupplier } = useData();
  const [showAddSheet, setShowAddSheet] = useState(false);
  const [search, setSearch] = useState('');
  const [balances, setBalances] = useState<Record<string, number>>({});

  useEffect(() => {
    loadSuppliers();
  }, []);

  useEffect(() => {
    async function loadBalances() {
      const active = state.suppliers.filter(s => s.isActive);
      const entries = await Promise.all(
        active.map(async s => [s.id, await calculateSupplierBalance(s.id)] as [string, number])
      );
      setBalances(Object.fromEntries(entries));
    }
    if (state.suppliers.length > 0) loadBalances();
  }, [state.suppliers]);

  const filtered = state.suppliers
    .filter(s => s.isActive)
    .filter(s => s.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="pb-20 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="bg-green-700 pt-12 pb-4 px-4">
        <h1 className="text-white text-2xl font-bold">{t('suppliers')}</h1>
      </div>

      {/* Search */}
      <div className="px-4 py-3 bg-white border-b border-gray-100">
        <div className="flex items-center gap-2 bg-gray-100 rounded-xl px-3 py-2">
          <Search size={18} className="text-gray-400 shrink-0" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={t('searchSupplier')}
            className="flex-1 bg-transparent text-base text-gray-800 placeholder-gray-400 focus:outline-none"
          />
        </div>
      </div>

      {/* List */}
      <div className="px-4 py-3 space-y-2">
        {filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <Truck size={48} className="mx-auto mb-3 opacity-50" />
            <p className="text-lg">{t('noEntries')}</p>
          </div>
        ) : (
          filtered.map(supplier => (
            <button
              key={supplier.id}
              onClick={() => navigate(`/suppliers/${supplier.id}`)}
              className="w-full bg-white rounded-2xl px-4 py-4 flex items-center gap-3 shadow-sm active:bg-gray-50 text-left"
            >
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center shrink-0">
                <span className="text-blue-700 font-bold text-lg">
                  {supplier.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-gray-800 font-semibold text-base truncate">{supplier.name}</p>
                {supplier.phone && (
                  <p className="text-gray-400 text-sm">{supplier.phone}</p>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <BalanceBadge balance={balances[supplier.id] ?? 0} />
                <ChevronRight size={18} className="text-gray-300" />
              </div>
            </button>
          ))
        )}
      </div>

      {/* FAB */}
      <button
        onClick={() => setShowAddSheet(true)}
        className="fixed bottom-20 right-4 w-14 h-14 bg-green-700 text-white rounded-full shadow-lg flex items-center justify-center active:bg-green-800 z-20"
      >
        <Plus size={28} />
      </button>

      {/* Add Supplier Sheet */}
      <BottomSheet
        isOpen={showAddSheet}
        onClose={() => setShowAddSheet(false)}
        title={t('addSupplier')}
      >
        <AddSupplierForm
          defaultRate={appState.defaultSupplierRate}
          onSave={async (data) => {
            try {
              await createSupplier({ ...data, isActive: true });
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

interface AddSupplierFormProps {
  defaultRate: number;
  onSave: (data: { name: string; phone?: string; defaultRate: number }) => Promise<void>;
  onCancel: () => void;
}

function AddSupplierForm({ defaultRate, onSave, onCancel }: AddSupplierFormProps) {
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
        <label className="block text-base font-medium text-gray-700 mb-1">{t('supplierName')}</label>
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder={t('supplierName')}
          autoFocus
          className="w-full border border-gray-300 rounded-xl px-3 py-3 text-base focus:outline-none focus:ring-2 focus:ring-green-500"
        />
      </div>
      <div>
        <label className="block text-base font-medium text-gray-700 mb-1">
          {t('phone')} <span className="text-gray-400 text-sm">({t('optional')})</span>
        </label>
        <input
          type="tel"
          value={phone}
          onChange={e => setPhone(e.target.value)}
          placeholder="9876543210"
          className="w-full border border-gray-300 rounded-xl px-3 py-3 text-base focus:outline-none focus:ring-2 focus:ring-green-500"
        />
      </div>
      <div>
        <label className="block text-base font-medium text-gray-700 mb-1">{t('defaultRate')} (₹/L)</label>
        <input
          type="number"
          inputMode="decimal"
          value={rate}
          onChange={e => setRate(e.target.value)}
          className="w-full border border-gray-300 rounded-xl px-3 py-3 text-base focus:outline-none focus:ring-2 focus:ring-green-500"
        />
      </div>
      <div className="flex gap-3 pt-2">
        <button
          onClick={onCancel}
          className="flex-1 py-4 rounded-xl border border-gray-300 text-gray-700 text-base font-semibold active:bg-gray-50"
        >
          {t('cancel')}
        </button>
        <button
          onClick={handleSave}
          disabled={!name.trim() || saving}
          className="flex-1 py-4 rounded-xl bg-green-700 text-white text-base font-semibold active:bg-green-800 disabled:opacity-60"
        >
          {saving ? '...' : t('save')}
        </button>
      </div>
    </div>
  );
}
