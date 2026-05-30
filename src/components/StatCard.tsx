import React, { ReactNode } from 'react';

interface StatCardProps {
  title: string;
  value: string;
  icon: ReactNode;
  color?: 'green' | 'red' | 'blue' | 'orange';
  subtitle?: string;
}

const colorMap = {
  green: {
    bg: 'bg-green-50 dark:bg-green-900/30',
    icon: 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-400',
    value: 'text-green-700 dark:text-green-400',
  },
  red: {
    bg: 'bg-red-50 dark:bg-red-900/30',
    icon: 'bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400',
    value: 'text-red-600 dark:text-red-400',
  },
  blue: {
    bg: 'bg-blue-50 dark:bg-blue-900/30',
    icon: 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-400',
    value: 'text-blue-700 dark:text-blue-400',
  },
  orange: {
    bg: 'bg-orange-50 dark:bg-orange-900/30',
    icon: 'bg-orange-100 dark:bg-orange-900/50 text-orange-700 dark:text-orange-400',
    value: 'text-orange-700 dark:text-orange-400',
  },
};

export function StatCard({ title, value, icon, color = 'green', subtitle }: StatCardProps) {
  const colors = colorMap[color];
  return (
    <div className={`rounded-2xl p-4 ${colors.bg} flex flex-col gap-2`}>
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colors.icon}`}>
        {icon}
      </div>
      <div>
        <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">{title}</p>
        <p className={`text-xl font-bold ${colors.value}`}>{value}</p>
        {subtitle && <p className="text-gray-400 dark:text-gray-500 text-xs mt-0.5">{subtitle}</p>}
      </div>
    </div>
  );
}
