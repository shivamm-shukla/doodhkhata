import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, MessageCircle, AlertTriangle, ChevronRight, CheckCircle2 } from 'lucide-react';
import { useLanguage } from '../hooks/useLanguage';
import { getAllCustomers } from '../db/queries';
import { getCustomerMonthlyData } from '../db/queries';
import { Customer } from '../db/index';
import { buildMonthlyMessage, getMonthName, openWhatsApp } from '../utils/whatsapp';
import { formatCurrency } from '../utils/format';

const BROADCAST_GUIDE_KEY = 'doodhkhata_broadcast_guide_shown';

interface CustomerSummary {
  customer: Customer;
  balance: number;
  monthTotalLitres: number;
  monthTotalBilled: number;
  monthTotalPaid: number;
  entries: Array<{ date: string; litres: number; amount: number }>;
}

export function WhatsAppBulk() {
  const { t, lang } = useLanguage();
  const navigate = useNavigate();

  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [summaries, setSummaries] = useState<CustomerSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [sendingIndex, setSendingIndex] = useState<number | null>(null);
  const [allDone, setAllDone] = useState(false);

  const loadSummaries = useCallback(async () => {
    setLoading(true);
    const customers = (await getAllCustomers()).filter(c => c.isActive);
    const results = await Promise.all(
      customers.map(async customer => {
        const data = await getCustomerMonthlyData(customer.id, year, month);
        return {
          customer,
          balance: data.balance,
          monthTotalLitres: data.monthTotalLitres,
          monthTotalBilled: data.monthTotalBilled,
          monthTotalPaid: data.monthTotalPaid,
          entries: data.monthDeliveries.map(d => ({ date: d.date, litres: d.litres, amount: d.amount })),
        };
      })
    );
    setSummaries(results);
    setLoading(false);
  }, [year, month]);

  useEffect(() => {
    loadSummaries();
  }, [loadSummaries]);

  const handleStart = () => {
    const alreadyShown = localStorage.getItem(BROADCAST_GUIDE_KEY);
    if (!alreadyShown) {
      setShowGuide(true);
    } else {
      setSendingIndex(0);
      setAllDone(false);
    }
  };

  const handleGuideClose = () => {
    localStorage.setItem(BROADCAST_GUIDE_KEY, '1');
    setShowGuide(false);
    setSendingIndex(0);
    setAllDone(false);
  };

  const handleNext = () => {
    const next = (sendingIndex ?? 0) + 1;
    if (next >= summaries.length) {
      setSendingIndex(null);
      setAllDone(true);
    } else {
      setSendingIndex(next);
    }
  };

  const currentSummary = sendingIndex !== null ? summaries[sendingIndex] : null;

  const sendMessage = (summary: CustomerSummary) => {
    if (!summary.customer.phone) return;
    const message = buildMonthlyMessage({
      lang,
      customerName: summary.customer.name,
      month,
      year,
      entries: summary.entries,
      totalLitres: summary.monthTotalLitres,
      totalBilled: summary.monthTotalBilled,
      totalPaid: summary.monthTotalPaid,
      balance: summary.balance,
    });
    navigator.clipboard.writeText(message).catch(() => {});
    openWhatsApp(summary.customer.phone, message);
  };

  // Month selector options — last 6 months
  const monthOptions: { year: number; month: number }[] = [];
  for (let i = 0; i < 6; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    monthOptions.push({ year: d.getFullYear(), month: d.getMonth() + 1 });
  }

  const withPhone = summaries.filter(s => s.customer.phone);
  const withoutPhone = summaries.filter(s => !s.customer.phone);

  return (
    <div className="pb-24 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="bg-green-700 pt-12 pb-5 px-4">
        <div className="flex items-center gap-2 mb-3">
          <button onClick={() => navigate(-1)} className="text-white opacity-80 flex items-center gap-1">
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-white text-xl font-bold flex-1">{t('whatsappMonthlyBtn')}</h1>
        </div>

        {/* Month selector */}
        <div>
          <p className="text-green-200 text-sm mb-2">{t('whatsappSelectMonth')}</p>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {monthOptions.map(opt => {
              const active = opt.year === year && opt.month === month;
              return (
                <button
                  key={`${opt.year}-${opt.month}`}
                  onClick={() => { setYear(opt.year); setMonth(opt.month); }}
                  className={`shrink-0 px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
                    active ? 'bg-white text-green-700' : 'bg-green-800 text-white'
                  }`}
                >
                  {getMonthName(opt.month, lang)} {opt.year}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="px-4 py-4 space-y-3">
        {loading ? (
          <div className="text-center py-16 text-gray-400">Loading...</div>
        ) : (
          <>
            {allDone && (
              <div className="bg-green-50 border border-green-200 rounded-2xl p-4 text-center">
                <p className="text-green-700 font-bold text-lg">{t('whatsappDone')}</p>
              </div>
            )}

            {/* Customers with phone */}
            {withPhone.map(s => (
              <div key={s.customer.id} className="bg-white rounded-2xl px-4 py-3 flex items-center gap-3 shadow-sm">
                <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center shrink-0">
                  <MessageCircle size={18} className="text-green-700" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-800 text-base truncate">{s.customer.name}</p>
                  <p className="text-gray-400 text-sm">{s.customer.phone}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className={`font-bold text-sm ${s.balance > 0 ? 'text-red-600' : s.balance < 0 ? 'text-green-700' : 'text-gray-500'}`}>
                    {s.balance === 0 ? '✅' : s.balance > 0 ? `₹${s.balance.toFixed(0)} due` : `₹${Math.abs(s.balance).toFixed(0)} adv`}
                  </p>
                  {s.entries.length > 0 && (
                    <p className="text-gray-400 text-xs">{s.entries.length} entries</p>
                  )}
                </div>
              </div>
            ))}

            {/* Customers without phone */}
            {withoutPhone.map(s => (
              <div key={s.customer.id} className="bg-white rounded-2xl px-4 py-3 flex items-center gap-3 shadow-sm opacity-70">
                <div className="w-10 h-10 bg-yellow-100 rounded-xl flex items-center justify-center shrink-0">
                  <AlertTriangle size={18} className="text-yellow-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-800 text-base truncate">{s.customer.name}</p>
                  <p className="text-yellow-600 text-sm">{t('whatsappNoNumber')}</p>
                </div>
                <button
                  onClick={() => navigate(`/customers/${s.customer.id}`)}
                  className="flex items-center gap-1 text-green-700 text-sm font-semibold shrink-0"
                >
                  {t('whatsappAddNumber')}
                  <ChevronRight size={16} />
                </button>
              </div>
            ))}

            {summaries.length === 0 && (
              <div className="text-center py-16 text-gray-400">
                <p>{t('noEntries')}</p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Start Button */}
      {!loading && withPhone.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 max-w-lg mx-auto px-4 pb-6 pt-3 bg-gray-50 border-t border-gray-100">
          <button
            onClick={handleStart}
            className="w-full py-4 bg-green-700 text-white rounded-2xl text-base font-bold flex items-center justify-center gap-2 active:bg-green-800"
          >
            <MessageCircle size={20} />
            {t('whatsappStart')} ({withPhone.length})
          </button>
        </div>
      )}

      {/* Broadcast Guide Modal */}
      {showGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-60">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm space-y-4">
            <div className="text-center">
              <div className="text-4xl mb-2">📋</div>
              <h2 className="text-lg font-bold text-gray-800">{t('whatsappBroadcastGuide')}</h2>
            </div>
            <div className="space-y-3 text-gray-700">
              {lang === 'hi' ? (
                <>
                  <p className="flex gap-2"><span className="font-bold text-green-700">1.</span> WhatsApp kholo</p>
                  <p className="flex gap-2"><span className="font-bold text-green-700">2.</span> New Broadcast list banao</p>
                  <p className="flex gap-2"><span className="font-bold text-green-700">3.</span> Apne sabhi customers ko add karo</p>
                  <p className="flex gap-2"><span className="font-bold text-green-700">4.</span> List ka naam rakho "DoodhKhata Customers"</p>
                </>
              ) : (
                <>
                  <p className="flex gap-2"><span className="font-bold text-green-700">1.</span> Open WhatsApp</p>
                  <p className="flex gap-2"><span className="font-bold text-green-700">2.</span> Create a New Broadcast list</p>
                  <p className="flex gap-2"><span className="font-bold text-green-700">3.</span> Add all your customers to it</p>
                  <p className="flex gap-2"><span className="font-bold text-green-700">4.</span> Name it "DoodhKhata Customers"</p>
                </>
              )}
            </div>
            <button
              onClick={handleGuideClose}
              className="w-full py-4 bg-green-700 text-white rounded-xl text-base font-bold active:bg-green-800"
            >
              {t('whatsappStart')}
            </button>
          </div>
        </div>
      )}

      {/* Sending Modal — one by one */}
      {currentSummary && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black bg-opacity-60 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg p-5 space-y-4">
            {/* Progress */}
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">
                {t('whatsappSending')} {(sendingIndex ?? 0) + 1} {t('whatsappOf')} {summaries.length}
              </p>
              <div className="flex gap-1">
                {summaries.map((_, i) => (
                  <div
                    key={i}
                    className={`h-1.5 rounded-full ${i <= (sendingIndex ?? 0) ? 'bg-green-700' : 'bg-gray-200'}`}
                    style={{ width: `${Math.max(6, 200 / summaries.length)}px` }}
                  />
                ))}
              </div>
            </div>

            {/* Customer info */}
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                currentSummary.customer.phone ? 'bg-green-100' : 'bg-yellow-100'
              }`}>
                {currentSummary.customer.phone
                  ? <MessageCircle size={22} className="text-green-700" />
                  : <AlertTriangle size={22} className="text-yellow-600" />
                }
              </div>
              <div>
                <p className="font-bold text-gray-800 text-lg">{currentSummary.customer.name}</p>
                <p className={`text-sm ${currentSummary.balance > 0 ? 'text-red-600' : 'text-gray-500'}`}>
                  {formatCurrency(Math.abs(currentSummary.balance))} {currentSummary.balance > 0 ? 'due' : currentSummary.balance < 0 ? 'advance' : '✅'}
                </p>
              </div>
            </div>

            {currentSummary.customer.phone ? (
              <>
                <p className="text-sm text-gray-500 bg-gray-50 rounded-xl px-3 py-2">
                  {lang === 'hi'
                    ? 'WhatsApp khul gaya — message bhejo, phir Next dabao'
                    : 'WhatsApp opened — send the message, then tap Next'}
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      sendMessage(currentSummary);
                    }}
                    className="flex-1 py-4 rounded-xl bg-green-700 text-white text-base font-semibold flex items-center justify-center gap-2 active:bg-green-800"
                  >
                    <MessageCircle size={18} />
                    {lang === 'hi' ? 'WhatsApp Kholo' : 'Open WhatsApp'}
                  </button>
                  <button
                    onClick={handleNext}
                    className="flex-1 py-4 rounded-xl border-2 border-green-700 text-green-700 text-base font-semibold active:bg-green-50"
                  >
                    {t('whatsappNext')}
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="bg-yellow-50 rounded-xl px-3 py-3">
                  <p className="text-yellow-700 text-sm font-medium">{t('whatsappNoNumber')}</p>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setSendingIndex(null);
                      navigate(`/customers/${currentSummary.customer.id}`);
                    }}
                    className="flex-1 py-4 rounded-xl bg-green-700 text-white text-base font-semibold active:bg-green-800"
                  >
                    {t('whatsappAddNumber')}
                  </button>
                  <button
                    onClick={handleNext}
                    className="flex-1 py-4 rounded-xl border border-gray-300 text-gray-700 text-base font-semibold active:bg-gray-50"
                  >
                    {t('whatsappSkip')}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* All done modal */}
      {allDone && sendingIndex === null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-60">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm text-center space-y-4">
            <CheckCircle2 size={56} className="text-green-700 mx-auto" />
            <p className="text-xl font-bold text-gray-800">{t('whatsappDone')}</p>
            <button
              onClick={() => { setAllDone(false); navigate(-1); }}
              className="w-full py-4 bg-green-700 text-white rounded-xl text-base font-bold active:bg-green-800"
            >
              {t('close')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
