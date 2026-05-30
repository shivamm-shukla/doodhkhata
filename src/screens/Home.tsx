import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap, LayoutList, Droplets, ShoppingCart, TrendingUp, TrendingDown, User, Package, MessageCircle } from 'lucide-react';
import { useLanguage } from '../hooks/useLanguage';
import { useTotalBalances } from '../hooks/useBalance';
import { StatCard } from '../components/StatCard';
import { getTodaySummary, getRecentActivities, ActivityItem } from '../db/queries';
import { formatCurrency, formatLitres, formatDate } from '../utils/format';
import { BottomSheet } from '../components/BottomSheet';
import { QuickEntry } from './QuickEntry';

export function Home() {
  const { t, lang } = useLanguage();
  const navigate = useNavigate();
  const { totalReceivable, totalPayable, refresh } = useTotalBalances();
  const [todaySold, setTodaySold] = useState(0);
  const [todayBought, setTodayBought] = useState(0);
  const [recentActivities, setRecentActivities] = useState<ActivityItem[]>([]);
  const [showQuickEntry, setShowQuickEntry] = useState(false);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    const [summary, activities] = await Promise.all([getTodaySummary(), getRecentActivities(10)]);
    setTodaySold(summary.soldLitres);
    setTodayBought(summary.purchasedLitres);
    setRecentActivities(activities);
    refresh();
  };

  return (
    <div className="pb-20 bg-gray-50 dark:bg-gray-900 min-h-screen">
      {/* Header */}
      <div className="bg-green-700 dark:bg-green-900 pt-12 pb-6 px-4 rounded-b-3xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-white text-2xl font-bold">{t('appName')} 🥛</h1>
            <p className="text-green-200 text-sm mt-0.5">{t('todaySummary')}</p>
          </div>
          <div className="text-right">
            <p className="text-green-200 text-xs">{lang === 'hi' ? 'लेना बाकी' : 'To Receive'}</p>
            <p className="text-white text-2xl font-bold">{formatCurrency(totalReceivable)}</p>
          </div>
        </div>
      </div>

      <div className="px-4 -mt-2 space-y-4">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3 mt-3">
          <StatCard title={t('todayLitresBought')} value={formatLitres(todayBought)} icon={<ShoppingCart size={20} />} color="blue" subtitle={t('purchased')} />
          <StatCard title={t('todayLitresSold')} value={formatLitres(todaySold)} icon={<Droplets size={20} />} color="green" subtitle={t('sold')} />
          <StatCard title={t('receivable')} value={formatCurrency(totalReceivable)} icon={<TrendingUp size={20} />} color="green" subtitle={t('customers')} />
          <StatCard title={t('payable')} value={formatCurrency(totalPayable)} icon={<TrendingDown size={20} />} color="red" subtitle={t('suppliers')} />
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setShowQuickEntry(true)}
            className="bg-green-700 dark:bg-green-800 text-white rounded-2xl p-5 flex flex-col items-start gap-2 active:scale-95 transition-transform shadow-sm"
          >
            <Zap size={28} />
            <span className="text-lg font-bold">{t('quickEntry')}</span>
            <span className="text-xs text-green-200">{lang === 'hi' ? 'एक ग्राहक' : 'One customer'}</span>
          </button>
          <button
            onClick={() => navigate('/batch-entry')}
            className="bg-white dark:bg-gray-800 text-gray-800 dark:text-white border border-gray-200 dark:border-gray-700 rounded-2xl p-5 flex flex-col items-start gap-2 active:scale-95 transition-transform shadow-sm"
          >
            <LayoutList size={28} className="text-green-700 dark:text-green-400" />
            <span className="text-lg font-bold">{t('batchEntry')}</span>
            <span className="text-xs text-gray-400 dark:text-gray-500">{lang === 'hi' ? 'सभी ग्राहक' : 'All customers'}</span>
          </button>
        </div>

        {/* WhatsApp Bulk Button */}
        <button
          onClick={() => navigate('/whatsapp-bulk')}
          className="w-full rounded-2xl p-4 flex items-center gap-3 active:scale-95 transition-transform shadow-sm"
          style={{ background: '#25D366' }}
        >
          <div className="w-11 h-11 bg-white/20 rounded-xl flex items-center justify-center shrink-0">
            <MessageCircle size={24} className="text-white" />
          </div>
          <div className="text-left flex-1">
            <p className="text-white text-base font-bold">{t('whatsappMonthlyBtn')}</p>
            <p className="text-white/75 text-xs mt-0.5">📲 {lang === 'hi' ? 'सबको एक साथ statement भेजो' : 'Send statement to all at once'}</p>
          </div>
        </button>

        {/* Recent Activity */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-4 pt-4 pb-2">
            <h2 className="text-lg font-bold text-gray-800 dark:text-white">{t('recentActivity')}</h2>
          </div>
          {recentActivities.length === 0 ? (
            <div className="px-4 pb-8 text-center text-gray-400 dark:text-gray-500 text-base py-8">
              {t('noActivity')}
            </div>
          ) : (
            <div className="divide-y divide-gray-50 dark:divide-gray-700/50">
              {recentActivities.map(activity => (
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
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
        isCustomer ? 'bg-green-100 dark:bg-green-900/40' : 'bg-blue-100 dark:bg-blue-900/40'
      }`}>
        {isCustomer
          ? <User size={18} className="text-green-700 dark:text-green-400" />
          : <Package size={18} className="text-blue-700 dark:text-blue-400" />
        }
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-gray-800 dark:text-white font-semibold text-base truncate">{activity.partyName}</p>
        <p className="text-gray-400 dark:text-gray-500 text-sm">
          {isDelivery ? `🥛 ${activity.litres}L` : '💰 Payment'} · {formatDate(activity.date)}
        </p>
      </div>
      <p className={`font-bold text-base shrink-0 ${isDelivery ? 'text-gray-800 dark:text-gray-100' : 'text-green-700 dark:text-green-400'}`}>
        {formatCurrency(activity.amount)}
      </p>
    </button>
  );
}
