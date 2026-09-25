import React, { useEffect, useState } from 'react';
import { useKitiStore } from '../../services/store';
import { businessService } from '../../services/businessService';
import { INITIAL_STAFF } from '../../services/seedData';
import {
  TrendingUp,
  DollarSign,
  ShoppingBag,
  Award,
  Download,
  Users,
  MessageSquare,
  Sparkles,
  Flame,
  CheckCircle2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const OwnerView: React.FC = () => {
  const { state } = useKitiStore();
  const [salesSummary, setSalesSummary] = useState<{ totalRevenue: number; paidOrdersCount: number; averageBill: number } | null>(null);
  const [topDishes, setTopDishes] = useState<Array<{ name: string; count: number; revenue: number }>>([]);
  const [selectedDish, setSelectedDish] = useState<{ name: string; count: number; revenue: number } | null>(null);
  const [timeRange, setTimeRange] = useState<'Today' | 'Week' | 'Month'>('Today');

  const refreshAnalytics = () => {
    const summary = businessService.getTodaySalesSummary();
    setSalesSummary(summary);
    const top = businessService.getTopSoldDishes();
    setTopDishes(top);
    if (top.length > 0 && !selectedDish) {
      setSelectedDish(top[0]);
    }
  };

  useEffect(() => {
    refreshAnalytics();
  }, [state.bills, state.orders]);

  // Export CSV of financial bills
  const handleDownloadCSV = () => {
    const headers = ['Bill ID', 'Table', 'Subtotal', 'Tax (5%)', 'Discount', 'Total (INR)', 'Split Type', 'Payment Mode', 'Status', 'Date'];
    const rows = state.bills.map(b => [
      b.id,
      `Table ${b.tableNo}`,
      b.subtotal,
      b.taxAmount,
      b.discountAmount,
      b.total,
      b.splitType,
      b.paymentMode,
      b.status,
      b.createdAt.slice(0, 10)
    ].join(','));
    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `kiti_restaurant_sales_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Mock revenue by hour for trends chart
  const hourlyTrends = [
    { hour: '12 PM', revenue: 4200, orders: 4 },
    { hour: '1 PM', revenue: 8900, orders: 9 },
    { hour: '2 PM', revenue: 6400, orders: 6 },
    { hour: '3 PM', revenue: 2100, orders: 2 },
    { hour: '7 PM', revenue: 9800, orders: 11 },
    { hour: '8 PM', revenue: 14500, orders: 15 },
    { hour: '9 PM', revenue: 12200, orders: 13 },
    { hour: '10 PM', revenue: 5300, orders: 5 }
  ];

  const maxHourlyRev = Math.max(...hourlyTrends.map(h => h.revenue));
  const maxDishCount = Math.max(...(topDishes.length > 0 ? topDishes.map(d => d.count) : [1]));

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/80 border border-slate-800 p-5 rounded-2xl backdrop-blur-md">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
                Executive Insights & Financials
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-bold border border-purple-500/30">
                  Owner View
                </span>
              </h2>
              <p className="text-xs text-slate-400">High-level business velocity, menu profitability & customer sentiment</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Time range switcher */}
          <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-semibold">
            {(['Today', 'Week', 'Month'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setTimeRange(tab)}
                className={`px-3 py-1.5 rounded-lg transition ${
                  timeRange === tab ? 'bg-purple-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <button
            onClick={handleDownloadCSV}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 transition shadow-lg shadow-emerald-950/40"
          >
            <Download className="w-4 h-4" /> Export CSV
          </button>
        </div>
      </div>

      {/* Top 4 KPI Animated Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-900/70 border border-slate-800 p-5 rounded-2xl backdrop-blur-md relative overflow-hidden"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Net Revenue</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-white">
              ₹{salesSummary ? salesSummary.totalRevenue.toLocaleString() : '0'}
            </span>
          </div>
          <div className="mt-2 flex items-center gap-1 text-xs text-emerald-400 font-medium">
            <TrendingUp className="w-3.5 h-3.5" /> +14.8% vs last week
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="bg-slate-900/70 border border-slate-800 p-5 rounded-2xl backdrop-blur-md relative overflow-hidden"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Paid Orders</span>
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-white">
              {salesSummary?.paidOrdersCount || 0}
            </span>
            <span className="text-xs text-slate-400">closed bills</span>
          </div>
          <div className="mt-2 flex items-center gap-1 text-xs text-blue-400 font-medium">
            <CheckCircle2 className="w-3.5 h-3.5" /> 100% collected
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-slate-900/70 border border-slate-800 p-5 rounded-2xl backdrop-blur-md relative overflow-hidden"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Average Ticket Size</span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-white">
              ₹{salesSummary ? salesSummary.averageBill.toLocaleString() : '0'}
            </span>
            <span className="text-xs text-slate-400">/ table</span>
          </div>
          <p className="mt-2 text-xs text-amber-400 font-medium">Strong beverage attachment</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-slate-900/70 border border-slate-800 p-5 rounded-2xl backdrop-blur-md relative overflow-hidden"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Customer Rating</span>
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-white">4.8</span>
            <span className="text-xs text-slate-400">/ 5.0</span>
          </div>
          <p className="mt-2 text-xs text-purple-400 font-medium">
            {state.complaints.filter(c => c.status !== 'Resolved').length} unresolved complaints
          </p>
        </motion.div>
      </div>

      {/* Charts Section: Sales Hourly Trends & Top Sold Dishes */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Hourly Sales Trends (7 cols) */}
        <div className="lg:col-span-7 bg-slate-900/80 border border-slate-800 p-5 rounded-2xl backdrop-blur-md space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                Hourly Sales Velocity
              </h3>
              <p className="text-xs text-slate-400">Peak dining revenue breakdown</p>
            </div>
            <div className="text-right">
              <span className="text-xs font-bold text-emerald-400">Peak: 8:00 PM</span>
              <p className="text-[10px] text-slate-500">₹14,500 in 1 hour</p>
            </div>
          </div>

          {/* Animated Bar Chart */}
          <div className="pt-6 pb-2 px-2 flex items-end justify-between gap-3 h-52 border-b border-slate-800">
            {hourlyTrends.map((h, i) => {
              const heightPercent = Math.max(15, Math.round((h.revenue / maxHourlyRev) * 100));
              const isPeak = h.revenue === maxHourlyRev;
              return (
                <div key={h.hour} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                  <div className="text-[10px] font-bold text-slate-400 group-hover:text-emerald-400 transition">
                    ₹{(h.revenue / 1000).toFixed(1)}k
                  </div>
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${heightPercent}%` }}
                    transition={{ duration: 0.8, delay: i * 0.05 }}
                    className={`w-full max-w-[36px] rounded-t-lg transition-all group-hover:brightness-125 relative ${
                      isPeak
                        ? 'bg-gradient-to-t from-emerald-600 to-emerald-400 shadow-lg shadow-emerald-500/20'
                        : 'bg-gradient-to-t from-slate-700 to-blue-500'
                    }`}
                  >
                    {isPeak && (
                      <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-[9px] px-1.5 py-0.5 rounded bg-emerald-500 text-black font-extrabold shadow">
                        PEAK
                      </span>
                    )}
                  </motion.div>
                  <span className="text-[11px] font-semibold text-slate-400 mt-1">{h.hour}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top Dish Popularity with Interactive Detail Card (5 cols) */}
        <div className="lg:col-span-5 bg-slate-900/80 border border-slate-800 p-5 rounded-2xl backdrop-blur-md space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-white text-base flex items-center gap-2">
              <Flame className="w-4 h-4 text-orange-400" />
              Dish Popularity & Profitability
            </h3>
            <span className="text-xs text-slate-400">Tap to inspect</span>
          </div>

          <div className="space-y-3">
            {topDishes.slice(0, 5).map((dish) => {
              const barPercent = Math.max(10, Math.round((dish.count / maxDishCount) * 100));
              const isSelected = selectedDish?.name === dish.name;
              return (
                <div
                  key={dish.name}
                  onClick={() => setSelectedDish(dish)}
                  className={`p-3 rounded-xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-orange-950/20 border-orange-500/50 shadow-md shadow-orange-950/30'
                      : 'bg-slate-950/40 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="font-bold text-white flex items-center gap-1.5">
                      <Flame className="w-3.5 h-3.5 text-orange-400" />
                      {dish.name}
                    </span>
                    <span className="font-bold text-emerald-400">₹{dish.revenue.toLocaleString()}</span>
                  </div>

                  <div className="w-full bg-slate-800/80 rounded-full h-2 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${barPercent}%` }}
                      transition={{ duration: 0.6 }}
                      className="bg-gradient-to-r from-amber-500 to-orange-500 h-2 rounded-full"
                    />
                  </div>

                  <div className="flex justify-between text-[11px] text-slate-400 mt-1">
                    <span>{dish.count} portions sold</span>
                    <span>₹{Math.round(dish.revenue / Math.max(1, dish.count))} avg price</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Expanding Detail Card for Selected Dish */}
          <AnimatePresence>
            {selectedDish && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white text-sm">{selectedDish.name} Performance</span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-orange-500/20 text-orange-300 font-bold">
                    Top Star Dish
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-slate-300 pt-1">
                  <div>Quantity: <strong className="text-white">{selectedDish.count} servings</strong></div>
                  <div>Gross Rev: <strong className="text-emerald-400">₹{selectedDish.revenue}</strong></div>
                  <div>Margin: <strong className="text-white">~68%</strong></div>
                  <div>Guest Feedback: <strong className="text-amber-400">4.9 / 5.0 ⭐</strong></div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Bottom Section: Customer Feedback Feed & Staff Roster */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Customer Complaints & Feedback Feed (6 cols) */}
        <div className="lg:col-span-6 bg-slate-900/80 border border-slate-800 p-5 rounded-2xl backdrop-blur-md space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-white text-base flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-purple-400" />
              Customer Sentiment & Feedback Feed
            </h3>
            <span className="text-xs text-slate-400">{state.complaints.length} logged entries</span>
          </div>

          <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
            {state.complaints.map(comp => (
              <div
                key={comp.id}
                className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-xs space-y-1"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white">{comp.customerName}</span>
                    {comp.tableNo && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-amber-400 font-semibold">
                        T-{comp.tableNo}
                      </span>
                    )}
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                      {comp.category}
                    </span>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    comp.status === 'Resolved'
                      ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/30'
                      : 'bg-rose-950 text-rose-400 border border-rose-500/30'
                  }`}>
                    {comp.status}
                  </span>
                </div>
                <p className="text-slate-300 italic">"{comp.text}"</p>
                {comp.resolutionNotes && (
                  <p className="text-emerald-400 text-[11px]">
                    <strong>Manager Resolution:</strong> {comp.resolutionNotes}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Staff Management Overview (6 cols) */}
        <div className="lg:col-span-6 bg-slate-900/80 border border-slate-800 p-5 rounded-2xl backdrop-blur-md space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-white text-base flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-400" />
              Staff Roster & Roles
            </h3>
            <span className="text-xs text-slate-400">{INITIAL_STAFF.length} team members</span>
          </div>

          <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
            {INITIAL_STAFF.map(member => (
              <div
                key={member.email}
                className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-slate-800 flex items-center justify-center font-bold text-white">
                    {member.name.slice(0, 1)}
                  </div>
                  <div>
                    <div className="font-bold text-white">{member.name}</div>
                    <div className="text-[11px] text-slate-400">{member.email}</div>
                  </div>
                </div>

                <div className="text-right">
                  <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                    member.role === 'Owner' ? 'bg-purple-950 text-purple-400 border border-purple-500/30' :
                    member.role === 'Manager' ? 'bg-orange-950 text-orange-400 border border-orange-500/30' :
                    member.role === 'Kitchen Chief' ? 'bg-amber-950 text-amber-400 border border-amber-500/30' :
                    'bg-emerald-950 text-emerald-400 border border-emerald-500/30'
                  }`}>
                    {member.role}
                  </span>
                  <div className="text-[10px] text-emerald-400 font-medium mt-0.5">● On Shift</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
export default OwnerView;
