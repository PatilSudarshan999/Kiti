import type { MenuItem, RestaurantTable, StaffMember, Order, CustomerComplaint, Reservation, WaitlistEntry, Bill } from '../types';

export const INITIAL_STAFF: StaffMember[] = [
  { uid: 'staff_waiter_1', name: 'Rahul Sharma', email: 'waiter@kiti.com', role: 'Waiter', active: true, pin: '1111' },
  { uid: 'staff_waiter_2', name: 'Anita Desai', email: 'waiter2@kiti.com', role: 'Waiter', active: true, pin: '1234' },
  { uid: 'staff_kitchen_1', name: 'Chef Sanjeev', email: 'chef@kiti.com', role: 'Kitchen Chief', active: true, pin: '2222' },
  { uid: 'staff_manager_1', name: 'Priya Verma', email: 'manager@kiti.com', role: 'Manager', active: true, pin: '3333' },
  { uid: 'staff_owner_1', name: 'Vikram Singhania', email: 'owner@kiti.com', role: 'Owner', active: true, pin: '4444' }
];


export const INITIAL_MENU_ITEMS: MenuItem[] = [
  // Starters
  {
    id: 'paneer_tikka',
    name: 'Paneer Tikka',
    price: 320,
    category: 'Appetizers',
    station: 'Starters',
    availability: 'InStock',
    description: 'Char-grilled cottage cheese cubes marinated in spiced yogurt and kasuri methi.',
    isVegetarian: true,
    prepTimeMinutes: 12
  },
  {
    id: 'chicken_tikka',
    name: 'Murgh Malai Tikka',
    price: 390,
    category: 'Appetizers',
    station: 'Starters',
    availability: 'InStock',
    description: 'Tender chicken morsels marinated in cardamom, cheese cream, and grilled to perfection.',
    isVegetarian: false,
    prepTimeMinutes: 15
  },
  {
    id: 'crispy_corn',
    name: 'Crispy Pepper Corn',
    price: 260,
    category: 'Appetizers',
    station: 'Starters',
    availability: 'InStock',
    description: 'Golden fried sweet corn kernels tossed with freshly ground pepper and scallions.',
    isVegetarian: true,
    prepTimeMinutes: 8
  },
  {
    id: 'fish_amritsari',
    name: 'Amritsari Fish Fingers',
    price: 420,
    category: 'Appetizers',
    station: 'Starters',
    availability: 'InStock',
    description: 'Carom seed and gram flour batter fried crisp river sole.',
    isVegetarian: false,
    prepTimeMinutes: 14
  },

  // Mains
  {
    id: 'butter_chicken',
    name: 'Classic Butter Chicken',
    price: 460,
    category: 'Entrees',
    station: 'Mains',
    availability: 'InStock',
    description: 'Smoked pulled chicken simmered in rich satin makhani gravy with butter.',
    isVegetarian: false,
    prepTimeMinutes: 16
  },
  {
    id: 'dal_makhani',
    name: 'Dal Makhani',
    price: 340,
    category: 'Entrees',
    station: 'Mains',
    availability: 'InStock',
    description: 'Black lentils slow cooked overnight on clay oven with cream and butter.',
    isVegetarian: true,
    prepTimeMinutes: 10
  },
  {
    id: 'paneer_butter_masala',
    name: 'Paneer Butter Masala',
    price: 370,
    category: 'Entrees',
    station: 'Mains',
    availability: 'InStock',
    description: 'Soft cottage cheese cubes enveloped in velvet tomato and cashew gravy.',
    isVegetarian: true,
    prepTimeMinutes: 14
  },
  {
    id: 'dum_biryani',
    name: 'Hyderabadi Dum Biryani',
    price: 440,
    category: 'Entrees',
    station: 'Mains',
    availability: 'InStock',
    description: 'Fragrant basmati rice sealed with spiced saffron cuts, fried onions, and mint.',
    isVegetarian: false,
    prepTimeMinutes: 18
  },
  {
    id: 'garlic_naan',
    name: 'Garlic Butter Naan',
    price: 80,
    category: 'Entrees',
    station: 'Mains',
    availability: 'InStock',
    description: 'Leavened tandoori bread glazed with minced roasted garlic and butter.',
    isVegetarian: true,
    prepTimeMinutes: 5
  },

  // Drinks
  {
    id: 'coke',
    name: 'Coca Cola (Chilled)',
    price: 70,
    category: 'Beverages',
    station: 'Drinks',
    availability: 'InStock',
    description: 'Classic chilled beverage served with fresh lemon slice.',
    isVegetarian: true,
    prepTimeMinutes: 2
  },
  {
    id: 'mango_lassi',
    name: 'Alphonso Mango Lassi',
    price: 180,
    category: 'Beverages',
    station: 'Drinks',
    availability: 'InStock',
    description: 'Creamy yogurt churned with real Alphonso mango pulp and crushed pistachios.',
    isVegetarian: true,
    prepTimeMinutes: 4
  },
  {
    id: 'fresh_lime_soda',
    name: 'Fresh Lime Soda',
    price: 110,
    category: 'Beverages',
    station: 'Drinks',
    availability: 'InStock',
    description: 'Fresh squeezed key limes with sparkling club soda (Sweet & Salted).',
    isVegetarian: true,
    prepTimeMinutes: 3
  },
  {
    id: 'masala_chai',
    name: 'Ginger Masala Chai',
    price: 90,
    category: 'Beverages',
    station: 'Drinks',
    availability: 'InStock',
    description: 'Aromatic tea brewed with fresh crushed ginger and green cardamom.',
    isVegetarian: true,
    prepTimeMinutes: 6
  },

  // Desserts
  {
    id: 'gulab_jamun',
    name: 'Warm Gulab Jamun (2 pcs)',
    price: 150,
    category: 'Desserts',
    station: 'Dessert',
    availability: 'InStock',
    description: 'Golden khoya dumplings steeped in rose water cardamom sugar syrup.',
    isVegetarian: true,
    prepTimeMinutes: 4
  },
  {
    id: 'sizzling_brownie',
    name: 'Sizzling Chocolate Brownie',
    price: 240,
    category: 'Desserts',
    station: 'Dessert',
    availability: 'InStock',
    description: 'Fudgy walnut brownie on a hot sizzler plate with vanilla bean ice cream & hot fudge.',
    isVegetarian: true,
    prepTimeMinutes: 7
  }
];

