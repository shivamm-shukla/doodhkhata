import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';

export function LanguageSelect() {
  const { updateLanguage } = useApp();
  const navigate = useNavigate();

  const handleSelect = async (lang: 'hi' | 'en') => {
    await updateLanguage(lang);
    navigate('/', { replace: true });
  };

  return (
    <div className="min-h-screen bg-green-700 flex flex-col items-center justify-center p-6">
      {/* Logo / App Name */}
      <div className="text-center mb-12">
        <div className="w-24 h-24 bg-white rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg">
          <span className="text-5xl">🥛</span>
        </div>
        <h1 className="text-4xl font-extrabold text-white mb-2">DoodhKhata</h1>
        <p className="text-5xl font-extrabold text-green-200">दूधखाता</p>
        <p className="text-green-200 mt-3 text-lg">Milk seller hisaab app</p>
      </div>

      {/* Language Selection */}
      <div className="w-full max-w-sm space-y-4">
        <p className="text-center text-green-100 text-lg font-medium mb-6">
          भाषा चुनें / Choose Language
        </p>

        <button
          onClick={() => handleSelect('hi')}
          className="w-full bg-white text-green-700 rounded-2xl py-5 text-2xl font-bold shadow-lg active:scale-95 transition-transform flex items-center justify-center gap-3"
        >
          <span className="text-3xl">🇮🇳</span>
          हिंदी
        </button>

        <button
          onClick={() => handleSelect('en')}
          className="w-full bg-white bg-opacity-15 border-2 border-white text-white rounded-2xl py-5 text-2xl font-bold active:scale-95 transition-transform flex items-center justify-center gap-3"
        >
          <span className="text-3xl">🇬🇧</span>
          English
        </button>
      </div>
    </div>
  );
}
