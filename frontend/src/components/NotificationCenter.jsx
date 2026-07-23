import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiBell,
  FiAlertTriangle,
  FiClock,
  FiCheckSquare,
  FiTrendingUp,
  FiFileText,
  FiInfo,
  FiCheck,
  FiTrash2,
  FiRefreshCw,
  FiX,
} from 'react-icons/fi';
import { notificationService } from '../services/notificationService';
import { toast } from 'react-toastify';

const NotificationCenter = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [filter, setFilter] = useState('all'); // 'all' | 'unread'
  const [loading, setLoading] = useState(false);

  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  // Helper: Format relative timestamp
  const getRelativeTime = (dateStr) => {
    const now = new Date();
    const past = new Date(dateStr);
    const diffMs = now - past;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    return `${diffDays}d ago`;
  };

  // Helper: Toast alerts based on notification type
  const triggerToastForNew = (newItems) => {
    newItems.forEach((item) => {
      switch (item.type) {
        case 'budget_exceeded':
          toast.error(`⚠️ ${item.title}: ${item.message}`);
          break;
        case 'goal_deadline':
          toast.warning(`⏳ ${item.title}: ${item.message}`);
          break;
        case 'habit_reminder':
          toast.info(`📋 ${item.title}: ${item.message}`);
          break;
        case 'savings_reminder':
          toast.warning(`💡 ${item.title}: ${item.message}`);
          break;
        case 'monthly_report_ready':
          toast.success(`📊 ${item.title}: ${item.message}`);
          break;
        default:
          toast.info(`🔔 ${item.title}`);
          break;
      }
    });
  };

  // Fetch notifications & run automated trigger scan
  const loadNotifications = useCallback(async (runCheck = false) => {
    try {
      setLoading(true);
      if (runCheck) {
        const triggerRes = await notificationService.checkTriggers();
        if (triggerRes.success && triggerRes.newCreatedNotifications?.length > 0) {
          triggerToastForNew(triggerRes.newCreatedNotifications);
        }
      }

      const res = await notificationService.getNotifications();
      if (res.success) {
        setNotifications(res.data || []);
        setUnreadCount(res.unreadCount || 0);
      }
    } catch (err) {
      console.error('Failed to load notifications:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Initial check on mount
    loadNotifications(true);
  }, [loadNotifications]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handlers
  const handleMarkAsRead = async (id, e) => {
    e?.stopPropagation();
    try {
      const res = await notificationService.markAsRead(id);
      if (res.success) {
        setNotifications((prev) =>
          prev.map((n) => (n._id === id ? { ...n, read: true } : n))
        );
        setUnreadCount(res.unreadCount);
      }
    } catch (err) {
      console.error('Mark read error:', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const res = await notificationService.markAllAsRead();
      if (res.success) {
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
        setUnreadCount(0);
        toast.success('All notifications marked as read');
      }
    } catch (err) {
      console.error('Mark all read error:', err);
    }
  };

  const handleDelete = async (id, e) => {
    e?.stopPropagation();
    try {
      const res = await notificationService.deleteNotification(id);
      if (res.success) {
        setNotifications((prev) => prev.filter((n) => n._id !== id));
        setUnreadCount(res.unreadCount);
      }
    } catch (err) {
      console.error('Delete notification error:', err);
    }
  };

  const handleClearAll = async () => {
    try {
      const res = await notificationService.clearAll();
      if (res.success) {
        setNotifications([]);
        setUnreadCount(0);
        toast.info('Cleared all notifications');
      }
    } catch (err) {
      console.error('Clear all error:', err);
    }
  };

  const handleItemClick = (item) => {
    if (!item.read) {
      handleMarkAsRead(item._id);
    }
    setIsOpen(false);
    if (item.link) {
      navigate(item.link);
    }
  };

  // Filtered notifications
  const displayedNotifications = notifications.filter((n) =>
    filter === 'unread' ? !n.read : true
  );

  // Helper icon renderer based on notification type
  const renderIcon = (type) => {
    switch (type) {
      case 'budget_exceeded':
        return <FiAlertTriangle className="w-4 h-4 text-rose-500" />;
      case 'goal_deadline':
        return <FiClock className="w-4 h-4 text-blue-500" />;
      case 'habit_reminder':
        return <FiCheckSquare className="w-4 h-4 text-amber-500" />;
      case 'savings_reminder':
        return <FiTrendingUp className="w-4 h-4 text-purple-500" />;
      case 'monthly_report_ready':
        return <FiFileText className="w-4 h-4 text-teal-500" />;
      default:
        return <FiInfo className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Notification Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all cursor-pointer relative select-none"
        aria-label="Notifications"
      >
        <FiBell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-[10px] font-extrabold text-white shadow-md animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Floating Notification Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-3 w-80 sm:w-96 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl z-50 overflow-hidden transition-all duration-200">
          {/* Header */}
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
            <div className="flex items-center gap-2">
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                Notifications
              </h3>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-xxs font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                  {unreadCount} unread
                </span>
              )}
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => loadNotifications(true)}
                disabled={loading}
                title="Sync Triggers"
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <FiRefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <FiX className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Sub-header Controls */}
          <div className="px-4 py-2 bg-slate-50/30 dark:bg-slate-950/30 border-b border-slate-100 dark:border-slate-800/60 flex items-center justify-between text-xs">
            <div className="flex gap-2">
              <button
                onClick={() => setFilter('all')}
                className={`font-bold transition-colors cursor-pointer ${
                  filter === 'all'
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                }`}
              >
                All ({notifications.length})
              </button>
              <span className="text-slate-300 dark:text-slate-700">|</span>
              <button
                onClick={() => setFilter('unread')}
                className={`font-bold transition-colors cursor-pointer ${
                  filter === 'unread'
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                }`}
              >
                Unread ({unreadCount})
              </button>
            </div>

            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="text-xxs font-bold text-slate-500 hover:text-emerald-500 transition-colors cursor-pointer"
                >
                  Mark all read
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  onClick={handleClearAll}
                  className="text-xxs font-bold text-slate-400 hover:text-rose-500 transition-colors cursor-pointer"
                >
                  Clear all
                </button>
              )}
            </div>
          </div>

          {/* Notification List */}
          <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60">
            {displayedNotifications.length === 0 ? (
              <div className="p-8 text-center text-slate-400 dark:text-slate-500 text-xs font-medium">
                No notifications to display.
              </div>
            ) : (
              displayedNotifications.map((item) => (
                <div
                  key={item._id}
                  onClick={() => handleItemClick(item)}
                  className={`p-3.5 flex items-start gap-3 transition-colors cursor-pointer ${
                    !item.read
                      ? 'bg-emerald-500/5 dark:bg-emerald-500/10 hover:bg-emerald-500/10 dark:hover:bg-emerald-500/15'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                  }`}
                >
                  {/* Category Icon */}
                  <div className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/60 shadow-xs shrink-0 mt-0.5">
                    {renderIcon(item.type)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className={`text-xs font-bold truncate ${!item.read ? 'text-slate-900 dark:text-white' : 'text-slate-700 dark:text-slate-300'}`}>
                        {item.title}
                      </p>
                      <span className="text-xxs font-medium text-slate-400 shrink-0">
                        {getRelativeTime(item.createdAt)}
                      </span>
                    </div>

                    <p className="text-xxs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 leading-normal">
                      {item.message}
                    </p>
                  </div>

                  {/* Quick Item Actions */}
                  <div className="flex items-center gap-1 shrink-0 self-center opacity-80 hover:opacity-100">
                    {!item.read && (
                      <button
                        onClick={(e) => handleMarkAsRead(item._id, e)}
                        title="Mark as read"
                        className="p-1 text-emerald-500 hover:bg-emerald-500/10 rounded-md transition-colors"
                      >
                        <FiCheck className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button
                      onClick={(e) => handleDelete(item._id, e)}
                      title="Delete"
                      className="p-1 text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 rounded-md transition-colors"
                    >
                      <FiTrash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationCenter;
