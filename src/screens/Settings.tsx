import React, { useState } from 'react';
import { Globe, IndianRupee, Download, Upload, ChevronRight, Sun, Moon, Monitor } from 'lucide-react';
import { useLanguage } from '../hooks/useLanguage';
import { useApp } from '../context/AppContext';
import { useTheme, Theme } from '../context/ThemeContext';
import { exportData, importData } from '../db/queries';

export function Settings() {
  const { t, lang } = useLanguage();
  const { state, updateLanguage, updateRates, showToast } = useApp();
  const { theme, setTheme } = useTheme();
  const [customerRate, setCustomerRate] = useState(String(state.defaultCustomerRate));
  const [supplierRate, setSupplierRate] = useState(String(state.defaultSupplierRate));
  const [saving, setSaving] = useState(false);

  const handleSaveRates = async () => {
    setSaving(true);
    try {
      await updateRates(parseFloat(customerRate) || state.defaultCustomerRate, parseFloat(supplierRate) || state.defaultSupplierRate);
      showToast(t('savedSuccessfully'));
    } catch { showToast(t('errorOccurred'), 'error'); }
    finally { setSaving(false); }
  };

  const handleExport = async () => {
    try {
      const data = await exportData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `doodhkhata-backup-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast(t('savedSuccessfully'));
    } catch { showToast(t('errorOccurred'), 'error'); }
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file'; input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      try { await importData(JSON.parse(await file.text())); showToast(t('savedSuccessfully')); window.location.reload(); }
      catch { showToast(t('errorOccurred'), 'error'); }
    };
    input.click();
  };

  const themeOptions: { value: Theme; icon: React.ReactNode; label: string }[] = [
    { value: 'light', icon: <Sun size={16} />, label: '☀️ ' + t('themeLight') },
    { value: 'system', icon: <Monitor size={16} />, label: '💻 ' + t('themeSystem') },
    { value: 'dark', icon: <Moon size={16} />, label: '🌙 ' + t('themeDark') },
  ];

  return (
    <div className="pb-20 bg-gray-50 dark:bg-gray-900 min-h-screen">
      <div className="bg-green-700 dark:bg-green-900 pt-12 pb-4 px-4">
        <h1 className="text-white text-2xl font-bold">{t('settings')} ⚙️</h1>
      </div>

      <div className="px-4 py-4 space-y-4">
        {/* Language */}
        <Section icon={<Globe size={18} className="text-green-700 dark:text-green-400" />} title={t('language')}>
          <div className="flex p-3 gap-3">
            <button onClick={() => updateLanguage('hi')}
              className={`flex-1 py-3.5 rounded-xl text-base font-semibold transition-colors ${lang === 'hi' ? 'bg-green-700 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'}`}>
              🇮🇳 हिंदी
            </button>
            <button onClick={() => updateLanguage('en')}
              className={`flex-1 py-3.5 rounded-xl text-base font-semibold transition-colors ${lang === 'en' ? 'bg-green-700 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'}`}>
              🇬🇧 English
            </button>
          </div>
        </Section>

        {/* Theme */}
        <Section icon={<Sun size={18} className="text-green-700 dark:text-green-400" />} title={t('theme')}>
          <div className="flex p-3 gap-2">
            {themeOptions.map(opt => (
              <button key={opt.value} onClick={() => setTheme(opt.value)}
                className={`flex-1 py-3.5 px-1 rounded-xl text-sm font-semibold transition-colors ${theme === opt.value ? 'bg-green-700 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'}`}>
                {opt.label}
              </button>
            ))}
          </div>
        </Section>

        {/* Default Rates */}
        <Section icon={<IndianRupee size={18} className="text-green-700 dark:text-green-400" />} title={t('defaultRate')}>
          <div className="p-4 space-y-4">
            <div>
              <label className="block text-base font-semibold text-gray-700 dark:text-gray-200 mb-1.5">{t('defaultCustomerRate')} ({t('perLitre')})</label>
              <input type="number" inputMode="decimal" value={customerRate} onChange={e => setCustomerRate(e.target.value)}
                className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white rounded-xl px-3 py-3.5 text-base focus:outline-none focus:ring-2 focus:ring-green-500" />
            </div>
            <div>
              <label className="block text-base font-semibold text-gray-700 dark:text-gray-200 mb-1.5">{t('defaultSupplierRate')} ({t('perLitre')})</label>
              <input type="number" inputMode="decimal" value={supplierRate} onChange={e => setSupplierRate(e.target.value)}
                className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white rounded-xl px-3 py-3.5 text-base focus:outline-none focus:ring-2 focus:ring-green-500" />
            </div>
            <button onClick={handleSaveRates} disabled={saving}
              className="w-full py-4 bg-green-700 text-white rounded-xl text-base font-bold active:bg-green-800 disabled:opacity-60">
              {saving ? '...' : t('save')}
            </button>
          </div>
        </Section>

        {/* Data */}
        <Section icon={<Download size={18} className="text-green-700 dark:text-green-400" />} title="Data">
          <div className="divide-y divide-gray-50 dark:divide-gray-700/50">
            <button onClick={handleExport} className="w-full px-4 py-4 flex items-center gap-3 active:bg-gray-50 dark:active:bg-gray-700/50">
              <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                <Download size={18} className="text-blue-600 dark:text-blue-400" />
              </div>
              <span className="flex-1 text-left text-base font-semibold text-gray-700 dark:text-gray-200">{t('exportData')}</span>
              <ChevronRight size={18} className="text-gray-300 dark:text-gray-600" />
            </button>
            <button onClick={handleImport} className="w-full px-4 py-4 flex items-center gap-3 active:bg-gray-50 dark:active:bg-gray-700/50">
              <div className="w-10 h-10 bg-orange-50 dark:bg-orange-900/30 rounded-xl flex items-center justify-center">
                <Upload size={18} className="text-orange-600 dark:text-orange-400" />
              </div>
              <span className="flex-1 text-left text-base font-semibold text-gray-700 dark:text-gray-200">{t('importData')}</span>
              <ChevronRight size={18} className="text-gray-300 dark:text-gray-600" />
            </button>
          </div>
        </Section>

        <div className="text-center text-gray-400 dark:text-gray-600 text-sm py-4">
          <p className="font-bold text-gray-600 dark:text-gray-400 text-base">🥛 {t('appName')}</p>
          <p className="mt-1">v1.0.0 · Doodhwale ka digital hisaab</p>
        </div>
      </div>
    </div>
  );
}

function Section({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-50 dark:border-gray-700 flex items-center gap-2">
        {icon}
        <h2 className="text-base font-bold text-gray-700 dark:text-gray-200">{title}</h2>
      </div>
      {children}
    </div>
  );
}
