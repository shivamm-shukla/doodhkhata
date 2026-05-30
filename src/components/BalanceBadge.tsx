import React from 'react';
import { formatCurrency } from '../utils/format';
import { useLanguage } from '../hooks/useLanguage';

interface BalanceBadgeProps {
  balance: number;
  size?: 'sm' | 'md' | 'lg';
}

export function BalanceBadge({ balance, size = 'sm' }: BalanceBadgeProps) {
  const { t } = useLanguage();

  const sizeClasses = {
    sm: 'text-sm px-2.5 py-0.5',
    md: 'text-base px-3 py-1',
    lg: 'text-lg px-4 py-2',
  };

  if (balance === 0) {
    return (
      <span className={`rounded-full font-semibold bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 ${sizeClasses[size]}`}>
        ✅
      </span>
    );
  }

  return (
    <span className={`rounded-full font-semibold ${sizeClasses[size]} ${
      balance > 0
        ? 'bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400'
        : 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400'
    }`}>
      {balance < 0 ? `+${formatCurrency(Math.abs(balance))}` : formatCurrency(balance)}
    </span>
  );
}