export const INITIAL_TABLES: RestaurantTable[] = [
  { id: 'table_1', tableNo: 1, capacity: 2, status: 'Occupied', currentOrderId: 'order_101', activeReservationId: null, position: { x: -6, y: 0, z: -4, shape: 'square' }, lastStatusChange: new Date(Date.now() - 35 * 60000).toISOString() },
  { id: 'table_2', tableNo: 2, capacity: 4, status: 'Occupied', currentOrderId: 'order_102', activeReservationId: null, position: { x: -2, y: 0, z: -4, shape: 'round' }, lastStatusChange: new Date(Date.now() - 20 * 60000).toISOString() },
  { id: 'table_3', tableNo: 3, capacity: 4, status: 'Billing', currentOrderId: 'order_103', activeReservationId: null, position: { x: 2, y: 0, z: -4, shape: 'round' }, lastStatusChange: new Date(Date.now() - 10 * 60000).toISOString() },
  { id: 'table_4', tableNo: 4, capacity: 6, status: 'Free', currentOrderId: null, activeReservationId: null, position: { x: 6, y: 0, z: -4, shape: 'rect' }, lastStatusChange: new Date(Date.now() - 90 * 60000).toISOString() },
  { id: 'table_5', tableNo: 5, capacity: 4, status: 'Occupied', currentOrderId: 'order_104', activeReservationId: null, position: { x: -6, y: 0, z: 2, shape: 'round' }, lastStatusChange: new Date(Date.now() - 15 * 60000).toISOString() },
  { id: 'table_6', tableNo: 6, capacity: 2, status: 'Reserved', currentOrderId: null, activeReservationId: 'res_201', position: { x: -2, y: 0, z: 2, shape: 'square' }, lastStatusChange: new Date(Date.now() - 40 * 60000).toISOString() },
  { id: 'table_7', tableNo: 7, capacity: 8, status: 'Free', currentOrderId: null, activeReservationId: null, position: { x: 2, y: 0, z: 2, shape: 'rect' }, lastStatusChange: new Date(Date.now() - 120 * 60000).toISOString() },
  { id: 'table_8', tableNo: 8, capacity: 4, status: 'Free', currentOrderId: null, activeReservationId: null, position: { x: 6, y: 0, z: 2, shape: 'round' }, lastStatusChange: new Date(Date.now() - 50 * 60000).toISOString() },
];

