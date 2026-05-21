import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Droplets, IndianRupee, Trash2, MoreVertical, UserX, Pencil } from 'lucide-react';
import { useLanguage } from '../hooks/useLanguage';
import { useApp } from '../context/AppContext';
import { useData } from '../context/DataContext';
import { useCustomerBalance } from '../hooks/useCustomers';
import { BottomSheet } from '../components/BottomSheet';
import { formatCurrency, formatLitres, formatDate } from '../utils/format';
import { todayString } from '../utils/format';
import { DeliveryEntry, PaymentEntry } from '../db/index';

export function CustomerDetail() {
  const { id } = useParams<{ id: string }>();
  const { t, lang } = useLanguage();
  const navigate = useNavigate();
  const { showToast, state: appState } = useApp();
  const { state, loadCustomerEntries, createDeliveryEntry, removeDeliveryEntry, createPaymentEntry, removePaymentEntry, removeCustomer, editCustomer } = useData();

  const [showDeliverySheet, setShowDeliverySheet] = useState(false);
  const [showPaymentSheet, setShowPaymentSheet] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showEditSheet, setShowEditSheet] = useState(false);
  const [showDeleteCustomer, setShowDeleteCustomer] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: 'delivery' | 'payment'; id: string } | null>(null);

  const customer = state.customers.find(c => c.id === id);
  const deliveries = (id ? state.customerDeliveries[id] : []) ?? [];
  const payments = (id ? state.customerPayments[id] : []) ?? [];
  const { balance, totalDelivery, totalPaid } = useCustomerBalance(id ?? '');

  useEffect(() => {
    if (id) loadCustomerEntries(id);
  }, [id]);

  if (!customer) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500 text-lg">Customer not found</p>
      </div>
    );
  }

  // Merge and sort all transactions by date/createdAt
  type Transaction =
    | ({ kind: 'delivery' } & DeliveryEntry)
    | ({ kind: 'payment' } & PaymentEntry);

  const transactions: Transaction[] = [
    ...deliveries.map(d => ({ kind: 'delivery' as const, ...d })),
    ...payments.map(p => ({ kind: 'payment' as const, ...p })),
  ].sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const handleDeleteCustomer = async () => {
    try {
      await removeCustomer(customer!.id);
      showToast(t('deletedSuccessfully'));
      navigate('/customers');
    } catch {
      showToast(t('errorOccurred'), 'error');
    }
    setShowDeleteCustomer(false);
  };

  const handleDeleteDelivery = async (entryId: string) => {
    try {
      await removeDeliveryEntry(entryId, customer.id, 'customer');
      showToast(t('deletedSuccessfully'));
    } catch {
      showToast(t('errorOccurred'), 'error');
    }
    setDeleteConfirm(null);
  };

  const handleDeletePayment = async (entryId: string) => {
    try {
      await removePaymentEntry(entryId, customer.id, 'customer');
      showToast(t('deletedSuccessfully'));
    } catch {
      showToast(t('errorOccurred'), 'error');
    }
    setDeleteConfirm(null);
  };

  return (
    <div className="pb-20 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className={`pt-12 pb-6 px-4 ${balance > 0 ? 'bg-red-600' : balance < 0 ? 'bg-green-700' : 'bg-gray-600'}`}>
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-white opacity-80">
            <ArrowLeft size={20} />
            <span className="text-base">{t('customers')}</span>
          </button>
          <div className="relative">
            <button onClick={() => setShowMenu(v => !v)} className="w-9 h-9 flex items-center justify-center text-white opacity-80 active:opacity-60">
              <MoreVertical size={22} />
            </button>
            {showMenu && (
              <div className="absolute right-0 top-10 bg-white rounded-2xl shadow-xl z-30 overflow-hidden min-w-[160px]">
                <button
                  onClick={() => { setShowMenu(false); setShowEditSheet(true); }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-base text-gray-700 active:bg-gray-50"
                >
                  <Pencil size={18} className="text-gray-500" />
                  {t('edit')}
                </button>
                <button
                  onClick={() => { setShowMenu(false); setShowDeleteCustomer(true); }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-base text-red-600 active:bg-red-50"
                >
                  <UserX size={18} />
                  {t('delete')}
                </button>
              </div>
            )}
          </div>
        </div>
        <h1 className="text-white text-2xl font-bold">{customer.name}</h1>
        {customer.phone && <p className="text-white opacity-70 text-sm mt-1">{customer.phone}</p>}
        <div className="mt-4 flex gap-4">
          <div>
            <p className="text-white opacity-70 text-sm">{t('sold')}</p>
            <p className="text-white text-xl font-bold">{formatCurrency(totalDelivery)}</p>
          </div>
          <div>
            <p className="text-white opacity-70 text-sm">{t('paid')}</p>
            <p className="text-white text-xl font-bold">{formatCurrency(totalPaid)}</p>
          </div>
          <div>
            <p className="text-white opacity-70 text-sm">{balance >= 0 ? t('due') : t('advance')}</p>
            <p className="text-white text-xl font-bold">{formatCurrency(Math.abs(balance))}</p>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-3 px-4 mt-4">
        <button
          onClick={() => setShowDeliverySheet(true)}
          className="bg-green-700 text-white rounded-2xl py-4 flex items-center justify-center gap-2 text-base font-semibold active:bg-green-800"
        >
          <Droplets size={20} />
          {t('deliveryEntry')}
        </button>
        <button
          onClick={() => setShowPaymentSheet(true)}
          className="bg-white border border-gray-200 text-gray-800 rounded-2xl py-4 flex items-center justify-center gap-2 text-base font-semibold active:bg-gray-50"
        >
          <IndianRupee size={20} className="text-green-700" />
          {t('paymentEntry')}
        </button>
      </div>

      {/* Transaction History */}
      <div className="px-4 mt-4">
        <h2 className="text-base font-bold text-gray-600 mb-2">{t('history')}</h2>
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          {transactions.length === 0 ? (
            <div className="py-10 text-center text-gray-400 text-base">{t('noEntries')}</div>
          ) : (
            <div className="divide-y divide-gray-50">
              {transactions.map(txn => (
                <TransactionRow
                  key={txn.id}
                  txn={txn}
                  onDelete={() => setDeleteConfirm({ type: txn.kind, id: txn.id })}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Delivery Sheet */}
      <BottomSheet isOpen={showDeliverySheet} onClose={() => setShowDeliverySheet(false)} title={t('deliveryEntry')}>
        <DeliveryForm
          defaultRate={customer.defaultRate}
          onSave={async (litres, rate, date, note) => {
            await createDeliveryEntry({ type: 'customer', partyId: customer.id, date, litres, rate, note });
            showToast(t('savedSuccessfully'));
            setShowDeliverySheet(false);
          }}
          onCancel={() => setShowDeliverySheet(false)}
        />
      </BottomSheet>

      {/* Payment Sheet */}
      <BottomSheet isOpen={showPaymentSheet} onClose={() => setShowPaymentSheet(false)} title={t('paymentEntry')}>
        <PaymentForm
          suggestedAmount={balance > 0 ? balance : 0}
          onSave={async (amount, date, note) => {
            await createPaymentEntry({ type: 'customer', partyId: customer.id, date, amount, note });
            showToast(t('savedSuccessfully'));
            setShowPaymentSheet(false);
          }}
          onCancel={() => setShowPaymentSheet(false)}
        />
      </BottomSheet>

      {/* Delete Entry Confirm */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm">
            <p className="text-lg font-semibold text-gray-800 mb-6">{t('deleteConfirm')}</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 py-3 rounded-xl border border-gray-300 text-gray-700 text-base font-semibold">{t('cancel')}</button>
              <button
                onClick={() => { if (deleteConfirm.type === 'delivery') handleDeleteDelivery(deleteConfirm.id); else handleDeletePayment(deleteConfirm.id); }}
                className="flex-1 py-3 rounded-xl bg-red-600 text-white text-base font-semibold"
              >{t('delete')}</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Customer Confirm */}
      {showDeleteCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm">
            <p className="text-lg font-semibold text-gray-800 mb-2">{t('deleteConfirm')}</p>
            <p className="text-sm text-gray-500 mb-6">"{customer.name}" {lang === 'hi' ? 'को हटाया जाएगा' : 'will be removed'}</p>
            <div className="flex gap-3">
              <button onClick={() => setShowDeleteCustomer(false)} className="flex-1 py-3 rounded-xl border border-gray-300 text-gray-700 text-base font-semibold">{t('cancel')}</button>
              <button onClick={handleDeleteCustomer} className="flex-1 py-3 rounded-xl bg-red-600 text-white text-base font-semibold">{t('delete')}</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Customer Sheet */}
      <BottomSheet isOpen={showEditSheet} onClose={() => setShowEditSheet(false)} title={t('edit')}>
        <EditCustomerForm
          customer={customer}
          onSave={async (data) => {
            try {
              await editCustomer(customer.id, data);
              showToast(t('savedSuccessfully'));
              setShowEditSheet(false);
            } catch {
              showToast(t('errorOccurred'), 'error');
            }
          }}
          onCancel={() => setShowEditSheet(false)}
        />
      </BottomSheet>

      {/* Backdrop to close menu */}
      {showMenu && <div className="fixed inset-0 z-20" onClick={() => setShowMenu(false)} />}
    </div>
  );
}

function TransactionRow({
  txn,
  onDelete,
}: {
  txn: ({ kind: 'delivery' } & DeliveryEntry) | ({ kind: 'payment' } & PaymentEntry);
  onDelete: () => void;
}) {
  const { t } = useLanguage();
  const isDelivery = txn.kind === 'delivery';
  const deliveryTxn = isDelivery ? (txn as { kind: 'delivery' } & DeliveryEntry) : null;

  return (
    <div className="px-4 py-3 flex items-center gap-3">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
        isDelivery ? 'bg-blue-50' : 'bg-green-50'
      }`}>
        {isDelivery ? (
          <Droplets size={18} className="text-blue-600" />
        ) : (
          <IndianRupee size={18} className="text-green-700" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-gray-800 font-semibold text-base">
            {isDelivery ? `${deliveryTxn!.litres}L @ ₹${deliveryTxn!.rate}` : `${t('payment')}`}
          </span>
        </div>
        <p className="text-gray-400 text-sm">{formatDate(txn.date)}</p>
        {txn.note && <p className="text-gray-400 text-xs">{txn.note}</p>}
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <p className={`font-bold text-base ${isDelivery ? 'text-gray-800' : 'text-green-700'}`}>
          {formatCurrency(txn.amount)}
        </p>
        <button
          onClick={onDelete}
          className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center active:bg-red-100"
        >
          <Trash2 size={16} className="text-red-500" />
        </button>
      </div>
    </div>
  );
}

function DeliveryForm({
  defaultRate,
  onSave,
  onCancel,
}: {
  defaultRate: number;
  onSave: (litres: number, rate: number, date: string, note?: string) => Promise<void>;
  onCancel: () => void;
}) {
  const { t } = useLanguage();
  const [litres, setLitres] = useState('');
  const [rate, setRate] = useState(String(defaultRate));
  const [date, setDate] = useState(todayString());
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  const amount = litres && rate ? (parseFloat(litres) * parseFloat(rate)).toFixed(2) : '0';

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-base font-medium text-gray-700 mb-1">{t('litres')}</label>
          <input
            type="number"
            inputMode="decimal"
            value={litres}
            onChange={e => setLitres(e.target.value)}
            autoFocus
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
            className="w-full border border-gray-300 rounded-xl px-3 py-3 text-base focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>
      </div>
      <div>
        <label className="block text-base font-medium text-gray-700 mb-1">{t('amount')}</label>
        <div className="w-full border border-gray-200 rounded-xl px-3 py-3 text-base bg-gray-50 font-semibold text-gray-700">
          ₹{amount}
        </div>
      </div>
      <div>
        <label className="block text-base font-medium text-gray-700 mb-1">{t('date')}</label>
        <input
          type="date"
          value={date}
          onChange={e => setDate(e.target.value)}
          className="w-full border border-gray-300 rounded-xl px-3 py-3 text-base focus:outline-none focus:ring-2 focus:ring-green-500"
        />
      </div>
      <div>
        <label className="block text-base font-medium text-gray-700 mb-1">
          {t('note')} <span className="text-gray-400 text-sm">({t('optional')})</span>
        </label>
        <input
          type="text"
          value={note}
          onChange={e => setNote(e.target.value)}
          className="w-full border border-gray-300 rounded-xl px-3 py-3 text-base focus:outline-none focus:ring-2 focus:ring-green-500"
        />
      </div>
      <div className="flex gap-3 pt-2">
        <button onClick={onCancel} className="flex-1 py-4 rounded-xl border border-gray-300 text-gray-700 text-base font-semibold">
          {t('cancel')}
        </button>
        <button
          onClick={async () => {
            if (!litres || !rate) return;
            setSaving(true);
            await onSave(parseFloat(litres), parseFloat(rate), date, note || undefined);
            setSaving(false);
          }}
          disabled={!litres || !rate || saving}
          className="flex-1 py-4 rounded-xl bg-green-700 text-white text-base font-semibold disabled:opacity-60"
        >
          {saving ? '...' : t('save')}
        </button>
      </div>
    </div>
  );
}

function PaymentForm({
  suggestedAmount,
  onSave,
  onCancel,
}: {
  suggestedAmount: number;
  onSave: (amount: number, date: string, note?: string) => Promise<void>;
  onCancel: () => void;
}) {
  const { t } = useLanguage();
  const [amount, setAmount] = useState(suggestedAmount > 0 ? String(suggestedAmount.toFixed(2)) : '');
  const [date, setDate] = useState(todayString());
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-base font-medium text-gray-700 mb-1">{t('amount')}</label>
        <input
          type="number"
          inputMode="decimal"
          value={amount}
          onChange={e => setAmount(e.target.value)}
          autoFocus
          placeholder="0"
          className="w-full border border-gray-300 rounded-xl px-3 py-3 text-base focus:outline-none focus:ring-2 focus:ring-green-500"
        />
      </div>
      <div>
        <label className="block text-base font-medium text-gray-700 mb-1">{t('date')}</label>
        <input
          type="date"
          value={date}
          onChange={e => setDate(e.target.value)}
          className="w-full border border-gray-300 rounded-xl px-3 py-3 text-base focus:outline-none focus:ring-2 focus:ring-green-500"
        />
      </div>
      <div>
        <label className="block text-base font-medium text-gray-700 mb-1">
          {t('note')} <span className="text-gray-400 text-sm">({t('optional')})</span>
        </label>
        <input
          type="text"
          value={note}
          onChange={e => setNote(e.target.value)}
          className="w-full border border-gray-300 rounded-xl px-3 py-3 text-base focus:outline-none focus:ring-2 focus:ring-green-500"
        />
      </div>
      <div className="flex gap-3 pt-2">
        <button onClick={onCancel} className="flex-1 py-4 rounded-xl border border-gray-300 text-gray-700 text-base font-semibold">
          {t('cancel')}
        </button>
        <button
          onClick={async () => {
            if (!amount) return;
            setSaving(true);
            await onSave(parseFloat(amount), date, note || undefined);
            setSaving(false);
          }}
          disabled={!amount || saving}
          className="flex-1 py-4 rounded-xl bg-green-700 text-white text-base font-semibold disabled:opacity-60"
        >
          {saving ? '...' : t('save')}
        </button>
      </div>
    </div>
  );
}

function EditCustomerForm({
  customer,
  onSave,
  onCancel,
}: {
  customer: import('../db/index').Customer;
  onSave: (data: { name: string; phone?: string; defaultRate: number }) => Promise<void>;
  onCancel: () => void;
}) {
  const { t } = useLanguage();
  const [name, setName] = useState(customer.name);
  const [phone, setPhone] = useState(customer.phone ?? '');
  const [rate, setRate] = useState(String(customer.defaultRate));
  const [saving, setSaving] = useState(false);

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-base font-medium text-gray-700 mb-1">{t('customerName')}</label>
        <input type="text" value={name} onChange={e => setName(e.target.value)} autoFocus
          className="w-full border border-gray-300 rounded-xl px-3 py-3 text-base focus:outline-none focus:ring-2 focus:ring-green-500" />
      </div>
      <div>
        <label className="block text-base font-medium text-gray-700 mb-1">{t('phone')} <span className="text-gray-400 text-sm">({t('optional')})</span></label>
        <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="9876543210"
          className="w-full border border-gray-300 rounded-xl px-3 py-3 text-base focus:outline-none focus:ring-2 focus:ring-green-500" />
      </div>
      <div>
        <label className="block text-base font-medium text-gray-700 mb-1">{t('defaultRate')} (₹/L)</label>
        <input type="number" inputMode="decimal" value={rate} onChange={e => setRate(e.target.value)}
          className="w-full border border-gray-300 rounded-xl px-3 py-3 text-base focus:outline-none focus:ring-2 focus:ring-green-500" />
      </div>
      <div className="flex gap-3 pt-2">
        <button onClick={onCancel} className="flex-1 py-4 rounded-xl border border-gray-300 text-gray-700 text-base font-semibold">{t('cancel')}</button>
        <button
          onClick={async () => {
            if (!name.trim()) return;
            setSaving(true);
            await onSave({ name: name.trim(), phone: phone.trim() || undefined, defaultRate: parseFloat(rate) || customer.defaultRate });
            setSaving(false);
          }}
          disabled={!name.trim() || saving}
          className="flex-1 py-4 rounded-xl bg-green-700 text-white text-base font-semibold disabled:opacity-60"
        >{saving ? '...' : t('save')}</button>
      </div>
    </div>
  );
}
