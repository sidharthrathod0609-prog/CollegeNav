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
  Search,
  Info,
  XCircle,
  UserCheck,
  Menu,
  Shield,
  Send,
  Check,
} from 'lucide-react';
import type { CVRRoute, CVRRouteStop } from '../data/cvrRoutes';
import type { TransportAdvisory } from '../types/transit';
import type { BoardingRequest, TripCapacityState } from '../types/boarding';
import { REJECTION_REASONS } from '../types/boarding';
import { getFirebaseConnectionDiagnostics } from '../services/firebaseConfig';
import { validateDepartureTime } from '../services/transportDataService';
import { acceptBoardingRequest, rejectBoardingRequest } from '../services/boardingService';

export type AdminTab = 
  | 'overview' 
  | 'routes' 
  | 'boarding' 
  | 'buses' 
  | 'advisories' 
  | 'settings'
  | 'dashboard' 
  | 'fleet' 
  | 'security';

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
  <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-150" onClick={onCancel}>
    <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 space-y-4 border border-[#E5E2DC]" onClick={(e) => e.stopPropagation()}>
      <div className="flex items-start gap-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${danger ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-700'}`}>
          {danger ? <AlertTriangle className="w-5 h-5" /> : <Info className="w-5 h-5" />}
        </div>
        <div>
          <h4 className="text-sm font-bold text-[#0F1E36]">{title}</h4>
          <p className="text-xs text-slate-600 mt-1 leading-relaxed">{message}</p>
        </div>
      </div>
      <div className="flex items-center gap-2 justify-end pt-2">
        <button type="button" onClick={onCancel} className="px-3.5 py-2 rounded-xl text-xs font-semibold border border-[#DCD8D0] hover:bg-[#FAF9F5] text-slate-700 transition-colors">
          {cancelLabel}
        </button>
        <button type="button" onClick={onConfirm} className={`px-4 py-2 rounded-xl text-xs font-bold text-white shadow-sm transition-colors ${danger ? 'bg-red-600 hover:bg-red-700' : 'bg-[#0F1E36] hover:bg-[#1A2F50]'}`}>
          {confirmLabel}
        </button>
      </div>
    </div>
  </div>
);

