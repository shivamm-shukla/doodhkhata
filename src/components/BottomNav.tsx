import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Users, Truck, Settings } from 'lucide-react';
import { useLanguage } from '../hooks/useLanguage';

export function BottomNav() {
  const { t } = useLanguage();

  const navItems = [
    { to: '/', label: t('home'), icon: Home, exact: true },
    { to: '/customers', label: t('customers'), icon: Users, exact: false },
    { to: '/suppliers', label: t('suppliers'), icon: Truck, exact: false },
    { to: '/settings', label: t('settings'), icon: Settings, exact: false },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 z-30">
      <div className="flex max-w-lg mx-auto">
        {navItems.map(({ to, label, icon: Icon, exact }) => (
          <NavLink
            key={to}
            to={to}
            end={exact}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center justify-center py-2 gap-0.5 min-h-[58px] transition-colors ${
                isActive
                  ? 'text-green-700 dark:text-green-400'
                  : 'text-gray-400 dark:text-gray-500 active:text-gray-600'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon size={23} strokeWidth={isActive ? 2.5 : 1.75} />
                <span className="text-xs font-semibold">{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
      <div style={{ height: 'env(safe-area-inset-bottom, 0px)' }} />
    </nav>
  );
}
