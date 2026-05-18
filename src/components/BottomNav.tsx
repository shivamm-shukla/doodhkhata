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
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-30 bottom-safe">
      <div className="flex">
        {navItems.map(({ to, label, icon: Icon, exact }) => (
          <NavLink
            key={to}
            to={to}
            end={exact}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center justify-center py-2 gap-1 min-h-[56px] transition-colors ${
                isActive
                  ? 'text-green-700'
                  : 'text-gray-400 active:text-gray-600'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon size={22} strokeWidth={isActive ? 2.5 : 1.75} />
                <span className="text-xs font-medium">{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
      {/* Safe area for iOS */}
      <div style={{ height: 'env(safe-area-inset-bottom, 0px)' }} />
    </nav>
  );
}
