import React, { useState, useEffect } from 'react';
import {
  Settings as SettingsIcon,
  Shield,
  Database,
  Server,
  Key,
  Globe,
  CheckCircle2,
  HelpCircle,
  Copy,
  Check,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import api from '../api/client';

const Settings = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [healthStatus, setHealthStatus] = useState('checking');
  const [copiedAccount, setCopiedAccount] = useState(null);

  useEffect(() => {
    checkHealth();
  }, []);

  const checkHealth = async () => {
    try {
      const res = await api.get('/health');
      setHealthStatus(res.data.status === 'healthy' ? 'online' : 'degraded');
    } catch {
      setHealthStatus('offline');
    }
  };

  const copyCreds = (email, pwd, key) => {
    navigator.clipboard.writeText(`Email: ${email}\nPassword: ${pwd}`);
    setCopiedAccount(key);
    showToast(`Copied credentials for ${key}`, 'info');
    setTimeout(() => setCopiedAccount(null), 2500);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="pb-2 border-b border-slate-200/60">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          Platform Environment & Settings
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Demonstration configuration, security boundaries, authentication roles, and API diagnostics.
        </p>
      </div>

      {/* Demonstration Account Credentials Reference */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-center gap-2">
          <Key className="w-5 h-5 text-[#2376A8]" />
          <h3 className="text-sm font-bold text-slate-900">
            Demonstration Role Accounts & Access Credentials
          </h3>
        </div>
        <p className="text-xs text-slate-500">
          The platform includes 3 pre-seeded demonstration accounts fulfilling requirement 3. Click copy to copy credentials to your clipboard.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
          {/* Super Admin */}
          <div className="p-4 rounded-xl border border-indigo-100 bg-indigo-50/40 space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 bg-indigo-100/70 px-2 py-0.5 rounded-md">
              Super Admin
            </span>
            <div className="text-xs">
              <strong className="block text-slate-900">Alexander Wright</strong>
              <code className="text-[11px] text-slate-600 block mt-1">superadmin@tourismplatform.com</code>
              <span className="text-[11px] text-slate-500 block">Password: SuperAdmin123!</span>
            </div>
            <button
              onClick={() => copyCreds('superadmin@tourismplatform.com', 'SuperAdmin123!', 'Super Admin')}
              className="mt-2 text-[11px] font-semibold text-indigo-700 hover:text-indigo-900 flex items-center gap-1"
            >
              {copiedAccount === 'Super Admin' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copiedAccount === 'Super Admin' ? 'Copied' : 'Copy Credentials'}
            </button>
          </div>

          {/* Admin Org 1 */}
          <div className="p-4 rounded-xl border border-sky-100 bg-sky-50/40 space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#2376A8] bg-sky-100/70 px-2 py-0.5 rounded-md">
              Admin &bull; Alpine & Azure
            </span>
            <div className="text-xs">
              <strong className="block text-slate-900">Marcus Sterling</strong>
              <code className="text-[11px] text-slate-600 block mt-1">admin@alpineexpeditions.com</code>
              <span className="text-[11px] text-slate-500 block">Password: AlpineAdmin123!</span>
            </div>
            <button
              onClick={() => copyCreds('admin@alpineexpeditions.com', 'AlpineAdmin123!', 'Alpine Admin')}
              className="mt-2 text-[11px] font-semibold text-[#2376A8] hover:text-[#142B45] flex items-center gap-1"
            >
              {copiedAccount === 'Alpine Admin' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copiedAccount === 'Alpine Admin' ? 'Copied' : 'Copy Credentials'}
            </button>
          </div>

          {/* Admin Org 2 */}
          <div className="p-4 rounded-xl border border-emerald-100 bg-emerald-50/40 space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#27A69A] bg-emerald-100/70 px-2 py-0.5 rounded-md">
              Admin &bull; Heritage & Horizon
            </span>
            <div className="text-xs">
              <strong className="block text-slate-900">Dr. Julian Ross</strong>
              <code className="text-[11px] text-slate-600 block mt-1">admin@heritagehorizon.com</code>
              <span className="text-[11px] text-slate-500 block">Password: HeritageAdmin123!</span>
            </div>
            <button
              onClick={() => copyCreds('admin@heritagehorizon.com', 'HeritageAdmin123!', 'Heritage Admin')}
              className="mt-2 text-[11px] font-semibold text-[#27A69A] hover:text-[#1f857b] flex items-center gap-1"
            >
              {copiedAccount === 'Heritage Admin' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copiedAccount === 'Heritage Admin' ? 'Copied' : 'Copy Credentials'}
            </button>
          </div>
        </div>
      </div>

      {/* System Diagnostics & Backend Architecture */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-slate-900">
          Architecture & Diagnostics
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Server className="w-4 h-4 text-[#2376A8]" />
              <span className="font-semibold text-slate-700">FastAPI Backend Service</span>
            </div>
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              {healthStatus.toUpperCase()}
            </span>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-[#27A69A]" />
              <span className="font-semibold text-slate-700">Database Engine</span>
            </div>
            <span className="text-[10px] font-bold text-slate-700 bg-white px-2 py-0.5 rounded-full border border-slate-200">
              PostgreSQL / Alembic
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;

