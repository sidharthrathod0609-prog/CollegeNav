import { useEffect, useState } from 'react';
import { ref, onValue, set, update, remove } from 'firebase/database';
import { getFirebaseDatabase, isFirebaseConfigured } from './firebaseConfig.ts';
import { OFFICIAL_CVR_ROUTES, type CVRRoute } from '../data/cvrRoutes.ts';
import type { TransportAdvisory } from '../types/transit.ts';

const ROUTES_STORAGE_KEY = 'cvr_transport_admin_routes_v1';
const ADVISORIES_STORAGE_KEY = 'cvr_transport_admin_advisories_v1';
const ADMIN_PASSKEY = 'CVR-TRANS-2026';

export type SyncStatus = 'CONNECTED_CLOUD' | 'OFFLINE_VERIFIED_FALLBACK' | 'CONNECTING' | 'SYNC_ERROR';

export const INITIAL_ADVISORIES: TransportAdvisory[] = [
  {
    id: 'adv-network-1',
    type: 'notice',
    severity: 'low',
    title: '54 Official Scheduled Corridors Operational',
    message: 'The College operates exclusive buses connecting various localities of the Twin Cities to the CVR College Campus (Vastunagar, Mangalpally).',
    status: 'ACTIVE',
    date: 'Official Circular',
    createdAt: Date.now() - 86400000,
    updatedAt: Date.now() - 86400000,
    publishedBy: 'CVR Transport Office',
  },
  {
    id: 'adv-verification-2',
    routeNumber: 'Route 21 & 39',
    type: 'verification',
    severity: 'medium',
    title: 'Notice: Routes 21 & 39 Require Manual Verification',
    message: 'Route stops for Route 21 and Route 39 are marked "Route stops not listed" on the official route sheet. Students traveling on these corridors should confirm stop sequences with the college transport office.',
    status: 'ACTIVE',
    date: 'Transport Notice',
    createdAt: Date.now() - 43200000,
    updatedAt: Date.now() - 43200000,
    publishedBy: 'CVR Transport Office',
  },
  {
    id: 'adv-guideline-3',
    type: 'guideline',
    severity: 'low',
    title: 'Student Morning Boarding Protocol',
    message: 'Students are advised to be present at their respective boarding points at least 5-10 minutes prior to the scheduled departure time.',
    status: 'ACTIVE',
    date: 'General Advisory',
    createdAt: Date.now() - 21600000,
    updatedAt: Date.now() - 21600000,
    publishedBy: 'CVR Transport Office',
  },
];

const safeStorage = {
  getItem: (key: string): string | null => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        return window.localStorage.getItem(key);
      }
    } catch {
      // Safe fallback
    }
    return null;
  },
  setItem: (key: string, val: string): void => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(key, val);
      }
    } catch {
      // Safe fallback
    }
  },
  removeItem: (key: string): void => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(key);
      }
    } catch {
      // Safe fallback
    }
  },
};

