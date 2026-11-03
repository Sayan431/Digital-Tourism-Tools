import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  Compass,
  LayoutDashboard,
  BarChart3,
  Users,
  Palmtree,
  CalendarCheck2,
  GitFork,
  FileSpreadsheet,
  Building2,
  Settings,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Sidebar = ({ isCollapsed, setIsCollapsed }) => {
  const { user, isSuperAdmin } = useAuth();

  const navigation = [
    { name: 'Dashboard', to: '/', icon: LayoutDashboard },
    { name: 'KPI Management', to: '/kpis', icon: BarChart3 },
    { name: 'CRM & Customers', to: '/crm', icon: Users },
    { name: 'Tourism Experiences', to: '/experiences', icon: Palmtree },
    { name: 'Bookings', to: '/bookings', icon: CalendarCheck2 },
    { name: 'Workflows & Automation', to: '/workflows', icon: GitFork },
    { name: 'Analytics & Reports', to: '/reports', icon: FileSpreadsheet },
    ...(isSuperAdmin
      ? [{ name: 'Organizations', to: '/organizations', icon: Building2 }]
      : []),
    { name: 'Settings', to: '/settings', icon: Settings },
  ];

  return (
    <aside
      className={`fixed top-0 left-0 z-40 h-screen transition-all duration-300 bg-[#142B45] text-white flex flex-col border-r border-[#1b3a5d] shadow-xl ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Brand Header */}
      <div className="h-18 flex items-center justify-between px-4 border-b border-white/10 bg-[#0d1e31]">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#27A69A] to-[#2376A8] flex items-center justify-center shrink-0 shadow-md">
            <Compass className="w-6 h-6 text-white" />
          </div>
          {!isCollapsed && (
            <div className="flex flex-col min-w-0">
              <span className="font-bold text-sm tracking-tight text-white truncate">
                TourDesk OS
              </span>
              <span className="text-[10px] text-teal-300/80 uppercase font-semibold tracking-wider">
                Digital Tourism
              </span>
            </div>
          )}
        </div>

        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-white/5 transition-colors hidden lg:flex"
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1.5 scrollbar-none">
        {navigation.map((item) => (
          <NavLink
            key={item.name}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-xs sm:text-sm transition-all duration-150 group ${
                isActive
                  ? 'bg-gradient-to-r from-[#2376A8] to-[#27A69A] text-white shadow-md shadow-[#2376A8]/20 font-semibold'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`
            }
            title={isCollapsed ? item.name : undefined}
          >
            <item.icon className="w-5 h-5 shrink-0 transition-transform group-hover:scale-105" />
            {!isCollapsed && <span className="truncate">{item.name}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Role & Org Badge in Footer */}
      {!isCollapsed && (
        <div className="p-4 border-t border-white/10 bg-[#0d1e31]/70">
          <div className="flex items-center gap-2 mb-1.5">
            <ShieldAlert className="w-4 h-4 text-[#27A69A]" />
            <span className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider">
              {user?.role === 'super_admin' ? 'Super Admin Mode' : 'Admin Console'}
            </span>
          </div>
          <p className="text-xs text-slate-400 truncate">
            {user?.role === 'super_admin'
              ? 'Multi-Tenant Governance'
              : user?.organization_name || 'Tourism Client'}
          </p>
        </div>
      )}
    </aside>
  );
};

export default Sidebar;

