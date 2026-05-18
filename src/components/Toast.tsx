import React from 'react';
import { CheckCircle, XCircle } from 'lucide-react';
import { useApp } from '../context/AppContext';

export function Toast() {
  const { state } = useApp();

  if (!state.toast) return null;

  const isSuccess = state.toast.type === 'success';

  return (
    <div
      className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-white text-base font-medium transition-all duration-300 ${
        isSuccess ? 'bg-green-700' : 'bg-red-600'
      }`}
      style={{ maxWidth: '90vw' }}
    >
      {isSuccess ? (
        <CheckCircle size={20} className="shrink-0" />
      ) : (
        <XCircle size={20} className="shrink-0" />
      )}
      <span>{state.toast.message}</span>
    </div>
  );
}
