import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap, LayoutList, Droplets, ShoppingCart, TrendingUp, TrendingDown, User, Package, MessageCircle, Search, X, CalendarRange } from 'lucide-react';
import { useLanguage } from '../hooks/useLanguage';
import { useTotalBalances } from '../hooks/useBalance';
import { getTodaySummary, getRecentActivities, ActivityItem } from '../db/queries';
import { formatCurrency, formatLitres, formatDate, todayString, toDateString } from '../utils/format';
import { BottomSheet } from '../components/BottomSheet';
import { QuickEntry } from './QuickEntry';

type FilterKey = 'today' | 'week' | 'month' | 'year' | 'all' | 'custom';

export function Home() {
  const { t, lang } = useLanguage();
  const navigate = useNavigate();
  const { totalReceivable, totalPayable, refresh } = useTotalBalances();

  const [todaySold, setTodaySold] = useState(0);
  const [todayBought, setTodayBought] = useState(0);
  const [allActivities, setAllActivities] = useState<ActivityItem[]>([]);
  const [showQuickEntry, setShowQuickEntry] = useState(false);
  const [filter, setFilter] = useState<FilterKey>('all');
  const [search, setSearch] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState(todayString());

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    const [summary, activities] = await Promise.all([getTodaySummary(), getRecentActivities(1000)]);
    setTodaySold(summary.soldLitres);
    setTodayBought(summary.purchasedLitres);
    setAllActivities(activities);
    refresh();
  };

  const filtered = useMemo(() => {
    let list = allActivities;

    if (search.trim()) {
      list = list.filter(a => a.partyName.toLowerCase().includes(search.toLowerCase()));
    }

    const today = todayString();
    if (filter === 'today') {
      list = list.filter(a => a.date === today);
    } else if (filter === 'week') {
      const d = new Date(); d.setDate(d.getDate() - 6);
      const from = toDateString(d);
      list = list.filter(a => a.date >= from);
    } else if (filter === 'month') {
      const d = new Date(); d.setDate(d.getDate() - 29);
      list = list.filter(a => a.date >= toDateString(d));
    } else if (filter === 'year') {
      const d = new Date(); d.setFullYear(d.getFullYear() - 1);
      list = list.filter(a => a.date >= toDateString(d));
    } else if (filter === 'custom') {
      if (customFrom) list = list.filter(a => a.date >= customFrom);
      if (customTo) list = list.filter(a => a.date <= customTo);
    }

    return list;
  }, [allActivities, search, filter, customFrom, customTo]);

  const FILTERS: { key: FilterKey; hi: string; en: string }[] = [
    { key: 'today', hi: 'आज', en: 'Today' },
    { key: 'week', hi: 'हफ्ते', en: 'Week' },
    { key: 'month', hi: 'महीना', en: 'Month' },
    { key: 'year', hi: 'साल', en: 'Year' },
    { key: 'all', hi: 'सब', en: 'All' },
    { key: 'custom', hi: 'तारीख', en: 'Range' },
  ];

  return (
    /* Full-screen flex column — top fixed, bottom scrolls */
    <div className="flex flex-col bg-gray-50 dark:bg-gray-900 overflow-hidden" style={{ height: '100dvh' }}>

      {/* ── FIXED TOP ──────────────────────────────── */}
      <div className="flex-none">
        {/* Green header */}
        <div className="bg-green-700 dark:bg-green-900 pt-12 pb-3 px-4">
          <div className="flex items-end justify-between mb-3">
            <div>
              <h1 className="text-white text-xl font-bold">🥛 {t('appName')}</h1>
              <p className="text-green-200 text-xs mt-0.5">{t('todaySummary')}</p>
            </div>
            <div className="text-right">
              <p className="text-green-200 text-xs">{lang === 'hi' ? 'लेना बाकी' : 'To Receive'}</p>
              <p className="text-white text-2xl font-bold leading-tight">{formatCurrency(totalReceivable)}</p>
            </div>
          </div>

          {/* Inline stats row */}
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-white/10 rounded-xl px-3 py-2 flex items-center gap-2">
              <ShoppingCart size={15} className="text-white/70 shrink-0" />
              <div>
                <p className="text-white/60 text-xs leading-none">{t('todayLitresBought')}</p>
                <p className="text-white font-bold text-sm mt-0.5">{formatLitres(todayBought)}</p>
              </div>
            </div>
            <div className="bg-white/10 rounded-xl px-3 py-2 flex items-center gap-2">
              <Droplets size={15} className="text-white/70 shrink-0" />
              <div>
                <p className="text-white/60 text-xs leading-none">{t('todayLitresSold')}</p>
                <p className="text-white font-bold text-sm mt-0.5">{formatLitres(todaySold)}</p>
              </div>
            </div>
            <div className="bg-white/10 rounded-xl px-3 py-2 flex items-center gap-2">
              <TrendingUp size={15} className="text-white/70 shrink-0" />
              <div>
                <p className="text-white/60 text-xs leading-none">{t('receivable')}</p>
                <p className="text-white font-bold text-sm mt-0.5">{formatCurrency(totalReceivable)}</p>
              </div>
            </div>
            <div className="bg-white/10 rounded-xl px-3 py-2 flex items-center gap-2">
              <TrendingDown size={15} className="text-white/70 shrink-0" />
              <div>
                <p className="text-white/60 text-xs leading-none">{t('payable')}</p>
                <p className="text-white font-bold text-sm mt-0.5">{formatCurrency(totalPayable)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Action buttons — 3 in a row */}
        <div className="px-4 pt-2.5 pb-1 grid grid-cols-3 gap-2 bg-gray-50 dark:bg-gray-900">
          <button onClick={() => setShowQuickEntry(true)}
            className="bg-green-700 dark:bg-green-800 text-white rounded-xl py-3 flex flex-col items-center gap-1 active:scale-95 transition-transform shadow-sm">
            <Zap size={20} />
            <span className="text-xs font-bold">{t('quickEntry')}</span>
          </button>
          <button onClick={() => navigate('/batch-entry')}
            className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl py-3 flex flex-col items-center gap-1 active:scale-95 transition-transform shadow-sm">
            <LayoutList size={20} className="text-green-700 dark:text-green-400" />
            <span className="text-xs font-bold text-gray-700 dark:text-gray-200">{t('batchEntry')}</span>
          </button>
          <button onClick={() => navigate('/whatsapp-bulk')}
            className="rounded-xl py-3 flex flex-col items-center gap-1 active:scale-95 transition-transform shadow-sm"
            style={{ background: '#25D366' }}>
            <MessageCircle size={20} className="text-white" />
            <span className="text-white text-xs font-bold">WhatsApp</span>
          </button>
        </div>
      </div>

      {/* ── SCROLLABLE ACTIVITY PANEL ──────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden" style={{ paddingBottom: '58px' }}>

        {/* Filter bar — sticky within panel */}
        <div className="flex-none bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 px-4 py-2 space-y-2">
          {/* Title + search toggle */}
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-gray-800 dark:text-white flex-1">{t('recentActivity')}</h2>
            <span className="text-xs text-gray-400 dark:text-gray-500">{filtered.length}</span>
            <button
              onClick={() => { setSearchOpen(v => !v); if (searchOpen) setSearch(''); }}
              className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
            >
              {searchOpen ? <X size={16} /> : <Search size={16} />}
            </button>
          </div>

          {/* Search input */}
          {searchOpen && (
            <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-700 rounded-xl px-3 py-2">
              <Search size={14} className="text-gray-400 shrink-0" />
              <input
                autoFocus
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder={lang === 'hi' ? 'ग्राहक / सप्लायर खोजें...' : 'Search name...'}
                className="flex-1 bg-transparent text-sm text-gray-800 dark:text-white placeholder-gray-400 focus:outline-none"
              />
              {search && <button onClick={() => setSearch('')}><X size={13} className="text-gray-400" /></button>}
            </div>
          )}

          {/* Filter chips */}
          <div className="flex gap-1.5 overflow-x-auto pb-0.5">
            {FILTERS.map(f => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1 transition-colors ${
                  filter === f.key
                    ? 'bg-green-700 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                }`}
              >
                {f.key === 'custom' && <CalendarRange size={11} />}
                {lang === 'hi' ? f.hi : f.en}
              </button>
            ))}
          </div>

          {/* Custom date range pickers */}
          {filter === 'custom' && (
            <div className="grid grid-cols-2 gap-2">
              <div>
                <p className="text-xs text-gray-400 dark:text-gray-500 mb-1">{lang === 'hi' ? 'से' : 'From'}</p>
                <input type="date" value={customFrom} onChange={e => setCustomFrom(e.target.value)}
                  className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-xl px-2 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-green-500" />
              </div>
              <div>
                <p className="text-xs text-gray-400 dark:text-gray-500 mb-1">{lang === 'hi' ? 'तक' : 'To'}</p>
                <input type="date" value={customTo} onChange={e => setCustomTo(e.target.value)}
                  className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-xl px-2 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-green-500" />
              </div>
            </div>
          )}
        </div>

        {/* Activity list — scrollable */}
        <div className="flex-1 overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="py-16 text-center">
              <p className="text-4xl mb-3">📭</p>
              <p className="text-gray-500 dark:text-gray-400 font-semibold">{t('noActivity')}</p>
              {(search || filter !== 'all') && (
                <button onClick={() => { setSearch(''); setFilter('all'); }}
                  className="mt-3 text-sm text-green-600 dark:text-green-400 font-semibold underline">
                  {lang === 'hi' ? 'फ़िल्टर हटाएं' : 'Clear filters'}
                </button>
              )}
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 divide-y divide-gray-50 dark:divide-gray-700/50">
              {filtered.map(activity => (
                <ActivityRow key={activity.id} activity={activity} navigate={navigate} />
              ))}
            </div>
          )}
        </div>
      </div>

      <BottomSheet isOpen={showQuickEntry} onClose={() => setShowQuickEntry(false)} title={t('quickEntry')}>
        <QuickEntry onClose={() => { setShowQuickEntry(false); loadData(); }} />
      </BottomSheet>
    </div>
  );
}

