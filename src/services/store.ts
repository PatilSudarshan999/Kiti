import { useState, useEffect } from 'react';
import type { RestaurantTable, Order, MenuItem, Bill, Reservation, WaitlistEntry, CustomerComplaint, StaffMember, UserRole, VoiceAssistantLog } from '../types';
import {
  INITIAL_TABLES,
  INITIAL_MENU_ITEMS,
  INITIAL_ORDERS,
  INITIAL_BILLS,
  INITIAL_RESERVATIONS,
  INITIAL_WAITLIST,
  INITIAL_COMPLAINTS,
  INITIAL_STAFF
} from './seedData';
import { db, isFirebaseConfigured } from './firebase';
import { collection, onSnapshot } from 'firebase/firestore';

interface KitiState {
  currentRole: UserRole;
  currentUser: StaffMember;
  tables: RestaurantTable[];
  orders: Order[];
  menuItems: MenuItem[];
  bills: Bill[];
  reservations: Reservation[];
  waitlist: WaitlistEntry[];
  complaints: CustomerComplaint[];
  voiceLogs: VoiceAssistantLog[];
  isVoiceListening: boolean;
  selectedTableNo: number | null;
}

const STORAGE_KEY = 'kiti_state_v1';

// Initial state loading
const getInitialState = (): KitiState => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        ...parsed,
        isVoiceListening: false,
        selectedTableNo: null
      };
    }
  } catch (e) {
    console.error('Failed to parse saved Kiti state:', e);
  }

  return {
    currentRole: 'Waiter',
    currentUser: INITIAL_STAFF[0],
    tables: INITIAL_TABLES,
    orders: INITIAL_ORDERS,
    menuItems: INITIAL_MENU_ITEMS,
    bills: INITIAL_BILLS,
    reservations: INITIAL_RESERVATIONS,
    waitlist: INITIAL_WAITLIST,
    complaints: INITIAL_COMPLAINTS,
    voiceLogs: [],
    isVoiceListening: false,
    selectedTableNo: null
  };
};

let globalState: KitiState = getInitialState();
const listeners = new Set<() => void>();

// Cross-tab real-time sync channel
const syncChannel = typeof window !== 'undefined' && 'BroadcastChannel' in window
  ? new BroadcastChannel('kiti_realtime_sync')
  : null;

if (syncChannel) {
  syncChannel.onmessage = (event) => {
    if (event.data?.type === 'SYNC_STATE' && event.data?.payload) {
      globalState = {
        ...globalState,
        ...event.data.payload,
        // preserve current user's local role view if opened in different tab
        currentRole: globalState.currentRole,
        currentUser: globalState.currentUser
      };
      notifyListeners();
    }
  };
}

const notifyListeners = () => {
  // Save persistent state
  try {
    const toPersist = {
      tables: globalState.tables,
      orders: globalState.orders,
      menuItems: globalState.menuItems,
      bills: globalState.bills,
      reservations: globalState.reservations,
      waitlist: globalState.waitlist,
      complaints: globalState.complaints,
      currentRole: globalState.currentRole,
      currentUser: globalState.currentUser
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toPersist));
  } catch (err) {
    console.warn('Storage save error:', err);
  }

  listeners.forEach(fn => fn());
};

export const broadcastState = (broadcast = true) => {
  notifyListeners();
  if (broadcast && syncChannel) {
    syncChannel.postMessage({
      type: 'SYNC_STATE',
      payload: {
        tables: globalState.tables,
        orders: globalState.orders,
        menuItems: globalState.menuItems,
        bills: globalState.bills,
        reservations: globalState.reservations,
        waitlist: globalState.waitlist,
        complaints: globalState.complaints
      }
    });
  }
};

// Wire up live Firebase Firestore listeners if configured
if (isFirebaseConfigured() && db) {
  try {
    onSnapshot(collection(db, 'tables'), (snapshot) => {
      if (!snapshot.empty) {
        const remoteTables: RestaurantTable[] = [];
        snapshot.forEach((doc) => remoteTables.push(doc.data() as RestaurantTable));
        globalState.tables = remoteTables;
        notifyListeners();
      }
    });

    onSnapshot(collection(db, 'orders'), (snapshot) => {
      if (!snapshot.empty) {
        const remoteOrders: Order[] = [];
        snapshot.forEach((doc) => remoteOrders.push(doc.data() as Order));
        globalState.orders = remoteOrders;
        notifyListeners();
      }
    });

    onSnapshot(collection(db, 'menuItems'), (snapshot) => {
      if (!snapshot.empty) {
        const remoteMenu: MenuItem[] = [];
        snapshot.forEach((doc) => remoteMenu.push(doc.data() as MenuItem));
        globalState.menuItems = remoteMenu;
        notifyListeners();
      }
    });
  } catch (err) {
    console.warn('Firebase snapshot listener error:', err);
  }
}

export const getStoreState = (): KitiState => globalState;

export const setStoreState = (updater: (prev: KitiState) => Partial<KitiState>, broadcast = true) => {
  const patch = updater(globalState);
  globalState = { ...globalState, ...patch };
  broadcastState(broadcast);
};

export const resetStoreToDefaults = () => {
  globalState = {
    currentRole: 'Waiter',
    currentUser: INITIAL_STAFF[0],
    tables: INITIAL_TABLES,
    orders: INITIAL_ORDERS,
    menuItems: INITIAL_MENU_ITEMS,
    bills: INITIAL_BILLS,
    reservations: INITIAL_RESERVATIONS,
    waitlist: INITIAL_WAITLIST,
    complaints: INITIAL_COMPLAINTS,
    voiceLogs: [],
    isVoiceListening: false,
    selectedTableNo: null
  };
  localStorage.removeItem(STORAGE_KEY);
  broadcastState(true);
};

// React hook for consuming state in UI components
export const useKitiStore = () => {
  const [, setTick] = useState(0);

  useEffect(() => {
    const handleUpdate = () => setTick(t => t + 1);
    listeners.add(handleUpdate);
    return () => {
      listeners.delete(handleUpdate);
    };
  }, []);

  return {
    state: globalState,
    setRole: (role: UserRole) => {
      const staffMatch = INITIAL_STAFF.find(s => s.role === role) || {
        uid: `staff_${role.toLowerCase()}`,
        name: `${role} User`,
        email: `${role.toLowerCase()}@kiti.com`,
        role,
        active: true
      };
      setStoreState(() => ({
        currentRole: role,
        currentUser: staffMatch
      }), false);
    },
    setSelectedTable: (tableNo: number | null) => {
      setStoreState(() => ({ selectedTableNo: tableNo }), false);
    },
    setIsVoiceListening: (listening: boolean) => {
      setStoreState(() => ({ isVoiceListening: listening }), false);
    },
    addVoiceLog: (log: Omit<VoiceAssistantLog, 'id' | 'timestamp'>) => {
      const entry: VoiceAssistantLog = {
        ...log,
        id: 'vlog_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
        timestamp: new Date().toISOString()
      };
      setStoreState(prev => ({
        voiceLogs: [entry, ...prev.voiceLogs.slice(0, 49)]
      }), false);
    },
    resetData: resetStoreToDefaults
  };
};