// ─── Rejection Reason Dialog ───
const RejectionDialog: React.FC<{
  isOpen: boolean;
  request: BoardingRequest | null;
  onClose: () => void;
  onConfirm: (reason: string) => void;
}> = ({ isOpen, request, onClose, onConfirm }) => {
  const [selectedReason, setSelectedReason] = useState<string>(REJECTION_REASONS[0]);

  if (!isOpen || !request) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-150" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4 border border-[#E5E2DC]" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-100 text-red-600 flex items-center justify-center shrink-0">
            <XCircle className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-[#0F1E36]">Decline Boarding Request</h4>
            <p className="text-xs text-slate-600 mt-0.5">
              Select reason for declining seat request for <strong className="text-[#0F1E36]">{request.studentName}</strong> ({request.studentId}).
            </p>
          </div>
        </div>

        <div className="space-y-2 pt-1">
          <label className="block text-xs font-bold text-slate-700">Official Operational Reason</label>
          <div className="space-y-1.5">
            {REJECTION_REASONS.map((reason) => (
              <label 
                key={reason} 
                className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-xs cursor-pointer transition-colors ${
                  selectedReason === reason 
                    ? 'border-red-400 bg-red-50/50 text-red-950 font-semibold' 
                    : 'border-[#E5E2DC] hover:bg-[#FAF9F5] text-slate-700'
                }`}
              >
                <input 
                  type="radio" 
                  name="reject_reason" 
                  checked={selectedReason === reason} 
                  onChange={() => setSelectedReason(reason)}
                  className="accent-red-600"
                />
                <span>{reason}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2 justify-end pt-3 border-t border-[#E5E2DC]">
          <button type="button" onClick={onClose} className="px-3.5 py-2 rounded-xl text-xs font-semibold border border-[#DCD8D0] hover:bg-[#FAF9F5] text-slate-700">
            Cancel
          </button>
          <button 
            type="button" 
            onClick={() => onConfirm(selectedReason)} 
            className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-red-600 hover:bg-red-700 transition-colors shadow-sm"
          >
            Confirm Decline
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Status Badge ───
const StatusBadge: React.FC<{ status: string; size?: 'sm' | 'md' }> = ({ status, size = 'sm' }) => {
  const styles: Record<string, string> = {
    ACTIVE: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    RESOLVED: 'bg-slate-100 text-slate-600 border-slate-200',
    PENDING: 'bg-amber-50 text-amber-900 border-amber-300 font-bold',
    ACCEPTED: 'bg-blue-50 text-blue-800 border-blue-200 font-bold',
    REJECTED: 'bg-red-50 text-red-800 border-red-200 font-bold',
    EXPIRED: 'bg-slate-100 text-slate-500 border-slate-200',
    BOARDED: 'bg-emerald-50 text-emerald-800 border-emerald-300 font-bold',
    CANCELLED: 'bg-slate-100 text-slate-500 border-slate-200',
    BOARDING_OPEN: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    AT_CAPACITY: 'bg-red-50 text-red-800 border-red-200 font-bold',
    STANDBY: 'bg-amber-50 text-amber-800 border-amber-200',
    SCHEDULED: 'bg-blue-50 text-blue-700 border-blue-200',
    COMPLETED: 'bg-slate-100 text-slate-700 border-slate-200',
  };
  const cls = styles[status] || 'bg-slate-100 text-slate-600 border-slate-200';
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full border font-mono tracking-tight font-semibold ${size === 'sm' ? 'text-[10px]' : 'text-xs'} ${cls}`}>
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
  const [rawTab, setRawTab] = useState<AdminTab>('overview');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Normalize legacy tab names
  const activeTab = useMemo<AdminTab>(() => {
    if (rawTab === 'dashboard') return 'overview';
    if (rawTab === 'fleet') return 'buses';
    if (rawTab === 'security') return 'settings';
    return rawTab;
  }, [rawTab]);

  const setActiveTab = (tab: AdminTab) => {
    setRawTab(tab);
    setMobileMenuOpen(false);
  };

  // ─── Route Editor & Drawer State ───
  const [selectedRouteId, setSelectedRouteId] = useState<string>(routes[0]?.id || 'cvr-route-1');
  const [routeSearchFilter, setRouteSearchFilter] = useState('');
  const [routeStatusFilter, setRouteStatusFilter] = useState<'all' | 'complete' | 'incomplete'>('all');
  const [isRouteDrawerOpen, setIsRouteDrawerOpen] = useState(false);

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
  const [isComposeAdvisoryOpen, setIsComposeAdvisoryOpen] = useState(false);
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
  const [fleetFilter, setFleetFilter] = useState<'all' | 'BOARDING_OPEN' | 'AT_CAPACITY' | 'STANDBY' | 'stale'>('all');
  const [selectedTripId, setSelectedTripId] = useState<string | null>(null);

  // ─── Boarding State ───
  const [boardingFilter, setBoardingFilter] = useState<'all' | 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED'>('all');
  const [boardingSearch, setBoardingSearch] = useState('');
  const [rejectingRequest, setRejectingRequest] = useState<BoardingRequest | null>(null);

  // ─── Operational Feedback & Dialogs ───
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{ title: string; message: string; danger?: boolean; onConfirm: () => void } | null>(null);

  const showSuccess = useCallback((msg: string) => {
    setActionSuccess(msg);
    setActionError(null);
    setTimeout(() => setActionSuccess(null), 4000);
  }, []);

  const showError = useCallback((msg: string) => {
    setActionError(msg);
    setActionSuccess(null);
  }, []);

  const handleOpenRouteEditor = (route: CVRRoute) => {
    setSelectedRouteId(route.id);
    setEditDepartureTime(route.departureTime);
    setEditStartingLocation(route.startingLocation);
    setEditDestination(route.destination);
    setEditStops([...route.stops]);
    setRouteValidationError(null);
    setIsRouteDrawerOpen(true);
  };

  // Sync editStops whenever the activeRoute reference changes
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
      setIsRouteDrawerOpen(false);
    } else {
      showError(result.error || 'Failed to update route');
    }
  };

  const handleResetDefaults = () => {
    setConfirmDialog({
      title: 'Reset All Routes to Official Data?',
      message: 'This will revert ALL 54 route schedules and stop sequences back to the official CVR circular dataset. Any custom edits will be lost.',
      danger: true,
      onConfirm: async () => {
        setConfirmDialog(null);
        const result = await onResetRouteDefaults(passkeyInput);
        if (result.success) {
          showSuccess('All 54 routes successfully reset to official circular records.');
          setIsRouteDrawerOpen(false);
        } else {
          showError(result.error || 'Failed to reset route records.');
        }
      },
    });
  };

  // ─── Stop Sequencer Handlers ───
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
      id: `${activeRoute.id}-stop-${Date.now()}`,
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
      setIsComposeAdvisoryOpen(false);
      showSuccess('Service advisory published successfully.');
    } else {
      showError(result.error || 'Failed to publish advisory');
    }
  };

  const handleUpdateAdvisoryStatus = async (adv: TransportAdvisory, newStatus: 'ACTIVE' | 'RESOLVED') => {
    const result = await onUpdateAdvisory(adv.id, { status: newStatus }, passkeyInput);
    if (result.success) showSuccess(`Advisory marked as ${newStatus}.`);
    else showError(result.error || 'Failed to update advisory status');
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
        if (result.success) showSuccess('Advisory permanently deleted.');
        else showError(result.error || 'Failed to delete advisory');
      },
    });
  };

  // ─── Boarding Actions (Admin Dispatcher Supervision) ───
  const handleApproveBoarding = async (req: BoardingRequest) => {
    setIsSaving(true);
    const result = await acceptBoardingRequest(req.id, passkeyInput);
    setIsSaving(false);
    if (result.success) {
      showSuccess(`Approved seat reservation for ${req.studentName} (Pass: ${result.request?.seatPassCode})`);
    } else {
      showError(result.error || 'Failed to approve request');
    }
  };

  const handleConfirmRejectBoarding = async (reason: string) => {
    if (!rejectingRequest) return;
    setIsSaving(true);
    const result = await rejectBoardingRequest(rejectingRequest.id, reason as any, passkeyInput);
    setIsSaving(false);
    setRejectingRequest(null);
    if (result.success) {
      showSuccess(`Request for ${rejectingRequest.studentName} declined (${reason})`);
    } else {
      showError(result.error || 'Failed to decline request');
    }
  };

  // ─── Filtered Data ───
  const incompleteRoutes = routes.filter((r) => r.isIncomplete);
  const activeAdvisories = advisories.filter((a) => a.status === 'ACTIVE');
  const resolvedAdvisories = advisories.filter((a) => a.status === 'RESOLVED');
  const pendingRequests = boardingRequests.filter((r) => r.status === 'PENDING');
  const acceptedRequests = boardingRequests.filter((r) => r.status === 'ACCEPTED');

  const filteredRoutes = routes.filter((r) => {
    const matchesSearch = 
      r.routeLabel.toLowerCase().includes(routeSearchFilter.toLowerCase()) ||
      r.startingLocation.toLowerCase().includes(routeSearchFilter.toLowerCase()) ||
      r.routeNumber.toString().includes(routeSearchFilter) ||
      r.stops.some(s => s.name.toLowerCase().includes(routeSearchFilter.toLowerCase()));
    
    if (routeStatusFilter === 'complete') return matchesSearch && !r.isIncomplete;
    if (routeStatusFilter === 'incomplete') return matchesSearch && r.isIncomplete;
    return matchesSearch;
  });

  const filteredAdvisories = advisories.filter((a) => {
    if (advisoryFilter === 'all') return true;
    return a.status === advisoryFilter;
  });

  const filteredTrips = trips.filter((t) => {
    const matchesSearch = 
      t.routeLabel.toLowerCase().includes(fleetSearch.toLowerCase()) ||
      t.busIdentifier.toLowerCase().includes(fleetSearch.toLowerCase()) ||
      t.startingLocation.toLowerCase().includes(fleetSearch.toLowerCase()) ||
      t.routeNumber.toString().includes(fleetSearch);
    
    if (!matchesSearch) return false;
    if (fleetFilter === 'stale') {
      const ageMs = Date.now() - t.lastOccupancyVerifiedAt;
      return ageMs > 25 * 60 * 1000;
    }
    if (fleetFilter !== 'all') {
      return t.operatingStatus === fleetFilter;
    }
    return true;
  });

  const filteredBoardingRequests = boardingRequests.filter((r) => {
    const matchesFilter = boardingFilter === 'all' || r.status === boardingFilter;
    const matchesSearch = !boardingSearch || 
      r.routeLabel.toLowerCase().includes(boardingSearch.toLowerCase()) ||
      r.studentName.toLowerCase().includes(boardingSearch.toLowerCase()) ||
      r.studentId.toLowerCase().includes(boardingSearch.toLowerCase()) ||
      r.pickupStop.toLowerCase().includes(boardingSearch.toLowerCase()) ||
      r.id.toLowerCase().includes(boardingSearch.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const diagnostics = getFirebaseConnectionDiagnostics();

  // Navigation Items matching Step 2 specification
  const navItems: { key: AdminTab; label: string; icon: React.ReactNode; badge?: number; badgeColor?: string }[] = [
    { key: 'overview', label: 'Overview', icon: <LayoutDashboard className="w-4 h-4" /> },
    { key: 'routes', label: 'Routes & Stops', icon: <Bus className="w-4 h-4" />, badge: routes.length },
    { key: 'boarding', label: 'Boarding Requests', icon: <Ticket className="w-4 h-4" />, badge: pendingRequests.length, badgeColor: pendingRequests.length > 0 ? 'bg-amber-500 text-white' : undefined },
    { key: 'buses', label: 'Buses & Assignments', icon: <Users className="w-4 h-4" />, badge: trips.length },
    { key: 'advisories', label: 'Service Advisories', icon: <Bell className="w-4 h-4" />, badge: activeAdvisories.length, badgeColor: activeAdvisories.length > 0 ? 'bg-amber-500 text-white' : undefined },
    { key: 'settings', label: 'Settings & Status', icon: <ShieldCheck className="w-4 h-4" /> },
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-[#0F1E36]/80 backdrop-blur-xs flex items-center justify-center p-0 sm:p-3 lg:p-4 animate-in fade-in duration-200">
      
      {/* ─── Control Center Shell ─── */}
      <div 
        className="bg-[#FAF9F5] w-full h-full sm:h-[94vh] sm:max-w-7xl sm:rounded-2xl border border-[#DCD8D0] shadow-2xl overflow-hidden flex flex-col sm:flex-row relative"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* ═══════════════ LEFT SIDEBAR ═══════════════ */}
        <aside 
          className={`
            fixed inset-y-0 left-0 z-40 w-64 bg-[#0F1E36] text-white flex flex-col justify-between border-r border-[#1B2B48] transition-transform duration-200 ease-in-out
            sm:static sm:translate-x-0 sm:z-auto
            ${mobileMenuOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'}
          `}
        >
          {/* Sidebar Top: Brand & Title */}
          <div>
            <div className="p-4 sm:p-5 border-b border-[#1A2C4B] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center font-black">
                  <Bus className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <h2 className="text-sm font-black tracking-tight text-white flex items-center gap-1.5">
                    CollegeNav
                    <span className="text-[10px] px-1.5 py-0.2 rounded font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      OPS
                    </span>
                  </h2>
                  <p className="text-[11px] text-slate-400 font-medium">Transport Command Centre</p>
                </div>
              </div>

              {/* Close Mobile Menu */}
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="sm:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Sidebar Navigation Links */}
            <nav className="p-3 space-y-1">
              <div className="px-3 py-1.5 text-[10px] font-mono uppercase tracking-wider text-slate-400 font-semibold">
                Operations Menu
              </div>
              {navItems.map((item) => {
                const isActive = activeTab === item.key;
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setActiveTab(item.key)}
                    className={`
                      w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all
                      ${isActive 
                        ? 'bg-[#1A2E4E] text-white shadow-xs border border-amber-500/30 text-amber-300' 
                        : 'text-slate-300 hover:text-white hover:bg-white/5'}
                    `}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className={isActive ? 'text-amber-400' : 'text-slate-400'}>
                        {item.icon}
                      </span>
                      <span>{item.label}</span>
                    </div>
                    {item.badge !== undefined && item.badge > 0 && (
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                        item.badgeColor || (isActive ? 'bg-amber-400 text-[#0F1E36]' : 'bg-[#1A2C4B] text-slate-300')
                      }`}>
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Sidebar Footer: Authority & Session */}
          <div className="p-4 border-t border-[#1A2C4B] space-y-3 bg-[#0B172B]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${syncStatus === 'CONNECTED_CLOUD' ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
                <span className="text-[11px] font-mono font-semibold text-slate-300">
                  {syncStatus === 'CONNECTED_CLOUD' ? 'Cloud RTDB' : 'Local Fallback'}
                </span>
              </div>
              <span className="text-[10px] font-mono text-slate-400">CVR-TRANS</span>
            </div>

            {isAuthenticated ? (
              <div className="flex items-center justify-between pt-1">
                <div className="min-w-0">
                  <span className="text-xs font-bold text-white block truncate">Admin In-Charge</span>
                  <span className="text-[10px] text-slate-400 block truncate">Transport Office</span>
                </div>
                <button
                  type="button"
                  onClick={() => { setIsAuthenticated(false); setPasskeyInput(''); }}
                  className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-slate-200 transition-colors"
                  title="Lock console session"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div className="text-[11px] text-slate-400 italic">
                Authentication Required
              </div>
            )}
          </div>
        </aside>

        {/* Backdrop for Mobile Sidebar */}
        {mobileMenuOpen && (
          <div 
            className="fixed inset-0 z-30 bg-black/50 sm:hidden" 
            onClick={() => setMobileMenuOpen(false)}
          />
        )}

        {/* ═══════════════ MAIN VIEWPORT ═══════════════ */}
        <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden bg-[#FAF9F5]">
          
          {/* ─── Compact Top Bar ─── */}
          <header className="h-14 px-4 sm:px-6 bg-white border-b border-[#E5E2DC] flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              {/* Mobile Hamburger Button */}
              <button
                type="button"
                onClick={() => setMobileMenuOpen(true)}
                className="sm:hidden p-1.5 rounded-lg border border-[#DCD8D0] text-[#0F1E36] hover:bg-[#FAF9F5]"
                title="Open menu"
              >
                <Menu className="w-4 h-4" />
              </button>

              <div>
                <h1 className="text-sm sm:text-base font-black text-[#0F1E36] tracking-tight capitalize">
                  {activeTab === 'overview' && 'Operations Overview'}
                  {activeTab === 'routes' && 'Routes & Stop Sequences'}
                  {activeTab === 'boarding' && 'Boarding Requests Oversight'}
                  {activeTab === 'buses' && 'Buses & Trip Capacity'}
                  {activeTab === 'advisories' && 'Service Advisories & Broadcasts'}
                  {activeTab === 'settings' && 'System Health & Settings'}
                </h1>
                <p className="text-[11px] text-slate-500 hidden sm:block">
                  {activeTab === 'overview' && 'Real-time telemetry and transport network status'}
                  {activeTab === 'routes' && 'Official 54 CVR transit corridors, schedules, and ordered stops'}
                  {activeTab === 'boarding' && 'Review and authorize ad-hoc seat reservations for missed buses'}
                  {activeTab === 'buses' && '52-seater coach assignments, live occupancy, and headcount freshness'}
                  {activeTab === 'advisories' && 'Publish schedule modifications, route delays, or weather notices'}
                  {activeTab === 'settings' && 'Firebase connection diagnostics and data persistence controls'}
                </p>
              </div>
            </div>

            {/* Top Bar Actions */}
            <div className="flex items-center gap-2">
              {/* Cloud Connection Badge */}
              <div className={`hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono font-semibold border ${
                syncStatus === 'CONNECTED_CLOUD' 
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
                  : 'bg-amber-50 text-amber-900 border-amber-200'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${syncStatus === 'CONNECTED_CLOUD' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                {syncStatus === 'CONNECTED_CLOUD' ? 'Firebase RTDB Sync' : 'Local Verified Mode'}
              </div>

              {/* Close Button */}
              <button
                onClick={onClose}
                type="button"
                className="w-8 h-8 rounded-full border border-[#DCD8D0] hover:bg-slate-100 text-slate-600 flex items-center justify-center transition-colors"
                title="Exit transport administration"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </header>

          {/* ─── Global Notifications ─── */}
          {actionSuccess && (
            <div className="bg-emerald-50 border-b border-emerald-200 px-4 py-2 text-xs text-emerald-900 font-semibold flex items-center gap-2 shrink-0">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="flex-1">{actionSuccess}</span>
              <button type="button" onClick={() => setActionSuccess(null)} className="text-emerald-700 hover:text-emerald-950">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
          {actionError && (
            <div className="bg-red-50 border-b border-red-200 px-4 py-2 text-xs text-red-900 font-semibold flex items-center gap-2 shrink-0">
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
              <span className="flex-1">{actionError}</span>
              <button type="button" onClick={() => setActionError(null)} className="text-red-700 hover:text-red-950">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* ═══════════════ AUTHENTICATION SCREEN ═══════════════ */}
          {!isAuthenticated ? (
            <div className="flex-1 p-6 sm:p-12 overflow-y-auto flex items-center justify-center">
              <div className="max-w-md w-full bg-white rounded-2xl border border-[#E5E2DC] shadow-sm p-6 sm:p-8 space-y-5 text-center">
                <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center mx-auto">
                  <Lock className="w-6 h-6 text-amber-600" />
                </div>
                <div>
                  <h3 className="text-base font-black text-[#0F1E36]">Authorized Staff Access</h3>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    Enter the CVR Transport Department administrator passkey to access route controls, fleet telematics, and boarding approvals.
                  </p>
                </div>
                <form onSubmit={handleLogin} className="space-y-3">
                  <div className="text-left space-y-1">
                    <label className="block text-xs font-bold text-[#0F1E36]">
                      Administrator Passkey
                    </label>
                    <input
                      type="password"
                      value={passkeyInput}
                      onChange={(e) => setPasskeyInput(e.target.value)}
                      placeholder="Enter administrator passkey..."
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#DCD8D0] focus:border-amber-600 focus:ring-2 focus:ring-amber-500/10 text-sm font-medium outline-none transition-all"
                      autoFocus
                    />
                  </div>
                  {authError && (
                    <p className="text-xs text-red-600 font-semibold text-left">{authError}</p>
                  )}
                  <button
                    type="submit"
                    className="w-full py-2.5 rounded-xl bg-[#0F1E36] hover:bg-[#1A2F50] text-white font-bold text-xs sm:text-sm transition-colors shadow-sm"
                  >
                    Authorize Transport Console
                  </button>
                </form>
                <div className="p-3 rounded-xl bg-[#FAF9F5] border border-[#E5E2DC] text-[11px] text-slate-600 font-mono text-center">
                  Demo Passkey: <strong className="text-[#0F1E36]">CVR-TRANS-2026</strong>
                </div>
              </div>
            </div>
          ) : (
            /* ═══════════════ AUTHENTICATED WORKSPACE ═══════════════ */
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">

              {/* ────────────────────────────────────────────────────────
                  TAB 1: OVERVIEW
                 ──────────────────────────────────────────────────────── */}
              {activeTab === 'overview' && (
                <div className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto space-y-6">
                  
                  {/* KPI Row (Derived from accurate application data) */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                    <div className="p-4 rounded-xl bg-white border border-[#E5E2DC] space-y-1 shadow-2xs">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-semibold">Total Corridors</span>
                        <Bus className="w-4 h-4 text-[#0F1E36]" />
                      </div>
                      <div className="text-2xl font-black text-[#0F1E36]">{routes.length}</div>
                      <span className="text-[11px] text-slate-500">Official scheduled CVR routes</span>
                    </div>

                    <div className="p-4 rounded-xl bg-white border border-[#E5E2DC] space-y-1 shadow-2xs">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-semibold">Incomplete Corridors</span>
                        <AlertTriangle className="w-4 h-4 text-amber-500" />
                      </div>
                      <div className="text-2xl font-black text-amber-600">{incompleteRoutes.length}</div>
                      <span className="text-[11px] text-slate-500 font-medium">Routes 21 & 39 need verification</span>
                    </div>

                    <div className="p-4 rounded-xl bg-white border border-[#E5E2DC] space-y-1 shadow-2xs">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-semibold">Pending Requests</span>
                        <Ticket className="w-4 h-4 text-blue-600" />
                      </div>
                      <div className="text-2xl font-black text-[#0F1E36]">{pendingRequests.length}</div>
                      <span className="text-[11px] text-slate-500">{acceptedRequests.length} confirmed reservations</span>
                    </div>

                    <div className="p-4 rounded-xl bg-white border border-[#E5E2DC] space-y-1 shadow-2xs">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-semibold">Active Advisories</span>
                        <Bell className="w-4 h-4 text-emerald-600" />
                      </div>
                      <div className="text-2xl font-black text-[#0F1E36]">{activeAdvisories.length}</div>
                      <span className="text-[11px] text-slate-500">{resolvedAdvisories.length} resolved alerts</span>
                    </div>
                  </div>

                  {/* Network Operations Health & Data Source */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {/* Database & Data Integrity Card */}
                    <div className="p-5 rounded-2xl bg-white border border-[#E5E2DC] space-y-3">
                      <div className="flex items-center gap-2 text-xs font-bold text-[#0F1E36] uppercase tracking-wider">
                        <Database className="w-4 h-4 text-amber-600" />
                        <span>Data Source & Sync Telemetry</span>
                      </div>
                      
                      <div className="space-y-2 text-xs">
                        <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#FAF9F5] border border-[#E5E2DC]">
                          <span className="text-slate-600 font-medium">Operating Mode</span>
                          <span className="font-bold text-[#0F1E36]">
                            {syncStatus === 'CONNECTED_CLOUD' ? 'Cloud Connected (Firebase RTDB)' : 'Deterministic Local Storage'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#FAF9F5] border border-[#E5E2DC]">
                          <span className="text-slate-600 font-medium">Database Endpoint</span>
                          <span className="font-mono text-[11px] text-slate-700 truncate max-w-[220px]">
                            {diagnostics.databaseURL}
                          </span>
                        </div>
                        <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#FAF9F5] border border-[#E5E2DC]">
                          <span className="text-slate-600 font-medium">Data Integrity Status</span>
                          <span className="font-bold text-emerald-800">54 Official Corridors Active</span>
                        </div>
                      </div>

                      <p className="text-[11px] text-slate-500 leading-relaxed pt-1">
                        All route updates and advisories persist deterministically. When Firebase credentials are supplied via environment variables, changes broadcast to all devices in real time.
                      </p>
                    </div>

                    {/* Operational Safety & Privacy Posture */}
                    <div className="p-5 rounded-2xl bg-white border border-[#E5E2DC] space-y-3">
                      <div className="flex items-center gap-2 text-xs font-bold text-[#0F1E36] uppercase tracking-wider">
                        <Shield className="w-4 h-4 text-emerald-700" />
                        <span>Security & Policy Guardrails</span>
                      </div>

                      <div className="space-y-2 text-xs">
                        <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-[#FAF9F5] border border-[#E5E2DC]">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span className="text-slate-700 font-medium">Driver Privacy: Contact numbers blocked from public fields</span>
                        </div>
                        <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-[#FAF9F5] border border-[#E5E2DC]">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span className="text-slate-700 font-medium">Capacity Protection: Overbooking prevented on full coaches</span>
                        </div>
                        <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-[#FAF9F5] border border-[#E5E2DC]">
                          <Info className="w-4 h-4 text-amber-600 shrink-0" />
                          <span className="text-slate-700 font-medium">Authorization: Administrative passkey enforced client-side</span>
                        </div>
                      </div>

                      <p className="text-[11px] text-slate-500 leading-relaxed pt-1">
                        Student boarding requests are verified against real-time 52-seat bus capacity. Corridors 21 and 39 require manual confirmation prior to dispatch.
                      </p>
                    </div>
                  </div>

                  {/* Rapid Dispatch Shortcuts */}
                  <div className="space-y-2">
                    <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-semibold">
                      Quick Operations Shortcuts
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <button 
                        type="button" 
                        onClick={() => setActiveTab('routes')} 
                        className="p-3.5 rounded-xl bg-white border border-[#E5E2DC] hover:border-amber-500/50 hover:bg-[#FAF9F5] text-left transition-all space-y-1 shadow-2xs group"
                      >
                        <Bus className="w-4 h-4 text-amber-600 group-hover:scale-105 transition-transform" />
                        <span className="block text-xs font-bold text-[#0F1E36]">Edit Routes</span>
                        <span className="block text-[10px] text-slate-500">Modify schedules & stops</span>
                      </button>

                      <button 
                        type="button" 
                        onClick={() => setActiveTab('boarding')} 
                        className="p-3.5 rounded-xl bg-white border border-[#E5E2DC] hover:border-amber-500/50 hover:bg-[#FAF9F5] text-left transition-all space-y-1 shadow-2xs group"
                      >
                        <Ticket className="w-4 h-4 text-blue-600 group-hover:scale-105 transition-transform" />
                        <span className="block text-xs font-bold text-[#0F1E36]">Review Boarding</span>
                        <span className="block text-[10px] text-slate-500">{pendingRequests.length} pending requests</span>
                      </button>

                      <button 
                        type="button" 
                        onClick={() => setActiveTab('buses')} 
                        className="p-3.5 rounded-xl bg-white border border-[#E5E2DC] hover:border-amber-500/50 hover:bg-[#FAF9F5] text-left transition-all space-y-1 shadow-2xs group"
                      >
                        <Users className="w-4 h-4 text-emerald-600 group-hover:scale-105 transition-transform" />
                        <span className="block text-xs font-bold text-[#0F1E36]">Fleet Capacity</span>
                        <span className="block text-[10px] text-slate-500">Coach headcount & status</span>
                      </button>

                      <button 
                        type="button" 
                        onClick={() => setActiveTab('advisories')} 
                        className="p-3.5 rounded-xl bg-white border border-[#E5E2DC] hover:border-amber-500/50 hover:bg-[#FAF9F5] text-left transition-all space-y-1 shadow-2xs group"
                      >
                        <Bell className="w-4 h-4 text-amber-600 group-hover:scale-105 transition-transform" />
                        <span className="block text-xs font-bold text-[#0F1E36]">Post Advisory</span>
                        <span className="block text-[10px] text-slate-500">Broadcast network alerts</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* ────────────────────────────────────────────────────────
                  TAB 2: ROUTES & STOPS (UX4G Data Table + Slide Drawer)
                 ──────────────────────────────────────────────────────── */}
              {activeTab === 'routes' && (
                <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                  
                  {/* Table Control Bar */}
                  <div className="p-4 bg-white border-b border-[#E5E2DC] flex items-center justify-between gap-3 flex-wrap">
                    <div className="flex items-center gap-2 flex-wrap">
                      {/* Search */}
                      <div className="relative">
                        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={routeSearchFilter}
                          onChange={(e) => setRouteSearchFilter(e.target.value)}
                          placeholder="Search route #, origin, or stop..."
                          className="pl-8 pr-3 py-1.5 rounded-xl border border-[#DCD8D0] text-xs bg-[#FAF9F5] outline-none focus:border-amber-600 focus:bg-white w-56 sm:w-64"
                        />
                      </div>

                      {/* Status Filter Chips */}
                      <div className="flex items-center gap-1 text-xs">
                        {(['all', 'complete', 'incomplete'] as const).map((filter) => (
                          <button
                            key={filter}
                            type="button"
                            onClick={() => setRouteStatusFilter(filter)}
                            className={`px-2.5 py-1 rounded-lg font-semibold transition-colors ${
                              routeStatusFilter === filter
                                ? 'bg-[#0F1E36] text-white shadow-xs'
                                : 'bg-[#FAF9F5] border border-[#E5E2DC] text-slate-600 hover:bg-white'
                            }`}
                          >
                            {filter === 'all' && `All (${routes.length})`}
                            {filter === 'complete' && `Verified (${routes.length - incompleteRoutes.length})`}
                            {filter === 'incomplete' && `Needs Verification (${incompleteRoutes.length})`}
                          </button>
                        ))}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleResetDefaults}
                      className="px-3 py-1.5 rounded-xl border border-[#DCD8D0] hover:bg-[#FAF9F5] text-slate-600 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                      title="Reset all 54 routes to original circular dataset"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Reset to Official</span>
                    </button>
                  </div>

                  {/* UX4G Data Table (Desktop) / Cards (Mobile) */}
                  <div className="flex-1 overflow-y-auto p-4 sm:p-6">
                    <div className="bg-white rounded-xl border border-[#E5E2DC] overflow-hidden shadow-2xs">
                      
                      {/* Desktop Table View */}
                      <div className="hidden md:block overflow-x-auto">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead>
                            <tr className="bg-[#F6F5F0] border-b border-[#E5E2DC] text-[10px] font-mono uppercase tracking-wider text-slate-500">
                              <th className="py-3 px-4 font-bold">Route</th>
                              <th className="py-3 px-4 font-bold">Starting Terminal</th>
                              <th className="py-3 px-4 font-bold">Departure</th>
                              <th className="py-3 px-4 font-bold">Stops</th>
                              <th className="py-3 px-4 font-bold">Verification Status</th>
                              <th className="py-3 px-4 font-bold text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#E5E2DC]">
                            {filteredRoutes.map((route) => (
                              <tr 
                                key={route.id} 
                                className={`hover:bg-[#FAF9F5] transition-colors ${selectedRouteId === route.id && isRouteDrawerOpen ? 'bg-amber-50/40' : ''}`}
                              >
                                <td className="py-3 px-4">
                                  <div className="flex items-center gap-2">
                                    <span className="font-mono font-bold text-[#0F1E36] bg-[#FAF9F5] px-2 py-0.5 rounded border border-[#E5E2DC]">
                                      #{route.routeNumber.toString().padStart(2, '0')}
                                    </span>
                                    <span className="font-bold text-[#0F1E36]">{route.routeLabel}</span>
                                  </div>
                                </td>
                                <td className="py-3 px-4 font-medium text-slate-800">
                                  {route.startingLocation}
                                </td>
                                <td className="py-3 px-4 font-mono font-semibold text-[#0F1E36]">
                                  <div className="flex items-center gap-1.5">
                                    <Clock className="w-3 h-3 text-amber-600" />
                                    <span>{route.departureTime}</span>
                                  </div>
                                </td>
                                <td className="py-3 px-4 text-slate-600 font-mono">
                                  {route.stops.length > 0 ? (
                                    <span>{route.stops.length} stops</span>
                                  ) : (
                                    <span className="text-amber-700 font-bold">0 stops (Unlisted)</span>
                                  )}
                                </td>
                                <td className="py-3 px-4">
                                  {route.isIncomplete ? (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                                      <AlertTriangle className="w-3 h-3" />
                                      Needs Verification
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                                      <CheckCircle2 className="w-3 h-3" />
                                      Official Record
                                    </span>
                                  )}
                                </td>
                                <td className="py-3 px-4 text-right">
                                  <button
                                    type="button"
                                    onClick={() => handleOpenRouteEditor(route)}
                                    className="px-3 py-1.5 rounded-lg border border-[#DCD8D0] hover:bg-[#0F1E36] hover:text-white hover:border-[#0F1E36] text-xs font-semibold text-slate-700 transition-colors"
                                  >
                                    Edit Schedule
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* Mobile Card List View */}
                      <div className="md:hidden divide-y divide-[#E5E2DC]">
                        {filteredRoutes.map((route) => (
                          <div key={route.id} className="p-4 space-y-2 hover:bg-[#FAF9F5]">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-mono font-bold text-xs text-[#0F1E36] bg-[#FAF9F5] px-1.5 py-0.5 rounded border border-[#E5E2DC]">
                                    #{route.routeNumber}
                                  </span>
                                  <span className="font-bold text-sm text-[#0F1E36]">{route.routeLabel}</span>
                                </div>
                                <span className="text-xs text-slate-600 block mt-0.5">{route.startingLocation} → CVR Campus</span>
                              </div>

                              <button
                                type="button"
                                onClick={() => handleOpenRouteEditor(route)}
                                className="px-3 py-1 rounded-lg bg-[#0F1E36] text-white text-xs font-bold"
                              >
                                Edit
                              </button>
                            </div>

                            <div className="flex items-center justify-between text-xs pt-1">
                              <span className="font-mono font-semibold text-slate-700 flex items-center gap-1">
                                <Clock className="w-3 h-3 text-amber-600" />
                                {route.departureTime}
                              </span>
                              <span className="text-[11px] text-slate-500 font-mono">{route.stops.length} stops</span>
                            </div>

                            {route.isIncomplete && (
                              <div className="p-2 rounded-lg bg-amber-50 border border-amber-200 text-[10px] text-amber-800 flex items-center gap-1.5">
                                <AlertTriangle className="w-3 h-3 shrink-0" />
                                <span>Official note: Stops not listed in circular sheet.</span>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>

                    </div>
                  </div>

                  {/* ─── Slide-Over Drawer for Route Schedule & Stops ─── */}
                  {isRouteDrawerOpen && activeRoute && (
                    <div 
                      className="fixed inset-y-0 right-0 z-50 w-full sm:w-[480px] bg-white border-l border-[#E5E2DC] shadow-2xl flex flex-col animate-in slide-in-from-right duration-200"
                    >
                      {/* Drawer Header */}
                      <div className="p-4 bg-[#0F1E36] text-white flex items-center justify-between shrink-0">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-sm font-black text-white">{activeRoute.routeLabel}</h3>
                            {activeRoute.isIncomplete && (
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                Incomplete
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-400">Route #{activeRoute.routeNumber} Schedule & Stops Editor</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setIsRouteDrawerOpen(false)}
                          className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Unsaved Changes Banner */}
                      {hasUnsavedRouteChanges && (
                        <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 text-xs font-semibold text-amber-900 flex items-center justify-between shrink-0">
                          <span className="flex items-center gap-1.5">
                            <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                            Unsaved edits on this corridor
                          </span>
                          <span className="text-[10px] font-mono text-amber-800">Draft</span>
                        </div>
                      )}

                      {/* Drawer Body */}
                      <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
                        
                        {/* Validation Error */}
                        {routeValidationError && (
                          <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800 flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 shrink-0" />
                            <span>{routeValidationError}</span>
                          </div>
                        )}

                        {/* Timing & Origin Form */}
                        <div className="space-y-3 p-4 rounded-xl bg-[#FAF9F5] border border-[#E5E2DC]">
                          <div>
                            <label className="block text-xs font-bold text-[#0F1E36] mb-1">
                              Scheduled Departure Time (12-hour AM/PM)
                            </label>
                            <div className="relative">
                              <Clock className="w-3.5 h-3.5 text-amber-600 absolute left-3 top-1/2 -translate-y-1/2" />
                              <input
                                type="text"
                                value={editDepartureTime}
                                onChange={(e) => setEditDepartureTime(e.target.value)}
                                placeholder="e.g. 7:05 AM"
                                className="w-full pl-8 pr-3 py-2 rounded-xl border border-[#DCD8D0] text-xs font-mono font-bold text-[#0F1E36] bg-white outline-none focus:border-amber-600"
                              />
                            </div>
                            <span className="text-[10px] text-slate-400 block mt-1">Must strictly follow standard 12-hour format</span>
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-[#0F1E36] mb-1">Starting Location</label>
                            <input
                              type="text"
                              value={editStartingLocation}
                              onChange={(e) => setEditStartingLocation(e.target.value)}
                              placeholder="Starting point / depot..."
                              className="w-full px-3 py-2 rounded-xl border border-[#DCD8D0] text-xs font-semibold text-[#0F1E36] bg-white outline-none focus:border-amber-600"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-[#0F1E36] mb-1">Terminus Destination</label>
                            <input
                              type="text"
                              value={editDestination}
                              onChange={(e) => setEditDestination(e.target.value)}
                              placeholder="Destination..."
                              className="w-full px-3 py-2 rounded-xl border border-[#DCD8D0] text-xs font-semibold text-[#0F1E36] bg-white outline-none focus:border-amber-600"
                            />
                          </div>
                        </div>

                        {/* Stop Sequence Timeline */}
                        <div className="space-y-3 pt-2">
                          <div className="flex items-center justify-between">
                            <label className="text-xs font-bold text-[#0F1E36] uppercase tracking-wider block">
                              Ordered Stops Timeline ({editStops.length})
                            </label>
                            <span className="text-[10px] font-mono text-slate-400">Directional Flow</span>
                          </div>

                          {/* Add Stop Bar */}
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              value={newStopName}
                              onChange={(e) => setNewStopName(e.target.value)}
                              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddStop())}
                              placeholder="Add next stop along corridor..."
                              className="flex-1 px-3 py-2 rounded-xl border border-[#DCD8D0] text-xs outline-none focus:border-amber-600 bg-white"
                            />
                            <button
                              type="button"
                              onClick={handleAddStop}
                              className="px-3 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold flex items-center gap-1 shadow-2xs"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>Add</span>
                            </button>
                          </div>

                          {/* Transit Stops Nodes */}
                          <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
                            {editStops.map((stop, idx) => (
                              <div
                                key={stop.id}
                                className="p-2.5 rounded-xl border border-[#E5E2DC] bg-[#FAF9F5] flex items-center justify-between gap-2 text-xs"
                              >
                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                  <span className="font-mono text-slate-400 text-[10px] w-5 text-center font-bold">
                                    {idx + 1}
                                  </span>
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
                                <div className="flex items-center gap-1 shrink-0">
                                  <button 
                                    type="button" 
                                    onClick={() => moveStop(idx, 'up')} 
                                    disabled={idx === 0} 
                                    className="p-1 rounded text-slate-400 hover:text-slate-700 disabled:opacity-20" 
                                    title="Move stop earlier in sequence"
                                  >
                                    <ArrowUp className="w-3.5 h-3.5" />
                                  </button>
                                  <button 
                                    type="button" 
                                    onClick={() => moveStop(idx, 'down')} 
                                    disabled={idx === editStops.length - 1} 
                                    className="p-1 rounded text-slate-400 hover:text-slate-700 disabled:opacity-20" 
                                    title="Move stop later in sequence"
                                  >
                                    <ArrowDown className="w-3.5 h-3.5" />
                                  </button>
                                  <button 
                                    type="button" 
                                    onClick={() => handleRemoveStop(stop.id)} 
                                    className="p-1 rounded text-red-500 hover:bg-red-50" 
                                    title="Delete stop"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            ))}
                            {editStops.length === 0 && (
                              <p className="text-xs text-slate-400 italic py-4 text-center">No stops recorded for this corridor.</p>
                            )}
                          </div>
                        </div>

                      </div>

                      {/* Drawer Footer Actions */}
                      <div className="p-4 bg-white border-t border-[#E5E2DC] flex items-center justify-between gap-3 shrink-0">
                        <button
                          type="button"
                          onClick={() => setIsRouteDrawerOpen(false)}
                          className="px-4 py-2 rounded-xl border border-[#DCD8D0] text-xs font-semibold text-slate-700 hover:bg-[#FAF9F5]"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={handleSaveRoute}
                          disabled={isSaving || !hasUnsavedRouteChanges}
                          className="px-5 py-2 rounded-xl bg-[#0F1E36] hover:bg-[#1A2F50] text-white text-xs font-bold flex items-center gap-1.5 shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          <Save className="w-3.5 h-3.5 text-amber-400" />
                          <span>{isSaving ? 'Committing...' : 'Save Schedule Changes'}</span>
                        </button>
                      </div>
                    </div>
                  )}

                </div>
              )}

              {/* ────────────────────────────────────────────────────────
                  TAB 3: BOARDING REQUESTS OVERSIGHT & ACTIONS
                 ──────────────────────────────────────────────────────── */}
              {activeTab === 'boarding' && (
                <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                  
                  {/* Filter & Search Bar */}
                  <div className="p-4 bg-white border-b border-[#E5E2DC] flex items-center justify-between gap-3 flex-wrap">
                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="relative">
                        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={boardingSearch}
                          onChange={(e) => setBoardingSearch(e.target.value)}
                          placeholder="Search student roll, name, or stop..."
                          className="pl-8 pr-3 py-1.5 rounded-xl border border-[#DCD8D0] text-xs bg-[#FAF9F5] outline-none focus:border-amber-600 focus:bg-white w-56 sm:w-64"
                        />
                      </div>

                      {/* Filter chips */}
                      <div className="flex items-center gap-1 text-xs">
                        {(['all', 'PENDING', 'ACCEPTED', 'REJECTED', 'EXPIRED'] as const).map((filter) => {
                          const count = filter === 'all' ? boardingRequests.length : boardingRequests.filter(r => r.status === filter).length;
                          return (
                            <button
                              key={filter}
                              type="button"
                              onClick={() => setBoardingFilter(filter)}
                              className={`px-2.5 py-1 rounded-lg font-semibold transition-colors ${
                                boardingFilter === filter
                                  ? 'bg-[#0F1E36] text-white shadow-xs'
                                  : 'bg-[#FAF9F5] border border-[#E5E2DC] text-slate-600 hover:bg-white'
                              }`}
                            >
                              {filter === 'all' ? 'All' : filter} ({count})
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="text-xs text-slate-500 font-mono">
                      {filteredBoardingRequests.length} requests displayed
                    </div>
                  </div>

                  {/* Requests Table / Cards */}
                  <div className="flex-1 overflow-y-auto p-4 sm:p-6">
                    {boardingRequests.length === 0 ? (
                      <div className="text-center py-16 bg-white rounded-2xl border border-[#E5E2DC] space-y-2 max-w-md mx-auto">
                        <Ticket className="w-10 h-10 text-slate-300 mx-auto" />
                        <h4 className="text-sm font-bold text-[#0F1E36]">No Boarding Requests Submitted</h4>
                        <p className="text-xs text-slate-500 px-6">
                          When students miss their assigned bus and request a seat on an alternative corridor, requests will appear here for oversight.
                        </p>
                      </div>
                    ) : filteredBoardingRequests.length === 0 ? (
                      <div className="text-center py-12 text-xs text-slate-400 bg-white rounded-xl border border-[#E5E2DC]">
                        No boarding requests match the current search or status filter.
                      </div>
                    ) : (
                      <div className="bg-white rounded-xl border border-[#E5E2DC] overflow-hidden shadow-2xs">
                        
                        {/* Desktop Table View */}
                        <div className="hidden lg:block overflow-x-auto">
                          <table className="w-full text-left text-xs border-collapse">
                            <thead>
                              <tr className="bg-[#F6F5F0] border-b border-[#E5E2DC] text-[10px] font-mono uppercase tracking-wider text-slate-500">
                                <th className="py-3 px-4 font-bold">Student</th>
                                <th className="py-3 px-4 font-bold">Requested Corridor</th>
                                <th className="py-3 px-4 font-bold">Boarding Points</th>
                                <th className="py-3 px-4 font-bold">Status</th>
                                <th className="py-3 px-4 font-bold">Seat Pass / Reason</th>
                                <th className="py-3 px-4 font-bold text-right">Actions</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-[#E5E2DC]">
                              {filteredBoardingRequests.map((req) => (
                                <tr key={req.id} className="hover:bg-[#FAF9F5] transition-colors">
                                  <td className="py-3 px-4">
                                    <div>
                                      <span className="font-bold text-[#0F1E36] block">{req.studentName}</span>
                                      <span className="font-mono text-[11px] text-slate-500">{req.studentId}</span>
                                    </div>
                                  </td>
                                  <td className="py-3 px-4">
                                    <div className="space-y-0.5">
                                      <span className="font-bold text-[#0F1E36] block">{req.routeLabel}</span>
                                      <span className="text-[10px] text-slate-400 font-mono">Trip: {req.tripId}</span>
                                    </div>
                                  </td>
                                  <td className="py-3 px-4">
                                    <div className="text-slate-700 font-medium space-y-0.5">
                                      <div className="flex items-center gap-1.5">
                                        <span className="text-amber-600">📍</span>
                                        <span>{req.pickupStop}</span>
                                      </div>
                                      <span className="text-[10px] text-slate-400 block pl-4">→ {req.destinationStop}</span>
                                    </div>
                                  </td>
                                  <td className="py-3 px-4">
                                    <StatusBadge status={req.status} />
                                  </td>
                                  <td className="py-3 px-4">
                                    {req.seatPassCode ? (
                                      <span className="font-mono font-bold text-xs text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                        {req.seatPassCode}
                                      </span>
                                    ) : req.rejectionReason ? (
                                      <span className="text-[11px] text-red-700 font-medium block max-w-[200px] truncate" title={req.rejectionReason}>
                                        {req.rejectionReason}
                                      </span>
                                    ) : (
                                      <span className="text-[10px] font-mono text-slate-400">
                                        Expires: {new Date(req.expiresAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                      </span>
                                    )}
                                  </td>
                                  <td className="py-3 px-4 text-right">
                                    {req.status === 'PENDING' ? (
                                      <div className="flex items-center justify-end gap-1.5">
                                        <button
                                          type="button"
                                          onClick={() => handleApproveBoarding(req)}
                                          disabled={isSaving}
                                          className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-2xs flex items-center gap-1"
                                          title="Approve seat reservation"
                                        >
                                          <Check className="w-3 h-3" />
                                          <span>Approve</span>
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => setRejectingRequest(req)}
                                          disabled={isSaving}
                                          className="px-2.5 py-1 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 font-bold text-xs"
                                          title="Decline request"
                                        >
                                          <X className="w-3 h-3" />
                                          <span>Decline</span>
                                        </button>
                                      </div>
                                    ) : (
                                      <span className="text-[10px] font-mono text-slate-400">
                                        {new Date(req.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                      </span>
                                    )}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>

                        {/* Mobile Cards View */}
                        <div className="lg:hidden divide-y divide-[#E5E2DC]">
                          {filteredBoardingRequests.map((req) => (
                            <div key={req.id} className="p-4 space-y-3 hover:bg-[#FAF9F5]">
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="font-bold text-sm text-[#0F1E36]">{req.studentName}</span>
                                    <StatusBadge status={req.status} />
                                  </div>
                                  <span className="font-mono text-xs text-slate-500 block">{req.studentId} • {req.routeLabel}</span>
                                </div>
                                <span className="text-[10px] font-mono text-slate-400">
                                  {new Date(req.requestedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>

                              <div className="text-xs text-slate-700 bg-[#FAF9F5] p-2.5 rounded-xl border border-[#E5E2DC] space-y-1">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-amber-600 font-bold">📍 Pickup:</span>
                                  <span>{req.pickupStop}</span>
                                </div>
                                <div className="flex items-center gap-1.5 text-slate-500">
                                  <span>🏁 Destination:</span>
                                  <span>{req.destinationStop}</span>
                                </div>
                              </div>

                              {req.seatPassCode && (
                                <div className="flex items-center justify-between text-xs font-mono font-bold bg-emerald-50 text-emerald-800 p-2 rounded-lg border border-emerald-200">
                                  <span>Seat Pass:</span>
                                  <span>{req.seatPassCode}</span>
                                </div>
                              )}

                              {req.rejectionReason && (
                                <div className="text-xs text-red-700 bg-red-50 p-2 rounded-lg border border-red-200 font-medium">
                                  Declined: {req.rejectionReason}
                                </div>
                              )}

                              {req.status === 'PENDING' && (
                                <div className="flex items-center gap-2 pt-1">
                                  <button
                                    type="button"
                                    onClick={() => handleApproveBoarding(req)}
                                    disabled={isSaving}
                                    className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-2xs flex items-center justify-center gap-1"
                                  >
                                    <Check className="w-3.5 h-3.5" />
                                    <span>Approve Seat</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setRejectingRequest(req)}
                                    disabled={isSaving}
                                    className="py-2 px-4 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 font-bold text-xs"
                                  >
                                    Decline
                                  </button>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>

                      </div>
                    )}
                  </div>

                  {/* Rejection Modal */}
                  <RejectionDialog
                    isOpen={Boolean(rejectingRequest)}
                    request={rejectingRequest}
                    onClose={() => setRejectingRequest(null)}
                    onConfirm={handleConfirmRejectBoarding}
                  />

                </div>
              )}

              {/* ────────────────────────────────────────────────────────
                  TAB 4: BUSES & ASSIGNMENTS (Fleet Telemetry)
                 ──────────────────────────────────────────────────────── */}
              {activeTab === 'buses' && (
                <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                  
                  {/* Fleet Filter Bar */}
                  <div className="p-4 bg-white border-b border-[#E5E2DC] flex items-center justify-between gap-3 flex-wrap">
                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="relative">
                        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={fleetSearch}
                          onChange={(e) => setFleetSearch(e.target.value)}
                          placeholder="Search route, bus TS-08-UB-XXXX..."
                          className="pl-8 pr-3 py-1.5 rounded-xl border border-[#DCD8D0] text-xs bg-[#FAF9F5] outline-none focus:border-amber-600 focus:bg-white w-56 sm:w-64"
                        />
                      </div>

                      {/* Fleet status filter */}
                      <div className="flex items-center gap-1 text-xs">
                        {(['all', 'BOARDING_OPEN', 'AT_CAPACITY', 'STANDBY', 'stale'] as const).map((filter) => (
                          <button
                            key={filter}
                            type="button"
                            onClick={() => setFleetFilter(filter)}
                            className={`px-2.5 py-1 rounded-lg font-semibold transition-colors ${
                              fleetFilter === filter
                                ? 'bg-[#0F1E36] text-white shadow-xs'
                                : 'bg-[#FAF9F5] border border-[#E5E2DC] text-slate-600 hover:bg-white'
                            }`}
                          >
                            {filter === 'all' && `All (${trips.length})`}
                            {filter === 'BOARDING_OPEN' && 'Boarding Open'}
                            {filter === 'AT_CAPACITY' && 'At Capacity'}
                            {filter === 'STANDBY' && 'Standby'}
                            {filter === 'stale' && 'Stale Headcount'}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="text-xs text-slate-500 font-mono">
                      {filteredTrips.length} active coaches
                    </div>
                  </div>

                  {/* Fleet Grid / Cards */}
                  <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3">
                    {trips.length === 0 ? (
                      <div className="text-center py-16 bg-white rounded-2xl border border-[#E5E2DC] space-y-2 max-w-md mx-auto">
                        <Bus className="w-10 h-10 text-slate-300 mx-auto" />
                        <h4 className="text-sm font-bold text-[#0F1E36]">Fleet Telemetry Initializing</h4>
                        <p className="text-xs text-slate-500 px-6">
                          Trip records are populated directly from the 54 circular corridors. Open the Conductor Portal to observe live field updates.
                        </p>
                      </div>
                    ) : filteredTrips.length === 0 ? (
                      <div className="text-center py-12 text-xs text-slate-400 bg-white rounded-xl border border-[#E5E2DC]">
                        No coaches match the current fleet search or status filter.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                        {filteredTrips.map((trip) => {
                          const isSelected = selectedTripId === trip.tripId;
                          const availableSeats = Math.max(0, trip.maxCapacity - trip.verifiedOccupancy - trip.confirmedReservationsCount);
                          const totalOccupied = trip.verifiedOccupancy + trip.confirmedReservationsCount;
                          const occupancyPct = Math.round((totalOccupied / trip.maxCapacity) * 100);
                          const staleMs = Date.now() - trip.lastOccupancyVerifiedAt;
                          const staleMinutes = Math.round(staleMs / 60000);
                          const isStale = staleMs > 25 * 60 * 1000;

                          return (
                            <div 
                              key={trip.tripId} 
                              onClick={() => setSelectedTripId(isSelected ? null : trip.tripId)}
                              className={`rounded-2xl border bg-white p-4 transition-all shadow-2xs space-y-3 cursor-pointer hover:border-amber-400/80 ${
                                isStale ? 'border-amber-300' : 'border-[#E5E2DC]'
                              }`}
                            >
                              {/* Coach Header */}
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="font-bold text-sm text-[#0F1E36]">{trip.routeLabel}</span>
                                    <StatusBadge status={trip.operatingStatus} />
                                  </div>
                                  <span className="text-[11px] text-slate-500 block truncate mt-0.5">
                                    {trip.startingLocation} → CVR Campus
                                  </span>
                                </div>
                                <div className="text-right shrink-0">
                                  <span className="font-mono font-black text-xs text-[#0F1E36] block">{trip.busIdentifier}</span>
                                  <span className="text-[10px] text-slate-400 font-mono">{trip.departureTime}</span>
                                </div>
                              </div>

                              {/* Capacity Bar */}
                              <div className="space-y-1.5 pt-1">
                                <div className="flex items-center justify-between text-xs">
                                  <span className="text-slate-500 font-medium">Seating Occupancy</span>
                                  <span className={`font-mono font-bold ${occupancyPct >= 100 ? 'text-red-600' : occupancyPct > 80 ? 'text-amber-600' : 'text-slate-800'}`}>
                                    {totalOccupied} / {trip.maxCapacity} ({occupancyPct}%)
                                  </span>
                                </div>
                                <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                                  <div 
                                    className={`h-full transition-all duration-300 rounded-full ${
                                      occupancyPct >= 100 ? 'bg-red-600' : occupancyPct > 80 ? 'bg-amber-500' : 'bg-emerald-600'
                                    }`}
                                    style={{ width: `${Math.min(100, occupancyPct)}%` }}
                                  />
                                </div>
                                <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                                  <span>{trip.verifiedOccupancy} onboard • {trip.confirmedReservationsCount} reserved</span>
                                  <span className="font-bold text-[#0F1E36]">{availableSeats} seats available</span>
                                </div>
                              </div>

                              {/* Headcount Audit & Conductor Verification */}
                              <div className="pt-2 border-t border-[#E5E2DC] flex items-center justify-between text-xs">
                                <div className="flex items-center gap-1.5">
                                  {isStale ? (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                                      <AlertTriangle className="w-3 h-3 text-amber-600" />
                                      Stale ({staleMinutes}m ago)
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                      Verified ({staleMinutes < 1 ? 'Just now' : `${staleMinutes}m ago`})
                                    </span>
                                  )}
                                </div>

                                {trip.driverSafetyAcknowledged && (
                                  <span className="text-[10px] text-slate-500 font-medium flex items-center gap-1" title="Driver acknowledged pre-trip safety checklist">
                                    <UserCheck className="w-3.5 h-3.5 text-blue-600" />
                                    Safety Acknowledged
                                  </span>
                                )}
                              </div>

                              {/* Expandable Coach Audit Information */}
                              {isSelected && (
                                <div className="pt-2 border-t border-[#E5E2DC] text-[11px] text-slate-600 space-y-1 bg-[#FAF9F5] p-2.5 rounded-xl animate-in fade-in duration-100">
                                  <div><span className="font-bold text-[#0F1E36]">Verified By:</span> {trip.lastOccupancyVerifiedBy || 'Conductor Checkpoint'}</div>
                                  <div><span className="font-bold text-[#0F1E36]">Boarding Policy:</span> {trip.isAcceptingRequests ? 'Accepting Ad-hoc Requests' : 'Direct Dispatch Only'}</div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ────────────────────────────────────────────────────────
                  TAB 5: SERVICE ADVISORIES & ALERTS
                 ──────────────────────────────────────────────────────── */}
              {activeTab === 'advisories' && (
                <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                  
                  {/* Action & Filter Bar */}
                  <div className="p-4 bg-white border-b border-[#E5E2DC] flex items-center justify-between gap-3 flex-wrap">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setIsComposeAdvisoryOpen(!isComposeAdvisoryOpen)}
                        className="px-3.5 py-1.5 rounded-xl bg-[#0F1E36] hover:bg-[#1A2F50] text-white text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5 text-amber-400" />
                        <span>{isComposeAdvisoryOpen ? 'Close Compose' : 'Broadcast New Advisory'}</span>
                      </button>

                      {/* Status filter */}
                      <div className="flex items-center gap-1 text-xs">
                        {(['all', 'ACTIVE', 'RESOLVED'] as const).map((filter) => (
                          <button
                            key={filter}
                            type="button"
                            onClick={() => setAdvisoryFilter(filter)}
                            className={`px-2.5 py-1 rounded-lg font-semibold transition-colors ${
                              advisoryFilter === filter
                                ? 'bg-[#0F1E36] text-white shadow-xs'
                                : 'bg-[#FAF9F5] border border-[#E5E2DC] text-slate-600 hover:bg-white'
                            }`}
                          >
                            {filter === 'all' && `All (${advisories.length})`}
                            {filter === 'ACTIVE' && `Active (${activeAdvisories.length})`}
                            {filter === 'RESOLVED' && `Resolved (${resolvedAdvisories.length})`}
                          </button>
                        ))}
                      </div>
                    </div>

                    <span className="text-xs font-mono text-slate-400 hidden sm:inline">
                      Official Passenger Advisory Broadcast
                    </span>
                  </div>

                  {/* Body Content */}
                  <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
                    
                    {/* Collapsible Compose Card */}
                    {isComposeAdvisoryOpen && (
                      <div className="bg-white p-5 rounded-2xl border border-[#E5E2DC] shadow-sm space-y-4 animate-in fade-in duration-150">
                        <div className="flex items-center justify-between border-b border-[#E5E2DC] pb-3">
                          <h4 className="text-xs font-bold text-[#0F1E36] uppercase tracking-wider flex items-center gap-2">
                            <Bell className="w-4 h-4 text-amber-600" />
                            <span>Broadcast Transport Advisory</span>
                          </h4>
                          <span className="text-[10px] font-mono text-slate-400">Published by CVR Transport Office</span>
                        </div>

                        <form onSubmit={handlePublishAdvisory} className="space-y-3">
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div className="sm:col-span-2 space-y-1">
                              <label className="block text-xs font-bold text-[#0F1E36]">Advisory Headline</label>
                              <input
                                type="text"
                                value={newAdvTitle}
                                onChange={(e) => setNewAdvTitle(e.target.value)}
                                placeholder="e.g. Sagar Highway Construction Delay Notice..."
                                className="w-full px-3 py-2 rounded-xl border border-[#DCD8D0] text-xs font-semibold outline-none focus:border-amber-600"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="block text-xs font-bold text-[#0F1E36]">Affected Route Corridor</label>
                              <select
                                value={newAdvRouteNumber}
                                onChange={(e) => setNewAdvRouteNumber(e.target.value)}
                                className="w-full px-3 py-2 rounded-xl border border-[#DCD8D0] text-xs font-semibold bg-white outline-none focus:border-amber-600"
                              >
                                <option value="All Routes">All 54 Corridors (Network-wide)</option>
                                {routes.map((r) => (
                                  <option key={r.id} value={r.routeLabel}>{r.routeLabel} — {r.startingLocation}</option>
                                ))}
                              </select>
                            </div>
                          </div>

                          <div className="space-y-1">
                            <label className="block text-xs font-bold text-[#0F1E36]">Notice Content</label>
                            <textarea
                              value={newAdvMessage}
                              onChange={(e) => setNewAdvMessage(e.target.value)}
                              placeholder="Precise operational instructions for students..."
                              rows={3}
                              className="w-full px-3 py-2 rounded-xl border border-[#DCD8D0] text-xs font-medium outline-none focus:border-amber-600 resize-none"
                            />
                            <span className="text-[10px] text-slate-400 block">Personal phone numbers will be automatically blocked per privacy policy</span>
                          </div>

                          <div className="flex items-center justify-between gap-3 pt-2 flex-wrap">
                            <div className="flex items-center gap-3 text-xs">
                              <div>
                                <span className="text-[11px] font-bold text-slate-500 mr-1.5">Type:</span>
                                <select 
                                  value={newAdvType} 
                                  onChange={(e) => setNewAdvType(e.target.value as any)} 
                                  className="px-2 py-1 rounded-lg border border-[#DCD8D0] text-xs bg-white"
                                >
                                  <option value="notice">Notice</option>
                                  <option value="guideline">Guideline</option>
                                  <option value="verification">Verification</option>
                                  <option value="alert">Alert</option>
                                </select>
                              </div>
                              <div>
                                <span className="text-[11px] font-bold text-slate-500 mr-1.5">Severity:</span>
                                <select 
                                  value={newAdvSeverity} 
                                  onChange={(e) => setNewAdvSeverity(e.target.value as any)} 
                                  className="px-2 py-1 rounded-lg border border-[#DCD8D0] text-xs bg-white"
                                >
                                  <option value="low">Standard (Low)</option>
                                  <option value="medium">Important (Medium)</option>
                                  <option value="high">Urgent (High)</option>
                                </select>
                              </div>
                            </div>

                            <button 
                              type="submit" 
                              disabled={isSaving} 
                              className="px-5 py-2 rounded-xl bg-[#0F1E36] hover:bg-[#1A2F50] text-white text-xs font-bold transition-colors shadow-sm flex items-center gap-1.5"
                            >
                              <Send className="w-3.5 h-3.5 text-amber-400" />
                              <span>{isSaving ? 'Publishing...' : 'Publish Advisory'}</span>
                            </button>
                          </div>
                        </form>
                      </div>
                    )}

                    {/* Advisories List */}
                    <div className="space-y-3">
                      {filteredAdvisories.length === 0 ? (
                        <div className="text-center py-12 text-xs text-slate-400 bg-white rounded-xl border border-[#E5E2DC]">
                          No advisories match the selected filter.
                        </div>
                      ) : (
                        filteredAdvisories.map((adv) => (
                          <div
                            key={adv.id}
                            className={`p-4 rounded-2xl border bg-white space-y-2.5 transition-all shadow-2xs ${
                              adv.status === 'RESOLVED' ? 'opacity-60 bg-slate-50/70 border-slate-200' : 'border-[#E5E2DC]'
                            }`}
                          >
                            {editingAdvisoryId === adv.id ? (
                              /* Inline Edit Mode */
                              <div className="space-y-3">
                                <input
                                  type="text"
                                  value={editAdvTitle}
                                  onChange={(e) => setEditAdvTitle(e.target.value)}
                                  className="w-full px-3 py-2 rounded-xl border border-amber-300 text-xs font-bold outline-none focus:border-amber-600 bg-white"
                                />
                                <textarea
                                  value={editAdvMessage}
                                  onChange={(e) => setEditAdvMessage(e.target.value)}
                                  rows={2}
                                  className="w-full px-3 py-2 rounded-xl border border-amber-300 text-xs font-medium outline-none focus:border-amber-600 resize-none bg-white"
                                />
                                <div className="flex items-center gap-2">
                                  <button 
                                    type="button" 
                                    onClick={() => handleSaveAdvisoryEdit(adv.id)} 
                                    disabled={isSaving} 
                                    className="px-3.5 py-1.5 rounded-lg bg-[#0F1E36] text-white text-xs font-bold"
                                  >
                                    {isSaving ? 'Saving...' : 'Save Changes'}
                                  </button>
                                  <button 
                                    type="button" 
                                    onClick={() => setEditingAdvisoryId(null)} 
                                    className="px-3.5 py-1.5 rounded-lg border border-[#DCD8D0] text-xs font-semibold text-slate-600 hover:bg-[#FAF9F5]"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            ) : (
                              /* View Mode */
                              <div className="flex items-start justify-between gap-3">
                                <div className="space-y-1.5 flex-1 min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    {adv.routeNumber && (
                                      <span className="px-2 py-0.5 rounded font-mono font-bold bg-[#FAF9F5] text-amber-900 border border-[#E5E2DC] text-[10px]">
                                        {adv.routeNumber}
                                      </span>
                                    )}
                                    <span className="font-bold text-xs sm:text-sm text-[#0F1E36]">{adv.title}</span>
                                    <StatusBadge status={adv.status || 'ACTIVE'} />
                                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase ${
                                      adv.severity === 'high' ? 'bg-red-50 text-red-700 border border-red-200' :
                                      adv.severity === 'medium' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                                      'bg-slate-100 text-slate-600 border border-slate-200'
                                    }`}>
                                      {adv.severity || 'low'} priority
                                    </span>
                                  </div>
                                  <p className="text-xs text-slate-700 leading-relaxed">{adv.message}</p>
                                  <div className="flex items-center gap-3 text-[10px] font-mono text-slate-400">
                                    <span>{adv.date}</span>
                                    {adv.createdAt && <span>Posted: {new Date(adv.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>}
                                  </div>
                                </div>

                                <div className="flex items-center gap-1.5 shrink-0">
                                  <button
                                    type="button"
                                    onClick={() => { setEditingAdvisoryId(adv.id); setEditAdvTitle(adv.title); setEditAdvMessage(adv.message); }}
                                    className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors"
                                    title="Edit advisory text"
                                  >
                                    <Edit3 className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleUpdateAdvisoryStatus(adv, adv.status === 'ACTIVE' ? 'RESOLVED' : 'ACTIVE')}
                                    className="px-2.5 py-1 rounded-lg text-xs font-semibold border border-[#DCD8D0] hover:bg-[#FAF9F5] transition-colors"
                                  >
                                    {adv.status === 'ACTIVE' ? 'Mark Resolved' : 'Reactivate'}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteAdvisory(adv)}
                                    className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition-colors"
                                    title="Delete advisory permanently"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* ────────────────────────────────────────────────────────
                  TAB 6: SETTINGS & SYSTEM STATUS
                 ──────────────────────────────────────────────────────── */}
              {activeTab === 'settings' && (
                <div className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto space-y-5 text-xs">
                  
                  {/* Database Health Card */}
                  <div className="p-5 rounded-2xl bg-white border border-[#E5E2DC] space-y-4 shadow-2xs">
                    <div className="flex items-center gap-2 text-xs font-bold text-[#0F1E36] uppercase tracking-wider">
                      <Database className="w-4 h-4 text-amber-600" />
                      <span>Firebase Realtime Database Diagnostics</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="p-3.5 rounded-xl bg-[#FAF9F5] border border-[#E5E2DC]">
                        <span className="text-[10px] text-slate-400 uppercase font-mono block">Sync Engine State</span>
                        <span className="text-xs font-bold text-[#0F1E36]">{syncStatus}</span>
                      </div>
                      <div className="p-3.5 rounded-xl bg-[#FAF9F5] border border-[#E5E2DC]">
                        <span className="text-[10px] text-slate-400 uppercase font-mono block">Fallback Guarantee</span>
                        <span className="text-xs font-bold text-emerald-800">
                          {diagnostics.isConfigured ? 'Cloud Active + Local Sync' : 'Verified Local Storage Active'}
                        </span>
                      </div>
                      <div className="p-3.5 rounded-xl bg-[#FAF9F5] border border-[#E5E2DC]">
                        <span className="text-[10px] text-slate-400 uppercase font-mono block">Database Endpoint</span>
                        <span className="text-xs font-mono text-slate-700 break-all">{diagnostics.databaseURL}</span>
                      </div>
                      <div className="p-3.5 rounded-xl bg-[#FAF9F5] border border-[#E5E2DC]">
                        <span className="text-[10px] text-slate-400 uppercase font-mono block">Project Identifier</span>
                        <span className="text-xs font-mono text-slate-700">{diagnostics.projectId}</span>
                      </div>
                    </div>
                  </div>

                  {/* Security Audit & Limitations */}
                  <div className="p-5 rounded-2xl bg-white border border-[#E5E2DC] space-y-3 shadow-2xs">
                    <div className="flex items-center gap-2 text-xs font-bold text-[#0F1E36] uppercase tracking-wider">
                      <ShieldCheck className="w-4 h-4 text-emerald-700" />
                      <span>Security & Authentication Audit</span>
                    </div>

                    <div className="space-y-2 text-slate-700">
                      <div className="flex items-start gap-2 p-2.5 rounded-xl bg-amber-50/60 border border-amber-200">
                        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-bold text-amber-900 block">Demonstration Passkey Advisory</span>
                          <span className="text-[11px] text-amber-800 leading-relaxed block">
                            The passkey <code className="font-mono bg-white px-1 py-0.2 rounded border">CVR-TRANS-2026</code> is validated locally in client state. In production, this should be superseded by Firebase Auth with custom claims.
                          </span>
                        </div>
                      </div>

                      <div className="flex items-start gap-2 p-2.5 rounded-xl bg-emerald-50/60 border border-emerald-200">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-bold text-emerald-900 block">Privacy Rule Enforcement</span>
                          <span className="text-[11px] text-emerald-800 leading-relaxed block">
                            Active regex filters intercept and reject 10-digit phone numbers in route locations, stops, and advisories to safeguard driver and conductor privacy.
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* System Reset Controls */}
                  <div className="p-5 rounded-2xl bg-white border border-[#E5E2DC] space-y-3 shadow-2xs">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-xs font-bold text-[#0F1E36] uppercase tracking-wider">Reset Route Data to Circular Defaults</h4>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Revert all custom schedule edits and restored ordered stops to the official 54 CVR transit sheet.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={handleResetDefaults}
                        className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-2xs transition-colors shrink-0"
                      >
                        Reset All Routes
                      </button>
                    </div>
                  </div>

                </div>
              )}

            </div>
          )}

        </div>

      </div>

      {/* Confirmation Modal */}
      {confirmDialog && (
        <ConfirmDialog
          title={confirmDialog.title}
          message={confirmDialog.message}
          danger={confirmDialog.danger}
          onConfirm={confirmDialog.onConfirm}
          onCancel={() => setConfirmDialog(null)}
        />
      )}

    </div>
  );
};
