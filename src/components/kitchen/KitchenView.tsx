import React, { useState } from 'react';
import { useKitiStore } from '../../services/store';
import { businessService, BusinessRuleError } from '../../services/businessService';
import type { StationCategory, ItemStatus } from '../../types';
import {
  Flame,
  CheckCircle2,
  Clock,
  PackageX,
  PackageCheck,
  ChefHat,
  Check,
  X
} from 'lucide-react';

export const KitchenView: React.FC = () => {
  const { state } = useKitiStore();
  const [selectedStation, setSelectedStation] = useState<StationCategory | 'All'>('All');
  const [showStockModal, setShowStockModal] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Collect all items across active orders with their parent order context
  const activeItems = state.orders
    .filter(order => order.status === 'Active' || order.status === 'Billing')
    .flatMap(order =>
      order.items
        .filter(item => item.status !== 'Served' && item.status !== 'Cancelled')
        .map(item => ({
          ...item,
          orderId: order.id,
          tableNo: order.tableNo,
          waiterName: order.waiterName,
          orderCreatedAt: order.createdAt
        }))
    );

  const filteredItems = activeItems.filter(item => selectedStation === 'All' || item.station === selectedStation);

  const pendingItems = filteredItems.filter(item => item.status === 'Pending');
  const preparingItems = filteredItems.filter(item => item.status === 'Preparing');
  const readyItems = filteredItems.filter(item => item.status === 'Ready');

  const handleUpdateStatus = (orderId: string, lineId: string, newStatus: ItemStatus) => {
    try {
      const res = businessService.updateItemStatus(orderId, lineId, newStatus);
      showToast(res.message);
    } catch (err: unknown) {
      if (err instanceof BusinessRuleError) showToast(err.message);
    }
  };

  const handleToggleStock = (itemId: string) => {
    try {
      const res = businessService.toggleItemStock(itemId);
      showToast(res.message);
    } catch (err: unknown) {
      if (err instanceof BusinessRuleError) showToast(err.message);
    }
  };

  const getElapsedMinutes = (timeString: string) => {
    const elapsedMs = Date.now() - new Date(timeString).getTime();
    return Math.max(1, Math.floor(elapsedMs / 60000));
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 flex items-center gap-3 bg-amber-500 text-black px-4 py-3 rounded-xl shadow-2xl font-bold text-sm backdrop-blur-md animate-bounce">
          <ChefHat className="w-5 h-5 shrink-0" />
          <span>{toastMessage}</span>
          <button onClick={() => setToastMessage(null)} className="ml-2 hover:opacity-75">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Top Kitchen Control Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-slate-900/80 border border-slate-800 p-4 rounded-2xl backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-orange-500/20 border border-orange-500/40 flex items-center justify-center text-orange-400">
            <ChefHat className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black text-white tracking-tight">Kitchen Dispatch Queue</h2>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-orange-500/20 text-orange-300 font-bold border border-orange-500/30">
                {activeItems.length} active items
              </span>
            </div>
            <p className="text-xs text-slate-400">High-visibility Kanban dispatch for kitchen stations</p>
          </div>
        </div>

        {/* Station Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0">
          {(['All', 'Starters', 'Mains', 'Drinks', 'Dessert'] as const).map(station => {
            const count = activeItems.filter(i => station === 'All' || i.station === station).length;
            const isSelected = selectedStation === station;

            return (
              <button
                key={station}
                onClick={() => setSelectedStation(station)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
                  isSelected
                    ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'
                }`}
              >
                <span>{station}</span>
                <span className={`px-1.5 py-0.2 rounded-md text-[10px] ${
                  isSelected ? 'bg-black/20 text-black' : 'bg-slate-900 text-slate-400'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Inventory Out of Stock Trigger */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowStockModal(true)}
            className="px-4 py-2 rounded-xl bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-800/80 font-bold text-xs flex items-center gap-2 transition"
          >
            <PackageX className="w-4 h-4 text-rose-400" />
            Manage 86 / Out of Stock
          </button>
        </div>
      </div>

      {/* Voice Assistant Shortcuts Bar */}
      <div className="p-3 bg-slate-900/50 border border-slate-800 rounded-xl flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
          <strong className="text-slate-300 font-bold">Chef Voice Controls (Hands-Free):</strong>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="bg-slate-800 px-2 py-0.5 rounded text-slate-300">"Hey Kiti, how many orders are pending?"</span>
          <span className="bg-slate-800 px-2 py-0.5 rounded text-slate-300">"Hey Kiti, mark table 5's paneer tikka ready"</span>
          <span className="bg-slate-800 px-2 py-0.5 rounded text-slate-300">"Hey Kiti, we're out of paneer tikka"</span>
        </div>
      </div>

      {/* 3-Column Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Column 1: PENDING ORDERS */}
        <div className="bg-slate-900/60 border border-amber-900/40 rounded-2xl p-4 space-y-4 backdrop-blur-md">
          <div className="flex items-center justify-between pb-3 border-b border-amber-900/30">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-amber-400 animate-pulse shadow-[0_0_10px_rgba(251,191,36,0.8)]" />
              <h3 className="font-black text-amber-300 tracking-wide text-sm uppercase">1. Pending Orders</h3>
            </div>
            <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-black text-xs border border-amber-500/40">
              {pendingItems.length}
            </span>
          </div>

          <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
            {pendingItems.length === 0 ? (
              <div className="py-12 text-center text-slate-500 text-xs">
                No new pending orders in this station.
              </div>
            ) : (
              pendingItems.map(item => {
                const elapsed = getElapsedMinutes(item.orderedAt);
                return (
                  <div
                    key={item.lineId}
                    className="p-4 rounded-xl bg-slate-950 border border-amber-500/50 shadow-lg space-y-3 transition transform hover:-translate-y-0.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-1 rounded-md bg-amber-500 text-black font-black text-xs">
                          T{item.tableNo}
                        </span>
                        <span className="text-xs font-semibold text-slate-400">{item.station}</span>
                      </div>
                      <div className={`flex items-center gap-1 text-xs font-bold ${elapsed > 10 ? 'text-rose-400 animate-pulse' : 'text-amber-400'}`}>
                        <Clock className="w-3.5 h-3.5" />
                        <span>{elapsed}m ago</span>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-lg font-black text-white leading-tight">
                        {item.quantity}x {item.itemName}
                      </h4>
                      <p className="text-xs text-slate-400 mt-0.5">Order #{item.orderId} • {item.waiterName}</p>
                    </div>

                    <button
                      onClick={() => handleUpdateStatus(item.orderId, item.lineId, 'Preparing')}
                      className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-black text-xs flex items-center justify-center gap-2 shadow-md transition"
                    >
                      <Flame className="w-4 h-4" />
                      Start Cooking
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Column 2: PREPARING (IN KITCHEN) */}
        <div className="bg-slate-900/60 border border-blue-900/40 rounded-2xl p-4 space-y-4 backdrop-blur-md">
          <div className="flex items-center justify-between pb-3 border-b border-blue-900/30">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-sky-400 animate-pulse shadow-[0_0_10px_rgba(56,189,248,0.8)]" />
              <h3 className="font-black text-sky-300 tracking-wide text-sm uppercase">2. Preparing (In Oven / Range)</h3>
            </div>
            <span className="px-2.5 py-0.5 rounded-full bg-sky-500/20 text-sky-300 font-black text-xs border border-sky-500/40">
              {preparingItems.length}
            </span>
          </div>

          <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
            {preparingItems.length === 0 ? (
              <div className="py-12 text-center text-slate-500 text-xs">
                No items currently on the stove.
              </div>
            ) : (
              preparingItems.map(item => {
                const elapsed = getElapsedMinutes(item.orderedAt);
                return (
                  <div
                    key={item.lineId}
                    className="p-4 rounded-xl bg-slate-950 border border-sky-500/50 shadow-lg space-y-3 transition transform hover:-translate-y-0.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-1 rounded-md bg-sky-500 text-black font-black text-xs">
                          T{item.tableNo}
                        </span>
                        <span className="text-xs font-semibold text-slate-400">{item.station}</span>
                      </div>
                      <div className={`flex items-center gap-1 text-xs font-bold ${elapsed > 15 ? 'text-rose-400 animate-pulse' : 'text-sky-300'}`}>
                        <Clock className="w-3.5 h-3.5" />
                        <span>{elapsed}m ago</span>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-lg font-black text-white leading-tight">
                        {item.quantity}x {item.itemName}
                      </h4>
                      <p className="text-xs text-slate-400 mt-0.5">Order #{item.orderId} • {item.waiterName}</p>
                    </div>

                    <button
                      onClick={() => handleUpdateStatus(item.orderId, item.lineId, 'Ready')}
                      className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-black text-xs flex items-center justify-center gap-2 shadow-md transition"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      Mark Ready for Pickup
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Column 3: READY FOR PICKUP */}
        <div className="bg-slate-900/60 border border-emerald-900/40 rounded-2xl p-4 space-y-4 backdrop-blur-md">
          <div className="flex items-center justify-between pb-3 border-b border-emerald-900/30">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.8)]" />
              <h3 className="font-black text-emerald-300 tracking-wide text-sm uppercase">3. Ready for Pass / Waiter</h3>
            </div>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-black text-xs border border-emerald-500/40">
              {readyItems.length}
            </span>
          </div>

          <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
            {readyItems.length === 0 ? (
              <div className="py-12 text-center text-slate-500 text-xs">
                No plated dishes waiting at the pickup counter.
              </div>
            ) : (
              readyItems.map(item => (
                <div
                  key={item.lineId}
                  className="p-4 rounded-xl bg-slate-950 border border-emerald-500/60 shadow-lg space-y-3 transition"
                >
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-1 rounded-md bg-emerald-500 text-black font-black text-xs">
                      Table {item.tableNo}
                    </span>
                    <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" /> Plated
                    </span>
                  </div>

                  <div>
                    <h4 className="text-lg font-black text-white leading-tight">
                      {item.quantity}x {item.itemName}
                    </h4>
                    <p className="text-xs text-slate-400 mt-0.5">Waiter: {item.waiterName}</p>
                  </div>

                  <div className="p-2 rounded-lg bg-emerald-950/30 border border-emerald-800/40 text-emerald-300 text-xs text-center font-medium">
                    Waiting for waiter to deliver to table
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Out of Stock Management Modal (Rule BR-02) */}
      {showStockModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <PackageX className="w-6 h-6 text-rose-400" />
                <div>
                  <h3 className="text-lg font-bold text-white">Kitchen 86 & Stock Controller</h3>
                  <p className="text-xs text-slate-400">Toggle items InStock / OutOfStock in real time</p>
                </div>
              </div>
              <button onClick={() => setShowStockModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              {state.menuItems.map(item => {
                const isOutOfStock = item.availability === 'OutOfStock';
                return (
                  <div
                    key={item.id}
                    className={`p-3 rounded-xl border flex items-center justify-between text-xs transition ${
                      isOutOfStock ? 'bg-rose-950/30 border-rose-800/50' : 'bg-slate-800/50 border-slate-700/60'
                    }`}
                  >
                    <div>
                      <div className="font-bold text-white text-sm flex items-center gap-2">
                        <span>{item.name}</span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 font-normal">
                          {item.station}
                        </span>
                      </div>
                      <span className="text-slate-400 text-xs">₹{item.price} • {item.description.slice(0, 45)}...</span>
                    </div>

                    <button
                      onClick={() => handleToggleStock(item.id)}
                      className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition ${
                        isOutOfStock
                          ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-md'
                          : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                      }`}
                    >
                      {isOutOfStock ? (
                        <>
                          <PackageX className="w-3.5 h-3.5" />
                          Out of Stock (86)
                        </>
                      ) : (
                        <>
                          <PackageCheck className="w-3.5 h-3.5" />
                          In Stock
                        </>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-800">
              <button
                onClick={() => setShowStockModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
