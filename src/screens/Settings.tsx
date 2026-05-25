import React, { useState } from 'react';
import { Globe, IndianRupee, Download, Upload, ChevronRight } from 'lucide-react';
import { useLanguage } from '../hooks/useLanguage';
import { useApp } from '../context/AppContext';
import { exportData, importData } from '../db/queries';

export function Settings() {
  const { t, lang } = useLanguage();
  const { state, updateLanguage, updateRates, showToast } = useApp();
  const [customerRate, setCustomerRate] = useState(String(state.defaultCustomerRate));
  const [supplierRate, setSupplierRate] = useState(String(state.defaultSupplierRate));
  const [saving, setSaving] = useState(false);

  const handleSaveRates = async () => {
    setSaving(true);
    try {
      await updateRates(
        parseFloat(customerRate) || state.defaultCustomerRate,
        parseFloat(supplierRate) || state.defaultSupplierRate
      );
      showToast(t('savedSuccessfully'));
    } catch {
      showToast(t('errorOccurred'), 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleExport = async () => {
    try {
      const data = await exportData();
      const json = JSON.stringify(data, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `doodhkhata-backup-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast(t('savedSuccessfully'));
    } catch {
      showToast(t('errorOccurred'), 'error');
    }
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      try {
        const text = await file.text();
        const data = JSON.parse(text);
        await importData(data);
        showToast(t('savedSuccessfully'));
        // Reload page to refresh all data
        window.location.reload();
      } catch {
        showToast(t('errorOccurred'), 'error');
      }
    };
    input.click();
  };

  return (
    <div className="pb-20 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="bg-green-700 pt-12 pb-4 px-4">
        <h1 className="text-white text-2xl font-bold">{t('settings')}</h1>
      </div>

      <div className="px-4 py-4 space-y-4">
        {/* Language */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-50 flex items-center gap-2">
            <Globe size={18} className="text-green-700" />
            <h2 className="text-base font-bold text-gray-700">{t('language')}</h2>
          </div>
          <div className="flex p-3 gap-3">
            <button
              onClick={() => updateLanguage('hi')}
              className={`flex-1 py-3 rounded-xl text-base font-semibold transition-colors ${
                lang === 'hi' ? 'bg-green-700 text-white' : 'bg-gray-100 text-gray-600'
              }`}
            >
              🇮🇳 हिंदी
            </button>
            <button
              onClick={() => updateLanguage('en')}
              className={`flex-1 py-3 rounded-xl text-base font-semibold transition-colors ${
                lang === 'en' ? 'bg-green-700 text-white' : 'bg-gray-100 text-gray-600'
              }`}
            >
              🇬🇧 English
            </button>
          </div>
        </div>

        {/* Default Rates */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-50 flex items-center gap-2">
            <IndianRupee size={18} className="text-green-700" />
            <h2 className="text-base font-bold text-gray-700">{t('defaultRate')}</h2>
          </div>
          <div className="p-4 space-y-4">
            <div>
              <label className="block text-base font-medium text-gray-700 mb-1">
                {t('defaultCustomerRate')} ({t('perLitre')})
              </label>
              <input
                type="number"
                inputMode="decimal"
                value={customerRate}
                onChange={e => setCustomerRate(e.target.value)}
                className="w-full border border-gray-300 rounded-xl px-3 py-3 text-base focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div>
              <label className="block text-base font-medium text-gray-700 mb-1">
                {t('defaultSupplierRate')} ({t('perLitre')})
              </label>
              <input
                type="number"
                inputMode="decimal"
                value={supplierRate}
                onChange={e => setSupplierRate(e.target.value)}
                className="w-full border border-gray-300 rounded-xl px-3 py-3 text-base focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <button
              onClick={handleSaveRates}
              disabled={saving}
              className="w-full py-3 bg-green-700 text-white rounded-xl text-base font-semibold active:bg-green-800 disabled:opacity-60"
            >
              {saving ? '...' : t('save')}
            </button>
          </div>
        </div>

        {/* Data Management */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-50">
            <h2 className="text-base font-bold text-gray-700">Data</h2>
          </div>
          <div className="divide-y divide-gray-50">
            <button
              onClick={handleExport}
              className="w-full px-4 py-4 flex items-center gap-3 active:bg-gray-50"
            >
              <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                <Download size={18} className="text-blue-600" />
              </div>
              <span className="flex-1 text-left text-base font-medium text-gray-700">{t('exportData')}</span>
              <ChevronRight size={18} className="text-gray-300" />
            </button>
            <button
              onClick={handleImport}
              className="w-full px-4 py-4 flex items-center gap-3 active:bg-gray-50"
            >
              <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center">
                <Upload size={18} className="text-orange-600" />
              </div>
              <span className="flex-1 text-left text-base font-medium text-gray-700">{t('importData')}</span>
              <ChevronRight size={18} className="text-gray-300" />
            </button>
          </div>
        </div>

        {/* App Info */}
        <div className="text-center text-gray-400 text-sm py-4">
          <p className="font-semibold text-gray-600">{t('appName')}</p>
          <p>v1.0.0 · Milk seller hisaab app</p>
        </div>
      </div>
    </div>
  );
}
