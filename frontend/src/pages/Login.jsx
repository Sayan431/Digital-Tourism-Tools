import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Compass, Lock, Mail, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e?.preventDefault();
    if (!email || !password) {
      showToast('Please enter both email and password', 'error');
      return;
    }

    setIsLoading(true);
    try {
      await login(email, password);
      showToast('Welcome to TourDesk OS', 'success');
      navigate('/');
    } catch (err) {
      showToast(err.response?.data?.detail || 'Invalid email or password', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickLogin = async (demoEmail, demoPwd) => {
    setEmail(demoEmail);
    setPassword(demoPwd);
    setIsLoading(true);
    try {
      await login(demoEmail, demoPwd);
      showToast('Logged in with demonstration credentials', 'success');
      navigate('/');
    } catch (err) {
      showToast('Failed to log in with demo account', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#142B45] via-[#1b3a5d] to-[#0d1e31] flex items-center justify-center p-4 sm:p-6">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden">
        {/* Banner */}
        <div className="p-8 text-center bg-gradient-to-b from-slate-50 to-white border-b border-slate-100">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#27A69A] to-[#2376A8] flex items-center justify-center mx-auto shadow-lg shadow-[#2376A8]/30 mb-4">
            <Compass className="w-8 h-8 text-white animate-spin-slow" />
          </div>
          <h1 className="text-2xl font-bold text-[#142B45] tracking-tight">
            TourDesk OS
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Digital Tourism Management Platform &bull; Demonstration Edition
          </p>
        </div>

        {/* Demo Fast-Login Section */}
        <div className="px-8 pt-6 pb-2">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-[#27A69A]" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              One-Click Demonstration Accounts
            </span>
          </div>

          <div className="grid grid-cols-1 gap-2">
            <button
              type="button"
              onClick={() =>
                handleQuickLogin('superadmin@tourismplatform.com', 'SuperAdmin123!')
              }
              className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200 hover:border-[#142B45] bg-slate-50 hover:bg-slate-100/80 transition-all text-left group"
            >
              <div>
                <span className="text-xs font-semibold text-slate-900 block group-hover:text-[#142B45]">
                  Super Admin
                </span>
                <span className="text-[10px] text-slate-500">
                  Platform-wide governance & organizations
                </span>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-[#142B45] group-hover:translate-x-0.5 transition-all" />
            </button>

            <button
              type="button"
              onClick={() =>
                handleQuickLogin('admin@alpineexpeditions.com', 'AlpineAdmin123!')
              }
              className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200 hover:border-[#2376A8] bg-slate-50 hover:bg-sky-50/50 transition-all text-left group"
            >
              <div>
                <span className="text-xs font-semibold text-slate-900 block group-hover:text-[#2376A8]">
                  Admin &bull; Alpine & Azure Expeditions
                </span>
                <span className="text-[10px] text-slate-500">
                  Alpine treks, kayak adventures, $26.8k rev
                </span>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-[#2376A8] group-hover:translate-x-0.5 transition-all" />
            </button>

            <button
              type="button"
              onClick={() =>
                handleQuickLogin('admin@heritagehorizon.com', 'HeritageAdmin123!')
              }
              className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200 hover:border-[#27A69A] bg-slate-50 hover:bg-emerald-50/50 transition-all text-left group"
            >
              <div>
                <span className="text-xs font-semibold text-slate-900 block group-hover:text-[#27A69A]">
                  Admin &bull; Heritage & Horizon Journeys
                </span>
                <span className="text-[10px] text-slate-500">
                  Kyoto & Athens cultural heritage, €21.8k rev
                </span>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-[#27A69A] group-hover:translate-x-0.5 transition-all" />
            </button>
          </div>
        </div>

        {/* Divider */}
        <div className="relative my-4 px-8">
          <div className="absolute inset-0 flex items-center px-8">
            <div className="w-full border-t border-slate-200" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white px-3 text-slate-400 text-[10px] font-semibold tracking-wider">
              Or Sign In With Email
            </span>
          </div>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} className="p-8 pt-2 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@tourismplatform.com"
                className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#2376A8]/20 focus:border-[#2376A8] transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#2376A8]/20 focus:border-[#2376A8] transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 px-4 rounded-xl font-semibold text-xs sm:text-sm text-white bg-gradient-to-r from-[#142B45] to-[#2376A8] hover:opacity-95 shadow-lg shadow-[#142B45]/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isLoading ? (
              <span className="inline-block animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
            ) : (
              <>
                <span>Sign In to Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;

