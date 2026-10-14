export type RequestStatus = 
  | 'PENDING' 
  | 'ACCEPTED' 
  | 'REJECTED' 
  | 'EXPIRED' 
  | 'BOARDED' 
  | 'CANCELLED';

export type TripOperationalStatus = 
  | 'SCHEDULED' 
  | 'BOARDING_OPEN' 
  | 'AT_CAPACITY' 
  | 'COMPLETED' 
  | 'STANDBY';

export interface BoardingRequest {
  id: string;
  tripId: string;
  routeId: string;
  routeNumber: number;
  routeLabel: string;
  studentId: string;
  studentName: string;
  missedBusRouteNumber?: number;
  pickupStop: string;
  pickupStopIndex: number;
  destinationStop: string;
  destinationStopIndex: number;
  status: RequestStatus;
  rejectionReason?: string;
  requestedAt: number;
  updatedAt: number;
  expiresAt: number;
  seatPassCode?: string;
  conductorNote?: string;
}

export interface TripCapacityState {
  tripId: string;
  routeId: string;
  routeNumber: number;
  routeLabel: string;
  busIdentifier: string;
  startingLocation: string;
  departureTime: string;
  maxCapacity: number;              // Standard authorized seating capacity
  verifiedOccupancy: number;        // Physical headcount observed onboard
  confirmedReservationsCount: number; // Accepted student reservations not yet boarded
  pendingRequestsCount: number;     // Awaiting conductor decision
  lastOccupancyVerifiedAt: number;  // Epoch ms of last verified count
  lastOccupancyVerifiedBy: string;  // e.g. "Conductor - LB Nagar Hub"
  isAcceptingRequests: boolean;     // Conductor manual control
  operatingStatus: TripOperationalStatus;
  driverSafetyAcknowledged?: boolean;
}

export interface CapacityCalculation {
  maxCapacity: number;
  verifiedOccupancy: number;
  confirmedReservationsCount: number;
  pendingRequestsCount: number;
  availableCapacity: number;
  isFull: boolean;
  isStale: boolean;
  staleMinutes: number;
}

export const REJECTION_REASONS = [
  'Bus reached maximum passenger capacity',
  'Bus has already departed this boarding point',
  'Corridor altered / Operating as non-stop express',
  'Occupancy headcount unverified - Cannot guarantee seat',
  'Student should take scheduled alternative corridor',
] as const;

export type RejectionReason = typeof REJECTION_REASONS[number];
