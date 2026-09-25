import React, { useState } from 'react';
import { useKitiStore } from '../../services/store';
import { businessService, BusinessRuleError } from '../../services/businessService';
import type { CustomerComplaint, Order } from '../../types';
import {
  ShieldAlert,
  ClipboardList,
  LayoutGrid,
  MessageSquareWarning,
  CheckCircle,
  XCircle,
  Clock,
  Search,
  Users,
  Eye,
  X,
  AlertTriangle,
  Receipt
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const ManagerView: React.FC = () => {
  const { state } = useKitiStore();
  const [selectedTableNo, setSelectedTableNo] = useState<number | null>(null);
  const [orderSearch, setOrderSearch] = useState('');
  const [complaintFilter, setComplaintFilter] = useState<'All' | 'Open' | 'Resolved'>('All');
  const [toastMessage, setToastMessage] = useState<{ text: string; isError?: boolean } | null>(null);

  // Cancellation modal state
  const [cancelModalOrder, setCancelModalOrder] = useState<Order | null>(null);
  const [cancelReason, setCancelReason] = useState('');

  // Complaint resolution modal state
  const [resolvingComplaint, setResolvingComplaint] = useState<CustomerComplaint | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState('');

  // Active orders drilldown modal state
  const [drilldownOrder, setDrilldownOrder] = useState<Order | null>(null);

  const showToast = (text: string, isError = false) => {
    setToastMessage({ text, isError });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // KPIs
  const totalTables = state.tables.length;
  const occupiedTables = state.tables.filter(t => t.status === 'Occupied').length;
  const billingTables = state.tables.filter(t => t.status === 'Billing').length;
  const occupancyRate = Math.round(((occupiedTables + billingTables) / totalTables) * 100);
  const activeOrders = state.orders.filter(o => o.status === 'Active' || o.status === 'Billing');
  const openComplaints = state.complaints.filter(c => c.status === 'Open' || c.status === 'Investigating');

  // Filtered orders
  const filteredOrders = activeOrders.filter(o => {
    const matchTable = `Table ${o.tableNo}`.toLowerCase().includes(orderSearch.toLowerCase()) ||
                       o.waiterName.toLowerCase().includes(orderSearch.toLowerCase()) ||
                       o.id.toLowerCase().includes(orderSearch.toLowerCase());
    return matchTable;
  });

  // Filtered complaints
  const filteredComplaints = state.complaints.filter(c => {
    if (complaintFilter === 'All') return true;
    if (complaintFilter === 'Open') return c.status === 'Open' || c.status === 'Investigating';
    if (complaintFilter === 'Resolved') return c.status === 'Resolved';
    return true;
  });

  // Handle Order Cancellation
  const handleConfirmCancelOrder = () => {
    if (!cancelModalOrder) return;
    if (!cancelReason.trim()) {
      showToast('A mandatory cancellation reason is required (Rule BR-01)!', true);
      return;
    }

    try {
      const res = businessService.cancelOrder(cancelModalOrder.id, cancelReason.trim());
      showToast(res.message);
      setCancelModalOrder(null);
      setCancelReason('');
      if (drilldownOrder?.id === cancelModalOrder.id) {
        setDrilldownOrder(null);
      }
    } catch (err: unknown) {
      if (err instanceof BusinessRuleError) {
        showToast(err.message, true);
      } else {
        showToast('Failed to cancel order.', true);
      }
    }
  };

  // Handle Complaint Resolution
  const handleConfirmResolveComplaint = () => {
    if (!resolvingComplaint) return;
    if (!resolutionNotes.trim()) {
      showToast('Please enter resolution notes.', true);
      return;
    }

    try {
      const res = businessService.resolveComplaint(resolvingComplaint.id, resolutionNotes.trim());
      showToast(res.message);
      setResolvingComplaint(null);
      setResolutionNotes('');
    } catch (err: unknown) {
      if (err instanceof BusinessRuleError) {
        showToast(err.message, true);
      } else {
        showToast('Failed to resolve complaint.', true);
      }
    }
  };

  const getTableColor = (status: string) => {
    switch (status) {
      case 'Free': return 'border-emerald-500/40 bg-emerald-950/20 text-emerald-400 hover:border-emerald-400';
      case 'Occupied': return 'border-rose-500/40 bg-rose-950/20 text-rose-400 hover:border-rose-400';
      case 'Reserved': return 'border-amber-500/40 bg-amber-950/20 text-amber-400 hover:border-amber-400';
      case 'Billing': return 'border-cyan-500/40 bg-cyan-950/20 text-cyan-400 hover:border-cyan-400';
      default: return 'border-slate-700 bg-slate-900 text-slate-300';
    }
  };

  const getElapsedMinutes = (timeString: string) => {
    const elapsedMs = Date.now() - new Date(timeString).getTime();
    return Math.max(1, Math.floor(elapsedMs / 60000));
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className={`fixed top-20 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl font-semibold text-sm backdrop-blur-md border ${
              toastMessage.isError
                ? 'bg-rose-950/90 border-rose-500/50 text-rose-200'
                : 'bg-emerald-950/90 border-emerald-500/50 text-emerald-200'
            }`}
          >
            {toastMessage.isError ? <AlertTriangle className="w-5 h-5 text-rose-400" /> : <CheckCircle className="w-5 h-5 text-emerald-400" />}
            <span>{toastMessage.text}</span>
            <button onClick={() => setToastMessage(null)} className="ml-2 hover:opacity-75">
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Banner / Operational KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-900/70 border border-slate-800 p-5 rounded-2xl backdrop-blur-md relative overflow-hidden"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Floor Occupancy</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <LayoutGrid className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-white">{occupancyRate}%</span>
            <span className="text-xs text-slate-400">({occupiedTables + billingTables}/{totalTables} Tables)</span>
          </div>
          <div className="mt-2 w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
            <div className="bg-emerald-500 h-1.5 rounded-full transition-all duration-500" style={{ width: `${occupancyRate}%` }} />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="bg-slate-900/70 border border-slate-800 p-5 rounded-2xl backdrop-blur-md relative overflow-hidden"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Active Orders</span>
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <ClipboardList className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-white">{activeOrders.length}</span>
            <span className="text-xs text-slate-400">tables dining</span>
          </div>
          <p className="mt-2 text-xs text-blue-400 font-medium">In kitchen & serving</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-slate-900/70 border border-slate-800 p-5 rounded-2xl backdrop-blur-md relative overflow-hidden"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Open Complaints</span>
            <div className="w-8 h-8 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
              <MessageSquareWarning className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-white">{openComplaints.length}</span>
            <span className="text-xs text-slate-400">require action</span>
          </div>
          <p className="mt-2 text-xs text-rose-400 font-medium">
            {openComplaints.length === 0 ? 'All resolved 👍' : 'Attention required'}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-slate-900/70 border border-slate-800 p-5 rounded-2xl backdrop-blur-md relative overflow-hidden"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Billing in Progress</span>
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-white">{billingTables}</span>
            <span className="text-xs text-slate-400">pending payment</span>
          </div>
          <p className="mt-2 text-xs text-cyan-400 font-medium">Locked for new orders (BR-03)</p>
        </motion.div>
      </div>

      {/* Main Grid: Mini Floor Plan & Live Orders */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Mini Floor Plan (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl backdrop-blur-md">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-white text-base flex items-center gap-2">
                  <LayoutGrid className="w-4 h-4 text-amber-400" />
                  Mini Floor Plan
                </h3>
                <p className="text-xs text-slate-400">Tap table to inspect live status</p>
              </div>
              <div className="flex gap-1.5 text-[10px]">
                <span className="px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-400 border border-emerald-500/30 font-medium">Free</span>
                <span className="px-2 py-0.5 rounded bg-rose-950/60 text-rose-400 border border-rose-500/30 font-medium">Occupied</span>
                <span className="px-2 py-0.5 rounded bg-amber-950/60 text-amber-400 border border-amber-500/30 font-medium">Reserved</span>
                <span className="px-2 py-0.5 rounded bg-cyan-950/60 text-cyan-400 border border-cyan-500/30 font-medium">Billing</span>
              </div>
            </div>

            {/* Grid of Tables */}
            <div className="grid grid-cols-4 gap-2.5">
              {state.tables.map(table => {
                const isSelected = selectedTableNo === table.tableNo;
                const activeOrderForTable = state.orders.find(o => o.tableNo === table.tableNo && o.status !== 'Completed' && o.status !== 'Cancelled');
                return (
                  <motion.button
                    key={table.tableNo}
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.96 }}
                    onClick={() => {
                      setSelectedTableNo(isSelected ? null : table.tableNo);
                      if (activeOrderForTable) {
                        setDrilldownOrder(activeOrderForTable);
                      }
                    }}
                    className={`p-3 rounded-xl border text-center transition-all flex flex-col items-center justify-center relative ${getTableColor(table.status)} ${
                      isSelected ? 'ring-2 ring-white shadow-lg shadow-black/40' : ''
                    }`}
                  >
                    <span className="text-xs font-black tracking-tight">T-{table.tableNo}</span>
                    <span className="text-[10px] opacity-80 mt-0.5 flex items-center gap-0.5">
                      <Users className="w-2.5 h-2.5 inline" /> {table.capacity}p
                    </span>
                    <span className="text-[9px] font-bold uppercase tracking-wider mt-1 px-1.5 py-0.2 rounded bg-black/40">
                      {table.status}
                    </span>
                  </motion.button>
                );
              })}
            </div>

            {/* Selected Table Inspector Details */}
            {selectedTableNo && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mt-4 pt-4 border-t border-slate-800 text-xs"
              >
                {(() => {
                  const table = state.tables.find(t => t.tableNo === selectedTableNo);
                  const order = state.orders.find(o => o.tableNo === selectedTableNo && o.status !== 'Completed' && o.status !== 'Cancelled');
                  if (!table) return null;
                  return (
                    <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white text-sm">Table {table.tableNo} Details</span>
                        <button onClick={() => setSelectedTableNo(null)} className="text-slate-400 hover:text-white">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-slate-300">
                        <div>Status: <span className="font-semibold text-white">{table.status}</span></div>
                        <div>Capacity: <span className="font-semibold text-white">{table.capacity} guests</span></div>
                        {order && (
                          <>
                            <div>Waiter: <span className="font-semibold text-white">{order.waiterName}</span></div>
                            <div>Subtotal: <span className="font-semibold text-emerald-400">₹{order.subtotal}</span></div>
                          </>
                        )}
                      </div>
                      {order && (
                        <div className="pt-2 flex gap-2">
                          <button
                            onClick={() => setDrilldownOrder(order)}
                            className="flex-1 py-1.5 px-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium text-xs flex items-center justify-center gap-1.5"
                          >
                            <Eye className="w-3.5 h-3.5" /> Inspect Order
                          </button>
                          <button
                            onClick={() => setCancelModalOrder(order)}
                            className="py-1.5 px-3 bg-rose-600/30 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/40 rounded-lg font-medium text-xs flex items-center justify-center gap-1.5"
                          >
                            <XCircle className="w-3.5 h-3.5" /> Cancel Order
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </motion.div>
            )}
          </div>

          {/* Quick Complaints Summary widget */}
          <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl backdrop-blur-md">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <MessageSquareWarning className="w-4 h-4 text-rose-400" />
                Customer Complaints Log
              </h3>
              <div className="flex gap-1 text-[11px]">
                {(['All', 'Open', 'Resolved'] as const).map(tab => (
                  <button
                    key={tab}
                    onClick={() => setComplaintFilter(tab)}
                    className={`px-2.5 py-1 rounded-lg font-semibold transition ${
                      complaintFilter === tab
                        ? 'bg-rose-500 text-black'
                        : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
              {filteredComplaints.length === 0 ? (
                <div className="text-center py-6 text-slate-500 text-xs">
                  No complaints found in this filter. Floor operations running smoothly!
                </div>
              ) : (
                filteredComplaints.map(comp => (
                  <div
                    key={comp.id}
                    className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-xs space-y-1.5 hover:border-slate-700 transition"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-white">{comp.customerName}</span>
                        {comp.tableNo && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-amber-400 font-semibold">
                            T-{comp.tableNo}
                          </span>
                        )}
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-medium">
                          {comp.category}
                        </span>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        comp.status === 'Resolved'
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/30'
                          : 'bg-rose-950 text-rose-400 border border-rose-500/30 animate-pulse'
                      }`}>
                        {comp.status}
                      </span>
                    </div>
                    <p className="text-slate-300 text-xs italic">"{comp.text}"</p>
                    {comp.resolutionNotes && (
                      <div className="bg-emerald-950/40 p-2 rounded-lg border border-emerald-500/20 text-emerald-300 text-[11px]">
                        <strong>Resolution:</strong> {comp.resolutionNotes}
                      </div>
                    )}
                    {comp.status !== 'Resolved' && (
                      <div className="pt-1 flex justify-end">
                        <button
                          onClick={() => setResolvingComplaint(comp)}
                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-medium text-[11px] flex items-center gap-1 transition"
                        >
                          <CheckCircle className="w-3 h-3" /> Resolve
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Live Orders List & Exceptions (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl backdrop-blur-md">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div>
                <h3 className="font-bold text-white text-base flex items-center gap-2">
                  <ClipboardList className="w-4 h-4 text-blue-400" />
                  Live Active Orders Stream
                </h3>
                <p className="text-xs text-slate-400">Real-time floor fulfillment & cancellation management</p>
              </div>
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  placeholder="Filter by table or waiter..."
                  value={orderSearch}
                  onChange={e => setOrderSearch(e.target.value)}
                  className="pl-8 pr-3 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 w-48"
                />
              </div>
            </div>

            {/* Orders Feed */}
            <div className="space-y-3">
              {filteredOrders.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-sm">
                  No active orders matching the search filter.
                </div>
              ) : (
                filteredOrders.map(order => {
                  const elapsed = getElapsedMinutes(order.createdAt);
                  const isLongWait = elapsed > 20;
                  return (
                    <motion.div
                      key={order.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-slate-700 transition space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center font-black text-blue-400 text-base">
                            T-{order.tableNo}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-white text-sm">#{order.id}</span>
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                order.status === 'Billing'
                                  ? 'bg-cyan-950 text-cyan-400 border border-cyan-500/30'
                                  : 'bg-blue-950 text-blue-400 border border-blue-500/30'
                              }`}>
                                {order.status}
                              </span>
                            </div>
                            <span className="text-xs text-slate-400">
                              Waiter: <strong className="text-slate-300">{order.waiterName}</strong>
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 text-right">
                          <div>
                            <span className="text-sm font-black text-emerald-400">₹{order.subtotal}</span>
                            <div className="flex items-center gap-1 text-[11px] text-slate-400">
                              <Clock className="w-3 h-3 text-slate-500" />
                              <span className={isLongWait ? 'text-rose-400 font-bold' : ''}>
                                {elapsed}m ago
                              </span>
                            </div>
                          </div>
                          <div className="flex gap-1.5">
                            <button
                              onClick={() => setDrilldownOrder(order)}
                              title="Drill-down into order items"
                              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setCancelModalOrder(order)}
                              title="Cancel order (Requires Rule BR-01 Reason)"
                              className="p-2 bg-rose-950/60 hover:bg-rose-900 border border-rose-500/30 text-rose-300 rounded-lg transition"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Items Preview Chips */}
                      <div className="flex flex-wrap gap-1.5 pt-1 border-t border-slate-800/80">
                        {order.items.map(item => (
                          <span
                            key={item.lineId}
                            className={`text-[11px] px-2.5 py-1 rounded-lg flex items-center gap-1.5 ${
                              item.status === 'Cancelled'
                                ? 'bg-rose-950/40 text-rose-400 line-through opacity-60'
                                : item.status === 'Served'
                                ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-500/20'
                                : item.status === 'Ready'
                                ? 'bg-amber-950/40 text-amber-300 border border-amber-500/30 font-semibold'
                                : item.status === 'Preparing'
                                ? 'bg-orange-950/40 text-orange-300 border border-orange-500/20'
                                : 'bg-slate-800 text-slate-300'
                            }`}
                          >
                            <span className="font-bold">{item.quantity}x</span>
                            <span>{item.itemName}</span>
                            <span className="text-[9px] opacity-75 font-mono">({item.status})</span>
                          </span>
                        ))}
                      </div>
                    </motion.div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Drill-down Order Modal */}
      <AnimatePresence>
        {drilldownOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 border border-slate-700 w-full max-w-xl rounded-2xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold">
                    T-{drilldownOrder.tableNo}
                  </div>
                  <div>
                    <h3 className="font-black text-white text-lg">Order #{drilldownOrder.id}</h3>
                    <p className="text-xs text-slate-400">Waiter: {drilldownOrder.waiterName} • Placed {getElapsedMinutes(drilldownOrder.createdAt)}m ago</p>
                  </div>
                </div>
                <button
                  onClick={() => setDrilldownOrder(null)}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Items List */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Order Items Detail</h4>
                {drilldownOrder.items.map(item => (
                  <div
                    key={item.lineId}
                    className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-bold text-white flex items-center gap-2">
                        <span>{item.quantity}x {item.itemName}</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded font-semibold ${
                          item.status === 'Served' ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/30' :
                          item.status === 'Ready' ? 'bg-amber-950 text-amber-400 border border-amber-500/30' :
                          item.status === 'Preparing' ? 'bg-orange-950 text-orange-400 border border-orange-500/30' :
                          item.status === 'Cancelled' ? 'bg-rose-950 text-rose-400 line-through' :
                          'bg-slate-800 text-slate-300'
                        }`}>
                          {item.status}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-400">Station: {item.station} • ₹{item.unitPrice} each</span>
                      {item.cancellationReason && (
                        <p className="text-rose-400 text-[11px] mt-0.5 italic">Cancelled: {item.cancellationReason}</p>
                      )}
                    </div>
                    <span className="font-bold text-emerald-400 text-sm">₹{item.unitPrice * item.quantity}</span>
                  </div>
                ))}
              </div>

              {/* Order Footer & Actions */}
              <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-400">Total Subtotal</span>
                  <div className="text-xl font-black text-emerald-400">₹{drilldownOrder.subtotal}</div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setCancelModalOrder(drilldownOrder);
                    }}
                    className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 transition"
                  >
                    <XCircle className="w-4 h-4" /> Cancel Order
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Cancellation with Mandatory Reason Modal (Rule BR-01) */}
      <AnimatePresence>
        {cancelModalOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 border border-rose-500/40 w-full max-w-md rounded-2xl p-6 shadow-2xl space-y-4"
            >
              <div className="flex items-center gap-3 text-rose-400">
                <div className="w-10 h-10 rounded-xl bg-rose-500/20 flex items-center justify-center">
                  <ShieldAlert className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">Cancel Order #{cancelModalOrder.id}</h3>
                  <p className="text-xs text-rose-400">Table {cancelModalOrder.tableNo} • Rule BR-01 Enforcement</p>
                </div>
              </div>

              <div className="bg-rose-950/30 border border-rose-500/30 p-3 rounded-xl text-xs text-rose-200">
                <strong>Business Rule BR-01:</strong> Active orders with prepared or in-progress items cannot be quietly erased. A documented cancellation reason is required for operational and audit integrity.
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Cancellation Reason <span className="text-rose-400">*</span>
                </label>
                <textarea
                  rows={3}
                  placeholder="e.g., Guest had urgent emergency, duplicate order taken, item unavailable..."
                  value={cancelReason}
                  onChange={e => setCancelReason(e.target.value)}
                  className="w-full p-3 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button
                  onClick={() => {
                    setCancelModalOrder(null);
                    setCancelReason('');
                  }}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-medium text-xs transition"
                >
                  Dismiss
                </button>
                <button
                  onClick={handleConfirmCancelOrder}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 transition"
                >
                  <XCircle className="w-4 h-4" /> Confirm Order Cancellation
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Complaint Resolution Modal */}
      <AnimatePresence>
        {resolvingComplaint && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 border border-emerald-500/40 w-full max-w-md rounded-2xl p-6 shadow-2xl space-y-4"
            >
              <div className="flex items-center gap-3 text-emerald-400">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                  <CheckCircle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">Resolve Complaint</h3>
                  <p className="text-xs text-slate-400">{resolvingComplaint.customerName} {resolvingComplaint.tableNo ? `(Table ${resolvingComplaint.tableNo})` : ''}</p>
                </div>
              </div>

              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs text-slate-300 italic">
                "{resolvingComplaint.text}"
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Resolution Notes <span className="text-emerald-400">*</span>
                </label>
                <textarea
                  rows={3}
                  placeholder="e.g., Offered complimentary dessert, apologized and replaced beverage, adjusted bill..."
                  value={resolutionNotes}
                  onChange={e => setResolutionNotes(e.target.value)}
                  className="w-full p-3 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button
                  onClick={() => {
                    setResolvingComplaint(null);
                    setResolutionNotes('');
                  }}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-medium text-xs transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmResolveComplaint}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 transition"
                >
                  <CheckCircle className="w-4 h-4" /> Save Resolution
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
export default ManagerView;
