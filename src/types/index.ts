// Core Data Types for Kiti Restaurant Operations Manager


export type UserRole = 'Waiter' | 'Kitchen Chief' | 'Manager' | 'Owner';

export type TableStatus = 'Free' | 'Occupied' | 'Reserved' | 'Billing';

export type StationCategory = 'Starters' | 'Mains' | 'Drinks' | 'Dessert';

export type ItemStatus = 'Pending' | 'Preparing' | 'Ready' | 'Served' | 'Cancelled';

export type OrderStatus = 'Active' | 'Billing' | 'Completed' | 'Cancelled';

export type ItemAvailability = 'InStock' | 'OutOfStock';

export type SplitType = 'Whole' | 'ByPerson' | 'ByItem';

export type PaymentMode = 'Cash' | 'Card' | 'UPI' | 'Pending';

export interface RestaurantTable {
  id: string; // e.g. "table_1"
  tableNo: number;
  capacity: number;
  status: TableStatus;
  currentOrderId: string | null;
  activeReservationId: string | null;
  position: {
    x: number;
    y: number;
    z: number;
    shape: 'round' | 'square' | 'rect';
  };
  lastStatusChange: string; // ISO string
  mergedWith?: number[] | null; // table numbers merged into this one
  transferredFrom?: number | null; // original table before transfer
}

export interface MenuItem {
  id: string;
  name: string;
  price: number;
  category: 'Appetizers' | 'Entrees' | 'Beverages' | 'Desserts';
  station: StationCategory;
  availability: ItemAvailability;
  description: string;
  isVegetarian: boolean;
  prepTimeMinutes: number;
  imageUrl?: string;
}

export interface OrderItem {
  lineId: string;
  menuItemId: string;
  itemName: string;
  quantity: number;
  unitPrice: number;
  station: StationCategory;
  status: ItemStatus;
  cancellationReason?: string | null;
  orderedAt: string; // ISO string
  readyAt?: string | null;
  servedAt?: string | null;
}

export interface Order {
  id: string;
  tableNo: number;
  waiterId: string;
  waiterName: string;
  status: OrderStatus;
  items: OrderItem[];
  subtotal: number;
  specialInstructions?: string;
  cancellationReason?: string | null;
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
}

export interface SubBillItem {
  lineId: string;
  itemName: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface SubBill {
  subBillId: string;
  payerLabel: string; // e.g., "Guest 1", "Guest 2"
  items: SubBillItem[];
  amount: number;
  paymentMode: PaymentMode;
  isPaid: boolean;
  paidAt?: string | null;
}

export interface Bill {
  id: string;
  orderId: string;
  tableNo: number;
  subtotal: number;
  taxPercent: number; // e.g. 5
  taxAmount: number;
  discountAmount: number;
  discountReason?: string;
  total: number;
  splitType: SplitType;
  subBills: SubBill[];
  paymentMode: PaymentMode;
  status: 'Pending' | 'Paid' | 'Refunded';
  closedByStaffId: string;
  createdAt: string; // ISO string
  paidAt?: string | null;
}

export interface Reservation {
  id: string;
  tableNo: number;
  customerName: string;
  phone: string;
  partySize: number;
  reservedTime: string; // ISO string
  status: 'Upcoming' | 'Seated' | 'No-show' | 'Cancelled';
  createdAt: string;
}

export interface WaitlistEntry {
  id: string;
  customerName: string;
  phone: string;
  partySize: number;
  timeAdded: string; // ISO string
  status: 'Waiting' | 'Seated' | 'Left';
  notifiedAt?: string | null;
}

export interface CustomerComplaint {
  id: string;
  tableNo: number | null;
  customerName: string;
  text: string;
  category: 'Food Quality' | 'Service Delay' | 'Ambience' | 'Billing' | 'Other';
  status: 'Open' | 'Investigating' | 'Resolved';
  resolutionNotes?: string | null;
  resolvedByStaffId?: string | null;
  createdAt: string; // ISO string
}

export interface StaffMember {
  uid: string;
  name: string;
  email: string;
  role: UserRole;
  active: boolean;
  pin?: string; // 4-digit PIN for quick terminal switching
}

export interface VoiceAssistantLog {
  id: string;
  timestamp: string;
  transcript: string;
  response: string;
  toolCalled?: string;
  toolArgs?: Record<string, unknown>;
  status: 'success' | 'error' | 'listening';
}

// Kitchen Order Ticket (KOT) — printed/digital slip per station per order
export interface KOTSlip {
  kotId: string;
  orderId: string;
  tableNo: number;
  waiterName: string;
  station: StationCategory;
  items: Array<{
    itemName: string;
    quantity: number;
    specialNote?: string;
  }>;
  issuedAt: string; // ISO string
  acknowledged: boolean;
}

// Manager Audit Log — immutable event ledger
export interface AuditLogEntry {
  id: string;
  timestamp: string;
  actorName: string;
  actorRole: UserRole;
  action: string;
  category: 'Order' | 'Table' | 'Billing' | 'Stock' | 'Staff' | 'Complaint' | 'System';
  metadata?: Record<string, unknown>;
}

