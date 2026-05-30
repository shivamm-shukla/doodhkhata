import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap, LayoutList, Droplets, ShoppingCart, TrendingUp, TrendingDown, User, Package, ArrowRight, MessageCircle } from 'lucide-react';
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

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [summary, activities] = await Promise.all([
      getTodaySummary(),
      getRecentActivities(10),
    ]);
    setTodaySold(summary.soldLitres);
    setTodayBought(summary.purchasedLitres);
    setRecentActivities(activities);
    refresh();
  };

  return (
    <div className="pb-20 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="bg-green-700 pt-12 pb-6 px-4 rounded-b-3xl">
        <h1 className="text-white text-2xl font-bold">{t('appName')}</h1>
        <p className="text-green-200 text-sm mt-1">{t('todaySummary')}</p>
      </div>

      <div className="px-4 -mt-4 space-y-4">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          <StatCard
            title={t('todayLitresBought')}
            value={formatLitres(todayBought)}
            icon={<ShoppingCart size={20} />}
            color="blue"
            subtitle={t('purchased')}
          />
          <StatCard
            title={t('todayLitresSold')}
            value={formatLitres(todaySold)}
            icon={<Droplets size={20} />}
            color="green"
            subtitle={t('sold')}
          />
          <StatCard
            title={t('receivable')}
            value={formatCurrency(totalReceivable)}
            icon={<TrendingUp size={20} />}
            color="green"
            subtitle={t('customers')}
          />
          <StatCard
            title={t('payable')}
            value={formatCurrency(totalPayable)}
            icon={<TrendingDown size={20} />}
            color="red"
            subtitle={t('suppliers')}
          />
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setShowQuickEntry(true)}
            className="bg-green-700 text-white rounded-2xl p-5 flex flex-col items-start gap-2 active:scale-95 transition-transform shadow-sm"
          >
            <Zap size={28} />
            <span className="text-lg font-bold">{t('quickEntry')}</span>
          </button>
          <button
            onClick={() => navigate('/batch-entry')}
            className="bg-white text-gray-800 border border-gray-200 rounded-2xl p-5 flex flex-col items-start gap-2 active:scale-95 transition-transform shadow-sm"
          >
            <LayoutList size={28} className="text-green-700" />
            <span className="text-lg font-bold">{t('batchEntry')}</span>
          </button>
        </div>

        {/* WhatsApp Bulk Button */}
        <button
          onClick={() => navigate('/whatsapp-bulk')}
          className="w-full bg-[#25D366] text-white rounded-2xl p-4 flex items-center gap-3 active:scale-95 transition-transform shadow-sm"
        >
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center shrink-0">
            <MessageCircle size={22} />
          </div>
          <div className="text-left">
            <p className="text-base font-bold">{t('whatsappMonthlyBtn')}</p>
            <p className="text-xs opacity-80">📲 {lang === 'hi' ? 'सबको एक साथ भेजो' : 'Send to all at once'}</p>
          </div>
        </button>

        {/* Recent Activity */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="px-4 pt-4 pb-2 flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-800">{t('recentActivity')}</h2>
          </div>

          {recentActivities.length === 0 ? (
            <div className="px-4 pb-6 text-center text-gray-400 text-base py-8">
              {t('noActivity')}
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {recentActivities.map((activity) => (
                <ActivityRow key={activity.id} activity={activity} navigate={navigate} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick Entry Sheet */}
      <BottomSheet isOpen={showQuickEntry} onClose={() => setShowQuickEntry(false)} title={t('quickEntry')}>
        <QuickEntry onClose={() => { setShowQuickEntry(false); loadData(); }} />
      </BottomSheet>
    </div>
  );
}

function ActivityRow({ activity, navigate }: { activity: ActivityItem; navigate: (path: string) => void }) {
  const isCustomer = activity.partyType === 'customer';
  const isDelivery = activity.entryType === 'delivery';

  const handleClick = () => {
    if (isCustomer) {
      navigate(`/customers/${activity.partyId}`);
    } else {
      navigate(`/suppliers/${activity.partyId}`);
    }
  };

  return (
    <button
      onClick={handleClick}
      className="w-full px-4 py-3 flex items-center gap-3 active:bg-gray-50 text-left"
    >
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
        isCustomer ? 'bg-green-100' : 'bg-blue-100'
      }`}>
        {isCustomer ? (
          <User size={18} className="text-green-700" />
        ) : (
          <Package size={18} className="text-blue-700" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-gray-800 font-semibold text-base truncate">{activity.partyName}</p>
        <p className="text-gray-400 text-sm">
          {isDelivery ? `${activity.litres}L` : 'Payment'} · {formatDate(activity.date)}
        </p>
      </div>
      <div className="text-right shrink-0">
        <p className={`font-bold text-base ${isDelivery ? 'text-gray-800' : 'text-green-700'}`}>
          {formatCurrency(activity.amount)}
        </p>
      </div>
    </button>
  );
}
