import React, { useState } from 'react';
import { useKitiStore } from '../../services/store';
import { businessService, BusinessRuleError } from '../../services/businessService';
import { ThreeFloorPlan } from './ThreeFloorPlan';
import type { TableStatus, MenuItem, SplitType, PaymentMode, StationCategory } from '../../types';
import confetti from 'canvas-confetti';
import {
  Utensils,
  Receipt,
  Plus,
  Minus,
  CheckCircle,
  AlertCircle,
  X,
  CreditCard,
  QrCode,
  Banknote,
  Send,
  Users,
  Grid,
  Box,
  Trash2,
  CalendarCheck
} from 'lucide-react';

export const WaiterView: React.FC = () => {
  const { state, setSelectedTable } = useKitiStore();
  const [viewMode, setViewMode] = useState<'3d' | '2d'>('3d');
  const [filterStatus, setFilterStatus] = useState<TableStatus | 'All'>('All');
  const [selectedStation, setSelectedStation] = useState<StationCategory | 'All'>('All');

  // Order taking cart for selected table
  const [cart, setCart] = useState<Record<string, number>>({});
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Cancellation modal state
  const [cancelModalItem, setCancelModalItem] = useState<{ lineId: string; itemName: string; status: string; orderId: string } | null>(null);
  const [cancellationReason, setCancellationReason] = useState('');

  // Billing modal state
  const [showBillingModal, setShowBillingModal] = useState(false);
  const [splitType, setSplitType] = useState<SplitType>('Whole');
  const [splitCount, setSplitCount] = useState(2);
  const [selectedPaymentMode, setSelectedPaymentMode] = useState<PaymentMode>('UPI');

  // Reservations/Waitlist drawer state
  const [showSeatingDrawer, setShowSeatingDrawer] = useState(false);

  const selectedTable = state.tables.find(t => t.tableNo === state.selectedTableNo);
  const activeOrder = selectedTable?.currentOrderId
    ? state.orders.find(o => o.id === selectedTable.currentOrderId && o.status !== 'Completed' && o.status !== 'Cancelled')
    : state.orders.find(o => o.tableNo === selectedTable?.tableNo && o.status !== 'Completed' && o.status !== 'Cancelled');

  const pendingBill = selectedTable
    ? state.bills.find(b => b.tableNo === selectedTable.tableNo && b.status === 'Pending')
    : null;

  const filteredTables = state.tables.filter(t => filterStatus === 'All' || t.status === filterStatus);

  const filteredMenu = state.menuItems.filter(m => selectedStation === 'All' || m.station === selectedStation);

  const showToast = (msg: string, isError = false) => {
    if (isError) {
      setErrorMessage(msg);
      setTimeout(() => setErrorMessage(null), 5000);
    } else {
      setSuccessMessage(msg);
      setTimeout(() => setSuccessMessage(null), 4000);
    }
  };

  const handleSelectTable = (tableNo: number) => {
    setSelectedTable(tableNo);
    setCart({});
    setErrorMessage(null);
  };

  const handleAddToCart = (menuItem: MenuItem) => {
    if (menuItem.availability === 'OutOfStock') {
      showToast(`Cannot add "${menuItem.name}". It is Out of Stock!`, true);
      return;
    }
    setCart(prev => ({
      ...prev,
      [menuItem.id]: (prev[menuItem.id] || 0) + 1
    }));
  };

  const handleRemoveFromCart = (menuItemId: string) => {
    setCart(prev => {
      const next = { ...prev };
      if (next[menuItemId] > 1) {
        next[menuItemId] -= 1;
      } else {
        delete next[menuItemId];
      }
      return next;
    });
  };

  const handleSendOrder = () => {
    if (!selectedTable) return;
    const items = Object.entries(cart).map(([menuItemId, quantity]) => ({ menuItemId, quantity }));
    if (items.length === 0) {
      showToast('Please select at least one item to order.', true);
      return;
    }

    try {
      if (activeOrder && activeOrder.status === 'Active') {
        const res = businessService.addItemsToOrder({ orderId: activeOrder.id, items });
        showToast(res.message);
      } else {
        const res = businessService.createOrder({
          tableNo: selectedTable.tableNo,
          items,
          waiterId: state.currentUser.uid,
          waiterName: state.currentUser.name
        });
        showToast(res.message);
      }
      setCart({});
    } catch (err: unknown) {
      if (err instanceof BusinessRuleError) {
        showToast(err.message, true);
      } else {
        showToast('Failed to send order.', true);
      }
    }
  };

  const handleMarkServed = (lineId: string) => {
    if (!activeOrder) return;
    try {
      const res = businessService.updateItemStatus(activeOrder.id, lineId, 'Served');
      showToast(res.message);
    } catch (err: unknown) {
      if (err instanceof BusinessRuleError) showToast(err.message, true);
    }
  };

  const handleOpenCancelModal = (item: { lineId: string; itemName: string; status: string; orderId: string }) => {
    setCancelModalItem(item);
    setCancellationReason('');
  };

  const handleConfirmCancelItem = () => {
    if (!cancelModalItem) return;
    try {
      const res = businessService.cancelItem({
        orderId: cancelModalItem.orderId,
        lineId: cancelModalItem.lineId,
        reason: cancellationReason
      });
      showToast(res.message);
      setCancelModalItem(null);
    } catch (err: unknown) {
      if (err instanceof BusinessRuleError) {
        showToast(err.message, true);
      }
    }
  };

  const handleGenerateBill = () => {
    if (!selectedTable) return;
    try {
      const res = businessService.generateBill({
        tableNo: selectedTable.tableNo,
        splitType,
        splitCount: splitType === 'ByPerson' ? splitCount : undefined
      });
      showToast(res.message);
      setShowBillingModal(false);
    } catch (err: unknown) {
      if (err instanceof BusinessRuleError) {
        showToast(err.message, true);
      }
    }
  };

  const handleSettleBill = (billId: string) => {
    try {
      const res = businessService.settleBill(billId, selectedPaymentMode);
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });
      showToast(res.message);
    } catch (err: unknown) {
      if (err instanceof BusinessRuleError) {
        showToast(err.message, true);
      }
    }
  };

  const counts = {
    total: state.tables.length,
    free: state.tables.filter(t => t.status === 'Free').length,
    occupied: state.tables.filter(t => t.status === 'Occupied').length,
    reserved: state.tables.filter(t => t.status === 'Reserved').length,
    billing: state.tables.filter(t => t.status === 'Billing').length,
  };

  return (
    <div className="space-y-6">
      {/* Toast notifications */}
      {errorMessage && (
        <div className="fixed top-20 right-6 z-50 flex items-center gap-3 bg-rose-950/90 border border-rose-600/80 text-rose-200 px-4 py-3 rounded-xl shadow-2xl backdrop-blur-md animate-bounce">
          <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
          <span className="text-sm font-medium">{errorMessage}</span>
          <button onClick={() => setErrorMessage(null)} className="ml-2 hover:text-white"><X className="w-4 h-4" /></button>
        </div>
      )}

      {successMessage && (
        <div className="fixed top-20 right-6 z-50 flex items-center gap-3 bg-emerald-950/90 border border-emerald-600/80 text-emerald-200 px-4 py-3 rounded-xl shadow-2xl backdrop-blur-md">
          <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-sm font-medium">{successMessage}</span>
          <button onClick={() => setSuccessMessage(null)} className="ml-2 hover:text-white"><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* Top Floor Summary & Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-slate-900/60 border border-slate-800 p-4 rounded-2xl backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
            <Utensils className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight">Floor Operations</h2>
            <p className="text-xs text-slate-400">Tap table to seat, order, or request billing</p>
          </div>
        </div>

        {/* Quick Status Stats Filter */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 lg:pb-0 text-xs">
          <button
            onClick={() => setFilterStatus('All')}
            className={`px-3 py-1.5 rounded-lg border font-medium transition ${
              filterStatus === 'All'
                ? 'bg-slate-700 text-white border-slate-600'
                : 'bg-slate-800/60 text-slate-400 border-slate-800 hover:text-slate-200'
            }`}
          >
            All ({counts.total})
          </button>
          <button
            onClick={() => setFilterStatus('Free')}
            className={`px-3 py-1.5 rounded-lg border font-medium transition flex items-center gap-1.5 ${
              filterStatus === 'Free'
                ? 'bg-emerald-950 text-emerald-300 border-emerald-500'
                : 'bg-slate-800/60 text-emerald-400 border-slate-800'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            Free ({counts.free})
          </button>
          <button
            onClick={() => setFilterStatus('Occupied')}
            className={`px-3 py-1.5 rounded-lg border font-medium transition flex items-center gap-1.5 ${
              filterStatus === 'Occupied'
                ? 'bg-rose-950 text-rose-300 border-rose-500'
                : 'bg-slate-800/60 text-rose-400 border-slate-800'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-rose-500" />
            Occupied ({counts.occupied})
          </button>
          <button
            onClick={() => setFilterStatus('Reserved')}
            className={`px-3 py-1.5 rounded-lg border font-medium transition flex items-center gap-1.5 ${
              filterStatus === 'Reserved'
                ? 'bg-amber-950 text-amber-300 border-amber-500'
                : 'bg-slate-800/60 text-amber-400 border-slate-800'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            Reserved ({counts.reserved})
          </button>
          <button
            onClick={() => setFilterStatus('Billing')}
            className={`px-3 py-1.5 rounded-lg border font-medium transition flex items-center gap-1.5 ${
              filterStatus === 'Billing'
                ? 'bg-sky-950 text-sky-300 border-sky-500'
                : 'bg-slate-800/60 text-sky-400 border-slate-800'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-sky-500" />
            Billing ({counts.billing})
          </button>
        </div>

        {/* View Switcher & Seating Drawer Toggle */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSeatingDrawer(!showSeatingDrawer)}
            className="px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1.5 transition"
          >
            <Users className="w-3.5 h-3.5 text-amber-400" />
            Waitlist ({state.waitlist.filter(w => w.status === 'Waiting').length})
          </button>

          <div className="flex items-center bg-slate-950 border border-slate-800 p-0.5 rounded-xl">
            <button
              onClick={() => setViewMode('3d')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                viewMode === '3d' ? 'bg-amber-500 text-black shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Box className="w-3.5 h-3.5" />
              3D Floor
            </button>
            <button
              onClick={() => setViewMode('2d')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                viewMode === '2d' ? 'bg-amber-500 text-black shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Grid className="w-3.5 h-3.5" />
              2D Grid
            </button>
          </div>
        </div>
      </div>

      {/* Main Floor Area + Order Panel Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Floor Visualizer (3D or 2D) */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-4">
          {viewMode === '3d' ? (
            <ThreeFloorPlan
              tables={filteredTables}
              selectedTableNo={state.selectedTableNo}
              onSelectTable={handleSelectTable}
            />
          ) : (
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 backdrop-blur-md">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {filteredTables.map(t => {
                  const isSelected = t.tableNo === state.selectedTableNo;
                  const statusColors: Record<TableStatus, string> = {
                    Free: 'border-emerald-500/50 bg-emerald-950/20 text-emerald-400 hover:border-emerald-400',
                    Occupied: 'border-rose-500/50 bg-rose-950/20 text-rose-400 hover:border-rose-400',
                    Reserved: 'border-amber-500/50 bg-amber-950/20 text-amber-400 hover:border-amber-400',
                    Billing: 'border-sky-500/50 bg-sky-950/20 text-sky-400 hover:border-sky-400 animate-pulse-subtle'
                  };

                  return (
                    <button
                      key={t.id}
                      onClick={() => handleSelectTable(t.tableNo)}
                      className={`p-4 rounded-xl border text-left flex flex-col justify-between transition relative ${statusColors[t.status]} ${
                        isSelected ? 'ring-2 ring-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.3)]' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xl font-bold text-white">T{t.tableNo}</span>
                        <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-slate-900/80 border border-slate-700">
                          {t.status}
                        </span>
                      </div>
                      <div className="mt-4 flex items-center justify-between text-xs text-slate-400">
                        <span>{t.capacity} Seats</span>
                        {t.status === 'Occupied' && <span className="text-rose-300">Active</span>}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Quick Voice Prompt Suggestions for Waiter */}
          <div className="p-4 bg-slate-900/40 border border-slate-800/80 rounded-xl flex items-center justify-between gap-4 text-xs text-slate-400">
            <span className="font-semibold text-amber-400">Voice Shortcuts:</span>
            <div className="flex flex-wrap gap-2">
              <span className="bg-slate-800 px-2.5 py-1 rounded-md text-slate-300">"Hey Kiti, table 5 — two paneer tikka, one coke"</span>
              <span className="bg-slate-800 px-2.5 py-1 rounded-md text-slate-300">"Hey Kiti, is table 3 ready to bill?"</span>
              <span className="bg-slate-800 px-2.5 py-1 rounded-md text-slate-300">"Hey Kiti, bill table 2"</span>
            </div>
          </div>
        </div>

        {/* Selected Table Order Taking & Details Panel */}
        <div className="lg:col-span-5 xl:col-span-4 bg-slate-900/70 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between backdrop-blur-md">
          {selectedTable ? (
            <div className="space-y-5">
              {/* Table Header Info */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-black text-white">Table {selectedTable.tableNo}</h3>
                    <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                      selectedTable.status === 'Free' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' :
                      selectedTable.status === 'Occupied' ? 'bg-rose-950 text-rose-400 border border-rose-800' :
                      selectedTable.status === 'Billing' ? 'bg-sky-950 text-sky-400 border border-sky-800' :
                      'bg-amber-950 text-amber-400 border border-amber-800'
                    }`}>
                      {selectedTable.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">Capacity: {selectedTable.capacity} guests</p>
                </div>

                {selectedTable.status === 'Occupied' && (
                  <button
                    onClick={() => setShowBillingModal(true)}
                    className="px-3 py-1.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-black font-bold text-xs flex items-center gap-1.5 transition shadow-lg shadow-sky-500/20"
                  >
                    <Receipt className="w-3.5 h-3.5" />
                    Bill Table
                  </button>
                )}

                {selectedTable.status === 'Billing' && pendingBill && (
                  <button
                    onClick={() => handleSettleBill(pendingBill.id)}
                    className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs flex items-center gap-1.5 transition shadow-lg shadow-emerald-500/20"
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    Settle ₹{pendingBill.total}
                  </button>
                )}
              </div>

              {/* Active Order Ticket */}
              {activeOrder && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>Order #{activeOrder.id}</span>
                    <span>Placed by: {activeOrder.waiterName}</span>
                  </div>

                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {activeOrder.items.map(item => (
                      <div
                        key={item.lineId}
                        className={`p-2.5 rounded-xl border flex items-center justify-between text-xs ${
                          item.status === 'Ready' ? 'bg-emerald-950/40 border-emerald-500/60' :
                          item.status === 'Preparing' ? 'bg-amber-950/30 border-amber-500/40' :
                          item.status === 'Cancelled' ? 'bg-slate-900 border-slate-800 opacity-50 line-through' :
                          item.status === 'Served' ? 'bg-slate-900/60 border-slate-800 text-slate-400' :
                          'bg-slate-800/40 border-slate-700/60'
                        }`}
                      >
                        <div className="space-y-0.5">
                          <div className="font-semibold text-slate-100 flex items-center gap-2">
                            <span>{item.quantity}x {item.itemName}</span>
                            <span className={`text-[10px] px-1.5 py-0.2 rounded font-bold uppercase ${
                              item.status === 'Ready' ? 'bg-emerald-500 text-black' :
                              item.status === 'Preparing' ? 'bg-amber-500 text-black' :
                              item.status === 'Served' ? 'bg-slate-700 text-slate-300' :
                              'bg-slate-700 text-slate-300'
                            }`}>
                              {item.status}
                            </span>
                          </div>
                          <span className="text-[11px] text-slate-400">₹{item.unitPrice * item.quantity}</span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          {item.status === 'Ready' && (
                            <button
                              onClick={() => handleMarkServed(item.lineId)}
                              className="px-2 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-[11px] transition"
                            >
                              Serve
                            </button>
                          )}

                          {item.status !== 'Served' && item.status !== 'Cancelled' && (
                            <button
                              onClick={() => handleOpenCancelModal({ lineId: item.lineId, itemName: item.itemName, status: item.status, orderId: activeOrder.id })}
                              className="p-1 text-slate-500 hover:text-rose-400 transition"
                              title="Cancel item"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="pt-2 border-t border-slate-800 flex justify-between text-sm font-bold text-white">
                    <span>Order Subtotal</span>
                    <span className="text-amber-400">₹{activeOrder.subtotal}</span>
                  </div>
                </div>
              )}

              {/* Order Taking Section (Menu Catalog & Cart) */}
              {selectedTable.status !== 'Billing' ? (
                <div className="space-y-3 pt-2 border-t border-slate-800">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    {activeOrder ? 'Add More Dishes' : 'Take New Order'}
                  </h4>

                  {/* Station Selector */}
                  <div className="flex items-center gap-1 overflow-x-auto pb-1 text-xs">
                    {(['All', 'Starters', 'Mains', 'Drinks', 'Dessert'] as const).map(cat => (
                      <button
                        key={cat}
                        onClick={() => setSelectedStation(cat)}
                        className={`px-2.5 py-1 rounded-md transition text-xs ${
                          selectedStation === cat
                            ? 'bg-amber-500 text-black font-bold'
                            : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>

                  {/* Menu Items List */}
                  <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
                    {filteredMenu.map(menuItem => {
                      const isOutOfStock = menuItem.availability === 'OutOfStock';
                      const inCartQty = cart[menuItem.id] || 0;

                      return (
                        <div
                          key={menuItem.id}
                          className={`p-2 rounded-xl border flex items-center justify-between text-xs transition ${
                            isOutOfStock
                              ? 'bg-slate-900/40 border-slate-800/40 opacity-60'
                              : 'bg-slate-800/40 border-slate-700/50 hover:border-slate-600'
                          }`}
                        >
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-1.5">
                              <span className={`w-2 h-2 rounded-full ${menuItem.isVegetarian ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                              <span className="font-medium text-slate-200">{menuItem.name}</span>
                              {isOutOfStock && (
                                <span className="text-[9px] px-1.5 py-0.2 rounded bg-rose-950 border border-rose-800 text-rose-300 font-bold uppercase">
                                  Out of Stock
                                </span>
                              )}
                            </div>
                            <span className="text-slate-400">₹{menuItem.price}</span>
                          </div>

                          <div className="flex items-center gap-1.5">
                            {inCartQty > 0 ? (
                              <div className="flex items-center gap-1 bg-slate-900 px-2 py-0.5 rounded-lg border border-slate-700">
                                <button onClick={() => handleRemoveFromCart(menuItem.id)} className="text-slate-400 hover:text-white">
                                  <Minus className="w-3 h-3" />
                                </button>
                                <span className="font-bold text-amber-400 px-1">{inCartQty}</span>
                                <button
                                  onClick={() => handleAddToCart(menuItem)}
                                  disabled={isOutOfStock}
                                  className="text-slate-400 hover:text-white disabled:opacity-30"
                                >
                                  <Plus className="w-3 h-3" />
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => handleAddToCart(menuItem)}
                                disabled={isOutOfStock}
                                className="px-2.5 py-1 rounded-lg bg-slate-700 hover:bg-amber-500 hover:text-black font-semibold text-slate-200 transition disabled:opacity-40 disabled:hover:bg-slate-700 disabled:hover:text-slate-200"
                              >
                                + Add
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Send Order Button */}
                  {Object.keys(cart).length > 0 && (
                    <button
                      onClick={handleSendOrder}
                      className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition"
                    >
                      <Send className="w-4 h-4" />
                      Send {Object.values(cart).reduce((a, b) => a + b, 0)} Items to Kitchen
                    </button>
                  )}
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-sky-950/30 border border-sky-600/40 text-sky-200 text-xs text-center">
                  Table is in <strong className="font-bold">Billing Status</strong>. No additional orders can be placed until current bill is settled.
                </div>
              )}
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 text-slate-500 space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-center text-slate-400">
                <Utensils className="w-7 h-7" />
              </div>
              <h4 className="text-base font-bold text-slate-300">Select a Table</h4>
              <p className="text-xs text-slate-400 max-w-xs">
                Click any table on the 3D floor map or 2D grid to take orders, monitor kitchen progress, or bill guests.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Bill Request / Split Modal */}
      {showBillingModal && selectedTable && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Receipt className="w-5 h-5 text-sky-400" />
                Generate Bill — Table {selectedTable.tableNo}
              </h3>
              <button onClick={() => setShowBillingModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-2">Split Type</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['Whole', 'ByPerson', 'ByItem'] as const).map(type => (
                    <button
                      key={type}
                      onClick={() => setSplitType(type)}
                      className={`py-2 px-3 rounded-xl border text-xs font-bold transition ${
                        splitType === type
                          ? 'bg-sky-500 text-black border-sky-400 shadow-md'
                          : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                      }`}
                    >
                      {type === 'Whole' ? 'Whole Bill' : type === 'ByPerson' ? 'By Person' : 'By Item'}
                    </button>
                  ))}
                </div>
              </div>

              {splitType === 'ByPerson' && (
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Number of Guests</label>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setSplitCount(Math.max(2, splitCount - 1))}
                      className="p-2 rounded-lg bg-slate-800 border border-slate-700 text-white"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="text-lg font-black text-white w-8 text-center">{splitCount}</span>
                    <button
                      onClick={() => setSplitCount(Math.min(8, splitCount + 1))}
                      className="p-2 rounded-lg bg-slate-800 border border-slate-700 text-white"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                    <span className="text-xs text-slate-400">Total split evenly among {splitCount} guests</span>
                  </div>
                </div>
              )}

              {splitType === 'ByItem' && (
                <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700 text-xs text-slate-300">
                  Items will be automatically divided by station & courses into individual sub-bills.
                </div>
              )}

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-2">Customer Payment Method</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => setSelectedPaymentMode('UPI')}
                    className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center gap-1.5 transition ${
                      selectedPaymentMode === 'UPI' ? 'bg-amber-500 text-black border-amber-400' : 'bg-slate-800 text-slate-300 border-slate-700'
                    }`}
                  >
                    <QrCode className="w-4 h-4" />
                    UPI / QR
                  </button>
                  <button
                    onClick={() => setSelectedPaymentMode('Card')}
                    className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center gap-1.5 transition ${
                      selectedPaymentMode === 'Card' ? 'bg-amber-500 text-black border-amber-400' : 'bg-slate-800 text-slate-300 border-slate-700'
                    }`}
                  >
                    <CreditCard className="w-4 h-4" />
                    Credit Card
                  </button>
                  <button
                    onClick={() => setSelectedPaymentMode('Cash')}
                    className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center gap-1.5 transition ${
                      selectedPaymentMode === 'Cash' ? 'bg-amber-500 text-black border-amber-400' : 'bg-slate-800 text-slate-300 border-slate-700'
                    }`}
                  >
                    <Banknote className="w-4 h-4" />
                    Cash
                  </button>
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-3 border-t border-slate-800">
              <button
                onClick={() => setShowBillingModal(false)}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition"
              >
                Cancel
              </button>
              <button
                onClick={handleGenerateBill}
                className="flex-1 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-black font-bold text-xs transition shadow-lg shadow-sky-500/20"
              >
                Generate & Lock Table
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancellation Reason Modal (Rule BR-01) */}
      {cancelModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-rose-800/80 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-950 border border-rose-600 flex items-center justify-center text-rose-400">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Cancel Order Item</h3>
                <p className="text-xs text-rose-300">
                  Item: <strong className="text-white">{cancelModalItem.itemName}</strong> ({cancelModalItem.status})
                </p>
              </div>
            </div>

            {cancelModalItem.status !== 'Pending' ? (
              <div className="space-y-2">
                <p className="text-xs text-slate-300">
                  This item is already <strong>{cancelModalItem.status}</strong>. Per restaurant business policy, you must provide a reason:
                </p>
                <textarea
                  value={cancellationReason}
                  onChange={(e) => setCancellationReason(e.target.value)}
                  placeholder="e.g. Guest changed their mind, kitchen delay, allergen concern..."
                  rows={3}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-rose-500"
                />
              </div>
            ) : (
              <p className="text-xs text-slate-300">
                This item is still Pending. Remove from active order?
              </p>
            )}

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setCancelModalItem(null)}
                className="flex-1 py-2 rounded-xl bg-slate-800 text-slate-300 font-semibold text-xs hover:bg-slate-700"
              >
                Go Back
              </button>
              <button
                onClick={handleConfirmCancelItem}
                disabled={cancelModalItem.status !== 'Pending' && !cancellationReason.trim()}
                className="flex-1 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-40 text-white font-bold text-xs"
              >
                Confirm Cancellation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reservations & Waitlist Sliding Drawer */}
      {showSeatingDrawer && (
        <div className="fixed inset-y-0 right-0 z-40 w-full sm:w-96 bg-slate-900 border-l border-slate-800 p-6 space-y-6 shadow-2xl backdrop-blur-xl overflow-y-auto">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <CalendarCheck className="w-5 h-5 text-amber-400" />
              Seating & Waitlist
            </h3>
            <button onClick={() => setShowSeatingDrawer(false)} className="text-slate-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Waitlist Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Live Waitlist</h4>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold">
                {state.waitlist.filter(w => w.status === 'Waiting').length} waiting
              </span>
            </div>

            <div className="space-y-2">
              {state.waitlist.map(entry => (
                <div key={entry.id} className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-between text-xs">
                  <div>
                    <div className="font-bold text-white">{entry.customerName}</div>
                    <div className="text-slate-400">{entry.partySize} guests • {entry.phone}</div>
                  </div>
                  <span className={`px-2 py-0.5 rounded font-bold uppercase text-[10px] ${
                    entry.status === 'Waiting' ? 'bg-amber-500 text-black' : 'bg-slate-700 text-slate-300'
                  }`}>
                    {entry.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Reservations Section */}
          <div className="space-y-3 pt-4 border-t border-slate-800">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Upcoming Reservations</h4>
            <div className="space-y-2">
              {state.reservations.map(res => (
                <div key={res.id} className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-between text-xs">
                  <div>
                    <div className="font-bold text-white">Table {res.tableNo}: {res.customerName}</div>
                    <div className="text-slate-400">{res.partySize} guests • {new Date(res.reservedTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                  </div>
                  <span className="px-2 py-0.5 rounded font-bold uppercase text-[10px] bg-sky-500/20 text-sky-300 border border-sky-600/40">
                    {res.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
