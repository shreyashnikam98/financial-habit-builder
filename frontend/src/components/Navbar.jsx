import React from 'react';
import { FiMenu, FiUser } from 'react-icons/fi';
import ThemeToggle from './ThemeToggle';
import NotificationCenter from './NotificationCenter';
import { useAuth } from '../hooks/useAuth';

const Navbar = ({ onToggleSidebar }) => {
  const { user } = useAuth();

  return (
    <header className="sticky top-0 z-30 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 py-3 sm:px-6">
      <div className="flex items-center justify-between">
        {/* Left Side: Mobile Menu Button & Title */}
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleSidebar}
            className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 md:hidden transition-colors"
            aria-label="Toggle Mobile Menu"
          >
            <FiMenu className="w-6 h-6" />
          </button>
          <div>
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 leading-tight">
              Welcome back, {user?.name ? user.name.split(' ')[0] : 'Wealth Builder'} 👋
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block">
              Track habits, manage cash flow, and grow long-term wealth
            </p>
          </div>
        </div>

        {/* Right Side Controls */}
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <NotificationCenter />

          <div className="h-6 w-[1px] bg-slate-200 dark:bg-slate-800 mx-1 hidden sm:block" />

          <div className="flex items-center gap-2.5 pl-1">
            <div className="w-9 h-9 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-sm border border-emerald-500/20">
              <FiUser className="w-4 h-4" />
            </div>
            <span className="text-sm font-semibold text-slate-700 dark:text-slate-200 hidden sm:inline-block">
              {user?.name || 'User'}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