// Helper to load locally cached routes
function loadLocalRoutes(): CVRRoute[] {
  try {
    const raw = safeStorage.getItem(ROUTES_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('[TransportService] Failed to parse local routes, using circular default:', err);
  }
  return OFFICIAL_CVR_ROUTES;
}

// Helper to load locally cached advisories
function loadLocalAdvisories(): TransportAdvisory[] {
  try {
    const raw = safeStorage.getItem(ADVISORIES_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('[TransportService] Failed to parse local advisories, using defaults:', err);
  }
  return INITIAL_ADVISORIES;
}

// Global in-memory cache for fast, synchronized updates
let cachedRoutes: CVRRoute[] = loadLocalRoutes();
let cachedAdvisories: TransportAdvisory[] = loadLocalAdvisories();
let cachedSyncStatus: SyncStatus = isFirebaseConfigured() ? 'CONNECTING' : 'OFFLINE_VERIFIED_FALLBACK';
const listeners: Set<() => void> = new Set();

function notifyListeners() {
  listeners.forEach((listener) => listener());
}

/**
 * Validates departure time strings like "6:50 AM", "07:05 AM", "8:15 AM"
 */
export function validateDepartureTime(timeStr: string): { valid: boolean; error?: string } {
  if (!timeStr || !timeStr.trim()) {
    return { valid: false, error: 'Departure time is required' };
  }
  const clean = timeStr.trim();
  const pattern = /^(0?[1-9]|1[0-2])[.:]([0-5]\d)\s*(?:AM|PM|am|pm)$/i;
  if (!pattern.test(clean) && !clean.toLowerCase().includes('not listed')) {
    return { valid: false, error: 'Time must follow standard 12-hour format (e.g. 7:05 AM)' };
  }
  return { valid: true };
}

/**
 * Checks for prohibited phone numbers in input to prevent privacy leaks
 */
export function containsPhoneNumber(text: string): boolean {
  return /\b[6-9]\d{9}\b/.test(text) || /\+?91[\s-]?\d{10}/.test(text);
}

/**
 * Authorizes admin access against transport passkey
 */
export function verifyAdminPasskey(passkey: string): boolean {
  return passkey.trim() === ADMIN_PASSKEY;
}

/**
 * Initializes Firebase listeners if configured, or falls back to local verified storage
 */
export function initTransportSync(): () => void {
  const db = getFirebaseDatabase();

  if (!db || !isFirebaseConfigured()) {
    cachedSyncStatus = 'OFFLINE_VERIFIED_FALLBACK';
    notifyListeners();
    return () => {};
  }

  cachedSyncStatus = 'CONNECTING';
  notifyListeners();

  const routesRef = ref(db, 'transport/routes');
  const advisoriesRef = ref(db, 'transport/advisories');

  const unsubscribeRoutes = onValue(
    routesRef,
    (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const routeList: CVRRoute[] = Array.isArray(data)
          ? data.filter(Boolean)
          : Object.values(data);

        if (routeList.length > 0) {
          cachedRoutes = routeList;
          localStorage.setItem(ROUTES_STORAGE_KEY, JSON.stringify(routeList));
        }
      } else {
        // If RTDB is empty, seed it with official circular dataset
        try {
          set(routesRef, OFFICIAL_CVR_ROUTES);
        } catch (e) {
          console.warn('[Firebase RTDB] Seed permission denied:', e);
        }
      }
      cachedSyncStatus = 'CONNECTED_CLOUD';
      notifyListeners();
    },
    (err) => {
      console.warn('[Firebase RTDB] Routes sync error, falling back:', err.message);
      cachedSyncStatus = 'OFFLINE_VERIFIED_FALLBACK';
      notifyListeners();
    }
  );

  const unsubscribeAdvisories = onValue(
    advisoriesRef,
    (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const advList: TransportAdvisory[] = Array.isArray(data)
          ? data.filter(Boolean)
          : Object.values(data);
        cachedAdvisories = advList;
        safeStorage.setItem(ADVISORIES_STORAGE_KEY, JSON.stringify(advList));
      } else {
        // Seed initial advisories if empty
        try {
          set(advisoriesRef, INITIAL_ADVISORIES);
        } catch (e) {
          console.warn('[Firebase RTDB] Advisory seed denied:', e);
        }
      }
      notifyListeners();
    },
    (err) => {
      console.warn('[Firebase RTDB] Advisories sync error:', err.message);
    }
  );

  return () => {
    unsubscribeRoutes();
    unsubscribeAdvisories();
  };
}

/**
 * Updates a route's schedule or stops (Admin Action)
 */
