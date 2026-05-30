import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, MessageCircle, AlertTriangle, ChevronRight, CheckCircle2, Send, Info } from 'lucide-react';
import { useLanguage } from '../hooks/useLanguage';
import { getAllCustomers, getCustomerMonthlyData } from '../db/queries';
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
  sent: boolean;
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
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [showInfo, setShowInfo] = useState(false);

  // After opening WhatsApp, auto-mark sent when user comes back
  const pendingAutoAdvance = useRef(false);

  useEffect(() => {
    const handle = () => {
      if (document.visibilityState === 'visible' && pendingAutoAdvance.current) {
        pendingAutoAdvance.current = false;
        setSummaries(prev => prev.map((s, i) => i === activeIndex ? { ...s, sent: true } : s));
        setActiveIndex(null);
      }
    };
    document.addEventListener('visibilitychange', handle);
    return () => document.removeEventListener('visibilitychange', handle);
  }, [activeIndex]);

  const loadSummaries = useCallback(async () => {
    setLoading(true);
    const customers = (await getAllCustomers()).filter(c => c.isActive);
    const results = await Promise.all(customers.map(async customer => {
      const data = await getCustomerMonthlyData(customer.id, year, month);
      return {
        customer,
        balance: data.balance,
        monthTotalLitres: data.monthTotalLitres,
        monthTotalBilled: data.monthTotalBilled,
        monthTotalPaid: data.monthTotalPaid,
        entries: data.monthDeliveries.map(d => ({ date: d.date, litres: d.litres, amount: d.amount })),
        sent: false,
      };
    }));
    setSummaries(results);
    setLoading(false);
  }, [year, month]);

  useEffect(() => { loadSummaries(); }, [loadSummaries]);

  const handleSendRow = (idx: number) => {
    if (!localStorage.getItem(BROADCAST_GUIDE_KEY)) {
      setShowGuide(true);
      setActiveIndex(idx);
      return;
    }
    doSend(idx);
  };

  const doSend = (idx: number) => {
    const s = summaries[idx];
    if (!s.customer.phone) return;
    const message = buildMonthlyMessage({
      lang,
      customerName: s.customer.name,
      month, year,
      entries: s.entries,
      totalLitres: s.monthTotalLitres,
      totalBilled: s.monthTotalBilled,
      totalPaid: s.monthTotalPaid,
      balance: s.balance,
    });
    navigator.clipboard.writeText(message).catch(() => {});
    setActiveIndex(idx);
    pendingAutoAdvance.current = true;
    openWhatsApp(s.customer.phone, message);
  };

  const handleGuideClose = () => {
    localStorage.setItem(BROADCAST_GUIDE_KEY, '1');
    setShowGuide(false);
    if (activeIndex !== null) doSend(activeIndex);
  };

  const withPhone = summaries.filter(s => s.customer.phone);
  const withoutPhone = summaries.filter(s => !s.customer.phone);
  const sentCount = summaries.filter(s => s.sent).length;

  const monthOptions = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    return { year: d.getFullYear(), month: d.getMonth() + 1 };
  });

  return (
    <div className="pb-28 bg-gray-50 dark:bg-gray-900 min-h-screen">
      {/* Header */}
      <div className="bg-green-700 dark:bg-green-900 pt-12 pb-5 px-4">
        <div className="flex items-center gap-2 mb-3">
          <button onClick={() => navigate(-1)} className="text-white/80"><ArrowLeft size={20} /></button>
          <h1 className="text-white text-xl font-bold flex-1">{t('whatsappMonthlyBtn')}</h1>
          <button onClick={() => setShowInfo(true)} className="text-white/70 w-8 h-8 flex items-center justify-center">
            <Info size={20} />
          </button>
        </div>
        <p className="text-green-200 text-sm mb-2">{t('whatsappSelectMonth')}</p>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {monthOptions.map(opt => {
            const active = opt.year === year && opt.month === month;
            return (
              <button key={`${opt.year}-${opt.month}`}
                onClick={() => { setYear(opt.year); setMonth(opt.month); setSummaries([]); }}
                className={`shrink-0 px-4 py-2 rounded-xl text-sm font-semibold ${active ? 'bg-white text-green-700' : 'bg-green-800 dark:bg-green-950 text-white'}`}>
                {getMonthName(opt.month, lang)} {opt.year}
              </button>
            );
          })}
        </div>
      </div>

      {/* Progress bar */}
      {withPhone.length > 0 && (
        <div className="px-4 py-3 bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 flex items-center gap-3">
          <div className="flex-1 bg-gray-100 dark:bg-gray-700 rounded-full h-2">
            <div
              className="bg-green-600 h-2 rounded-full transition-all"
              style={{ width: `${(sentCount / withPhone.length) * 100}%` }}
            />
          </div>
          <p className="text-sm font-bold text-gray-600 dark:text-gray-300 shrink-0">
            {sentCount}/{withPhone.length}
          </p>
          {sentCount === withPhone.length && withPhone.length > 0 && (
            <span className="text-green-600 dark:text-green-400 text-sm font-bold">✅ {lang === 'hi' ? 'Sab bhej diya!' : 'All sent!'}</span>
          )}
        </div>
      )}

      <div className="px-4 py-4 space-y-2">
        {loading ? (
          <div className="text-center py-16 text-gray-400 dark:text-gray-600">Loading...</div>
        ) : (
          <>
            {/* How it works hint */}
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-2xl px-4 py-3 flex items-start gap-2">
              <span className="text-lg shrink-0">💡</span>
              <p className="text-blue-700 dark:text-blue-400 text-sm">
                {lang === 'hi'
                  ? 'Send dabao → WhatsApp khulega → wahan Send dabao → wapas aao → next customer ready'
                  : 'Tap Send → WhatsApp opens → press Send there → come back → next customer ready'}
              </p>
            </div>

            {/* Customers WITH phone */}
            {withPhone.map((s, idx) => {
              const realIdx = summaries.indexOf(s);
              const isActive = activeIndex === realIdx;
              return (
                <div key={s.customer.id}
                  className={`bg-white dark:bg-gray-800 rounded-2xl px-4 py-3.5 flex items-center gap-3 shadow-sm transition-all ${s.sent ? 'opacity-60' : ''} ${isActive ? 'ring-2 ring-green-500' : ''}`}>
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 font-bold text-base ${
                    s.sent ? 'bg-green-100 dark:bg-green-900/40' : 'bg-gray-100 dark:bg-gray-700'
                  }`}>
                    {s.sent
                      ? <CheckCircle2 size={22} className="text-green-600 dark:text-green-400" />
                      : <span className="text-gray-700 dark:text-gray-300">{s.customer.name.charAt(0).toUpperCase()}</span>
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-800 dark:text-white text-base truncate">{s.customer.name}</p>
                    <p className="text-gray-400 dark:text-gray-500 text-sm">📞 {s.customer.phone}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <p className={`text-sm font-bold ${s.balance > 0 ? 'text-red-600 dark:text-red-400' : s.balance < 0 ? 'text-green-600 dark:text-green-400' : 'text-gray-400'}`}>
                      {s.balance === 0 ? '✅' : `${formatCurrency(Math.abs(s.balance))} ${s.balance > 0 ? (lang === 'hi' ? 'due' : 'due') : 'adv'}`}
                    </p>
                    <button
                      onClick={() => handleSendRow(realIdx)}
                      disabled={s.sent}
                      className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-all active:scale-90 ${
                        s.sent
                          ? 'bg-green-100 dark:bg-green-900/40 cursor-default'
                          : 'bg-green-700 dark:bg-green-800 active:bg-green-800'
                      }`}
                    >
                      {s.sent
                        ? <CheckCircle2 size={20} className="text-green-600 dark:text-green-400" />
                        : <Send size={18} className="text-white" />
                      }
                    </button>
                  </div>
                </div>
              );
            })}

            {/* Customers WITHOUT phone */}
            {withoutPhone.map(s => (
              <div key={s.customer.id} className="bg-white dark:bg-gray-800 rounded-2xl px-4 py-3.5 flex items-center gap-3 shadow-sm opacity-60">
                <div className="w-11 h-11 bg-yellow-100 dark:bg-yellow-900/30 rounded-xl flex items-center justify-center shrink-0">
                  <AlertTriangle size={20} className="text-yellow-600 dark:text-yellow-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-gray-800 dark:text-white text-base truncate">{s.customer.name}</p>
                  <p className="text-yellow-600 dark:text-yellow-500 text-sm">{t('whatsappNoNumber')}</p>
                </div>
                <button onClick={() => navigate(`/customers/${s.customer.id}`)}
                  className="flex items-center gap-1 text-green-700 dark:text-green-400 text-sm font-semibold shrink-0">
                  {t('whatsappAddNumber')}<ChevronRight size={16} />
                </button>
              </div>
            ))}

            {summaries.length === 0 && !loading && (
              <div className="text-center py-16 text-gray-400 dark:text-gray-600">{t('noEntries')}</div>
            )}
          </>
        )}
      </div>

      {/* Info modal — why one by one */}
      {showInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 w-full max-w-sm space-y-4">
            <div className="text-center text-4xl">📲</div>
            <h2 className="text-lg font-bold text-gray-800 dark:text-white text-center">
              {lang === 'hi' ? 'Ek-ek karke kyun?' : 'Why one by one?'}
            </h2>
            <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
              {lang === 'hi'
                ? 'WhatsApp mein har customer ka alag naam, baaki aur hisaab hota hai isliye ek hi baar mein sab ko ek saath nahi bheja ja sakta. Lekin yeh process bahut aasaan hai — sirf ek tap mein WhatsApp khulega aur message pehle se likha hoga, bas Send dabao!'
                : "Each customer has their own name, balance and entries — so one single message can't go to all. But this process is super easy — one tap opens WhatsApp with the message pre-filled, just press Send!"}
            </p>
            <button onClick={() => setShowInfo(false)}
              className="w-full py-4 bg-green-700 text-white rounded-xl font-bold">{t('close')}</button>
          </div>
        </div>
      )}

      {/* Broadcast setup guide */}
      {showGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 w-full max-w-sm space-y-4">
            <div className="text-center">
              <div className="text-5xl mb-3">📋</div>
              <h2 className="text-lg font-bold text-gray-800 dark:text-white">{t('whatsappBroadcastGuide')}</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {lang === 'hi' ? 'Yeh ek baar karo, baad mein seedha bhej sako ge' : 'Do this once for faster sending later'}
              </p>
            </div>
            <div className="space-y-3">
              {(lang === 'hi'
                ? ['WhatsApp kholo', 'New Broadcast list banao', 'Sabhi customers ko add karo', '"DoodhKhata Customers" naam do']
                : ['Open WhatsApp', 'Create a New Broadcast list', 'Add all your customers', 'Name it "DoodhKhata Customers"']
              ).map((text, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-full bg-green-100 dark:bg-green-900/40 flex items-center justify-center shrink-0">
                    <span className="text-green-700 dark:text-green-400 font-bold text-sm">{i + 1}</span>
                  </div>
                  <p className="text-gray-700 dark:text-gray-300 text-sm">{text}</p>
                </div>
              ))}
            </div>
            <button onClick={handleGuideClose}
              className="w-full py-4 bg-green-700 text-white rounded-xl font-bold active:bg-green-800">
              {lang === 'hi' ? 'Theek hai, Shuru Karo!' : 'Got it, Start!'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
