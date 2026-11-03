import React, { useState, useRef, useEffect } from 'react';
import {
  Bell,
  Building2,
  LogOut,
  User as UserIcon,
  Check,
  ExternalLink,
  ChevronDown,
  Menu,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';
import { useToast } from '../context/ToastContext';

const TopNav = ({ toggleMobileSidebar }) => {
  const {
    user,
    logout,
    organizations,
    activeOrgId,
    switchActiveOrg,
    unreadNotifCount,
    setUnreadNotifCount,
    isSuperAdmin,
  } = useAuth();
  const { showToast } = useToast();

  const [notifsOpen, setNotifsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const notifRef = useRef(null);
  const profileRef = useRef(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotifsOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleOpenNotifications = async () => {
    setNotifsOpen(!notifsOpen);
    if (!notifsOpen) {
      try {
        const params = activeOrgId ? { org_id: activeOrgId } : {};
        const res = await api.get('/notifications', { params });
        setNotifications(res.data);
      } catch (err) {
        console.error('Error fetching notifications', err);
      }
    }
  };

  const handleMarkAllRead = async () => {
    try {
      const params = activeOrgId ? { org_id: activeOrgId } : {};
      await api.put('/notifications/read-all', null, { params });
      setUnreadNotifCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      showToast('All notifications marked as read', 'success');
    } catch (err) {
      showToast('Failed to update notifications', 'error');
    }
  };

  const currentOrg = organizations.find((o) => o.id === activeOrgId);

  return (
    <header className="h-18 bg-white border-b border-slate-200/80 sticky top-0 z-30 flex items-center justify-between px-4 sm:px-6 shadow-xs">
      <div className="flex items-center gap-3">
        {/* Mobile menu button */}
        <button
          onClick={toggleMobileSidebar}
          className="lg:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Multi-Tenant Org Switcher / Indicator */}
        <div className="flex items-center gap-2">
          {isSuperAdmin ? (
            <div className="relative flex items-center">
              <Building2 className="w-4 h-4 text-[#2376A8] absolute left-3 pointer-events-none" />
              <select
                value={activeOrgId || ''}
                onChange={(e) => switchActiveOrg(e.target.value)}
                className="pl-9 pr-8 py-1.5 text-xs sm:text-sm font-semibold bg-slate-50 border border-slate-200 rounded-xl text-slate-800 hover:border-[#2376A8] focus:outline-hidden focus:ring-2 focus:ring-[#2376A8]/20 transition-all cursor-pointer"
              >
                <option value="">🌐 Platform-Wide (All Organizations)</option>
                {organizations.map((org) => (
                  <option key={org.id} value={org.id}>
                    🏢 {org.name}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200/80">
              <div className="w-2.5 h-2.5 rounded-full bg-[#27A69A] animate-pulse" />
              <span className="text-xs sm:text-sm font-semibold text-slate-800">
                {currentOrg?.name || user?.organization_name || 'Alpine & Azure Expeditions'}
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Notifications Dropdown */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={handleOpenNotifications}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors relative"
            title="Notifications"
          >
            <Bell className="w-5 h-5" />
            {unreadNotifCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center animate-bounce">
                {unreadNotifCount > 9 ? '9+' : unreadNotifCount}
              </span>
            )}
          </button>

          {notifsOpen && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-white border border-slate-200 shadow-xl overflow-hidden z-50">
              <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <span className="font-semibold text-xs sm:text-sm text-slate-800">
                  Notifications & Alerts
                </span>
                {unreadNotifCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="text-[11px] font-medium text-[#2376A8] hover:underline flex items-center gap-1"
                  >
                    <Check className="w-3 h-3" /> Mark all read
                  </button>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-400">
                    No notifications right now
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      className={`p-3.5 hover:bg-slate-50 transition-colors ${
                        !n.is_read ? 'bg-sky-50/40' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-xs font-semibold text-slate-900">
                          {n.title}
                        </span>
                        <span className="text-[10px] text-slate-400 shrink-0">
                          {new Date(n.created_at).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 mt-1">{n.message}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Profile Dropdown */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => setProfileOpen(!profileOpen)}
            className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-100 transition-colors text-left"
          >
            <img
              src={
                user?.avatar_url ||
                'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'
              }
              alt="Avatar"
              className="w-8 h-8 rounded-full object-cover border border-slate-200"
            />
            <div className="hidden md:flex flex-col">
              <span className="text-xs font-semibold text-slate-800 line-clamp-1">
                {user?.full_name}
              </span>
              <span className="text-[10px] text-slate-500 capitalize">
                {user?.role?.replace('_', ' ')}
              </span>
            </div>
            <ChevronDown className="w-4 h-4 text-slate-400 hidden sm:block" />
          </button>

          {profileOpen && (
            <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-white border border-slate-200 shadow-xl py-2 z-50">
              <div className="px-4 py-2 border-b border-slate-100">
                <p className="text-xs font-semibold text-slate-900">{user?.full_name}</p>
                <p className="text-[11px] text-slate-500 truncate">{user?.email}</p>
              </div>

              <div className="px-2 py-1">
                <button
                  onClick={logout}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default TopNav;

