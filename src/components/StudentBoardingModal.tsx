import React, { useState, useMemo } from 'react';
import { 
  X, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  MapPin, 
  User, 
  Ticket, 
  ArrowRight, 
  RefreshCw, 
  ShieldAlert, 
  Search,
  XCircle,
  QrCode
} from 'lucide-react';
import { OFFICIAL_CVR_ROUTES } from '../data/cvrRoutes.ts';
import { 
  useBoardingData, 
  findAlternativeTripsForMissedBus,
  createBoardingRequest,
  cancelBoardingRequest
} from '../services/boardingService.ts';
import type { BoardingRequest, TripCapacityState } from '../types/boarding.ts';

interface StudentBoardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialRouteNumber?: number;
  initialPickupStop?: string;
}

export const StudentBoardingModal: React.FC<StudentBoardingModalProps> = ({
  isOpen,
  onClose,
  initialRouteNumber,
  initialPickupStop = '',
}) => {
  // Form State
  const [studentId, setStudentId] = useState<string>('');
  const [studentName, setStudentName] = useState<string>('');
  const [missedRouteNumber, setMissedRouteNumber] = useState<number | undefined>(initialRouteNumber);
  const [pickupStop, setPickupStop] = useState<string>(initialPickupStop);
  const [destinationStop] = useState<string>('College (CVR Campus)');
  const [selectedTripId, setSelectedTripId] = useState<string | null>(null);

  // Status & Feedback
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Hook for live requests and trips
  const { 
    requests, 
    calculateCapacity 
  } = useBoardingData(studentId);

  // Identify student's active request if any
  const activeStudentRequest: BoardingRequest | undefined = useMemo(() => {
    if (!studentId.trim()) return undefined;
    return requests.find(
      (r) => r.studentId.toLowerCase() === studentId.trim().toLowerCase() && 
      (r.status === 'PENDING' || r.status === 'ACCEPTED' || r.status === 'REJECTED')
    );
  }, [requests, studentId]);

  // Find candidate pickup stops across all routes
  const availableStops = useMemo(() => {
    const set = new Set<string>();
    OFFICIAL_CVR_ROUTES.forEach((r) => {
      r.stops.forEach((s) => {
        if (!s.isDestination && !s.name.toLowerCase().includes('college')) {
          set.add(s.name);
        }
      });
    });
    return Array.from(set).sort();
  }, []);

  // Compute alternative compatible trips
  const candidateTrips = useMemo(() => {
    if (!pickupStop) return [];
    return findAlternativeTripsForMissedBus(missedRouteNumber, pickupStop, destinationStop);
  }, [missedRouteNumber, pickupStop, destinationStop]);

  if (!isOpen) return null;

  const handleSelectTrip = (trip: TripCapacityState) => {
    const calc = calculateCapacity(trip);
    if (!trip.isAcceptingRequests) {
      setErrorMessage(`Route ${trip.routeNumber} is currently not accepting ad-hoc boarding requests.`);
      return;
    }
    if (calc.availableCapacity <= 0) {
      setErrorMessage(`Route ${trip.routeNumber} is currently at maximum capacity (0 seats available).`);
      return;
    }
    setErrorMessage(null);
    setSelectedTripId(trip.tripId);
  };

  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!studentId.trim() || !studentName.trim()) {
      setErrorMessage('Please enter your Student Roll Number and Name');
      return;
    }

    if (!pickupStop) {
      setErrorMessage('Please select your boarding stop');
      return;
    }

    if (!selectedTripId) {
      setErrorMessage('Please choose a bus from the available alternative trips list');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await createBoardingRequest({
        tripId: selectedTripId,
        studentId: studentId.trim(),
        studentName: studentName.trim(),
        pickupStop,
        destinationStop,
        missedBusRouteNumber: missedRouteNumber,
      });

      if (!result.success) {
        setErrorMessage(result.error || 'Failed to submit boarding request');
      } else {
        setSuccessMessage('Boarding request submitted! Conductor will review it when safely stopped.');
      }
    } catch {
      setErrorMessage('Network or server error while submitting boarding request');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = async (reqId: string) => {
    if (!studentId.trim()) return;
    try {
      const res = await cancelBoardingRequest(reqId, studentId);
      if (!res.success) {
        setErrorMessage(res.error || 'Failed to cancel request');
      } else {
        setSuccessMessage('Boarding request cancelled successfully.');
      }
    } catch {
      setErrorMessage('Error cancelling request');
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-[#0F1E36]/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-150">
      <div 
        className="bg-white rounded-2xl max-w-2xl w-full border border-[#DCD8D0] shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 sm:p-6 bg-[#0F1E36] text-white flex items-start justify-between relative">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
              <Ticket className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">Smart Boarding Request</h2>
                <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Missed Bus Assist
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-300 font-medium mt-0.5">
                Reserve authorized standing or vacant seating on compatible CVR corridors
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            type="button"
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/25 text-white flex items-center justify-center transition-colors"
            title="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6">
          
          {/* Active Request Tracker Banner (if student already submitted a request) */}
          {activeStudentRequest && (
            <div className={`p-4 rounded-xl border ${
              activeStudentRequest.status === 'ACCEPTED'
                ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                : activeStudentRequest.status === 'PENDING'
                ? 'bg-amber-50 border-amber-300 text-amber-950'
                : 'bg-rose-50 border-rose-300 text-rose-950'
            }`}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  {activeStudentRequest.status === 'ACCEPTED' ? (
                    <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
                  ) : activeStudentRequest.status === 'PENDING' ? (
                    <Clock className="w-6 h-6 text-amber-600 animate-spin shrink-0" />
                  ) : (
                    <XCircle className="w-6 h-6 text-rose-600 shrink-0" />
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold uppercase tracking-wider">
                        Request Status: <strong>{activeStudentRequest.status}</strong>
                      </span>
                      <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-white/80 border border-current">
                        Route #{activeStudentRequest.routeNumber}
                      </span>
                    </div>
                    <p className="text-sm font-semibold mt-0.5">
                      {activeStudentRequest.pickupStop} ➔ {activeStudentRequest.destinationStop}
                    </p>
                  </div>
                </div>

                {activeStudentRequest.status === 'PENDING' && (
                  <button
                    type="button"
                    onClick={() => handleCancel(activeStudentRequest.id)}
                    className="px-2.5 py-1 text-xs font-bold rounded-lg bg-white border border-amber-300 text-amber-900 hover:bg-amber-100 transition-colors"
                  >
                    Cancel Request
                  </button>
                )}
              </div>

              {/* Accepted State: Digital Boarding Pass */}
              {activeStudentRequest.status === 'ACCEPTED' && (
                <div className="mt-3.5 pt-3.5 border-t border-emerald-200 bg-white/90 p-3.5 rounded-lg border border-emerald-300 flex items-center justify-between gap-4 flex-wrap">
                  <div>
                    <div className="flex items-center gap-1.5 text-xs text-emerald-800 font-bold uppercase tracking-wider">
                      <QrCode className="w-4 h-4 text-emerald-700" />
                      <span>Digital Seat Boarding Pass</span>
                    </div>
                    <p className="text-lg font-black font-mono tracking-wider text-emerald-900 mt-0.5">
                      {activeStudentRequest.seatPassCode}
                    </p>
                    <p className="text-xs text-slate-600 mt-0.5">
                      Show this pass to the conductor upon boarding at <strong>{activeStudentRequest.pickupStop}</strong>.
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-emerald-600 text-white">
                      Seat Reserved
                    </span>
                  </div>
                </div>
              )}

              {/* Pending State Notice */}
              {activeStudentRequest.status === 'PENDING' && (
                <div className="mt-3 pt-3 border-t border-amber-200 text-xs text-amber-900 flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0" />
                  <span>
                    Awaiting conductor approval. Review occurs safely at scheduled vehicle stops.
                  </span>
                </div>
              )}

              {/* Rejected State: Reason and Find Alternative Button */}
              {activeStudentRequest.status === 'REJECTED' && (
                <div className="mt-3 pt-3 border-t border-rose-200 text-xs space-y-2">
                  <p className="text-rose-900">
                    <strong>Rejection Reason:</strong> {activeStudentRequest.rejectionReason || 'Bus reached maximum capacity.'}
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedTripId(null);
                      setErrorMessage(null);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-rose-700 text-white font-bold hover:bg-rose-800 transition-colors inline-flex items-center gap-1.5"
                  >
                    <span>Find Another Suitable Bus</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmitRequest} className="space-y-4">
            
            {/* Student Identification */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-[#0F1E36] uppercase tracking-wider mb-1">
                  Student Roll / Hall Ticket No. *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value.toUpperCase())}
                    placeholder="e.g. 23B81A0501"
                    className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-[#FAF9F5] border border-[#DCD8D0] rounded-xl focus:outline-hidden focus:ring-2 focus:ring-[#0F1E36] font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#0F1E36] uppercase tracking-wider mb-1">
                  Student Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  placeholder="e.g. Rahul Sharma"
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-[#FAF9F5] border border-[#DCD8D0] rounded-xl focus:outline-hidden focus:ring-2 focus:ring-[#0F1E36]"
                />
              </div>
            </div>

            {/* Missed Bus & Boarding Hub Selection */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-[#0F1E36] uppercase tracking-wider mb-1">
                  Which Bus Did You Miss? (Optional)
                </label>
                <select
                  value={missedRouteNumber || ''}
                  onChange={(e) => setMissedRouteNumber(e.target.value ? Number(e.target.value) : undefined)}
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-[#FAF9F5] border border-[#DCD8D0] rounded-xl focus:outline-hidden focus:ring-2 focus:ring-[#0F1E36]"
                >
                  <option value="">-- Select missed route (optional) --</option>
                  {OFFICIAL_CVR_ROUTES.map((r) => (
                    <option key={r.id} value={r.routeNumber}>
                      Route #{r.routeNumber} ({r.startingLocation})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#0F1E36] uppercase tracking-wider mb-1">
                  Your Current Boarding Stop *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <MapPin className="w-4 h-4 text-amber-600" />
                  </div>
                  <select
                    required
                    value={pickupStop}
                    onChange={(e) => {
                      setPickupStop(e.target.value);
                      setSelectedTripId(null);
                    }}
                    className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-[#FAF9F5] border border-[#DCD8D0] rounded-xl focus:outline-hidden focus:ring-2 focus:ring-[#0F1E36]"
                  >
                    <option value="">-- Select Boarding Point --</option>
                    {availableStops.map((stop) => (
                      <option key={stop} value={stop}>{stop}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Alternative Candidate Trips Selection */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-bold text-[#0F1E36] uppercase tracking-wider">
                  Available Buses Serving {pickupStop ? `"${pickupStop}"` : 'Your Stop'} ({candidateTrips.length})
                </label>
                <span className="text-[11px] text-slate-500 font-medium">
                  Sorted by Available Capacity
                </span>
              </div>

              {pickupStop ? (
                candidateTrips.length > 0 ? (
                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    {candidateTrips.map(({ trip, calculation, isAlternative }) => {
                      const isSelected = selectedTripId === trip.tripId;
                      const hasAvailableSeats = calculation.availableCapacity > 0;
                      const isAtCapacity = calculation.isFull;

                      return (
                        <div
                          key={trip.tripId}
                          onClick={() => handleSelectTrip(trip)}
                          className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                            isSelected
                              ? 'bg-amber-50/90 border-[#0F1E36] ring-2 ring-[#0F1E36]/15'
                              : isAtCapacity
                              ? 'bg-slate-50/70 border-slate-200 opacity-75'
                              : 'bg-white border-[#E5E2DC] hover:border-amber-400 hover:bg-[#FAF9F5]'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-[#0F1E36] text-white flex items-center justify-center font-bold text-xs shrink-0">
                              #{trip.routeNumber}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs sm:text-sm font-bold text-[#0F1E36]">
                                  {trip.routeLabel}
                                </span>
                                {isAlternative && (
                                  <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-200">
                                    Alternative
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                                <span>Departs terminal: <strong>{trip.departureTime}</strong></span>
                                <span>•</span>
                                <span>Bus: {trip.busIdentifier}</span>
                              </p>
                            </div>
                          </div>

                          {/* Capacity status pill */}
                          <div className="text-right shrink-0">
                            {isAtCapacity ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200">
                                Bus Full ({calculation.verifiedOccupancy}/{calculation.maxCapacity})
                              </span>
                            ) : hasAvailableSeats ? (
                              <div>
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                  {calculation.availableCapacity} Seats Available
                                </span>
                                {calculation.isStale && (
                                  <span className="block text-[10px] text-amber-700 font-medium mt-0.5">
                                    Count {calculation.staleMinutes}m ago
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
                                Standby
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-6 text-center bg-[#FAF9F5] rounded-xl border border-[#E5E2DC] text-xs text-slate-600">
                    <AlertTriangle className="w-5 h-5 text-amber-600 mx-auto mb-1.5" />
                    <p className="font-semibold">No direct CVR routes found serving "{pickupStop}" to College.</p>
                    <p className="text-slate-500 mt-1">Please select a primary junction (e.g. LB Nagar, Uppal, Dilsukhnagar, ECIL).</p>
                  </div>
                )
              ) : (
                <div className="p-5 text-center bg-[#FAF9F5] rounded-xl border border-dashed border-[#DCD8D0] text-xs text-slate-500">
                  <Search className="w-5 h-5 text-slate-400 mx-auto mb-1" />
                  Select your current boarding stop above to inspect available buses and capacity.
                </div>
              )}
            </div>

            {/* Error & Success Messages */}
            {errorMessage && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{errorMessage}</span>
              </div>
            )}

            {successMessage && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>{successMessage}</span>
              </div>
            )}

            {/* Safety & Protocol Notice */}
            <div className="p-3 rounded-xl bg-[#FAF9F5] border border-[#E5E2DC] text-slate-600 text-[11px] leading-relaxed flex items-start gap-2">
              <ShieldAlert className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
              <span>
                <strong>Transport Protocol:</strong> Requests are delivered to the vehicle conductor. Drivers will not operate the application while driving. Boarding passes must be presented before entry.
              </span>
            </div>

            {/* Submit Action */}
            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl border border-[#DCD8D0] hover:bg-[#FAF9F5] text-slate-700 text-xs font-bold transition-colors"
              >
                Close
              </button>

              <button
                type="submit"
                disabled={isSubmitting || !selectedTripId}
                className="px-5 py-2.5 rounded-xl bg-[#0F1E36] hover:bg-[#1A2F50] disabled:bg-slate-300 text-amber-400 disabled:text-slate-500 text-xs sm:text-sm font-bold flex items-center gap-2 transition-colors shadow-2xs cursor-pointer disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Transmitting Request...</span>
                  </>
                ) : (
                  <>
                    <Ticket className="w-4 h-4" />
                    <span>Submit Boarding Request</span>
                  </>
                )}
              </button>
            </div>

          </form>

        </div>
      </div>
    </div>
  );
};