function ActivityRow({ activity, navigate }: { activity: ActivityItem; navigate: (path: string) => void }) {
  const isCustomer = activity.partyType === 'customer';
  const isDelivery = activity.entryType === 'delivery';

  return (
    <button
      onClick={() => navigate(isCustomer ? `/customers/${activity.partyId}` : `/suppliers/${activity.partyId}`)}
      className="w-full px-4 py-3.5 flex items-center gap-3 active:bg-gray-50 dark:active:bg-gray-700/50 text-left"
    >
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
        isCustomer ? 'bg-green-100 dark:bg-green-900/40' : 'bg-blue-100 dark:bg-blue-900/40'
      }`}>
        {isCustomer
          ? <User size={17} className="text-green-700 dark:text-green-400" />
          : <Package size={17} className="text-blue-700 dark:text-blue-400" />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-gray-800 dark:text-white font-semibold text-sm truncate">{activity.partyName}</p>
        <p className="text-gray-400 dark:text-gray-500 text-xs">
          {isDelivery ? `🥛 ${activity.litres}L` : '💰 Payment'} · {formatDate(activity.date)}
        </p>
      </div>
      <p className={`font-bold text-sm shrink-0 ${isDelivery ? 'text-gray-800 dark:text-gray-100' : 'text-green-700 dark:text-green-400'}`}>
        {formatCurrency(activity.amount)}
      </p>
    </button>
  );
}