export async function updateRouteSchedule(
  routeId: string,
  updates: Partial<CVRRoute>,
  authPasskey: string
): Promise<{ success: boolean; error?: string }> {
  if (!verifyAdminPasskey(authPasskey)) {
    return { success: false, error: 'Unauthorized: Invalid Transport Administrator passkey' };
  }

  // Input Validation
  if (updates.departureTime) {
    const timeValidation = validateDepartureTime(updates.departureTime);
    if (!timeValidation.valid) {
      return { success: false, error: timeValidation.error };
    }
  }

  if (updates.startingLocation && !updates.startingLocation.trim()) {
    return { success: false, error: 'Starting location cannot be empty' };
  }

  // Privacy Protection: Prohibit driver phone numbers
  const serialized = JSON.stringify(updates);
  if (containsPhoneNumber(serialized)) {
    return { success: false, error: 'Privacy Policy Violation: Personal contact numbers cannot be stored' };
  }

  const routeIndex = cachedRoutes.findIndex((r) => r.id === routeId);
  if (routeIndex === -1) {
    return { success: false, error: `Route "${routeId}" not found in circular dataset` };
  }

  const existingRoute = cachedRoutes[routeIndex];
  
  // Clean, normalized route update preserving route number & core integrity
  const updatedRoute: CVRRoute = {
    ...existingRoute,
    ...updates,
    routeNumber: existingRoute.routeNumber, // Route number is immutable
    id: existingRoute.id,
    stopCount: updates.stops ? updates.stops.length : existingRoute.stops.length,
    verificationStatus: 'OFFICIAL_ROUTE_SHEET',
  };

  // 1. Update in-memory and local storage fallback
  cachedRoutes[routeIndex] = updatedRoute;
  safeStorage.setItem(ROUTES_STORAGE_KEY, JSON.stringify(cachedRoutes));
  notifyListeners();

  // 2. Sync to Firebase RTDB if connected
  const db = getFirebaseDatabase();
  if (db && isFirebaseConfigured()) {
    try {
      const routeRef = ref(db, `transport/routes/${existingRoute.routeNumber - 1}`);
      await update(routeRef, updatedRoute);
    } catch (err: any) {
      console.warn('[Firebase RTDB] Write rejected by rules or network, preserved locally:', err?.message);
    }
  }

  return { success: true };
}

/**
 * Publishes a new service advisory (Admin Action)
 */
export async function publishTransportAdvisory(
  advisoryData: Omit<TransportAdvisory, 'id' | 'createdAt' | 'updatedAt' | 'date'>,
  authPasskey: string
): Promise<{ success: boolean; advisory?: TransportAdvisory; error?: string }> {
  if (!verifyAdminPasskey(authPasskey)) {
    return { success: false, error: 'Unauthorized: Invalid Transport Administrator passkey' };
  }

  if (!advisoryData.title.trim() || !advisoryData.message.trim()) {
    return { success: false, error: 'Advisory title and message are required' };
  }

  if (containsPhoneNumber(advisoryData.message) || containsPhoneNumber(advisoryData.title)) {
    return { success: false, error: 'Privacy Policy Violation: Personal contact numbers cannot be published' };
  }

  const now = Date.now();
  const dateStr = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  const newAdvisory: TransportAdvisory = {
    ...advisoryData,
    id: `adv-${now}-${Math.random().toString(36).substring(2, 6)}`,
    date: dateStr,
    createdAt: now,
    updatedAt: now,
    status: 'ACTIVE',
    publishedBy: 'CVR Transport Office',
  };

  // In-memory & local fallback
  cachedAdvisories = [newAdvisory, ...cachedAdvisories];
  safeStorage.setItem(ADVISORIES_STORAGE_KEY, JSON.stringify(cachedAdvisories));
  notifyListeners();

  // Sync to Firebase RTDB
  const db = getFirebaseDatabase();
  if (db && isFirebaseConfigured()) {
    try {
      const advRef = ref(db, `transport/advisories/${newAdvisory.id}`);
      await set(advRef, newAdvisory);
    } catch (err: any) {
      console.warn('[Firebase RTDB] Advisory write failed, preserved locally:', err?.message);
    }
  }

  return { success: true, advisory: newAdvisory };
}

/**
 * Updates an advisory (toggle status, edit text)
 */
