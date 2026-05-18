import React from 'react';
import { formatCurrency } from '../utils/format';
import { useLanguage } from '../hooks/useLanguage';

interface BalanceBadgeProps {
  balance: number;
  size?: 'sm' | 'md' | 'lg';
}

export function BalanceBadge({ balance, size = 'sm' }: BalanceBadgeProps) {
  const { t } = useLanguage();

  const isAdvance = balance < 0;
  const isDue = balance > 0;

  const sizeClasses = {
    sm: 'text-sm px-2 py-0.5',
    md: 'text-base px-3 py-1',
    lg: 'text-lg px-4 py-2',
  };

  if (balance === 0) {
    return (
      <span className={`rounded-full font-medium bg-gray-100 text-gray-600 ${sizeClasses[size]}`}>
        ₹0
      </span>
    );
  }

  return (
    <span
      className={`rounded-full font-semibold ${sizeClasses[size]} ${
        isDue
          ? 'bg-red-100 text-red-600'
          : 'bg-green-100 text-green-700'
      }`}
    >
      {isAdvance ? `${t('advance')} ` : `${t('due')} `}
      {formatCurrency(Math.abs(balance))}
    </span>
  );
}
