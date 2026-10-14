import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { 
  X, 
  ShieldCheck, 
  Lock, 
  Bus, 
  Bell, 
  Database, 
  Save, 
  RotateCcw, 
  Trash2, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  Plus,
  ArrowUp,
  ArrowDown,
  LogOut,
  LayoutDashboard,
  Users,
  Ticket,
  Edit3,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Search,
  Info,
  XCircle,
  RefreshCw,
  UserCheck,
  Hash,
} from 'lucide-react';
import type { CVRRoute, CVRRouteStop } from '../data/cvrRoutes';
import type { TransportAdvisory } from '../types/transit';
import type { BoardingRequest, TripCapacityState } from '../types/boarding';
import { 
  getFirebaseConnectionDiagnostics 
} from '../services/firebaseConfig';
import {
  validateDepartureTime,
} from '../services/transportDataService';

type AdminTab = 'dashboard' | 'routes' | 'advisories' | 'fleet' | 'boarding' | 'security';

interface AdminPortalModalProps {
  isOpen: boolean;
  onClose: () => void;
  routes: CVRRoute[];
  advisories: TransportAdvisory[];
  syncStatus: string;
  trips?: TripCapacityState[];
  boardingRequests?: BoardingRequest[];
  onUpdateRoute: (routeId: string, updates: Partial<CVRRoute>, passkey: string) => Promise<{ success: boolean; error?: string }>;
  onPublishAdvisory: (advisory: Omit<TransportAdvisory, 'id' | 'createdAt' | 'updatedAt' | 'date'>, passkey: string) => Promise<{ success: boolean; error?: string }>;
  onUpdateAdvisory: (id: string, updates: Partial<TransportAdvisory>, passkey: string) => Promise<{ success: boolean; error?: string }>;
  onDeleteAdvisory: (id: string, passkey: string) => Promise<{ success: boolean; error?: string }>;
  onResetRouteDefaults: (passkey: string) => Promise<{ success: boolean; error?: string }>;
  onUpdateTrip?: (tripId: string, updates: Partial<TripCapacityState>, passkey: string) => Promise<{ success: boolean; error?: string }>;
}

