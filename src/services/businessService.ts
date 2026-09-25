import type { Order, OrderItem, MenuItem, Bill, SubBill, TableStatus, ItemStatus, ItemAvailability, SplitType, PaymentMode, CustomerComplaint } from '../types';
import { getStoreState, setStoreState } from './store';

export class BusinessRuleError extends Error {
  readonly code: string;
  constructor(message: string, code: string) {
    super(message);
    this.code = code;
    this.name = 'BusinessRuleError';
  }
}

export interface CreateOrderParams {
  tableNo: number;
  items: Array<{
    menuItemId: string;
    quantity: number;
  }>;
  waiterId?: string;
  waiterName?: string;
  specialInstructions?: string;
}

export interface AddItemsParams {
  orderId: string;
  items: Array<{
    menuItemId: string;
    quantity: number;
  }>;
}

export interface CancelItemParams {
  orderId: string;
  lineId: string;
  reason?: string;
}

export interface GenerateBillParams {
  tableNo: number;
  splitType?: SplitType;
  splitCount?: number; // for ByPerson
  customSubBills?: SubBill[]; // for ByItem
  discountAmount?: number;
  discountReason?: string;
}

export const businessService = {
  /**
   * Rule BR-02 & BR-03: Create an order for a table
   */
  createOrder: (params: CreateOrderParams): { order: Order; message: string } => {
    const state = getStoreState();
    const table = state.tables.find(t => t.tableNo === params.tableNo);

    if (!table) {
      throw new BusinessRuleError(`Table ${params.tableNo} does not exist.`, 'TABLE_NOT_FOUND');
    }

    // BR-03: Table cannot take an order in Billing status
    if (table.status === 'Billing') {
      throw new BusinessRuleError(
        `Table ${params.tableNo} is currently in Billing status and cannot take new orders. Settle the bill and free the table first.`,
        'TABLE_BILLING_LOCKED'
      );
    }

    if (!params.items || params.items.length === 0) {
      throw new BusinessRuleError('Order must contain at least one item.', 'EMPTY_ORDER');
    }

    // BR-02: Check item availability
    const orderItems: OrderItem[] = [];
    let subtotal = 0;

    for (const itemReq of params.items) {
      const menuItem = state.menuItems.find(m => m.id === itemReq.menuItemId || m.name.toLowerCase() === itemReq.menuItemId.toLowerCase());
      if (!menuItem) {
        throw new BusinessRuleError(`Item "${itemReq.menuItemId}" was not found in the restaurant menu.`, 'MENU_ITEM_NOT_FOUND');
      }

      if (menuItem.availability === 'OutOfStock') {
        throw new BusinessRuleError(
          `Cannot order "${menuItem.name}". It is currently Out of Stock!`,
          'ITEM_OUT_OF_STOCK'
        );
      }

      const lineTotal = menuItem.price * itemReq.quantity;
      subtotal += lineTotal;

      orderItems.push({
        lineId: `line_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        menuItemId: menuItem.id,
        itemName: menuItem.name,
        quantity: itemReq.quantity,
        unitPrice: menuItem.price,
        station: menuItem.station,
        status: 'Pending',
        orderedAt: new Date().toISOString()
      });
    }

    const orderId = `order_${Date.now().toString().slice(-4)}_${params.tableNo}`;
    const newOrder: Order = {
      id: orderId,
      tableNo: params.tableNo,
      waiterId: params.waiterId || state.currentUser.uid,
      waiterName: params.waiterName || state.currentUser.name,
      status: 'Active',
      items: orderItems,
      subtotal,
      specialInstructions: params.specialInstructions,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    setStoreState(prev => ({
      orders: [newOrder, ...prev.orders],
      tables: prev.tables.map(t =>
        t.tableNo === params.tableNo
          ? {
              ...t,
              status: 'Occupied' as TableStatus,
              currentOrderId: orderId,
              lastStatusChange: new Date().toISOString()
            }
          : t
      )
    }));

    return {
      order: newOrder,
      message: `Order #${orderId} created for Table ${params.tableNo} with ${orderItems.length} items.`
    };
  },

  /**
   * Add items to an existing active order
   */
  addItemsToOrder: (params: AddItemsParams): { order: Order; message: string } => {
    const state = getStoreState();
    const order = state.orders.find(o => o.id === params.orderId);

    if (!order) {
      throw new BusinessRuleError(`Order #${params.orderId} not found.`, 'ORDER_NOT_FOUND');
    }

    if (order.status !== 'Active') {
      throw new BusinessRuleError(`Cannot append items to order #${params.orderId} because it is ${order.status}.`, 'ORDER_NOT_ACTIVE');
    }

    const newOrderItems: OrderItem[] = [];
    let addedSubtotal = 0;

    for (const itemReq of params.items) {
      const menuItem = state.menuItems.find(m => m.id === itemReq.menuItemId || m.name.toLowerCase() === itemReq.menuItemId.toLowerCase());
      if (!menuItem) {
        throw new BusinessRuleError(`Item "${itemReq.menuItemId}" was not found.`, 'MENU_ITEM_NOT_FOUND');
      }

      if (menuItem.availability === 'OutOfStock') {
        throw new BusinessRuleError(`Cannot add "${menuItem.name}". It is currently Out of Stock!`, 'ITEM_OUT_OF_STOCK');
      }

      addedSubtotal += menuItem.price * itemReq.quantity;
      newOrderItems.push({
        lineId: `line_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        menuItemId: menuItem.id,
        itemName: menuItem.name,
        quantity: itemReq.quantity,
        unitPrice: menuItem.price,
        station: menuItem.station,
        status: 'Pending',
        orderedAt: new Date().toISOString()
      });
    }

    const updatedOrder: Order = {
      ...order,
      items: [...order.items, ...newOrderItems],
      subtotal: order.subtotal + addedSubtotal,
      updatedAt: new Date().toISOString()
    };

    setStoreState(prev => ({
      orders: prev.orders.map(o => o.id === params.orderId ? updatedOrder : o)
    }));

    return {
      order: updatedOrder,
      message: `Added ${newOrderItems.length} item(s) to Table ${order.tableNo} order.`
    };
  },

  /**
   * Advance item preparation status (Pending -> Preparing -> Ready -> Served)
   */
  updateItemStatus: (orderId: string, lineId: string, newStatus: ItemStatus): { order: Order; message: string } => {
    const state = getStoreState();
    const order = state.orders.find(o => o.id === orderId);

    if (!order) {
      throw new BusinessRuleError(`Order #${orderId} not found.`, 'ORDER_NOT_FOUND');
    }

    const item = order.items.find(i => i.lineId === lineId);
    if (!item) {
      throw new BusinessRuleError(`Item line #${lineId} not found in order.`, 'ITEM_NOT_FOUND');
    }

    const now = new Date().toISOString();
    const updatedItems = order.items.map(i => {
      if (i.lineId === lineId) {
        return {
          ...i,
          status: newStatus,
          readyAt: newStatus === 'Ready' ? now : i.readyAt,
          servedAt: newStatus === 'Served' ? now : i.servedAt
        };
      }
      return i;
    });

    const updatedOrder: Order = {
      ...order,
      items: updatedItems,
      updatedAt: now
    };

    setStoreState(prev => ({
      orders: prev.orders.map(o => o.id === orderId ? updatedOrder : o)
    }));

    return {
      order: updatedOrder,
      message: `Marked "${item.itemName}" as ${newStatus} for Table ${order.tableNo}.`
    };
  },

  /**
   * Rule BR-01: Cancel or remove an order item
   * If Pending -> can be removed or cancelled.
   * If Preparing or Ready -> MUST provide explicit cancellation reason!
   */
  cancelItem: (params: CancelItemParams): { order: Order; message: string } => {
    const state = getStoreState();
    const order = state.orders.find(o => o.id === params.orderId);

    if (!order) {
      throw new BusinessRuleError(`Order #${params.orderId} not found.`, 'ORDER_NOT_FOUND');
    }

    const item = order.items.find(i => i.lineId === params.lineId);
    if (!item) {
      throw new BusinessRuleError(`Item line #${params.lineId} not found.`, 'ITEM_NOT_FOUND');
    }

    // BR-01: Item can only be edited/removed without reason if Pending.
    // If Preparing or Ready, explicit reason is mandatory.
    if (item.status === 'Preparing' || item.status === 'Ready') {
      if (!params.reason || params.reason.trim().length === 0) {
        throw new BusinessRuleError(
          `Cannot cancel "${item.itemName}" because it is already ${item.status}! A mandatory cancellation reason is required (e.g. guest left, preparation issue).`,
          'CANCELLATION_REASON_REQUIRED'
        );
      }
    } else if (item.status === 'Served') {
      throw new BusinessRuleError(
        `Cannot cancel "${item.itemName}" because it has already been served to Table ${order.tableNo}.`,
        'ITEM_ALREADY_SERVED'
      );
    }

    const updatedItems = order.items.map(i => {
      if (i.lineId === params.lineId) {
        return {
          ...i,
          status: 'Cancelled' as ItemStatus,
          cancellationReason: params.reason || 'Cancelled while pending'
        };
      }
      return i;
    });

    // Recalculate subtotal excluding cancelled items
    const activeSubtotal = updatedItems
      .filter(i => i.status !== 'Cancelled')
      .reduce((sum, i) => sum + (i.unitPrice * i.quantity), 0);

    const updatedOrder: Order = {
      ...order,
      items: updatedItems,
      subtotal: activeSubtotal,
      updatedAt: new Date().toISOString()
    };

    setStoreState(prev => ({
      orders: prev.orders.map(o => o.id === params.orderId ? updatedOrder : o)
    }));

    return {
      order: updatedOrder,
      message: `Item "${item.itemName}" cancelled on Table ${order.tableNo}. Reason: ${params.reason || 'Pending deletion'}`
    };
  },

  /**
   * Cancel entire order with reason
   */
  cancelOrder: (orderId: string, reason: string): { message: string } => {
    const state = getStoreState();
    const order = state.orders.find(o => o.id === orderId);

    if (!order) {
      throw new BusinessRuleError(`Order #${orderId} not found.`, 'ORDER_NOT_FOUND');
    }

    if (!reason || reason.trim().length === 0) {
      throw new BusinessRuleError('A cancellation reason is required to cancel an active order.', 'REASON_REQUIRED');
    }

    const updatedOrder: Order = {
      ...order,
      status: 'Cancelled',
      cancellationReason: reason,
      items: order.items.map(i => ({
        ...i,
        status: i.status === 'Served' ? 'Served' : 'Cancelled',
        cancellationReason: reason
      })),
      updatedAt: new Date().toISOString()
    };

    setStoreState(prev => ({
      orders: prev.orders.map(o => o.id === orderId ? updatedOrder : o),
      tables: prev.tables.map(t =>
        t.tableNo === order.tableNo
          ? { ...t, status: 'Free' as TableStatus, currentOrderId: null, lastStatusChange: new Date().toISOString() }
          : t
      )
    }));

    return { message: `Order #${orderId} for Table ${order.tableNo} has been cancelled.` };
  },

  /**
   * Rule BR-02: Toggle menu item inventory availability (InStock / OutOfStock)
   */
  toggleItemStock: (itemId: string, availability?: ItemAvailability): { item: MenuItem; message: string } => {
    const state = getStoreState();
    const item = state.menuItems.find(m => m.id === itemId || m.name.toLowerCase() === itemId.toLowerCase());

    if (!item) {
      throw new BusinessRuleError(`Menu item "${itemId}" not found.`, 'MENU_ITEM_NOT_FOUND');
    }

    const nextAvailability = availability || (item.availability === 'InStock' ? 'OutOfStock' : 'InStock');

    const updatedItem: MenuItem = {
      ...item,
      availability: nextAvailability
    };

    setStoreState(prev => ({
      menuItems: prev.menuItems.map(m => m.id === item.id ? updatedItem : m)
    }));

    return {
      item: updatedItem,
      message: `Menu item "${item.name}" is now marked as ${nextAvailability}.`
    };
  },

  /**
   * Update table status manually
   */
  updateTableStatus: (tableNo: number, status: TableStatus): { message: string } => {
    const state = getStoreState();
    const table = state.tables.find(t => t.tableNo === tableNo);

    if (!table) {
      throw new BusinessRuleError(`Table ${tableNo} does not exist.`, 'TABLE_NOT_FOUND');
    }

    setStoreState(prev => ({
      tables: prev.tables.map(t =>
        t.tableNo === tableNo
          ? {
              ...t,
              status,
              currentOrderId: status === 'Free' ? null : t.currentOrderId,
              lastStatusChange: new Date().toISOString()
            }
          : t
      )
    }));

    return { message: `Table ${tableNo} status changed to ${status}.` };
  },

  /**
   * Rule BR-04: Generate Bill with Split by Person and Split by Item support
   */
  generateBill: (params: GenerateBillParams): { bill: Bill; message: string } => {
    const state = getStoreState();
    const table = state.tables.find(t => t.tableNo === params.tableNo);

    if (!table) {
      throw new BusinessRuleError(`Table ${params.tableNo} not found.`, 'TABLE_NOT_FOUND');
    }

    const activeOrder = state.orders.find(o => o.tableNo === params.tableNo && o.status !== 'Cancelled' && o.status !== 'Completed');
    if (!activeOrder) {
      throw new BusinessRuleError(`No active order found for Table ${params.tableNo}.`, 'NO_ACTIVE_ORDER');
    }

    const activeItems = activeOrder.items.filter(i => i.status !== 'Cancelled');
    const subtotal = activeItems.reduce((sum, i) => sum + (i.unitPrice * i.quantity), 0);
    const taxPercent = 5;
    const taxAmount = Number(((subtotal * taxPercent) / 100).toFixed(2));
    const discountAmount = params.discountAmount || 0;
    const total = Number((subtotal + taxAmount - discountAmount).toFixed(2));

    const splitType = params.splitType || 'Whole';
    let subBills: SubBill[] = [];

    if (splitType === 'Whole') {
      subBills = [
        {
          subBillId: `sb_${Date.now()}_1`,
          payerLabel: 'Full Bill',
          items: activeItems.map(i => ({
            lineId: i.lineId,
            itemName: i.itemName,
            quantity: i.quantity,
            unitPrice: i.unitPrice,
            total: i.unitPrice * i.quantity
          })),
          amount: total,
          paymentMode: 'Pending',
          isPaid: false
        }
      ];
    } else if (splitType === 'ByPerson') {
      const count = Math.max(2, params.splitCount || 2);
      const baseShare = Math.floor((total / count) * 100) / 100;
      const remainder = Number((total - (baseShare * count)).toFixed(2));

      subBills = Array.from({ length: count }).map((_, idx) => {
        // distribute remainder cents to first guest so sum matches total exactly
        const shareAmount = idx === 0 ? Number((baseShare + remainder).toFixed(2)) : baseShare;
        return {
          subBillId: `sb_${Date.now()}_${idx + 1}`,
          payerLabel: `Guest ${idx + 1}`,
          items: [],
          amount: shareAmount,
          paymentMode: 'Pending',
          isPaid: false
        };
      });
    } else if (splitType === 'ByItem') {
      if (params.customSubBills && params.customSubBills.length > 0) {
        subBills = params.customSubBills;
      } else {
        // Default split by item: 2 guests dividing items in half
        const half = Math.ceil(activeItems.length / 2);
        const group1 = activeItems.slice(0, half);
        const group2 = activeItems.slice(half);

        const calcGroupTotal = (grp: typeof activeItems) => {
          const sub = grp.reduce((s, it) => s + (it.unitPrice * it.quantity), 0);
          return Number((sub * 1.05).toFixed(2));
        };

        const g1Amt = calcGroupTotal(group1);
        const g2Amt = Number((total - g1Amt).toFixed(2));

        subBills = [
          {
            subBillId: `sb_${Date.now()}_1`,
            payerLabel: 'Guest 1 (Items)',
            items: group1.map(i => ({ lineId: i.lineId, itemName: i.itemName, quantity: i.quantity, unitPrice: i.unitPrice, total: i.unitPrice * i.quantity })),
            amount: g1Amt,
            paymentMode: 'Pending',
            isPaid: false
          },
          {
            subBillId: `sb_${Date.now()}_2`,
            payerLabel: 'Guest 2 (Items)',
            items: group2.map(i => ({ lineId: i.lineId, itemName: i.itemName, quantity: i.quantity, unitPrice: i.unitPrice, total: i.unitPrice * i.quantity })),
            amount: g2Amt,
            paymentMode: 'Pending',
            isPaid: false
          }
        ];
      }
    }

    const billId = `bill_${Date.now().toString().slice(-4)}_${params.tableNo}`;
    const newBill: Bill = {
      id: billId,
      orderId: activeOrder.id,
      tableNo: params.tableNo,
      subtotal,
      taxPercent,
      taxAmount,
      discountAmount,
      discountReason: params.discountReason,
      total,
      splitType,
      subBills,
      paymentMode: 'Pending',
      status: 'Pending',
      closedByStaffId: state.currentUser.uid,
      createdAt: new Date().toISOString()
    };

    // Lock table into Billing status (BR-03)
    setStoreState(prev => ({
      bills: [newBill, ...prev.bills],
      orders: prev.orders.map(o => o.id === activeOrder.id ? { ...o, status: 'Billing' } : o),
      tables: prev.tables.map(t =>
        t.tableNo === params.tableNo
          ? { ...t, status: 'Billing' as TableStatus, lastStatusChange: new Date().toISOString() }
          : t
      )
    }));

    return {
      bill: newBill,
      message: `Bill generated for Table ${params.tableNo}. Total: ₹${total} (${splitType} split). Table status updated to Billing.`
    };
  },

  /**
   * Settle Bill, accept payment, and free the table
   */
  settleBill: (billId: string, paymentMode: PaymentMode = 'UPI'): { message: string } => {
    const state = getStoreState();
    const bill = state.bills.find(b => b.id === billId);

    if (!bill) {
      throw new BusinessRuleError(`Bill #${billId} not found.`, 'BILL_NOT_FOUND');
    }

    const now = new Date().toISOString();
    const updatedBill: Bill = {
      ...bill,
      paymentMode,
      status: 'Paid',
      paidAt: now,
      subBills: bill.subBills.map(sb => ({ ...sb, isPaid: true, paymentMode, paidAt: now }))
    };

    // Free the table and complete the order
    setStoreState(prev => ({
      bills: prev.bills.map(b => b.id === billId ? updatedBill : b),
      orders: prev.orders.map(o => o.id === bill.orderId ? { ...o, status: 'Completed', updatedAt: now } : o),
      tables: prev.tables.map(t =>
        t.tableNo === bill.tableNo
          ? { ...t, status: 'Free' as TableStatus, currentOrderId: null, lastStatusChange: now }
          : t
      )
    }));

    return {
      message: `Payment of ₹${bill.total} received via ${paymentMode}. Table ${bill.tableNo} is now Free for new guests.`
    };
  },

  /**
   * Complaints management
   */
  logComplaint: (params: { tableNo?: number | null; customerName: string; text: string; category: CustomerComplaint['category'] }): { complaint: CustomerComplaint; message: string } => {
    const complaint: CustomerComplaint = {
      id: `comp_${Date.now()}`,
      tableNo: params.tableNo || null,
      customerName: params.customerName,
      text: params.text,
      category: params.category,
      status: 'Open',
      createdAt: new Date().toISOString()
    };

    setStoreState(prev => ({
      complaints: [complaint, ...prev.complaints]
    }));

    return {
      complaint,
      message: `Complaint recorded for ${params.customerName}${params.tableNo ? ` (Table ${params.tableNo})` : ''}: "${params.text}"`
    };
  },

  resolveComplaint: (complaintId: string, resolutionNotes: string): { message: string } => {
    const state = getStoreState();
    const comp = state.complaints.find(c => c.id === complaintId);

    if (!comp) {
      throw new BusinessRuleError(`Complaint #${complaintId} not found.`, 'COMPLAINT_NOT_FOUND');
    }

    setStoreState(prev => ({
      complaints: prev.complaints.map(c =>
        c.id === complaintId
          ? {
              ...c,
              status: 'Resolved',
              resolutionNotes,
              resolvedByStaffId: state.currentUser.uid
            }
          : c
      )
    }));

    return { message: `Complaint #${complaintId} marked resolved.` };
  },

  // Query helpers for voice and UI
  getPendingOrdersCount: (): number => {
    const state = getStoreState();
    let pendingCount = 0;
    state.orders.forEach(order => {
      if (order.status === 'Active') {
        order.items.forEach(item => {
          if (item.status === 'Pending') pendingCount += item.quantity;
        });
      }
    });
    return pendingCount;
  },

  getTodaySalesSummary: () => {
    const state = getStoreState();
    const paidBills = state.bills.filter(b => b.status === 'Paid');
    const totalRevenue = paidBills.reduce((acc, b) => acc + b.total, 0);
    const orderCount = paidBills.length;
    const averageBill = orderCount > 0 ? Math.round(totalRevenue / orderCount) : 0;

    return {
      totalRevenue,
      paidOrdersCount: orderCount,
      averageBill
    };
  },


  getTopSoldDishes: () => {
    const state = getStoreState();
    const itemMap = new Map<string, { name: string; count: number; revenue: number }>();

    state.orders.forEach(o => {
      o.items.forEach(i => {
        if (i.status === 'Served' || i.status === 'Ready' || i.status === 'Preparing') {
          const prev = itemMap.get(i.menuItemId) || { name: i.itemName, count: 0, revenue: 0 };
          itemMap.set(i.menuItemId, {
            name: i.itemName,
            count: prev.count + i.quantity,
            revenue: prev.revenue + (i.unitPrice * i.quantity)
          });
        }
      });
    });

    return Array.from(itemMap.values()).sort((a, b) => b.count - a.count);
  },

  /**
   * Transfer an active order from one table to another free table
   */
  transferTable: (fromTableNo: number, toTableNo: number): { message: string } => {
    const state = getStoreState();
    const fromTable = state.tables.find(t => t.tableNo === fromTableNo);
    const toTable = state.tables.find(t => t.tableNo === toTableNo);

    if (!fromTable) throw new BusinessRuleError(`Table ${fromTableNo} not found.`, 'TABLE_NOT_FOUND');
    if (!toTable) throw new BusinessRuleError(`Table ${toTableNo} not found.`, 'TABLE_NOT_FOUND');

    if (fromTable.status === 'Free') {
      throw new BusinessRuleError(`Table ${fromTableNo} is already Free — nothing to transfer.`, 'TABLE_TRANSFER_INVALID');
    }
    if (fromTable.status === 'Billing') {
      throw new BusinessRuleError(`Table ${fromTableNo} is in Billing status. Settle the bill before transferring.`, 'TABLE_BILLING_LOCKED');
    }
    if (toTable.status !== 'Free') {
      throw new BusinessRuleError(`Table ${toTableNo} is ${toTable.status}. Can only transfer to a Free table.`, 'TARGET_TABLE_NOT_FREE');
    }

    const activeOrder = state.orders.find(
      o => o.tableNo === fromTableNo && (o.status === 'Active')
    );

    setStoreState(prev => ({
      orders: prev.orders.map(o =>
        o.tableNo === fromTableNo && o.status === 'Active'
          ? { ...o, tableNo: toTableNo, updatedAt: new Date().toISOString() }
          : o
      ),
      tables: prev.tables.map(t => {
        if (t.tableNo === fromTableNo) {
          return { ...t, status: 'Free' as TableStatus, currentOrderId: null, lastStatusChange: new Date().toISOString(), transferredFrom: null };
        }
        if (t.tableNo === toTableNo) {
          return {
            ...t,
            status: fromTable.status as TableStatus,
            currentOrderId: activeOrder?.id || null,
            lastStatusChange: new Date().toISOString(),
            transferredFrom: fromTableNo
          };
        }
        return t;
      })
    }));

    return { message: `Table ${fromTableNo} order successfully transferred to Table ${toTableNo}.` };
  },

  /**
   * Merge a satellite table's order into a host table's order
   */
  mergeTables: (hostTableNo: number, satelliteTableNo: number): { message: string } => {
    const state = getStoreState();
    const hostTable = state.tables.find(t => t.tableNo === hostTableNo);
    const satelliteTable = state.tables.find(t => t.tableNo === satelliteTableNo);

    if (!hostTable) throw new BusinessRuleError(`Host Table ${hostTableNo} not found.`, 'TABLE_NOT_FOUND');
    if (!satelliteTable) throw new BusinessRuleError(`Satellite Table ${satelliteTableNo} not found.`, 'TABLE_NOT_FOUND');

    if (hostTable.status !== 'Occupied') {
      throw new BusinessRuleError(`Host Table ${hostTableNo} must be Occupied to merge into it.`, 'TABLE_MERGE_INVALID');
    }
    if (satelliteTable.status !== 'Occupied') {
      throw new BusinessRuleError(`Satellite Table ${satelliteTableNo} must be Occupied to merge.`, 'TABLE_MERGE_INVALID');
    }
    if (hostTable.status === 'Billing' || satelliteTable.status === 'Billing') {
      throw new BusinessRuleError('Cannot merge tables that are in Billing status.', 'TABLE_BILLING_LOCKED');
    }

    const hostOrder = state.orders.find(o => o.tableNo === hostTableNo && o.status === 'Active');
    const satelliteOrder = state.orders.find(o => o.tableNo === satelliteTableNo && o.status === 'Active');

    if (!hostOrder) throw new BusinessRuleError(`No active order on Host Table ${hostTableNo}.`, 'NO_ACTIVE_ORDER');
    if (!satelliteOrder) throw new BusinessRuleError(`No active order on Satellite Table ${satelliteTableNo}.`, 'NO_ACTIVE_ORDER');

    const mergedItems = [...hostOrder.items, ...satelliteOrder.items];
    const mergedSubtotal = mergedItems
      .filter(i => i.status !== 'Cancelled')
      .reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);

    setStoreState(prev => ({
      orders: prev.orders.map(o => {
        if (o.id === hostOrder.id) {
          return { ...o, items: mergedItems, subtotal: mergedSubtotal, updatedAt: new Date().toISOString() };
        }
        if (o.id === satelliteOrder.id) {
          return { ...o, status: 'Cancelled', cancellationReason: `Merged into Table ${hostTableNo}`, updatedAt: new Date().toISOString() };
        }
        return o;
      }),
      tables: prev.tables.map(t => {
        if (t.tableNo === hostTableNo) {
          return {
            ...t,
            mergedWith: [...(t.mergedWith || []), satelliteTableNo],
            lastStatusChange: new Date().toISOString()
          };
        }
        if (t.tableNo === satelliteTableNo) {
          return { ...t, status: 'Free' as TableStatus, currentOrderId: null, lastStatusChange: new Date().toISOString() };
        }
        return t;
      })
    }));

    return { message: `Table ${satelliteTableNo} merged into Table ${hostTableNo}. All items consolidated on host order.` };
  }
};

