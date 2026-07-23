import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  FiPieChart,
  FiCheckSquare,
  FiDollarSign,
  FiArrowUpRight,
  FiArrowDownRight,
  FiTarget,
  FiTrendingUp,
  FiBriefcase,
  FiUser,
  FiLogOut,
  FiActivity,
} from 'react-icons/fi';
import { useAuth } from '../hooks/useAuth';

const Sidebar = ({ isOpen, onClose }) => {
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const links = [
    { name: 'Dashboard', path: '/dashboard', icon: FiPieChart },
    { name: 'Habits Tracker', path: '/habits', icon: FiCheckSquare },
    { name: 'Income Manager', path: '/incomes', icon: FiArrowUpRight },
    { name: 'Expense Manager', path: '/expenses', icon: FiArrowDownRight },
    { name: 'Transactions Log', path: '/transactions', icon: FiDollarSign },
    { name: 'Financial Goals', path: '/goals', icon: FiTarget },
    { name: 'Wealth & Investments', path: '/investments', icon: FiTrendingUp },
    { name: 'Budgets', path: '/budgets', icon: FiBriefcase },
    { name: 'Reports', path: '/reports', icon: FiActivity },
    { name: 'My Profile', path: '/profile', icon: FiUser },
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-xs md:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed top-0 left-0 z-50 h-screen w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transition-transform duration-300 ease-in-out flex flex-col justify-between ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="p-5 overflow-y-auto">
          {/* Logo Brand Header */}
          <div className="flex items-center gap-3 pb-6 border-b border-slate-200 dark:border-slate-800">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-emerald-500/20">
              <FiActivity className="w-6 h-6" />
            </div>
            <div>
              <h1 className="font-extrabold text-slate-900 dark:text-white leading-tight text-base tracking-tight">
                WealthHabit
              </h1>
              <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                Builder & Tracker
              </p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="mt-6 space-y-1.5">
            {links.map((link) => {
              const Icon = link.icon;
              return (
                <NavLink
                  key={link.path}
                  to={link.path}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 ${
                      isActive
                        ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/25'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-slate-200'
                    }`
                  }
                >
                  <Icon className="w-5 h-5" />
                  <span>{link.name}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* User Card & Logout Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-3 mb-3 px-2">
            <div className="w-9 h-9 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-sm border border-emerald-500/20">
              {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                {user?.name || 'User'}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                {user?.email || ''}
              </p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-rose-200 dark:border-rose-900/40 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 font-medium text-sm transition-colors duration-200"
          >
            <FiLogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