// ─── Confirmation Dialog ───
const ConfirmDialog: React.FC<{
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}> = ({ title, message, confirmLabel = 'Confirm', cancelLabel = 'Cancel', danger = false, onConfirm, onCancel }) => (
  <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-xs" onClick={onCancel}>
    <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full mx-4 p-5 space-y-4 border border-[#E5E2DC]" onClick={(e) => e.stopPropagation()}>
      <div className="flex items-start gap-3">
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${danger ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-700'}`}>
          {danger ? <AlertTriangle className="w-5 h-5" /> : <Info className="w-5 h-5" />}
        </div>
        <div>
          <h4 className="text-sm font-bold text-[#0F1E36]">{title}</h4>
          <p className="text-xs text-slate-600 mt-1 leading-relaxed">{message}</p>
        </div>
      </div>
      <div className="flex items-center gap-2 justify-end">
        <button type="button" onClick={onCancel} className="px-3.5 py-1.5 rounded-lg text-xs font-semibold border border-[#DCD8D0] hover:bg-[#FAF9F5] text-slate-700">
          {cancelLabel}
        </button>
        <button type="button" onClick={onConfirm} className={`px-3.5 py-1.5 rounded-lg text-xs font-bold text-white shadow-sm ${danger ? 'bg-red-600 hover:bg-red-700' : 'bg-[#0F1E36] hover:bg-[#1A2F50]'}`}>
          {confirmLabel}
        </button>
      </div>
    </div>
  </div>
);

// ─── Stat Card ───
const StatCard: React.FC<{
  label: string;
  value: string | number;
  icon: React.ReactNode;
  color?: string;
  sub?: string;
}> = ({ label, value, icon, color = 'text-amber-600', sub }) => (
  <div className="p-3.5 rounded-xl bg-white border border-[#E5E2DC] space-y-1.5">
    <div className="flex items-center gap-2">
      <div className={`${color}`}>{icon}</div>
      <span className="text-[10px] text-slate-400 uppercase font-mono tracking-wider">{label}</span>
    </div>
    <div className="text-xl font-black text-[#0F1E36]">{value}</div>
    {sub && <span className="text-[10px] text-slate-500">{sub}</span>}
  </div>
);

// ─── Badge ───
const StatusBadge: React.FC<{ status: string; size?: 'sm' | 'md' }> = ({ status, size = 'sm' }) => {
  const styles: Record<string, string> = {
    ACTIVE: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    RESOLVED: 'bg-slate-200 text-slate-700 border-slate-300',
    PENDING: 'bg-amber-100 text-amber-800 border-amber-200',
    ACCEPTED: 'bg-blue-100 text-blue-800 border-blue-200',
    REJECTED: 'bg-red-100 text-red-800 border-red-200',
    EXPIRED: 'bg-slate-200 text-slate-600 border-slate-300',
    BOARDED: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    CANCELLED: 'bg-slate-200 text-slate-500 border-slate-300',
    BOARDING_OPEN: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    AT_CAPACITY: 'bg-red-100 text-red-800 border-red-200',
    STANDBY: 'bg-amber-100 text-amber-800 border-amber-200',
    SCHEDULED: 'bg-blue-100 text-blue-800 border-blue-200',
    COMPLETED: 'bg-slate-200 text-slate-700 border-slate-300',
  };
  const cls = styles[status] || 'bg-slate-100 text-slate-600 border-slate-200';
  return (
    <span className={`px-2 py-0.5 rounded-full border font-bold ${size === 'sm' ? 'text-[10px]' : 'text-xs'} ${cls}`}>
      {status.replace(/_/g, ' ')}
    </span>
  );
};

export const AdminPortalModal: React.FC<AdminPortalModalProps> = ({
  isOpen,
  onClose,
  routes,
  advisories,
  syncStatus,
  trips = [],
  boardingRequests = [],
  onUpdateRoute,
  onPublishAdvisory,
  onUpdateAdvisory,
  onDeleteAdvisory,
  onResetRouteDefaults,
}) => {
  // ─── Authentication ───
  const [passkeyInput, setPasskeyInput] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // ─── Navigation ───
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');

  // ─── Route Editor State ───
  const [selectedRouteId, setSelectedRouteId] = useState<string>(routes[0]?.id || 'cvr-route-1');
  const [searchFilter, setSearchFilter] = useState('');
  const activeRoute = routes.find((r) => r.id === selectedRouteId) || routes[0];
  const [editDepartureTime, setEditDepartureTime] = useState(activeRoute?.departureTime || '');
  const [editStartingLocation, setEditStartingLocation] = useState(activeRoute?.startingLocation || '');
  const [editDestination, setEditDestination] = useState(activeRoute?.destination || 'College (CVR Campus)');
  const [editStops, setEditStops] = useState<CVRRouteStop[]>(activeRoute?.stops || []);
  const [newStopName, setNewStopName] = useState('');
  const [routeValidationError, setRouteValidationError] = useState<string | null>(null);

  // Track if route has unsaved changes
  const hasUnsavedRouteChanges = useMemo(() => {
    if (!activeRoute) return false;
    return (
      editDepartureTime !== activeRoute.departureTime ||
      editStartingLocation !== activeRoute.startingLocation ||
      editDestination !== activeRoute.destination ||
      JSON.stringify(editStops) !== JSON.stringify(activeRoute.stops)
    );
  }, [activeRoute, editDepartureTime, editStartingLocation, editDestination, editStops]);

  // ─── Advisory State ───
  const [newAdvTitle, setNewAdvTitle] = useState('');
  const [newAdvMessage, setNewAdvMessage] = useState('');
  const [newAdvRouteNumber, setNewAdvRouteNumber] = useState('All Routes');
  const [newAdvType, setNewAdvType] = useState<'notice' | 'guideline' | 'verification' | 'alert'>('notice');
  const [newAdvSeverity, setNewAdvSeverity] = useState<'low' | 'medium' | 'high'>('low');
  const [editingAdvisoryId, setEditingAdvisoryId] = useState<string | null>(null);
  const [editAdvTitle, setEditAdvTitle] = useState('');
  const [editAdvMessage, setEditAdvMessage] = useState('');
  const [advisoryFilter, setAdvisoryFilter] = useState<'all' | 'ACTIVE' | 'RESOLVED'>('all');

  // ─── Fleet State ───
  const [fleetSearch, setFleetSearch] = useState('');
  const [selectedTripId, setSelectedTripId] = useState<string | null>(null);

  // ─── Boarding State ───
  const [boardingFilter, setBoardingFilter] = useState<'all' | 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED'>('all');
  const [boardingSearch, setBoardingSearch] = useState('');

  // ─── UI State ───
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{ title: string; message: string; danger?: boolean; onConfirm: () => void } | null>(null);

  // ─── Helpers ───
  const showSuccess = useCallback((msg: string) => {
    setActionSuccess(msg);
    setActionError(null);
    setTimeout(() => setActionSuccess(null), 4000);
  }, []);

  const showError = useCallback((msg: string) => {
    setActionError(msg);
    setActionSuccess(null);
  }, []);

  const handleSelectRoute = useCallback((route: CVRRoute) => {
    setSelectedRouteId(route.id);
    setEditDepartureTime(route.departureTime);
    setEditStartingLocation(route.startingLocation);
    setEditDestination(route.destination);
    setEditStops([...route.stops]);
    setRouteValidationError(null);
  }, []);

  // Sync editStops whenever the activeRoute reference changes (e.g. after save)
  useEffect(() => {
    if (activeRoute) {
      setEditDepartureTime(activeRoute.departureTime);
      setEditStartingLocation(activeRoute.startingLocation);
      setEditDestination(activeRoute.destination);
      setEditStops([...activeRoute.stops]);
    }
  }, [activeRoute?.id, activeRoute?.departureTime, activeRoute?.startingLocation, activeRoute?.destination]);

  if (!isOpen) return null;

  // ─── Auth Handler ───
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (passkeyInput.trim() === 'CVR-TRANS-2026') {
      setIsAuthenticated(true);
      setAuthError(null);
    } else {
      setAuthError('Invalid administrator passkey. Please check authorized credentials.');
    }
  };

  // ─── Route Handlers ───
  const handleSaveRoute = async () => {
    if (!activeRoute) return;

    // Validate departure time
    if (editDepartureTime.trim()) {
      const tv = validateDepartureTime(editDepartureTime);
      if (!tv.valid) {
        setRouteValidationError(tv.error || 'Invalid departure time format');
        return;
      }
    }

    if (!editStartingLocation.trim()) {
      setRouteValidationError('Starting location is required');
      return;
    }

    setRouteValidationError(null);
    setIsSaving(true);
    setActionError(null);

    const result = await onUpdateRoute(
      activeRoute.id,
      {
        departureTime: editDepartureTime.trim(),
        startingLocation: editStartingLocation.trim(),
        destination: editDestination.trim(),
        stops: editStops,
        isIncomplete: editStops.length === 0,
      },
      passkeyInput
    );

    setIsSaving(false);
    if (result.success) {
      showSuccess(`${activeRoute.routeLabel} updated successfully.`);
    } else {
      showError(result.error || 'Failed to update route');
    }
  };

  const handleResetDefaults = () => {
    setConfirmDialog({
      title: 'Reset All Routes to Official Data?',
      message: 'This will revert ALL route edits back to the official CVR circular dataset. Any custom stop additions or schedule changes will be lost.',
      danger: true,
      onConfirm: async () => {
        setConfirmDialog(null);
        const result = await onResetRouteDefaults(passkeyInput);
        if (result.success) {
          showSuccess('Routes reset to official circular records');
        } else {
          showError(result.error || 'Failed to reset');
        }
      },
    });
  };

  // ─── Stop Handlers ───
  const moveStop = (index: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= editStops.length) return;
    const newStops = [...editStops];
    const temp = newStops[index];
    newStops[index] = newStops[targetIdx];
    newStops[targetIdx] = temp;
    setEditStops(newStops.map((s, idx) => ({ ...s, stopOrder: idx + 1 })));
  };

  const handleAddStop = () => {
    if (!newStopName.trim()) return;
    const stop: CVRRouteStop = {
      id: `${activeRoute.id}-custom-${Date.now()}`,
      name: newStopName.trim(),
      isStartingPoint: editStops.length === 0,
      isDestination: false,
      stopOrder: editStops.length + 1,
    };
    setEditStops([...editStops, stop]);
    setNewStopName('');
  };

  const handleRemoveStop = (stopId: string) => {
    const filtered = editStops.filter((s) => s.id !== stopId);
    setEditStops(filtered.map((s, idx) => ({ ...s, stopOrder: idx + 1 })));
  };

  // ─── Advisory Handlers ───
  const handlePublishAdvisory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdvTitle.trim() || !newAdvMessage.trim()) {
      showError('Please fill in both the advisory title and message.');
      return;
    }

    setIsSaving(true);
    const result = await onPublishAdvisory(
      {
        title: newAdvTitle.trim(),
        message: newAdvMessage.trim(),
        routeNumber: newAdvRouteNumber === 'All Routes' ? undefined : newAdvRouteNumber,
        type: newAdvType,
        severity: newAdvSeverity,
        status: 'ACTIVE',
      },
      passkeyInput
    );

    setIsSaving(false);
    if (result.success) {
      setNewAdvTitle('');
      setNewAdvMessage('');
      setNewAdvRouteNumber('All Routes');
      setNewAdvType('notice');
      setNewAdvSeverity('low');
      showSuccess('Service advisory published.');
    } else {
      showError(result.error || 'Failed to publish advisory');
    }
  };

  const handleUpdateAdvisoryStatus = async (adv: TransportAdvisory, newStatus: 'ACTIVE' | 'RESOLVED') => {
    const result = await onUpdateAdvisory(adv.id, { status: newStatus }, passkeyInput);
    if (result.success) showSuccess(`Advisory ${newStatus === 'RESOLVED' ? 'resolved' : 'reactivated'}.`);
    else showError(result.error || 'Failed to update advisory');
  };

  const handleSaveAdvisoryEdit = async (advId: string) => {
    if (!editAdvTitle.trim() || !editAdvMessage.trim()) {
      showError('Advisory title and message cannot be empty.');
      return;
    }
    setIsSaving(true);
    const result = await onUpdateAdvisory(advId, { title: editAdvTitle.trim(), message: editAdvMessage.trim() }, passkeyInput);
    setIsSaving(false);
    if (result.success) {
      setEditingAdvisoryId(null);
      showSuccess('Advisory updated.');
    } else {
      showError(result.error || 'Failed to save advisory');
    }
  };

  const handleDeleteAdvisory = (adv: TransportAdvisory) => {
    setConfirmDialog({
      title: 'Delete Service Advisory?',
      message: `"${adv.title}" will be permanently removed. This action cannot be undone.`,
      danger: true,
      onConfirm: async () => {
        setConfirmDialog(null);
        const result = await onDeleteAdvisory(adv.id, passkeyInput);
        if (result.success) showSuccess('Advisory deleted.');
        else showError(result.error || 'Failed to delete advisory');
      },
    });
  };

  // ─── Derived Data ───
  const filteredRoutes = routes.filter((r) =>
    r.routeLabel.toLowerCase().includes(searchFilter.toLowerCase()) ||
    r.startingLocation.toLowerCase().includes(searchFilter.toLowerCase()) ||
    r.routeNumber.toString().includes(searchFilter)
  );

  const incompleteRoutes = routes.filter((r) => r.isIncomplete);
  const activeAdvisories = advisories.filter((a) => a.status === 'ACTIVE');
  const resolvedAdvisories = advisories.filter((a) => a.status === 'RESOLVED');
  const pendingRequests = boardingRequests.filter((r) => r.status === 'PENDING');
  const acceptedRequests = boardingRequests.filter((r) => r.status === 'ACCEPTED');

  const filteredAdvisories = advisories.filter((a) => {
    if (advisoryFilter === 'all') return true;
    return a.status === advisoryFilter;
  });

  const filteredTrips = trips.filter((t) =>
    t.routeLabel.toLowerCase().includes(fleetSearch.toLowerCase()) ||
    t.busIdentifier.toLowerCase().includes(fleetSearch.toLowerCase()) ||
    t.startingLocation.toLowerCase().includes(fleetSearch.toLowerCase()) ||
    t.routeNumber.toString().includes(fleetSearch)
  );

  const filteredBoardingRequests = boardingRequests.filter((r) => {
    const matchesFilter = boardingFilter === 'all' || r.status === boardingFilter;
    const matchesSearch = !boardingSearch || 
      r.routeLabel.toLowerCase().includes(boardingSearch.toLowerCase()) ||
      r.studentName.toLowerCase().includes(boardingSearch.toLowerCase()) ||
      r.pickupStop.toLowerCase().includes(boardingSearch.toLowerCase()) ||
      r.id.toLowerCase().includes(boardingSearch.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const diagnostics = getFirebaseConnectionDiagnostics();

  // ─── Tab definitions ───
  const tabs: { key: AdminTab; label: string; icon: React.ReactNode; badge?: number }[] = [
    { key: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-3.5 h-3.5" /> },
    { key: 'routes', label: 'Routes', icon: <Bus className="w-3.5 h-3.5" />, badge: routes.length },
    { key: 'advisories', label: 'Advisories', icon: <Bell className="w-3.5 h-3.5" />, badge: activeAdvisories.length },
    { key: 'fleet', label: 'Fleet', icon: <Users className="w-3.5 h-3.5" />, badge: trips.length },
    { key: 'boarding', label: 'Boarding', icon: <Ticket className="w-3.5 h-3.5" />, badge: pendingRequests.length },
    { key: 'security', label: 'Security', icon: <Database className="w-3.5 h-3.5" /> },
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-[#0F1E36]/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-150">
      <div 
        className="bg-white rounded-2xl max-w-5xl w-full border border-[#DCD8D0] shadow-2xl overflow-hidden flex flex-col max-h-[94vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ─── Header ─── */}
        <div className="bg-[#0F1E36] text-white p-4 sm:p-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
              <Bus className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-black tracking-tight">Transport Administration</h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  CVRCE In-Charge
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Official Schedule, Fleet, Boarding & Advisory Management
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isAuthenticated && (
              <>
                {/* Sync status indicator */}
                <div className={`hidden sm:flex items-center gap-1.5 px-2 py-1 rounded-lg text-[10px] font-mono ${
                  syncStatus === 'CONNECTED_CLOUD' 
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${syncStatus === 'CONNECTED_CLOUD' ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                  {syncStatus === 'CONNECTED_CLOUD' ? 'Cloud' : 'Local'}
                </div>
                <button
                  type="button"
                  onClick={() => { setIsAuthenticated(false); setPasskeyInput(''); }}
                  className="px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs text-slate-200 flex items-center gap-1 transition-colors"
                  title="Log out"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Lock</span>
                </button>
              </>
            )}
            <button
              onClick={onClose}
              type="button"
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/25 text-white flex items-center justify-center transition-colors"
              title="Close admin portal"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ─── Global Notifications ─── */}
        {actionSuccess && (
          <div className="bg-emerald-50 border-b border-emerald-200 px-4 py-2.5 text-xs text-emerald-900 font-medium flex items-center gap-2 shrink-0">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{actionSuccess}</span>
          </div>
        )}
        {actionError && (
          <div className="bg-red-50 border-b border-red-200 px-4 py-2.5 text-xs text-red-900 font-medium flex items-center gap-2 shrink-0">
            <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{actionError}</span>
            <button type="button" onClick={() => setActionError(null)} className="ml-auto">
              <XCircle className="w-3.5 h-3.5 text-red-400 hover:text-red-600" />
            </button>
          </div>
        )}

        {/* ─── Content ─── */}
        {!isAuthenticated ? (
          /* ─── Authentication Screen ─── */
          <div className="p-8 sm:p-12 text-center max-w-md mx-auto space-y-5">
            <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center mx-auto">
              <Lock className="w-7 h-7 text-amber-600" />
            </div>
            <div>
              <h3 className="text-lg font-black text-[#0F1E36]">Authorized Staff Access</h3>
              <p className="text-xs text-slate-500 mt-1">
                Enter the CVR Transport Department administrator passkey to manage routes, modify schedules, and publish advisories.
              </p>
            </div>
            <form onSubmit={handleLogin} className="space-y-3">
              <div className="text-left">
                <label className="block text-xs font-bold text-[#0F1E36] mb-1">
                  Administrator Passkey
                </label>
                <input
                  type="password"
                  value={passkeyInput}
                  onChange={(e) => setPasskeyInput(e.target.value)}
                  placeholder="Enter administrator passkey..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#DCD8D0] focus:border-amber-600 focus:ring-2 focus:ring-amber-500/10 text-sm font-medium outline-none"
                  autoFocus
                />
              </div>
              {authError && (
                <p className="text-xs text-red-600 font-semibold">{authError}</p>
              )}
              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-[#0F1E36] hover:bg-[#1A2F50] text-white font-bold text-xs sm:text-sm transition-colors shadow-sm"
              >
                Authorize Transport Console
              </button>
            </form>
            <div className="p-3 rounded-xl bg-[#FAF9F5] border border-[#E5E2DC] text-[11px] text-slate-500 font-mono">
              Demo Test Passkey: <strong className="text-[#0F1E36]">CVR-TRANS-2026</strong>
            </div>
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-[11px] text-amber-800 space-y-1">
              <div className="flex items-center gap-1.5 font-bold">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Security Notice</span>
              </div>
              <p className="text-[10px] leading-relaxed">
                This passkey is a client-side demo credential. In production, Firebase Authentication with custom claims would enforce server-side authorization.
              </p>
            </div>
          </div>
        ) : (
          /* ─── Authenticated Dashboard ─── */
          <div className="flex-1 flex flex-col overflow-hidden">
            
            {/* Tab Navigation */}
            <div className="flex items-center border-b border-[#E5E2DC] bg-[#FAF9F5] px-2 sm:px-4 pt-2 gap-0.5 sm:gap-1 text-xs font-bold overflow-x-auto shrink-0">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTab(tab.key)}
                  className={`px-2.5 sm:px-3.5 py-2.5 rounded-t-lg transition-all flex items-center gap-1.5 whitespace-nowrap ${
                    activeTab === tab.key
                      ? 'bg-white text-[#0F1E36] border-t border-x border-[#E5E2DC] -mb-[1px] shadow-2xs'
                      : 'text-slate-500 hover:text-[#0F1E36]'
                  }`}
                >
                  {tab.icon}
                  <span className="hidden sm:inline">{tab.label}</span>
                  {tab.badge !== undefined && tab.badge > 0 && (
                    <span className={`px-1.5 py-0 rounded-full text-[9px] font-bold ${
                      activeTab === tab.key ? 'bg-[#0F1E36] text-white' : 'bg-slate-200 text-slate-600'
                    }`}>
                      {tab.badge}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* ═══════════════ TAB: DASHBOARD ═══════════════ */}
            {activeTab === 'dashboard' && (
              <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-5">
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                  <StatCard label="Total Routes" value={routes.length} icon={<Bus className="w-4 h-4" />} sub="Official CVR records" />
                  <StatCard label="Incomplete Routes" value={incompleteRoutes.length} icon={<AlertTriangle className="w-4 h-4" />} color="text-amber-500" sub={incompleteRoutes.map(r => r.routeLabel).join(', ') || 'None'} />
                  <StatCard label="Active Advisories" value={activeAdvisories.length} icon={<Bell className="w-4 h-4" />} color="text-emerald-600" sub={`${resolvedAdvisories.length} resolved`} />
                  <StatCard label="Pending Boarding" value={pendingRequests.length} icon={<Ticket className="w-4 h-4" />} color="text-blue-600" sub={`${acceptedRequests.length} accepted`} />
                </div>

                {/* Data Source & Connection */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-4 rounded-xl border border-[#E5E2DC] bg-[#FAF9F5] space-y-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-[#0F1E36]">
                      <Database className="w-4 h-4 text-amber-600" />
                      <span>Data Source</span>
                    </div>
                    <div className="text-xs text-slate-700 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${syncStatus === 'CONNECTED_CLOUD' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                        <span className="font-semibold">
                          {syncStatus === 'CONNECTED_CLOUD' ? 'Firebase Cloud Connected' 
                           : syncStatus === 'CONNECTING' ? 'Connecting...'
                           : syncStatus === 'SYNC_ERROR' ? 'Connection Error — Local Fallback'
                           : 'Local Verified Fallback'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500">
                        {syncStatus === 'CONNECTED_CLOUD' 
                          ? 'Changes sync to Firebase RTDB in real-time.'
                          : 'Changes are stored locally. Configure Firebase environment variables for cloud sync.'}
                      </p>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl border border-[#E5E2DC] bg-[#FAF9F5] space-y-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-[#0F1E36]">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      <span>Security Status</span>
                    </div>
                    <div className="text-xs text-slate-700 space-y-1">
                      <div className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>RTDB rules enforce auth + custom claims</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                        <span className="text-amber-800">Frontend passkey is demo-only (not production auth)</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Phone numbers blocked from data fields</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="flex flex-wrap gap-2">
                  <button type="button" onClick={() => setActiveTab('routes')} className="px-3 py-2 rounded-lg bg-white border border-[#DCD8D0] text-xs font-bold text-[#0F1E36] hover:bg-[#FAF9F5] flex items-center gap-1.5">
                    <Bus className="w-3.5 h-3.5 text-amber-600" />
                    Manage Routes
                  </button>
                  <button type="button" onClick={() => setActiveTab('advisories')} className="px-3 py-2 rounded-lg bg-white border border-[#DCD8D0] text-xs font-bold text-[#0F1E36] hover:bg-[#FAF9F5] flex items-center gap-1.5">
                    <Bell className="w-3.5 h-3.5 text-amber-600" />
                    Publish Advisory
                  </button>
                  <button type="button" onClick={() => setActiveTab('fleet')} className="px-3 py-2 rounded-lg bg-white border border-[#DCD8D0] text-xs font-bold text-[#0F1E36] hover:bg-[#FAF9F5] flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-amber-600" />
                    Fleet Overview
                  </button>
                  <button type="button" onClick={() => setActiveTab('boarding')} className="px-3 py-2 rounded-lg bg-white border border-[#DCD8D0] text-xs font-bold text-[#0F1E36] hover:bg-[#FAF9F5] flex items-center gap-1.5">
                    <Ticket className="w-3.5 h-3.5 text-amber-600" />
                    Boarding Requests
                  </button>
                </div>
              </div>
            )}

            {/* ═══════════════ TAB: ROUTES ═══════════════ */}
            {activeTab === 'routes' && (
              <div className="flex-1 grid grid-cols-1 md:grid-cols-12 overflow-hidden">
                
                {/* Left Route Selector */}
                <div className="md:col-span-4 border-r border-[#E5E2DC] p-3 flex flex-col gap-2 overflow-hidden bg-[#FAF9F5]">
                  <input
                    type="text"
                    value={searchFilter}
                    onChange={(e) => setSearchFilter(e.target.value)}
                    placeholder="Filter route number or origin..."
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-[#DCD8D0] bg-white outline-none focus:border-amber-600"
                  />

                  <div className="flex-1 overflow-y-auto space-y-1 pr-1">
                    {filteredRoutes.map((route) => (
                      <button
                        key={route.id}
                        type="button"
                        onClick={() => handleSelectRoute(route)}
                        className={`w-full text-left p-2 rounded-lg text-xs transition-colors flex items-center justify-between ${
                          selectedRouteId === route.id
                            ? 'bg-[#0F1E36] text-white font-bold shadow-xs'
                            : 'hover:bg-white text-slate-700 bg-white/60 border border-[#E5E2DC]'
                        }`}
                      >
                        <div className="truncate">
                          <span className="block font-bold">
                            {route.routeLabel}
                            {route.isIncomplete && (
                              <AlertTriangle className="w-3 h-3 inline ml-1 text-amber-400" />
                            )}
                          </span>
                          <span className="block text-[11px] opacity-80 truncate">{route.startingLocation}</span>
                        </div>
                        <span className="font-mono text-[11px] shrink-0 ml-2">
                          {route.departureTime}
                        </span>
                      </button>
                    ))}
                  </div>
                  <div className="text-[10px] text-slate-400 text-center font-mono pt-1 border-t border-[#E5E2DC]">
                    {filteredRoutes.length} of {routes.length} routes
                  </div>
                </div>

                {/* Right Route Editor */}
                <div className="md:col-span-8 p-4 sm:p-5 overflow-y-auto space-y-4">
                  {activeRoute ? (
                    <>
                      <div className="flex items-center justify-between border-b border-[#E5E2DC] pb-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-base font-black text-[#0F1E36]">{activeRoute.routeLabel}</h3>
                            {activeRoute.isIncomplete && (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                                Incomplete Record
                              </span>
                            )}
                            {hasUnsavedRouteChanges && (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
                                Unsaved Changes
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-500">Route #{activeRoute.routeNumber} Official Schedule</p>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={handleResetDefaults}
                            className="px-2.5 py-1.5 rounded-lg border border-[#DCD8D0] hover:bg-[#FAF9F5] text-slate-600 text-xs font-semibold flex items-center gap-1"
                            title="Reset all routes to official records"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Reset</span>
                          </button>
                          <button
                            type="button"
                            onClick={handleSaveRoute}
                            disabled={isSaving || !hasUnsavedRouteChanges}
                            className="px-4 py-1.5 rounded-lg bg-[#0F1E36] hover:bg-[#1A2F50] text-white text-xs font-bold flex items-center gap-1.5 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <Save className="w-3.5 h-3.5 text-amber-400" />
                            <span>{isSaving ? 'Saving...' : 'Save Updates'}</span>
                          </button>
                        </div>
                      </div>

                      {/* Validation error */}
                      {routeValidationError && (
                        <div className="p-2.5 rounded-lg bg-red-50 border border-red-200 text-xs text-red-800 flex items-center gap-2">
                          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                          {routeValidationError}
                        </div>
                      )}

                      {/* Schedule Fields */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        <div>
                          <label className="block font-bold text-[#0F1E36] mb-1">Departure Time</label>
                          <div className="relative flex items-center">
                            <Clock className="w-3.5 h-3.5 text-amber-600 absolute left-3 pointer-events-none" />
                            <input
                              type="text"
                              value={editDepartureTime}
                              onChange={(e) => setEditDepartureTime(e.target.value)}
                              placeholder="e.g. 7:05 AM"
                              className="w-full pl-8 pr-3 py-2 rounded-lg border border-[#DCD8D0] text-xs font-mono font-bold text-[#0F1E36] outline-none focus:border-amber-600"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block font-bold text-[#0F1E36] mb-1">Starting Location</label>
                          <input
                            type="text"
                            value={editStartingLocation}
                            onChange={(e) => setEditStartingLocation(e.target.value)}
                            placeholder="Starting terminal name..."
                            className="w-full px-3 py-2 rounded-lg border border-[#DCD8D0] text-xs font-semibold text-[#0F1E36] outline-none focus:border-amber-600"
                          />
                        </div>
                      </div>

                      {/* Destination */}
                      <div className="text-xs">
                        <label className="block font-bold text-[#0F1E36] mb-1">Destination</label>
                        <input
                          type="text"
                          value={editDestination}
                          onChange={(e) => setEditDestination(e.target.value)}
                          placeholder="Destination..."
                          className="w-full px-3 py-2 rounded-lg border border-[#DCD8D0] text-xs font-semibold text-[#0F1E36] outline-none focus:border-amber-600"
                        />
                      </div>

                      {/* Stops Sequencer */}
                      <div className="space-y-2 pt-2 border-t border-[#E5E2DC]">
                        <label className="block font-bold text-[#0F1E36] text-xs uppercase tracking-wider">
                          Ordered Stop Sequence ({editStops.length} stops)
                        </label>

                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={newStopName}
                            onChange={(e) => setNewStopName(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddStop())}
                            placeholder="Add new stop name..."
                            className="flex-1 px-3 py-1.5 rounded-lg border border-[#DCD8D0] text-xs outline-none focus:border-amber-600"
                          />
                          <button
                            type="button"
                            onClick={handleAddStop}
                            className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold flex items-center gap-1"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Add</span>
                          </button>
                        </div>

                        <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                          {editStops.map((stop, idx) => (
                            <div
                              key={stop.id}
                              className="p-2 rounded-lg border border-[#E5E2DC] bg-[#FAF9F5] flex items-center justify-between gap-2 text-xs"
                            >
                              <div className="flex items-center gap-2 flex-1 min-w-0">
                                <span className="font-mono text-slate-400 text-[10px] w-5">{idx + 1}.</span>
                                <input
                                  type="text"
                                  value={stop.name}
                                  onChange={(e) => {
                                    const updated = [...editStops];
                                    updated[idx] = { ...stop, name: e.target.value };
                                    setEditStops(updated);
                                  }}
                                  className="flex-1 bg-transparent border-b border-transparent hover:border-slate-300 focus:border-amber-600 outline-none text-xs font-medium text-[#0F1E36]"
                                />
                              </div>
                              <div className="flex items-center gap-1">
                                <button type="button" onClick={() => moveStop(idx, 'up')} disabled={idx === 0} className="p-1 rounded text-slate-400 hover:text-slate-700 disabled:opacity-30" title="Move up">
                                  <ArrowUp className="w-3.5 h-3.5" />
                                </button>
                                <button type="button" onClick={() => moveStop(idx, 'down')} disabled={idx === editStops.length - 1} className="p-1 rounded text-slate-400 hover:text-slate-700 disabled:opacity-30" title="Move down">
                                  <ArrowDown className="w-3.5 h-3.5" />
                                </button>
                                <button type="button" onClick={() => handleRemoveStop(stop.id)} className="p-1 rounded text-red-500 hover:bg-red-50" title="Remove stop">
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          ))}
                          {editStops.length === 0 && (
                            <p className="text-xs text-slate-400 italic py-2 text-center">No stops defined. Add stops above.</p>
                          )}
                        </div>
                      </div>
                    </>
                  ) : (
                    <p className="text-xs text-slate-400">Select a route to edit details.</p>
                  )}
                </div>
              </div>
            )}

            {/* ═══════════════ TAB: ADVISORIES ═══════════════ */}
            {activeTab === 'advisories' && (
              <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-5">
                
                {/* Publish Form */}
                <div className="bg-[#FAF9F5] p-4 sm:p-5 rounded-xl border border-[#E5E2DC] space-y-3">
                  <h3 className="text-xs font-bold text-[#0F1E36] uppercase tracking-wider flex items-center gap-1.5">
                    <Plus className="w-4 h-4 text-amber-600" />
                    <span>Publish Service Advisory</span>
                  </h3>

                  <form onSubmit={handlePublishAdvisory} className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="sm:col-span-2">
                        <label className="block text-[11px] font-bold text-[#0F1E36] mb-1">Advisory Headline</label>
                        <input
                          type="text"
                          value={newAdvTitle}
                          onChange={(e) => setNewAdvTitle(e.target.value)}
                          placeholder="e.g. Route 14 Departure Rescheduled..."
                          className="w-full px-3 py-2 rounded-lg border border-[#DCD8D0] text-xs outline-none focus:border-amber-600"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-[#0F1E36] mb-1">Associated Route</label>
                        <select
                          value={newAdvRouteNumber}
                          onChange={(e) => setNewAdvRouteNumber(e.target.value)}
                          className="w-full px-3 py-2 rounded-lg border border-[#DCD8D0] text-xs bg-white outline-none focus:border-amber-600"
                        >
                          <option value="All Routes">All Fleet Corridors</option>
                          {routes.map((r) => (
                            <option key={r.id} value={r.routeLabel}>{r.routeLabel} ({r.startingLocation})</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-[#0F1E36] mb-1">Advisory Message</label>
                      <textarea
                        value={newAdvMessage}
                        onChange={(e) => setNewAdvMessage(e.target.value)}
                        placeholder="Detailed guidance for students..."
                        rows={3}
                        className="w-full px-3 py-2 rounded-lg border border-[#DCD8D0] text-xs outline-none focus:border-amber-600 resize-none"
                      />
                    </div>

                    <div className="flex items-center justify-between gap-3 flex-wrap">
                      <div className="flex items-center gap-3 text-xs">
                        <div>
                          <span className="text-[11px] font-bold text-slate-500 mr-1.5">Type:</span>
                          <select value={newAdvType} onChange={(e) => setNewAdvType(e.target.value as any)} className="px-2 py-1 rounded border border-[#DCD8D0] text-xs bg-white">
                            <option value="notice">Notice</option>
                            <option value="guideline">Guideline</option>
                            <option value="verification">Verification</option>
                            <option value="alert">Alert</option>
                          </select>
                        </div>
                        <div>
                          <span className="text-[11px] font-bold text-slate-500 mr-1.5">Severity:</span>
                          <select value={newAdvSeverity} onChange={(e) => setNewAdvSeverity(e.target.value as any)} className="px-2 py-1 rounded border border-[#DCD8D0] text-xs bg-white">
                            <option value="low">Standard (Low)</option>
                            <option value="medium">Important (Medium)</option>
                            <option value="high">Urgent (High)</option>
                          </select>
                        </div>
                      </div>
                      <button type="submit" disabled={isSaving} className="px-4 py-2 rounded-lg bg-[#0F1E36] hover:bg-[#1A2F50] text-white text-xs font-bold transition-colors shadow-xs">
                        Publish Advisory
                      </button>
                    </div>
                  </form>
                </div>

                {/* Filter bar */}
                <div className="flex items-center gap-2 text-xs">
                  <span className="font-bold text-[#0F1E36]">Filter:</span>
                  {(['all', 'ACTIVE', 'RESOLVED'] as const).map((f) => (
                    <button
                      key={f}
                      type="button"
                      onClick={() => setAdvisoryFilter(f)}
                      className={`px-2.5 py-1 rounded-lg font-semibold transition-colors ${
                        advisoryFilter === f ? 'bg-[#0F1E36] text-white' : 'bg-white border border-[#DCD8D0] text-slate-600 hover:bg-[#FAF9F5]'
                      }`}
                    >
                      {f === 'all' ? `All (${advisories.length})` : `${f} (${f === 'ACTIVE' ? activeAdvisories.length : resolvedAdvisories.length})`}
                    </button>
                  ))}
                </div>

                {/* Published Advisories */}
                <div className="space-y-2">
                  {filteredAdvisories.length === 0 && (
                    <p className="text-xs text-slate-400 text-center py-6">No advisories match the current filter.</p>
                  )}
                  {filteredAdvisories.map((adv) => (
                    <div
                      key={adv.id}
                      className={`p-3.5 rounded-xl border text-xs bg-white ${
                        adv.status === 'RESOLVED' ? 'opacity-60 bg-slate-50 border-slate-200' : 'border-[#E5E2DC]'
                      }`}
                    >
                      {editingAdvisoryId === adv.id ? (
                        /* Inline Edit Mode */
                        <div className="space-y-2">
                          <input
                            type="text"
                            value={editAdvTitle}
                            onChange={(e) => setEditAdvTitle(e.target.value)}
                            className="w-full px-3 py-1.5 rounded-lg border border-amber-300 text-xs font-bold outline-none focus:border-amber-600"
                          />
                          <textarea
                            value={editAdvMessage}
                            onChange={(e) => setEditAdvMessage(e.target.value)}
                            rows={2}
                            className="w-full px-3 py-1.5 rounded-lg border border-amber-300 text-xs outline-none focus:border-amber-600 resize-none"
                          />
                          <div className="flex items-center gap-2">
                            <button type="button" onClick={() => handleSaveAdvisoryEdit(adv.id)} disabled={isSaving} className="px-3 py-1 rounded-lg bg-[#0F1E36] text-white text-xs font-bold">
                              {isSaving ? 'Saving...' : 'Save'}
                            </button>
                            <button type="button" onClick={() => setEditingAdvisoryId(null)} className="px-3 py-1 rounded-lg border border-[#DCD8D0] text-xs font-semibold text-slate-600">
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        /* View Mode */
                        <div className="flex items-start justify-between gap-3">
                          <div className="space-y-1 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              {adv.routeNumber && (
                                <span className="px-2 py-0.5 rounded font-mono font-bold bg-amber-100 text-amber-900 text-[10px]">
                                  {adv.routeNumber}
                                </span>
                              )}
                              <span className="font-bold text-[#0F1E36]">{adv.title}</span>
                              <StatusBadge status={adv.status || 'ACTIVE'} />
                              <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                                adv.severity === 'high' ? 'bg-red-100 text-red-700' : adv.severity === 'medium' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'
                              }`}>
                                {(adv.severity || 'low').toUpperCase()}
                              </span>
                            </div>
                            <p className="text-slate-600 leading-relaxed">{adv.message}</p>
                            <div className="flex items-center gap-3 text-[10px] font-mono text-slate-400">
                              <span>{adv.date}</span>
                              {adv.createdAt && <span>Created: {new Date(adv.createdAt).toLocaleString()}</span>}
                              {adv.updatedAt && adv.updatedAt !== adv.createdAt && <span>Updated: {new Date(adv.updatedAt).toLocaleString()}</span>}
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              type="button"
                              onClick={() => { setEditingAdvisoryId(adv.id); setEditAdvTitle(adv.title); setEditAdvMessage(adv.message); }}
                              className="p-1.5 rounded text-slate-500 hover:bg-slate-100"
                              title="Edit advisory"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleUpdateAdvisoryStatus(adv, adv.status === 'ACTIVE' ? 'RESOLVED' : 'ACTIVE')}
                              className="px-2.5 py-1 rounded text-xs font-semibold border border-[#DCD8D0] hover:bg-[#FAF9F5]"
                            >
                              {adv.status === 'ACTIVE' ? 'Resolve' : 'Reactivate'}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteAdvisory(adv)}
                              className="p-1.5 rounded text-red-500 hover:bg-red-50"
                              title="Delete advisory"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ═══════════════ TAB: FLEET & ASSIGNMENTS ═══════════════ */}
            {activeTab === 'fleet' && (
              <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <h3 className="text-sm font-bold text-[#0F1E36]">Bus & Trip Assignments</h3>
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={fleetSearch}
                      onChange={(e) => setFleetSearch(e.target.value)}
                      placeholder="Search route, bus ID..."
                      className="pl-8 pr-3 py-1.5 rounded-lg border border-[#DCD8D0] text-xs bg-white outline-none focus:border-amber-600 w-56"
                    />
                  </div>
                </div>

                {trips.length === 0 ? (
                  <div className="text-center py-12 space-y-2">
                    <Bus className="w-8 h-8 text-slate-300 mx-auto" />
                    <p className="text-xs text-slate-500">No trip data available. Trip data is populated from the boarding system.</p>
                    <p className="text-[10px] text-slate-400">Open the Conductor Portal from the main interface to initialize trip records.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredTrips.map((trip) => {
                      const isSelected = selectedTripId === trip.tripId;
                      const availableSeats = Math.max(0, trip.maxCapacity - trip.verifiedOccupancy - trip.confirmedReservationsCount);
                      const occupancyPct = Math.round((trip.verifiedOccupancy / trip.maxCapacity) * 100);
                      const staleMs = Date.now() - trip.lastOccupancyVerifiedAt;
                      const staleMinutes = Math.round(staleMs / 60000);
                      const isStale = staleMs > 25 * 60 * 1000;

                      return (
                        <div key={trip.tripId} className="rounded-xl border border-[#E5E2DC] bg-white overflow-hidden">
                          <button
                            type="button"
                            onClick={() => setSelectedTripId(isSelected ? null : trip.tripId)}
                            className="w-full p-3 text-left flex items-center justify-between gap-3 hover:bg-[#FAF9F5] transition-colors"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-8 h-8 rounded-lg bg-[#FAF9F5] border border-[#E5E2DC] flex items-center justify-center">
                                <Hash className="w-3.5 h-3.5 text-amber-600" />
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-bold text-[#0F1E36]">{trip.routeLabel}</span>
                                  <StatusBadge status={trip.operatingStatus} />
                                  {isStale && <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-orange-100 text-orange-700 border border-orange-200">STALE</span>}
                                </div>
                                <span className="text-[11px] text-slate-500 block truncate">{trip.startingLocation} → CVR Campus</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-3 shrink-0">
                              <div className="text-right">
                                <span className="text-xs font-mono font-bold text-[#0F1E36]">{trip.busIdentifier}</span>
                                <span className="block text-[10px] text-slate-500">{trip.departureTime}</span>
                              </div>
                              <div className="text-right">
                                <span className={`text-xs font-bold ${occupancyPct > 90 ? 'text-red-600' : occupancyPct > 70 ? 'text-amber-600' : 'text-emerald-600'}`}>
                                  {trip.verifiedOccupancy}/{trip.maxCapacity}
                                </span>
                                <span className="block text-[10px] text-slate-400">{availableSeats} avail.</span>
                              </div>
                              {isSelected ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                            </div>
                          </button>

                          {isSelected && (
                            <div className="border-t border-[#E5E2DC] p-3 bg-[#FAF9F5] space-y-3">
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                                <div className="p-2 rounded-lg bg-white border border-[#E5E2DC]">
                                  <span className="text-[10px] text-slate-400 block">Max Capacity</span>
                                  <span className="font-bold text-[#0F1E36]">{trip.maxCapacity} seats</span>
                                </div>
                                <div className="p-2 rounded-lg bg-white border border-[#E5E2DC]">
                                  <span className="text-[10px] text-slate-400 block">Verified Occupancy</span>
                                  <span className={`font-bold ${isStale ? 'text-orange-600' : 'text-[#0F1E36]'}`}>
                                    {trip.verifiedOccupancy} {isStale ? '(stale)' : ''}
                                  </span>
                                </div>
                                <div className="p-2 rounded-lg bg-white border border-[#E5E2DC]">
                                  <span className="text-[10px] text-slate-400 block">Confirmed Reservations</span>
                                  <span className="font-bold text-[#0F1E36]">{trip.confirmedReservationsCount}</span>
                                </div>
                                <div className="p-2 rounded-lg bg-white border border-[#E5E2DC]">
                                  <span className="text-[10px] text-slate-400 block">Pending Requests</span>
                                  <span className="font-bold text-[#0F1E36]">{trip.pendingRequestsCount}</span>
                                </div>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                                <div className="p-2 rounded-lg bg-white border border-[#E5E2DC]">
                                  <span className="text-[10px] text-slate-400 block">Occupancy Last Verified</span>
                                  <span className={`font-mono text-[11px] ${isStale ? 'text-orange-600 font-bold' : 'text-slate-700'}`}>
                                    {staleMinutes < 1 ? 'Just now' : `${staleMinutes} min ago`}
                                    {isStale && ' — Unverified'}
                                  </span>
                                </div>
                                <div className="p-2 rounded-lg bg-white border border-[#E5E2DC]">
                                  <span className="text-[10px] text-slate-400 block">Verified By</span>
                                  <span className="text-[11px] text-slate-700">{trip.lastOccupancyVerifiedBy || 'Not yet verified'}</span>
                                </div>
                              </div>

                              <div className="flex items-center gap-2 text-xs">
                                <span className={`flex items-center gap-1.5 px-2 py-1 rounded-lg font-semibold ${
                                  trip.isAcceptingRequests ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-800 border border-red-200'
                                }`}>
                                  {trip.isAcceptingRequests ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                                  {trip.isAcceptingRequests ? 'Accepting Boarding' : 'Not Accepting'}
                                </span>
                                {trip.driverSafetyAcknowledged && (
                                  <span className="flex items-center gap-1 px-2 py-1 rounded-lg bg-blue-50 text-blue-800 border border-blue-200 font-semibold">
                                    <UserCheck className="w-3 h-3" /> Driver Safety Acknowledged
                                  </span>
                                )}
                              </div>

                              <p className="text-[10px] text-slate-400 italic">
                                Driver and substitute assignments are managed by the Transport Office. Bus identifier and capacity are set per trip.
                              </p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* ═══════════════ TAB: BOARDING REQUESTS ═══════════════ */}
            {activeTab === 'boarding' && (
              <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <h3 className="text-sm font-bold text-[#0F1E36]">Boarding Request Oversight</h3>
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={boardingSearch}
                      onChange={(e) => setBoardingSearch(e.target.value)}
                      placeholder="Search student, route, stop..."
                      className="pl-8 pr-3 py-1.5 rounded-lg border border-[#DCD8D0] text-xs bg-white outline-none focus:border-amber-600 w-56"
                    />
                  </div>
                </div>

                {/* Filter bar */}
                <div className="flex items-center gap-1.5 text-xs flex-wrap">
                  {(['all', 'PENDING', 'ACCEPTED', 'REJECTED', 'EXPIRED'] as const).map((f) => {
                    const count = f === 'all' ? boardingRequests.length : boardingRequests.filter(r => r.status === f).length;
                    return (
                      <button
                        key={f}
                        type="button"
                        onClick={() => setBoardingFilter(f)}
                        className={`px-2.5 py-1 rounded-lg font-semibold transition-colors ${
                          boardingFilter === f ? 'bg-[#0F1E36] text-white' : 'bg-white border border-[#DCD8D0] text-slate-600 hover:bg-[#FAF9F5]'
                        }`}
                      >
                        {f === 'all' ? 'All' : f} ({count})
                      </button>
                    );
                  })}
                </div>

                {boardingRequests.length === 0 ? (
                  <div className="text-center py-12 space-y-2">
                    <Ticket className="w-8 h-8 text-slate-300 mx-auto" />
                    <p className="text-xs text-slate-500">No boarding requests yet.</p>
                    <p className="text-[10px] text-slate-400">Students can submit boarding requests via the "Missed Bus?" button.</p>
                  </div>
                ) : filteredBoardingRequests.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-6">No requests match the current filter.</p>
                ) : (
                  <div className="space-y-2">
                    {filteredBoardingRequests.map((req) => (
                      <div key={req.id} className="p-3.5 rounded-xl border border-[#E5E2DC] bg-white text-xs space-y-2">
                        <div className="flex items-start justify-between gap-3">
                          <div className="space-y-1 flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-[#0F1E36]">{req.studentName}</span>
                              <StatusBadge status={req.status} />
                              <span className="px-2 py-0.5 rounded font-mono text-[10px] font-bold bg-amber-100 text-amber-900">{req.routeLabel}</span>
                            </div>
                            <div className="flex items-center gap-2 text-slate-600 flex-wrap">
                              <span>📍 {req.pickupStop}</span>
                              <span className="text-slate-300">→</span>
                              <span>{req.destinationStop}</span>
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <span className="text-[10px] font-mono text-slate-400 block">
                              {new Date(req.requestedAt).toLocaleTimeString()}
                            </span>
                            <span className="text-[10px] font-mono text-slate-400 block">
                              {req.id.substring(0, 12)}...
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 text-[10px] text-slate-500 flex-wrap">
                          <span>Trip: {req.tripId}</span>
                          {req.missedBusRouteNumber && <span>Missed: Route {req.missedBusRouteNumber}</span>}
                          <span>Expires: {new Date(req.expiresAt).toLocaleTimeString()}</span>
                          {req.seatPassCode && <span className="font-bold text-emerald-700">Pass: {req.seatPassCode}</span>}
                        </div>

                        {req.rejectionReason && (
                          <div className="p-2 rounded-lg bg-red-50 border border-red-100 text-red-800 text-[11px]">
                            <span className="font-bold">Rejection:</span> {req.rejectionReason}
                          </div>
                        )}
                        {req.conductorNote && (
                          <div className="p-2 rounded-lg bg-blue-50 border border-blue-100 text-blue-800 text-[11px]">
                            <span className="font-bold">Conductor Note:</span> {req.conductorNote}
                          </div>
                        )}

                        <p className="text-[10px] text-slate-400 italic">
                          Boarding decisions are made by the assigned conductor. Admin can monitor but should not override capacity protection.
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ═══════════════ TAB: SECURITY ═══════════════ */}
            {activeTab === 'security' && (
              <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-5 text-xs">
                
                <div className="p-4 rounded-xl border border-[#E5E2DC] bg-[#FAF9F5] space-y-3">
                  <div className="flex items-center gap-2 text-sm font-bold text-[#0F1E36]">
                    <Database className="w-4 h-4 text-amber-600" />
                    <span>Firebase Realtime Database Diagnostics</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="p-3 rounded-lg bg-white border border-[#E5E2DC]">
                      <span className="text-[10px] text-slate-400 uppercase font-mono block">Sync Engine State</span>
                      <span className="text-xs font-bold text-[#0F1E36]">{syncStatus}</span>
                    </div>
                    <div className="p-3 rounded-lg bg-white border border-[#E5E2DC]">
                      <span className="text-[10px] text-slate-400 uppercase font-mono block">Fallback Guarantee</span>
                      <span className="text-xs font-bold text-emerald-800">
                        {diagnostics.isConfigured ? 'Cloud Active + Local Sync' : 'Verified Local Fallback Active'}
                      </span>
                    </div>
                    <div className="p-3 rounded-lg bg-white border border-[#E5E2DC]">
                      <span className="text-[10px] text-slate-400 uppercase font-mono block">Database Endpoint</span>
                      <span className="text-xs font-mono text-slate-700 break-all">{diagnostics.databaseURL}</span>
                    </div>
                    <div className="p-3 rounded-lg bg-white border border-[#E5E2DC]">
                      <span className="text-[10px] text-slate-400 uppercase font-mono block">Project ID</span>
                      <span className="text-xs font-mono text-slate-700">{diagnostics.projectId}</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/50 space-y-2">
                  <div className="flex items-center gap-2 font-bold text-emerald-950">
                    <ShieldCheck className="w-4 h-4 text-emerald-700" />
                    <span>Database Security Rules</span>
                  </div>
                  <div className="space-y-1.5 text-[11px] text-emerald-900 leading-relaxed">
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                      <span>Public read access for students to query routes and advisories.</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                      <span>Route and advisory writes require <code className="bg-emerald-100 px-1 rounded">auth.token.admin === true</code> or <code className="bg-emerald-100 px-1 rounded">role === 'transport_admin'</code>.</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                      <span>Trip capacity writes restricted to admin or assigned conductor.</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                      <span>Boarding request writes require auth or student ownership.</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                      <span>Phone number validation blocks private contact data from all fields.</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/50 space-y-2">
                  <div className="flex items-center gap-2 font-bold text-amber-950">
                    <AlertTriangle className="w-4 h-4 text-amber-700" />
                    <span>Known Limitations</span>
                  </div>
                  <div className="space-y-1.5 text-[11px] text-amber-900 leading-relaxed">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                      <span>The admin passkey (<code className="bg-amber-100 px-1 rounded">CVR-TRANS-2026</code>) is a frontend demo credential, visible in the JavaScript bundle. Production deployment requires Firebase Authentication with server-enforced custom claims.</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                      <span>Local fallback edits do not synchronize to other devices. Only Firebase-connected mode ensures multi-device consistency.</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                      <span>Firebase environment variables (<code className="bg-amber-100 px-1 rounded">.env</code>) must be configured for cloud mode. Without them, all writes are local-only.</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-[#E5E2DC] bg-[#FAF9F5] space-y-2">
                  <div className="flex items-center gap-2 font-bold text-[#0F1E36]">
                    <RefreshCw className="w-4 h-4 text-slate-600" />
                    <span>Data Persistence</span>
                  </div>
                  <div className="space-y-1 text-[11px] text-slate-700">
                    <p>• Routes and advisories are cached in <code className="bg-slate-100 px-1 rounded">localStorage</code> for offline resilience.</p>
                    <p>• When Firebase is connected, localStorage syncs bidirectionally on each listener update.</p>
                    <p>• Resetting routes clears the local cache and re-seeds from the official 54-route circular dataset.</p>
                  </div>
                </div>
              </div>
            )}

          </div>
        )}

        {/* ─── Footer ─── */}
        <div className="p-3.5 bg-[#FAF9F5] border-t border-[#E5E2DC] flex items-center justify-between text-xs text-slate-500 shrink-0">
          <span className="font-mono text-[11px]">
            CVR College of Engineering • Transport Department Console
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-[#0F1E36] text-white font-bold text-xs hover:bg-[#1A2F50]"
          >
            Close Console
          </button>
        </div>

      </div>

      {/* Confirmation Dialog */}
      {confirmDialog && (
        <ConfirmDialog
          title={confirmDialog.title}
          message={confirmDialog.message}
          danger={confirmDialog.danger}
          onConfirm={confirmDialog.onConfirm}
          onCancel={() => setConfirmDialog(null)}
          confirmLabel={confirmDialog.danger ? 'Yes, Proceed' : 'Confirm'}
        />
      )}
    </div>
  );
};
