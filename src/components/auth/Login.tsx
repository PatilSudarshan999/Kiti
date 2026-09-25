import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useKitiStore } from '../../services/store';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth, isFirebaseConfigured } from '../../services/firebase';
import type { UserRole } from '../../types';
import {
  Sparkles,
  UtensilsCrossed,
  ChefHat,
  ShieldCheck,
  TrendingUp,
  ArrowRight,
  Lock,
  Mail,
  AlertCircle
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function Login() {
  const { setRole, setSelectedTable } = useKitiStore();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const roleRoutes: Record<UserRole, string> = {
    'Waiter': '/waiter',
    'Kitchen Chief': '/kitchen',
    'Manager': '/manager',
    'Owner': '/owner'
  };

  const handleDemoLogin = (role: UserRole) => {
    setRole(role);
    setSelectedTable(null);
    navigate(roleRoutes[role]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (isFirebaseConfigured() && auth) {
      try {
        const cred = await signInWithEmailAndPassword(auth, email, password);
        const { INITIAL_STAFF } = await import('../../services/seedData');
        const staff = INITIAL_STAFF.find((s) => s.email === cred.user.email);
        if (staff) {
          setRole(staff.role);
          navigate(roleRoutes[staff.role]);
        } else {
          // Default to waiter if staff record not found
          setRole('Waiter');
          navigate('/waiter');
        }
      } catch (err: any) {
        setError(err.message ?? 'Authentication failed');
      } finally {
        setLoading(false);
      }
    } else {
      // Local demo mode: check if email matches staff
      const { INITIAL_STAFF } = await import('../../services/seedData');
      const staff = INITIAL_STAFF.find((s) => s.email === email);
      if (staff) {
        setRole(staff.role);
        navigate(roleRoutes[staff.role]);
      } else {
        setError('No live Firebase credentials detected. Tap one of the demo role cards below for instant full-feature access.');
        setLoading(false);
      }
    }
  };

  const demoRoles: Array<{ role: UserRole; title: string; desc: string; icon: React.ReactNode; color: string }> = [
    {
      role: 'Waiter',
      title: 'Waiter — Floor View',
      desc: '3D interactive restaurant floor plan, table status & instant order dispatch',
      icon: <UtensilsCrossed className="w-5 h-5 text-emerald-400" />,
      color: 'border-emerald-500/40 hover:border-emerald-400 bg-emerald-950/20'
    },
    {
      role: 'Kitchen Chief',
      title: 'Kitchen Chief — Queue View',
      desc: 'High-contrast Kanban dispatch queue, station grouping & stock toggle',
      icon: <ChefHat className="w-5 h-5 text-orange-400" />,
      color: 'border-orange-500/40 hover:border-orange-400 bg-orange-950/20'
    },
    {
      role: 'Manager',
      title: 'Manager — Command View',
      desc: 'Live floor plan, real-time orders drilldown, BR-01 cancellations & complaints',
      icon: <ShieldCheck className="w-5 h-5 text-blue-400" />,
      color: 'border-blue-500/40 hover:border-blue-400 bg-blue-950/20'
    },
    {
      role: 'Owner',
      title: 'Owner — Insights View',
      desc: 'Executive financial metrics, sales trends, dish profitability & customer sentiment',
      icon: <TrendingUp className="w-5 h-5 text-purple-400" />,
      color: 'border-purple-500/40 hover:border-purple-400 bg-purple-950/20'
    }
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center p-6 relative overflow-hidden">
      {/* Background Glow Orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-4xl space-y-8 z-10"
      >
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            AI-Powered Restaurant Operations Manager
          </div>
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-white flex items-center justify-center gap-3">
            <span className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-600 flex items-center justify-center text-black font-black text-2xl shadow-xl shadow-amber-500/20">
              K
            </span>
            Kiti Operations
          </h1>
          <p className="text-slate-400 text-sm max-w-md mx-auto">
            Full-stack restaurant management workflow with dual Manual & Voice ("Hey Kiti") operational modes.
          </p>
        </div>

        {/* Dual Mode: One-Click Demo Role Cards (Primary) & Auth Form */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Quick Demo Role Cards (7 cols) */}
          <div className="lg:col-span-7 bg-slate-900/80 border border-slate-800 p-6 rounded-3xl backdrop-blur-xl shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="font-bold text-white text-base">Select Your Operating Role</h3>
                <p className="text-xs text-slate-400">Experience the tailored interface built specifically for each workflow</p>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-500/30">
                Instant Access
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {demoRoles.map(item => (
                <motion.button
                  key={item.role}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleDemoLogin(item.role)}
                  className={`p-4 rounded-2xl border text-left transition-all space-y-2 flex flex-col justify-between group ${item.color}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="p-2 rounded-xl bg-slate-950/60 border border-slate-800">
                      {item.icon}
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-white group-hover:translate-x-1 transition" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-sm">{item.title}</h4>
                    <p className="text-[11px] text-slate-400 line-clamp-2 mt-1">{item.desc}</p>
                  </div>
                </motion.button>
              ))}
            </div>
          </div>

          {/* Direct Credentials Login (5 cols) */}
          <div className="lg:col-span-5 bg-slate-900/80 border border-slate-800 p-6 rounded-3xl backdrop-blur-xl shadow-2xl space-y-4">
            <div>
              <h3 className="font-bold text-white text-base">Firebase Sign In</h3>
              <p className="text-xs text-slate-400">Authenticated staff access</p>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-300 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1" htmlFor="email">
                  Staff Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                  <input
                    id="email"
                    type="email"
                    placeholder="waiter@kiti.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1" htmlFor="password">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                  <input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-black font-extrabold rounded-xl text-xs shadow-lg shadow-amber-500/20 transition disabled:opacity-50"
              >
                {loading ? 'Authenticating...' : 'Sign In with Credentials'}
              </button>
            </form>

            <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400 space-y-1">
              <div>Default accounts:</div>
              <div className="text-slate-300 font-mono text-[10px]">
                waiter@kiti.com • chef@kiti.com • manager@kiti.com • owner@kiti.com
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
