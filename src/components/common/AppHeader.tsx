import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useKitiStore } from '../../services/store';
import type { UserRole } from '../../types';
import {
  UtensilsCrossed,
  ChefHat,
  ShieldCheck,
  TrendingUp,
  RotateCcw,
  Sparkles,
  Radio,
  LogOut
} from 'lucide-react';

export const AppHeader: React.FC = () => {
  const { state, setRole, resetData } = useKitiStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [time, setTime] = useState(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const roles: Array<{ role: UserRole; path: string; label: string; icon: React.ReactNode; color: string }> = [
    {
      role: 'Waiter',
      path: '/waiter',
      label: 'Floor View',
      icon: <UtensilsCrossed className="w-4 h-4" />,
      color: 'text-emerald-400 border-emerald-500/30'
    },
    {
      role: 'Kitchen Chief',
      path: '/kitchen',
      label: 'Queue View',
      icon: <ChefHat className="w-4 h-4" />,
      color: 'text-orange-400 border-orange-500/30'
    },
    {
      role: 'Manager',
      path: '/manager',
      label: 'Command View',
      icon: <ShieldCheck className="w-4 h-4" />,
      color: 'text-blue-400 border-blue-500/30'
    },
    {
      role: 'Owner',
      path: '/owner',
      label: 'Insights View',
      icon: <TrendingUp className="w-4 h-4" />,
      color: 'text-purple-400 border-purple-500/30'
    }
  ];

  const handleSwitchRole = (role: UserRole, path: string) => {
    setRole(role);
    navigate(path);
  };

  const handleResetData = () => {
    if (window.confirm('Reset all restaurant data (tables, orders, bills, stock) to initial seed state?')) {
      resetData();
    }
  };

  return (
    <header className="sticky top-0 z-30 w-full bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/80 px-4 lg:px-8 py-3 transition-all">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Brand & Connection Status */}
        <div className="flex items-center justify-between md:justify-start gap-4">
          <div
            onClick={() => navigate('/waiter')}
            className="flex items-center gap-2.5 cursor-pointer group"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-600 flex items-center justify-center text-black font-black text-lg shadow-lg shadow-amber-500/20 group-hover:scale-105 transition">
              K
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-black text-white text-base tracking-tight group-hover:text-amber-400 transition">
                  Kiti
                </span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-extrabold border border-amber-500/30 flex items-center gap-0.5">
                  <Sparkles className="w-2.5 h-2.5" /> AI Ops
                </span>
              </div>
              <p className="text-[10px] text-slate-400">Restaurant Operations Manager</p>
            </div>
          </div>

          {/* Sync indicator & clock */}
          <div className="hidden sm:flex items-center gap-3 pl-2 border-l border-slate-800 text-xs">
            <div className="flex items-center gap-1.5 text-emerald-400 font-medium bg-emerald-950/40 px-2.5 py-1 rounded-full border border-emerald-500/20">
              <Radio className="w-3 h-3 animate-pulse" />
              <span className="text-[11px]">Live Sync</span>
            </div>
            <span className="text-slate-400 font-mono text-[11px]">{time}</span>
          </div>
        </div>

        {/* Role Navigation Switcher */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          {roles.map(r => {
            const isActive = location.pathname === r.path || state.currentRole === r.role;
            return (
              <button
                key={r.role}
                onClick={() => handleSwitchRole(r.role, r.path)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
                  isActive
                    ? 'bg-slate-900 border border-slate-700 text-white shadow-md shadow-black/40 ring-1 ring-white/10'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900/50'
                }`}
              >
                <span className={isActive ? r.color.split(' ')[0] : 'text-slate-500'}>
                  {r.icon}
                </span>
                <span>{r.role}</span>
                <span className="hidden xl:inline text-[10px] text-slate-500 font-normal">
                  ({r.label})
                </span>
              </button>
            );
          })}
        </div>

        {/* Actions & User Info */}
        <div className="hidden lg:flex items-center gap-2.5">
          <button
            onClick={handleResetData}
            title="Reset Store to Default Seed Data"
            className="p-2 text-slate-400 hover:text-amber-400 hover:bg-slate-900 rounded-xl border border-transparent hover:border-slate-800 transition text-xs flex items-center gap-1"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="text-[11px]">Reset Data</span>
          </button>

          <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
            <div className="w-7 h-7 rounded-lg bg-slate-800 flex items-center justify-center font-bold text-xs text-white">
              {state.currentUser.name.slice(0, 1)}
            </div>
            <div className="text-left text-[11px]">
              <div className="font-bold text-white truncate max-w-[100px]">{state.currentUser.name}</div>
              <div className="text-slate-400 text-[10px]">{state.currentRole}</div>
            </div>
            <button
              onClick={() => navigate('/login')}
              title="Logout"
              className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg transition"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
export default AppHeader;
