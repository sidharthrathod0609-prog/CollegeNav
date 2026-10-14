import type { CVRRoute, CVRRouteStop } from '../data/cvrRoutes';

export type { CVRRoute, CVRRouteStop };

export type RouteSortOption = 'recommendation' | 'fewest-stops' | 'earliest' | 'route-number';

export interface RouteSearchResult {
  route: CVRRoute;
  originStop: CVRRouteStop;
  destinationStop: CVRRouteStop;
  originIndex: number;
  destinationIndex: number;
  intermediateStopCount: number;
  departureTime: string;
  recommendationScore: number;
  recommendationReasons: string[];
  isRecommended: boolean;
}

export interface TransportAdvisory {
  id: string;
  routeNumber?: string;
  type: 'notice' | 'guideline' | 'verification' | 'alert';
  severity?: 'low' | 'medium' | 'high';
  title: string;
  message: string;
  status?: 'ACTIVE' | 'RESOLVED';
  date: string;
  createdAt?: number;
  updatedAt?: number;
  publishedBy?: string;
}

export interface SearchFilters {
  origin: string;
  destination: string;
  sortBy: RouteSortOption;
}

export interface GeographicCoordinate {
  lat: number;
  lng: number;
}

// Backward compatibility types for demo/mock files
export type ServiceStatus = 'ON_TIME' | 'DELAYED' | 'DEPARTED' | 'SCHEDULED' | 'DIVERTED';

export interface TransitStop {
  id: string;
  name: string;
  landmark: string;
  lat: number;
  lng: number;
  scheduledTime: string;
  eveningTime?: string;
  isMajorHub?: boolean;
}

export interface ServiceAlert {
  id: string;
  routeId: string;
  routeNumber: string;
  type: string;
  severity?: string;
  title: string;
  message: string;
  timestamp: string;
  delayMinutes?: number;
  isSimulatedDemo?: boolean;
}

export interface BusRoute {
  id: string;
  routeNumber: string;
  routeName: string;
  busIdentifier?: string;
  driverName?: string;
  driverContactDemo?: string;
  capacity?: number;
  occupiedSeatsEst?: number;
  status?: ServiceStatus;
  statusNote?: string;
  delayMinutes?: number;
  currentSimulatedLocation?: {
    lat: number;
    lng: number;
    currentStopIndex: number;
    nextStopName: string;
    speedKmH: number;
    lastUpdated: string;
  };
  morningStartTime?: string;
  campusArrivalEta?: string;
  eveningDepartureTime?: string;
  color?: string;
  stops: TransitStop[];
  isDemoData?: boolean;
  verificationStatus?: string;
}

