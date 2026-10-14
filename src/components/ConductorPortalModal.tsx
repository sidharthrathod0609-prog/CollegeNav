import React, { useState, useMemo } from 'react';
import { 
  X, 
  ShieldAlert, 
  Lock, 
  CheckCircle2, 
  Clock, 
  Users, 
  AlertTriangle, 
  UserCheck, 
  LogOut, 
  ChevronDown 
} from 'lucide-react';
import { 
  useBoardingData, 
  verifyConductorPasskey,
  acceptBoardingRequest,
  rejectBoardingRequest,
  markPassengerBoarded,
  updateTripOccupancy,
  toggleTripAcceptance
} from '../services/boardingService.ts';
import { REJECTION_REASONS } from '../types/boarding.ts';
import type { TripCapacityState } from '../types/boarding.ts';

interface ConductorPortalModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ConductorPortalModal: React.FC<ConductorPortalModalProps> = ({
  isOpen,
  onClose,
}) => {
  // Auth state
  const [passkeyInput, setPasskeyInput] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeTripId, setActiveTripId] = useState<string>('trip-cvr-r7');
  const [authError, setAuthError] = useState<string | null>(null);

  // Safety confirmation
  const [safetyAcknowledged, setSafetyAcknowledged] = useState(false);

  // Quick Headcount State
  const [isUpdatingHeadcount, setIsUpdatingHeadcount] = useState(false);
  const [newHeadcount, setNewHeadcount] = useState<number>(38);
  const [checkpointName, setCheckpointName] = useState<string>('Scheduled Stop');

  // Rejection modal state
  const [rejectingRequestId, setRejectingRequestId] = useState<string | null>(null);
  const [selectedRejectReason, setSelectedRejectReason] = useState<string>(REJECTION_REASONS[0]);

  // Operational feedback
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Boarding Data Hook
  const { trips, requests, calculateCapacity } = useBoardingData();

  // Find currently selected trip
  const activeTrip: TripCapacityState | undefined = useMemo(() => {
    return trips.find((t) => t.tripId === activeTripId) || trips[0];
  }, [trips, activeTripId]);

  // Compute live capacity calculation for active trip
  const capacityCalc = useMemo(() => {
    if (!activeTrip) return null;
    return calculateCapacity(activeTrip);
  }, [activeTrip, calculateCapacity]);

  // Filter requests for active trip
  const tripPendingRequests = useMemo(() => {
    if (!activeTrip) return [];
    return requests.filter((r) => r.tripId === activeTrip.tripId && r.status === 'PENDING');
  }, [requests, activeTrip]);

  const tripConfirmedReservations = useMemo(() => {
    if (!activeTrip) return [];
    return requests.filter((r) => r.tripId === activeTrip.tripId && r.status === 'ACCEPTED');
  }, [requests, activeTrip]);

  if (!isOpen) return null;

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    if (verifyConductorPasskey(passkeyInput, activeTripId)) {
      setIsAuthenticated(true);
      setSafetyAcknowledged(true);
      if (activeTrip) {
        setNewHeadcount(activeTrip.verifiedOccupancy);
      }
    } else {
      setAuthError('Invalid credentials. Use official Conductor Passkey (e.g. CVR-CONDUCTOR-2026 or CVR-COND-R{number})');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setPasskeyInput('');
    setSafetyAcknowledged(false);
    setActionMessage(null);
  };

  const handleAccept = async (reqId: string) => {
    setIsProcessing(true);
    setActionMessage(null);
    try {
      const res = await acceptBoardingRequest(reqId, passkeyInput);
      if (!res.success) {
        setActionMessage({ type: 'error', text: res.error || 'Failed to approve request' });
      } else {
        setActionMessage({ type: 'success', text: `Approved student ${res.request?.studentName}. Seat pass generated.` });
      }
    } catch {
      setActionMessage({ type: 'error', text: 'Unexpected error approving boarding request' });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmReject = async () => {
    if (!rejectingRequestId) return;
    setIsProcessing(true);
    setActionMessage(null);
    try {
      const res = await rejectBoardingRequest(rejectingRequestId, selectedRejectReason, passkeyInput);
      if (!res.success) {
        setActionMessage({ type: 'error', text: res.error || 'Failed to reject request' });
      } else {
        setActionMessage({ type: 'success', text: 'Request declined with specified reason.' });
        setRejectingRequestId(null);
      }
    } catch {
      setActionMessage({ type: 'error', text: 'Unexpected error rejecting boarding request' });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleMarkBoarded = async (reqId: string) => {
    setIsProcessing(true);
    setActionMessage(null);
    try {
      const res = await markPassengerBoarded(reqId, passkeyInput);
      if (!res.success) {
        setActionMessage({ type: 'error', text: res.error || 'Failed to mark boarded' });
      } else {
        setActionMessage({ type: 'success', text: 'Passenger checked in and transferred to verified onboard occupancy.' });
      }
    } catch {
      setActionMessage({ type: 'error', text: 'Error recording boarding' });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSaveHeadcount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTrip) return;
    setIsProcessing(true);
    setActionMessage(null);
    try {
      const res = await updateTripOccupancy(activeTrip.tripId, newHeadcount, checkpointName, passkeyInput);
      if (!res.success) {
        setActionMessage({ type: 'error', text: res.error || 'Failed to update headcount' });
      } else {
        setActionMessage({ type: 'success', text: `Verified onboard headcount updated to ${newHeadcount} passengers.` });
        setIsUpdatingHeadcount(false);
      }
    } catch {
      setActionMessage({ type: 'error', text: 'Error saving physical headcount' });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleToggleAcceptance = async () => {
    if (!activeTrip) return;
    setIsProcessing(true);
    setActionMessage(null);
    try {
      const newStatus = !activeTrip.isAcceptingRequests;
      const res = await toggleTripAcceptance(activeTrip.tripId, newStatus, passkeyInput);
      if (!res.success) {
        setActionMessage({ type: 'error', text: res.error || 'Failed to toggle status' });
      } else {
        setActionMessage({ 
          type: 'success', 
          text: newStatus ? 'Boarding requests are now OPEN for this bus.' : 'Boarding requests are now CLOSED for this bus.' 
        });
      }
    } catch {
      setActionMessage({ type: 'error', text: 'Error toggling acceptance status' });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] overflow-y-auto bg-[#0F1E36]/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-150">
      <div 
        className="bg-white rounded-2xl max-w-3xl w-full border border-[#DCD8D0] shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-5 sm:p-6 bg-[#0F1E36] text-white flex items-start justify-between relative">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
              <UserCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">Driver & Conductor Portal</h2>
                <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Authorized Operations
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-300 font-medium mt-0.5">
                Trip capacity protection, physical headcount verification, and smart seat approvals
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            type="button"
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/25 text-white flex items-center justify-center transition-colors"
            title="Close portal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* DRIVER SAFETY PROTOCOL BANNER (MANDATORY) */}
        <div className="bg-amber-500 text-[#0F1E36] px-4 sm:px-6 py-2.5 text-xs font-bold flex items-center gap-2.5 shadow-xs">
          <ShieldAlert className="w-4 h-4 text-[#0F1E36] shrink-0" />
          <span>
            SAFETY PROTOCOL: Review and approve requests ONLY while vehicle is safely stopped at a scheduled stop. Driver must NEVER operate this console while in motion!
          </span>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6">

          {/* Login Gate */}
          {!isAuthenticated ? (
            <div className="max-w-md mx-auto py-8 text-center space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-[#0F1E36]/5 border border-[#0F1E36]/10 flex items-center justify-center text-[#0F1E36] mx-auto">
                <Lock className="w-7 h-7" />
              </div>

              <div>
                <h3 className="text-lg font-bold text-[#0F1E36]">Conductor Authorization</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Enter your assigned conductor passkey to manage trip reservations and capacity.
                </p>
              </div>

              <form onSubmit={handleLogin} className="space-y-3 text-left">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Assigned Trip Corridor
                  </label>
                  <select
                    value={activeTripId}
                    onChange={(e) => setActiveTripId(e.target.value)}
                    className="w-full px-3 py-2 text-xs sm:text-sm bg-[#FAF9F5] border border-[#DCD8D0] rounded-xl focus:outline-hidden focus:ring-2 focus:ring-[#0F1E36]"
                  >
                    {trips.map((t) => (
                      <option key={t.tripId} value={t.tripId}>
                        Route #{t.routeNumber} ({t.startingLocation} ➔ CVR Campus)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Conductor Passkey
                  </label>
                  <input
                    type="password"
                    required
                    value={passkeyInput}
                    onChange={(e) => setPasskeyInput(e.target.value)}
                    placeholder="Enter passkey (e.g. CVR-CONDUCTOR-2026)"
                    className="w-full px-3 py-2 text-xs sm:text-sm bg-[#FAF9F5] border border-[#DCD8D0] rounded-xl focus:outline-hidden focus:ring-2 focus:ring-[#0F1E36]"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Default evaluation passkey: <code className="font-mono text-slate-600 bg-slate-100 px-1 py-0.5 rounded">CVR-CONDUCTOR-2026</code>
                  </p>
                </div>

                {authError && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                    <span>{authError}</span>
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-[#0F1E36] hover:bg-[#1A2F50] text-amber-400 font-bold text-xs sm:text-sm transition-colors shadow-2xs cursor-pointer flex items-center justify-center gap-2"
                >
                  <UserCheck className="w-4 h-4" />
                  <span>Authenticate Conductor Console</span>
                </button>
              </form>
            </div>
          ) : activeTrip && capacityCalc ? (
            /* Authenticated Conductor Console */
            <div className="space-y-6">

              {/* Top Controls: Trip Switcher & Acceptance Toggle & Logout */}
              <div className="flex items-center justify-between gap-3 flex-wrap p-3.5 rounded-xl bg-[#FAF9F5] border border-[#E5E2DC]">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-lg bg-[#0F1E36] text-white flex items-center justify-center font-bold text-xs shrink-0">
                    #{activeTrip.routeNumber}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-[#0F1E36]">{activeTrip.routeLabel}</span>
                      <span className="text-xs text-slate-500 font-mono">({activeTrip.busIdentifier})</span>
                      {safetyAcknowledged && (
                        <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                          Vehicle Stationary
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-slate-500">
                      Terminal: {activeTrip.startingLocation} ({activeTrip.departureTime}) ➔ CVR Campus
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleToggleAcceptance}
                    disabled={isProcessing}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors flex items-center gap-1.5 ${
                      activeTrip.isAcceptingRequests
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                        : 'bg-rose-50 text-rose-800 border-rose-300 hover:bg-rose-100'
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full ${activeTrip.isAcceptingRequests ? 'bg-emerald-600' : 'bg-rose-600'}`} />
                    <span>{activeTrip.isAcceptingRequests ? 'Requests: OPEN' : 'Requests: PAUSED'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleLogout}
                    className="p-1.5 rounded-lg border border-[#DCD8D0] hover:bg-white text-slate-600 text-xs transition-colors"
                    title="Log out"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Operational Feedback Banner */}
              {actionMessage && (
                <div className={`p-3 rounded-xl border text-xs flex items-center justify-between gap-2 ${
                  actionMessage.type === 'success'
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                    : 'bg-rose-50 border-rose-200 text-rose-800'
                }`}>
                  <div className="flex items-center gap-2">
                    {actionMessage.type === 'success' ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                    )}
                    <span>{actionMessage.text}</span>
                  </div>
                  <button onClick={() => setActionMessage(null)} className="text-xs font-bold underline">
                    Dismiss
                  </button>
                </div>
              )}

              {/* FEATURE 3: SEPARATE CAPACITY PROTECTION METRICS */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                
                {/* 1. Max Capacity */}
                <div className="p-3.5 rounded-xl bg-[#FAF9F5] border border-[#E5E2DC]">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Authorized Capacity</span>
                  <span className="text-xl font-black font-mono text-[#0F1E36] block mt-1">
                    {capacityCalc.maxCapacity}
                  </span>
                  <span className="text-[11px] text-slate-500">Coach Seats</span>
                </div>

                {/* 2. Verified Onboard Occupancy */}
                <div className="p-3.5 rounded-xl bg-[#FAF9F5] border border-[#E5E2DC]">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Verified Occupancy</span>
                  <span className="text-xl font-black font-mono text-[#0F1E36] block mt-1">
                    {capacityCalc.verifiedOccupancy}
                  </span>
                  <span className="text-[11px] text-slate-500">Physical Headcount</span>
                </div>

                {/* 3. Confirmed Reservations Awaiting Boarding */}
                <div className="p-3.5 rounded-xl bg-[#FAF9F5] border border-[#E5E2DC]">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Reserved Not Boarded</span>
                  <span className="text-xl font-black font-mono text-amber-700 block mt-1">
                    {capacityCalc.confirmedReservationsCount}
                  </span>
                  <span className="text-[11px] text-slate-500">Accepted Passes</span>
                </div>

                {/* 4. Calculated Available Seats */}
                <div className={`p-3.5 rounded-xl border ${
                  capacityCalc.availableCapacity > 0
                    ? 'bg-emerald-50 border-emerald-300'
                    : 'bg-rose-50 border-rose-300'
                }`}>
                  <span className="text-[10px] font-bold uppercase tracking-wider block text-slate-500">Available Capacity</span>
                  <span className={`text-xl font-black font-mono block mt-1 ${
                    capacityCalc.availableCapacity > 0 ? 'text-emerald-800' : 'text-rose-800'
                  }`}>
                    {capacityCalc.availableCapacity}
                  </span>
                  <span className={`text-[11px] font-bold ${
                    capacityCalc.availableCapacity > 0 ? 'text-emerald-700' : 'text-rose-700'
                  }`}>
                    {capacityCalc.availableCapacity > 0 ? 'Seats Open' : 'Bus Full'}
                  </span>
                </div>
              </div>

              {/* Stale Occupancy Alert (if last verification > 25 mins ago) */}
              {capacityCalc.isStale && (
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-xs flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-amber-700 shrink-0" />
                    <span>
                      <strong>Stale Occupancy Warning:</strong> Headcount was last verified {capacityCalc.staleMinutes} minutes ago ({activeTrip.lastOccupancyVerifiedBy}). Verify count before approving new seats!
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsUpdatingHeadcount(true)}
                    className="px-2.5 py-1 rounded bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shrink-0"
                  >
                    Verify Count
                  </button>
                </div>
              )}

              {/* Headcount Update Panel (Accordion/Expandable) */}
              <div className="border border-[#E5E2DC] rounded-xl overflow-hidden">
                <div 
                  onClick={() => setIsUpdatingHeadcount(!isUpdatingHeadcount)}
                  className="p-3.5 bg-[#FAF9F5] hover:bg-[#F2EFE9] flex items-center justify-between cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-[#0F1E36]" />
                    <span className="text-xs font-bold text-[#0F1E36] uppercase tracking-wider">
                      Physical Headcount Audit Control
                    </span>
                    <span className="text-[11px] text-slate-500 font-mono">
                      (Last verified by: {activeTrip.lastOccupancyVerifiedBy})
                    </span>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform ${isUpdatingHeadcount ? 'rotate-180' : ''}`} />
                </div>

                {isUpdatingHeadcount && (
                  <form onSubmit={handleSaveHeadcount} className="p-4 bg-white border-t border-[#E5E2DC] space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                          Current Actual Onboard Passengers
                        </label>
                        <input
                          type="number"
                          min="0"
                          max={activeTrip.maxCapacity + 30}
                          value={newHeadcount}
                          onChange={(e) => setNewHeadcount(Number(e.target.value))}
                          className="w-full px-3 py-2 text-xs sm:text-sm bg-[#FAF9F5] border border-[#DCD8D0] rounded-xl font-mono font-bold"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                          Verification Checkpoint / Confluence Hub
                        </label>
                        <input
                          type="text"
                          value={checkpointName}
                          onChange={(e) => setCheckpointName(e.target.value)}
                          placeholder="e.g. LB Nagar Ring Road or Uppal Depot"
                          className="w-full px-3 py-2 text-xs sm:text-sm bg-[#FAF9F5] border border-[#DCD8D0] rounded-xl"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setIsUpdatingHeadcount(false)}
                        className="px-3 py-1.5 rounded-lg border border-[#DCD8D0] text-xs font-bold hover:bg-[#FAF9F5]"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isProcessing}
                        className="px-4 py-1.5 rounded-lg bg-[#0F1E36] hover:bg-[#1A2F50] text-amber-400 text-xs font-bold transition-colors"
                      >
                        Commit Verified Headcount
                      </button>
                    </div>
                  </form>
                )}
              </div>

              {/* SECTION: INCOMING BOARDING REQUESTS QUEUE */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-[#0F1E36] uppercase tracking-wider flex items-center gap-2">
                    <Clock className="w-4 h-4 text-amber-600" />
                    <span>Incoming Boarding Requests ({tripPendingRequests.length})</span>
                  </h3>
                  <span className="text-[11px] text-slate-500">
                    Review when vehicle is safely stationary
                  </span>
                </div>

                {tripPendingRequests.length > 0 ? (
                  <div className="space-y-2.5">
                    {tripPendingRequests.map((req) => (
                      <div
                        key={req.id}
                        className="p-3.5 rounded-xl bg-white border border-[#E5E2DC] shadow-2xs flex items-center justify-between gap-3 flex-wrap"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-[#0F1E36]">{req.studentName}</span>
                            <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-slate-100 text-slate-700">
                              {req.studentId}
                            </span>
                            {req.missedBusRouteNumber && (
                              <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-200">
                                Missed Route #{req.missedBusRouteNumber}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-600 mt-1">
                            Boarding Point: <strong className="text-[#0F1E36]">{req.pickupStop}</strong> ➔ Destination: <strong>{req.destinationStop}</strong>
                          </p>
                        </div>

                        {/* Actions: Accept or Reject */}
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setRejectingRequestId(req.id);
                            }}
                            disabled={isProcessing}
                            className="px-3 py-1.5 rounded-lg border border-rose-300 text-rose-700 hover:bg-rose-50 text-xs font-bold transition-colors"
                          >
                            Decline
                          </button>

                          <button
                            type="button"
                            onClick={() => handleAccept(req.id)}
                            disabled={isProcessing || capacityCalc.availableCapacity <= 0}
                            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-colors shadow-2xs flex items-center gap-1.5 ${
                              capacityCalc.availableCapacity > 0
                                ? 'bg-emerald-700 hover:bg-emerald-800 text-white'
                                : 'bg-slate-300 text-slate-500 cursor-not-allowed'
                            }`}
                            title={capacityCalc.availableCapacity <= 0 ? 'Bus reached maximum capacity' : 'Approve seat reservation'}
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>{capacityCalc.availableCapacity <= 0 ? 'Full (0 Seats)' : 'Approve Seat'}</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-6 text-center bg-[#FAF9F5] rounded-xl border border-[#E5E2DC] text-xs text-slate-500">
                    No pending boarding requests awaiting decision.
                  </div>
                )}
              </div>

              {/* SECTION: CONFIRMED RESERVATIONS AWAITING BOARDING */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-[#0F1E36] uppercase tracking-wider flex items-center gap-2">
                    <UserCheck className="w-4 h-4 text-emerald-700" />
                    <span>Confirmed Passengers Awaiting Boarding ({tripConfirmedReservations.length})</span>
                  </h3>
                  <span className="text-[11px] text-slate-500 font-mono">
                    Check-in upon boarding
                  </span>
                </div>

                {tripConfirmedReservations.length > 0 ? (
                  <div className="space-y-2.5">
                    {tripConfirmedReservations.map((res) => (
                      <div
                        key={res.id}
                        className="p-3.5 rounded-xl bg-emerald-50/50 border border-emerald-200 flex items-center justify-between gap-3 flex-wrap"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-[#0F1E36]">{res.studentName}</span>
                            <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-white border border-emerald-300 text-emerald-900">
                              {res.seatPassCode}
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 mt-0.5">
                            Boarding Point: <strong>{res.pickupStop}</strong>
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleMarkBoarded(res.id)}
                          disabled={isProcessing}
                          className="px-3.5 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition-colors flex items-center gap-1.5"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Mark Boarded (Count In)</span>
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-5 text-center bg-[#FAF9F5] rounded-xl border border-[#E5E2DC] text-xs text-slate-500">
                    No active unboarded reservations.
                  </div>
                )}
              </div>

            </div>
          ) : null}

        </div>

        {/* Rejection Modal Dialog */}
        {rejectingRequestId && (
          <div className="fixed inset-0 z-[110] bg-black/50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-5 space-y-4 shadow-2xl border border-slate-300">
              <div className="flex items-center gap-2 font-bold text-rose-800 text-sm">
                <AlertTriangle className="w-4 h-4" />
                <span>Specify Rejection Reason</span>
              </div>
              <p className="text-xs text-slate-600">
                The student will receive this feedback and will be directed to find alternative routes.
              </p>
              
              <select
                value={selectedRejectReason}
                onChange={(e) => setSelectedRejectReason(e.target.value)}
                className="w-full px-3 py-2 text-xs sm:text-sm bg-[#FAF9F5] border border-[#DCD8D0] rounded-xl"
              >
                {REJECTION_REASONS.map((reason) => (
                  <option key={reason} value={reason}>{reason}</option>
                ))}
              </select>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setRejectingRequestId(null)}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-bold hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmReject}
                  disabled={isProcessing}
                  className="px-4 py-1.5 rounded-lg bg-rose-700 hover:bg-rose-800 text-white text-xs font-bold"
                >
                  Confirm Rejection
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