export const INITIAL_ORDERS: Order[] = [
  {
    id: 'order_101',
    tableNo: 1,
    waiterId: 'staff_waiter_1',
    waiterName: 'Rahul Sharma',
    status: 'Active',
    items: [
      { lineId: 'item_101_1', menuItemId: 'paneer_tikka', itemName: 'Paneer Tikka', quantity: 1, unitPrice: 320, station: 'Starters', status: 'Served', orderedAt: new Date(Date.now() - 30 * 60000).toISOString(), readyAt: new Date(Date.now() - 18 * 60000).toISOString(), servedAt: new Date(Date.now() - 15 * 60000).toISOString() },
      { lineId: 'item_101_2', menuItemId: 'fresh_lime_soda', itemName: 'Fresh Lime Soda', quantity: 2, unitPrice: 110, station: 'Drinks', status: 'Served', orderedAt: new Date(Date.now() - 30 * 60000).toISOString(), readyAt: new Date(Date.now() - 25 * 60000).toISOString(), servedAt: new Date(Date.now() - 23 * 60000).toISOString() },
      { lineId: 'item_101_3', menuItemId: 'dal_makhani', itemName: 'Dal Makhani', quantity: 1, unitPrice: 340, station: 'Mains', status: 'Preparing', orderedAt: new Date(Date.now() - 15 * 60000).toISOString() },
      { lineId: 'item_101_4', menuItemId: 'garlic_naan', itemName: 'Garlic Butter Naan', quantity: 3, unitPrice: 80, station: 'Mains', status: 'Preparing', orderedAt: new Date(Date.now() - 15 * 60000).toISOString() }
    ],
    subtotal: 1120,
    createdAt: new Date(Date.now() - 35 * 60000).toISOString(),
    updatedAt: new Date(Date.now() - 15 * 60000).toISOString()
  },
  {
    id: 'order_102',
    tableNo: 2,
    waiterId: 'staff_waiter_1',
    waiterName: 'Rahul Sharma',
    status: 'Active',
    items: [
      { lineId: 'item_102_1', menuItemId: 'crispy_corn', itemName: 'Crispy Pepper Corn', quantity: 2, unitPrice: 260, station: 'Starters', status: 'Ready', orderedAt: new Date(Date.now() - 18 * 60000).toISOString(), readyAt: new Date(Date.now() - 3 * 60000).toISOString() },
      { lineId: 'item_102_2', menuItemId: 'dum_biryani', itemName: 'Hyderabadi Dum Biryani', quantity: 2, unitPrice: 440, station: 'Mains', status: 'Preparing', orderedAt: new Date(Date.now() - 18 * 60000).toISOString() },
      { lineId: 'item_102_3', menuItemId: 'coke', itemName: 'Coca Cola (Chilled)', quantity: 2, unitPrice: 70, station: 'Drinks', status: 'Pending', orderedAt: new Date(Date.now() - 5 * 60000).toISOString() }
    ],
    subtotal: 1540,
    createdAt: new Date(Date.now() - 20 * 60000).toISOString(),
    updatedAt: new Date(Date.now() - 5 * 60000).toISOString()
  },
  {
    id: 'order_103',
    tableNo: 3,
    waiterId: 'staff_waiter_1',
    waiterName: 'Rahul Sharma',
    status: 'Billing',
    items: [
      { lineId: 'item_103_1', menuItemId: 'butter_chicken', itemName: 'Classic Butter Chicken', quantity: 1, unitPrice: 460, station: 'Mains', status: 'Served', orderedAt: new Date(Date.now() - 45 * 60000).toISOString(), readyAt: new Date(Date.now() - 30 * 60000).toISOString(), servedAt: new Date(Date.now() - 25 * 60000).toISOString() },
      { lineId: 'item_103_2', menuItemId: 'garlic_naan', itemName: 'Garlic Butter Naan', quantity: 2, unitPrice: 80, station: 'Mains', status: 'Served', orderedAt: new Date(Date.now() - 45 * 60000).toISOString(), readyAt: new Date(Date.now() - 30 * 60000).toISOString(), servedAt: new Date(Date.now() - 25 * 60000).toISOString() },
      { lineId: 'item_103_3', menuItemId: 'gulab_jamun', itemName: 'Warm Gulab Jamun (2 pcs)', quantity: 2, unitPrice: 150, station: 'Dessert', status: 'Served', orderedAt: new Date(Date.now() - 20 * 60000).toISOString(), readyAt: new Date(Date.now() - 12 * 60000).toISOString(), servedAt: new Date(Date.now() - 10 * 60000).toISOString() }
    ],
    subtotal: 920,
    createdAt: new Date(Date.now() - 50 * 60000).toISOString(),
    updatedAt: new Date(Date.now() - 10 * 60000).toISOString()
  },
  {
    id: 'order_104',
    tableNo: 5,
    waiterId: 'staff_waiter_1',
    waiterName: 'Rahul Sharma',
    status: 'Active',
    items: [
      { lineId: 'item_104_1', menuItemId: 'paneer_tikka', itemName: 'Paneer Tikka', quantity: 2, unitPrice: 320, station: 'Starters', status: 'Pending', orderedAt: new Date(Date.now() - 6 * 60000).toISOString() },
      { lineId: 'item_104_2', menuItemId: 'coke', itemName: 'Coca Cola (Chilled)', quantity: 1, unitPrice: 70, station: 'Drinks', status: 'Pending', orderedAt: new Date(Date.now() - 6 * 60000).toISOString() }
    ],
    subtotal: 710,
    createdAt: new Date(Date.now() - 6 * 60000).toISOString(),
    updatedAt: new Date(Date.now() - 6 * 60000).toISOString()
  }
];

