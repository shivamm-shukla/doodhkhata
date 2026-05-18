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
    bg: 'bg-green-50',
    icon: 'bg-green-100 text-green-700',
    value: 'text-green-700',
  },
  red: {
    bg: 'bg-red-50',
    icon: 'bg-red-100 text-red-600',
    value: 'text-red-600',
  },
  blue: {
    bg: 'bg-blue-50',
    icon: 'bg-blue-100 text-blue-700',
    value: 'text-blue-700',
  },
  orange: {
    bg: 'bg-orange-50',
    icon: 'bg-orange-100 text-orange-700',
    value: 'text-orange-700',
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
        <p className="text-gray-500 text-sm font-medium">{title}</p>
        <p className={`text-xl font-bold ${colors.value}`}>{value}</p>
        {subtitle && <p className="text-gray-400 text-xs mt-0.5">{subtitle}</p>}
      </div>
    </div>
  );
}