export async function updateTransportAdvisory(
  advisoryId: string,
  updates: Partial<TransportAdvisory>,
  authPasskey: string
): Promise<{ success: boolean; error?: string }> {
  if (!verifyAdminPasskey(authPasskey)) {
    return { success: false, error: 'Unauthorized: Invalid Transport Administrator passkey' };
  }

  const idx = cachedAdvisories.findIndex((a) => a.id === advisoryId);
  if (idx === -1) {
    return { success: false, error: 'Advisory not found' };
  }

  const updated: TransportAdvisory = {
    ...cachedAdvisories[idx],
    ...updates,
    updatedAt: Date.now(),
  };

  cachedAdvisories[idx] = updated;
  safeStorage.setItem(ADVISORIES_STORAGE_KEY, JSON.stringify(cachedAdvisories));
  notifyListeners();

  const db = getFirebaseDatabase();
  if (db && isFirebaseConfigured()) {
    try {
      const advRef = ref(db, `transport/advisories/${advisoryId}`);
      await update(advRef, updated);
    } catch (err: any) {
      console.warn('[Firebase RTDB] Advisory update rejected:', err?.message);
    }
  }

  return { success: true };
}

/**
 * Deletes an advisory (Admin Action)
 */
export async function deleteTransportAdvisory(
  advisoryId: string,
  authPasskey: string
): Promise<{ success: boolean; error?: string }> {
  if (!verifyAdminPasskey(authPasskey)) {
    return { success: false, error: 'Unauthorized: Invalid Transport Administrator passkey' };
  }

  cachedAdvisories = cachedAdvisories.filter((a) => a.id !== advisoryId);
  safeStorage.setItem(ADVISORIES_STORAGE_KEY, JSON.stringify(cachedAdvisories));
  notifyListeners();

  const db = getFirebaseDatabase();
  if (db && isFirebaseConfigured()) {
    try {
      const advRef = ref(db, `transport/advisories/${advisoryId}`);
      await remove(advRef);
    } catch (err: any) {
      console.warn('[Firebase RTDB] Advisory delete failed:', err?.message);
    }
  }

  return { success: true };
}

/**
 * Resets all routes back to official verified circular sheet records
 */
export async function resetToCircularDefault(authPasskey: string): Promise<{ success: boolean; error?: string }> {
  if (!verifyAdminPasskey(authPasskey)) {
    return { success: false, error: 'Unauthorized: Invalid Transport Administrator passkey' };
  }

  cachedRoutes = OFFICIAL_CVR_ROUTES;
  safeStorage.removeItem(ROUTES_STORAGE_KEY);
  notifyListeners();

  const db = getFirebaseDatabase();
  if (db && isFirebaseConfigured()) {
    try {
      const routesRef = ref(db, 'transport/routes');
      await set(routesRef, OFFICIAL_CVR_ROUTES);
    } catch (err: any) {
      console.warn('[Firebase RTDB] Reset failed on cloud:', err?.message);
    }
  }

  return { success: true };
}

/**
 * React Hook for consuming synchronized transport data
 */
export function useTransportData() {
  const [routes, setRoutes] = useState<CVRRoute[]>(cachedRoutes);
  const [advisories, setAdvisories] = useState<TransportAdvisory[]>(cachedAdvisories);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>(cachedSyncStatus);

  useEffect(() => {
    const cleanupSync = initTransportSync();

    const handleUpdate = () => {
      setRoutes([...cachedRoutes]);
      setAdvisories([...cachedAdvisories]);
      setSyncStatus(cachedSyncStatus);
    };

    listeners.add(handleUpdate);
    handleUpdate();

    return () => {
      listeners.delete(handleUpdate);
      cleanupSync();
    };
  }, []);

  return {
    routes,
    advisories,
    syncStatus,
    isFallback: syncStatus === 'OFFLINE_VERIFIED_FALLBACK',
    updateRouteSchedule,
    publishTransportAdvisory,
    updateTransportAdvisory,
    deleteTransportAdvisory,
    resetToCircularDefault,
  };
}
