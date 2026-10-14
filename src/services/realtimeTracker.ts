import type { BusRoute } from '../types/transit';

/**
 * Firebase Realtime Database Data Contract
 * Schema structure: /fleet_telemetry/{routeId}
 */
export interface FirebaseBusTelemetry {
  routeId: string;
  busIdentifier: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  speedKmH: number;
  headingDegrees: number;
  currentStopIndex: number;
  nextStopId: string;
  delayMinutes: number;
  batteryOrFuelPct: number;
  lastPingTimestamp: number;
  source: 'FIREBASE_RTDB' | 'LOCAL_SIMULATOR';
}

export interface TelemetryListenerCallback {
  (telemetry: Record<string, FirebaseBusTelemetry>): void;
}

/**
 * Realtime Simulation & Firebase Connector
 * Allows demonstrator/judges to toggle live telemetry updates to watch the bus move along the route stops!
 */
class RealtimeTransitService {
  private listeners: Set<TelemetryListenerCallback> = new Set();
  private intervalId: number | null = null;
  private isSimulating: boolean = false;
  private telemetryState: Record<string, FirebaseBusTelemetry> = {};

  constructor() {
    this.initDefaultTelemetry();
  }

  private initDefaultTelemetry() {
    // Initial coordinates set from mock data
    this.telemetryState = {
      'route-14': {
        routeId: 'route-14',
        busIdentifier: 'TS-08-UA-1402',
        coordinates: { lat: 17.3688, lng: 78.5247 },
        speedKmH: 34,
        headingDegrees: 145,
        currentStopIndex: 3,
        nextStopId: 'stop-chaitanyapuri',
        delayMinutes: 0,
        batteryOrFuelPct: 88,
        lastPingTimestamp: Date.now(),
        source: 'LOCAL_SIMULATOR',
      },
      'route-22': {
        routeId: 'route-22',
        busIdentifier: 'TS-08-UA-2218',
        coordinates: { lat: 17.3755, lng: 78.5615 },
        speedKmH: 18,
        headingDegrees: 180,
        currentStopIndex: 2,
        nextStopId: 'stop-lbnagar',
        delayMinutes: 12,
        batteryOrFuelPct: 76,
        lastPingTimestamp: Date.now(),
        source: 'LOCAL_SIMULATOR',
      },
      'route-08': {
        routeId: 'route-08',
        busIdentifier: 'TS-08-UA-0845',
        coordinates: { lat: 17.3457, lng: 78.5522 },
        speedKmH: 42,
        headingDegrees: 160,
        currentStopIndex: 3,
        nextStopId: 'stop-sagar-ring',
        delayMinutes: 0,
        batteryOrFuelPct: 92,
        lastPingTimestamp: Date.now(),
        source: 'LOCAL_SIMULATOR',
      },
    };
  }

  public subscribe(callback: TelemetryListenerCallback): () => void {
    this.listeners.add(callback);
    // Send initial snapshot immediately
    callback(this.telemetryState);

    return () => {
      this.listeners.delete(callback);
    };
  }

  public getSnapshot(): Record<string, FirebaseBusTelemetry> {
    return { ...this.telemetryState };
  }

  public isLiveSimulationActive(): boolean {
    return this.isSimulating;
  }

  public startSimulation(routes: BusRoute[]) {
    if (this.isSimulating) return;
    this.isSimulating = true;

    this.intervalId = window.setInterval(() => {
      routes.forEach((route) => {
        const current = this.telemetryState[route.id];
        if (!current) return;

        // Progress smoothly along the stops
        const stops = route.stops;
        let nextIndex = current.currentStopIndex;

        // Minor coordinate nudge towards next stop to simulate GPS ping
        const currentTargetStop = stops[Math.min(nextIndex + 1, stops.length - 1)];
        const stepRatio = 0.08;
        const newLat = current.coordinates.lat + (currentTargetStop.lat - current.coordinates.lat) * stepRatio;
        const newLng = current.coordinates.lng + (currentTargetStop.lng - current.coordinates.lng) * stepRatio;

        // If very close to next stop, increment target stop
        const dist = Math.hypot(newLat - currentTargetStop.lat, newLng - currentTargetStop.lng);
        if (dist < 0.002 && nextIndex < stops.length - 2) {
          nextIndex += 1;
        }

        this.telemetryState[route.id] = {
          ...current,
          coordinates: { lat: newLat, lng: newLng },
          currentStopIndex: nextIndex,
          nextStopId: stops[Math.min(nextIndex + 1, stops.length - 1)].id,
          speedKmH: Math.floor(25 + Math.random() * 20),
          lastPingTimestamp: Date.now(),
        };
      });

      this.notifyListeners();
    }, 2500);
  }

  public stopSimulation() {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isSimulating = false;
  }

  private notifyListeners() {
    this.listeners.forEach((listener) => {
      listener({ ...this.telemetryState });
    });
  }
}

export const realtimeTransit = new RealtimeTransitService();