export const INITIAL_BILLS: Bill[] = [
  {
    id: 'bill_past_99',
    orderId: 'order_past_99',
    tableNo: 4,
    subtotal: 1850,
    taxPercent: 5,
    taxAmount: 92.5,
    discountAmount: 100,
    discountReason: 'Happy Hour Special',
    total: 1842.5,
    splitType: 'Whole',
    subBills: [
      { subBillId: 'sb_1', payerLabel: 'Full Table', items: [], amount: 1842.5, paymentMode: 'UPI', isPaid: true, paidAt: new Date(Date.now() - 110 * 60000).toISOString() }
    ],
    paymentMode: 'UPI',
    status: 'Paid',
    closedByStaffId: 'staff_waiter_1',
    createdAt: new Date(Date.now() - 120 * 60000).toISOString(),
    paidAt: new Date(Date.now() - 110 * 60000).toISOString()
  }
];

export const INITIAL_RESERVATIONS: Reservation[] = [
  {
    id: 'res_201',
    tableNo: 6,
    customerName: 'Ananya Deshmukh',
    phone: '+91 98200 45678',
    partySize: 2,
    reservedTime: new Date(Date.now() + 25 * 60000).toISOString(),
    status: 'Upcoming',
    createdAt: new Date(Date.now() - 180 * 60000).toISOString()
  },
  {
    id: 'res_202',
    tableNo: 7,
    customerName: 'Kunal Kapoor',
    phone: '+91 99341 87654',
    partySize: 6,
    reservedTime: new Date(Date.now() + 75 * 60000).toISOString(),
    status: 'Upcoming',
    createdAt: new Date(Date.now() - 240 * 60000).toISOString()
  }
];

export const INITIAL_WAITLIST: WaitlistEntry[] = [
  {
    id: 'wait_301',
    customerName: 'Rajesh Mehra',
    phone: '+91 97110 33445',
    partySize: 4,
    timeAdded: new Date(Date.now() - 15 * 60000).toISOString(),
    status: 'Waiting'
  },
  {
    id: 'wait_302',
    customerName: 'Tanvi Joshi',
    phone: '+91 98212 99881',
    partySize: 2,
    timeAdded: new Date(Date.now() - 8 * 60000).toISOString(),
    status: 'Waiting'
  }
];

export const INITIAL_COMPLAINTS: CustomerComplaint[] = [
  {
    id: 'comp_401',
    tableNo: 2,
    customerName: 'Deepak Patel',
    text: 'Slight delay in appetizers serving. Starters arrived after 20 minutes.',
    category: 'Service Delay',
    status: 'Open',
    createdAt: new Date(Date.now() - 12 * 60000).toISOString()
  },
  {
    id: 'comp_402',
    tableNo: 1,
    customerName: 'Sneha Roy',
    text: 'Air conditioning near Table 1 was slightly too cold.',
    category: 'Ambience',
    status: 'Resolved',
    resolutionNotes: 'Temperature adjusted by floor manager.',
    resolvedByStaffId: 'staff_manager_1',
    createdAt: new Date(Date.now() - 40 * 60000).toISOString()
  }
];
