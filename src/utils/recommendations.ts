import type { CVRRoute, CVRRouteStop } from '../data/cvrRoutes';
import type { RouteSearchResult, RouteSortOption } from '../types/transit';

/**
 * Normalizes input strings for robust, punctuation-tolerant, spacing-tolerant matching.
 * Examples: "L.B. Nagar", "lb nagar", "l b nagar" -> "lb nagar"
 */
export function normalizeSearchTerm(term: string): string {
  return term
    .toLowerCase()
    .replace(/[.\-_'’()]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Checks if a destination input represents the CVR College campus
 */
function isCollegeCampusTerm(term: string): boolean {
  const norm = normalizeSearchTerm(term);
  if (!norm) return true;
  const campusKeywords = ['college', 'cvr', 'campus', 'cvrce', 'vastunagar', 'mangalpally', 'cvr college'];
  return campusKeywords.some((k) => norm.includes(k) || k.includes(norm));
}

/**
 * Parses time strings like "6:50 AM", "7.05 AM", "08:15 AM" into total minutes from midnight
 */
export function parseTimeToMinutes(timeStr: string): number {
  if (!timeStr || timeStr.toLowerCase().includes('not')) return 9999;
  
  // Normalize "7.05 AM" -> "7:05 AM"
  const normalized = timeStr.trim().replace('.', ':');
  const parts = normalized.split(/\s+/);
  if (parts.length < 2) return 9999;
  
  const [hoursStr, minutesStr] = parts[0].split(':');
  let hours = parseInt(hoursStr, 10);
  const minutes = parseInt(minutesStr, 10);
  const period = parts[1].toUpperCase();

  if (isNaN(hours) || isNaN(minutes)) return 9999;
  if (period === 'PM' && hours !== 12) hours += 12;
  if (period === 'AM' && hours === 12) hours = 0;

  return hours * 60 + minutes;
}

/**
 * Accurately matches stop names against search queries.
 * Uses whole-word boundary matching to prevent partial false positives (e.g. "uppal" in "boduppal").
 */
export function matchesStopQuery(stopName: string, query: string): boolean {
  const normStop = normalizeSearchTerm(stopName);
  const normQuery = normalizeSearchTerm(query);
  if (!normQuery) return true;
  if (normStop === normQuery) return true;

  const queryWords = normQuery.split(/\s+/).filter(Boolean);
  return queryWords.every((word) => {
    const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`\\b${escaped}\\b`, 'i');
    return regex.test(normStop);
  });
}

/**
 * Search and rank official CVR College bus routes.
 * Strictly adheres to verified data rules:
 * - Order-based matching (origin must appear before destination)
 * - Transparent recommendation score (capped at 100, no impossible 110)
 * - Flags incomplete routes
 * - Never invents travel duration or arrival estimates
 */
export function searchAndRankRoutes(
  routes: CVRRoute[],
  originInput: string,
  destinationInput: string,
  sortBy: RouteSortOption = 'recommendation'
): RouteSearchResult[] {
  const normOrigin = normalizeSearchTerm(originInput);
  const normDest = normalizeSearchTerm(destinationInput || 'college');
  const destIsCollege = isCollegeCampusTerm(destinationInput);
  const originIsCollege = isCollegeCampusTerm(originInput);

  // If origin is College itself, no morning route departs from campus
  if (originIsCollege && normOrigin.length > 0) {
    return [];
  }

  // Check if user is searching directly for a route number (e.g. "Route 20", "20", "r20")
  const routeNumMatch = normOrigin.match(/^(?:route|r)?\s*(\d+)$/i);
  const targetRouteNumber = routeNumMatch ? parseInt(routeNumMatch[1], 10) : null;

  const results: RouteSearchResult[] = [];

  for (const route of routes) {
    // If route number was searched directly
    if (targetRouteNumber !== null) {
      if (route.routeNumber === targetRouteNumber) {
        const originStop: CVRRouteStop = route.stops[0] || {
          id: `${route.id}-start`,
          name: route.startingLocation,
          isStartingPoint: true,
          isDestination: false,
          stopOrder: 1,
        };
        const destStop: CVRRouteStop = route.stops[route.stops.length - 1] || {
          id: `${route.id}-end`,
          name: route.destination,
          isStartingPoint: false,
          isDestination: true,
          stopOrder: route.stops.length || 2,
        };

        const intermediateCount = Math.max(0, route.stops.length - 2);

        results.push({
          route,
          originStop,
          destinationStop: destStop,
          originIndex: 0,
          destinationIndex: Math.max(0, route.stops.length - 1),
          intermediateStopCount: intermediateCount,
          departureTime: route.departureTime,
          recommendationScore: route.isIncomplete ? 30 : 95,
          recommendationReasons: route.isIncomplete
            ? ['Direct route number search match', 'Warning: Route stops not listed in official circular']
            : ['Direct route number search match', `Departs ${route.departureTime} from ${route.startingLocation}`],
          isRecommended: !route.isIncomplete,
        });
      }
      continue;
    }

    // Handle incomplete routes (e.g., Route 21 and Route 39)
    if (route.isIncomplete || route.stops.length === 0) {
      if (normOrigin === '') {
        // If searching all routes, include incomplete routes clearly labeled
        results.push({
          route,
          originStop: {
            id: `${route.id}-unlisted`,
            name: 'Stops unlisted in circular',
            isStartingPoint: true,
            isDestination: false,
            stopOrder: 1,
          },
          destinationStop: {
            id: `${route.id}-dest`,
            name: route.destination,
            isStartingPoint: false,
            isDestination: true,
            stopOrder: 2,
          },
          originIndex: 0,
          destinationIndex: 1,
          intermediateStopCount: 0,
          departureTime: 'Not listed',
          recommendationScore: 20,
          recommendationReasons: ['Record present in circular, but stops marked unlisted'],
          isRecommended: false,
        });
      }
      continue;
    }

    // 1. Find matching origin stop (must not be the final destination stop)
    let originIndex = -1;
    if (normOrigin === '') {
      originIndex = 0; // Default to route origin if empty search
    } else {
      originIndex = route.stops.findIndex((s, idx) => {
        // Cannot board at the terminal destination stop
        if (idx === route.stops.length - 1 && s.isDestination) return false;
        return matchesStopQuery(s.name, normOrigin);
      });

      // Also check route starting location field
      if (originIndex === -1 && matchesStopQuery(route.startingLocation, normOrigin)) {
        originIndex = 0;
      }
    }

    // If origin did not match, skip this route
    if (originIndex === -1) {
      continue;
    }

    // 2. Find matching destination stop (must appear strictly AFTER originIndex)
    let destIndex = -1;
    if (destIsCollege) {
      // Find the "College" stop, which is the final stop on all CVR routes
      destIndex = route.stops.findIndex(
        (s, idx) => idx > originIndex && (s.isDestination || normalizeSearchTerm(s.name) === 'college')
      );
      if (destIndex === -1 && route.stops.length > originIndex + 1) {
        destIndex = route.stops.length - 1;
      }
    } else {
      // Search for specific intermediate destination stop appearing after origin
      destIndex = route.stops.findIndex((s, idx) => {
        if (idx <= originIndex) return false;
        return matchesStopQuery(s.name, normDest);
      });
    }

    // If no valid destination appears after the origin, skip (enforces stop order)
    if (destIndex === -1 || destIndex <= originIndex) {
      continue;
    }

    const originStop = route.stops[originIndex];
    const destinationStop = route.stops[destIndex];
    const intermediateStopCount = destIndex - originIndex - 1;

    // 3. Compute Transparent Recommendation Score (Base 50, Capped strictly at 100)
    let score = 50;
    const reasons: string[] = [];

    // Rule 1: Origin Terminal vs Intermediate Stop
    if (originIndex === 0) {
      score += 25;
      reasons.push(`Direct departure from route starting terminal (${route.departureTime})`);
    } else {
      score += 10;
      reasons.push(`Boarding at intermediate stop #${originIndex + 1} (${originStop.name})`);
    }

    // Rule 2: Route Directness / Intermediate Stop Count
    if (intermediateStopCount <= 3) {
      score += 20;
      reasons.push(`Express corridor with only ${intermediateStopCount} intermediate stop${intermediateStopCount === 1 ? '' : 's'}`);
    } else if (intermediateStopCount <= 7) {
      score += 12;
      reasons.push(`Moderate transit corridor with ${intermediateStopCount} stops`);
    } else {
      score += 5;
      reasons.push(`Standard radial corridor with ${intermediateStopCount} stops`);
    }

    // Rule 3: Schedule Availability
    const startMins = parseTimeToMinutes(route.departureTime);
    if (startMins <= 7 * 60 + 30) {
      score += 5;
      reasons.push(`Early morning scheduled service (${route.departureTime})`);
    } else {
      score += 3;
      reasons.push(`Morning service departing at ${route.departureTime}`);
    }

    // Departure time string display
    const departureDisplay = originIndex === 0 
      ? route.departureTime 
      : `Starts ${route.departureTime} at ${route.startingLocation}`;

    // Strictly enforce 0 - 100 range
    const finalScore = Math.min(100, Math.max(10, score));

    results.push({
      route,
      originStop,
      destinationStop,
      originIndex,
      destinationIndex: destIndex,
      intermediateStopCount,
      departureTime: departureDisplay,
      recommendationScore: finalScore,
      recommendationReasons: reasons,
      isRecommended: false, // will be assigned to top match below
    });
  }

  // Sort Results
  results.sort((a, b) => {
    if (sortBy === 'fewest-stops') {
      if (a.intermediateStopCount !== b.intermediateStopCount) {
        return a.intermediateStopCount - b.intermediateStopCount;
      }
      return b.recommendationScore - a.recommendationScore;
    }
    
    if (sortBy === 'earliest') {
      const aTime = parseTimeToMinutes(a.route.departureTime);
      const bTime = parseTimeToMinutes(b.route.departureTime);
      if (aTime !== bTime) {
        return aTime - bTime;
      }
      return a.route.routeNumber - b.route.routeNumber;
    }

    if (sortBy === 'route-number') {
      return a.route.routeNumber - b.route.routeNumber;
    }

    // Default: 'recommendation'
    if (b.recommendationScore !== a.recommendationScore) {
      return b.recommendationScore - a.recommendationScore;
    }
    if (a.intermediateStopCount !== b.intermediateStopCount) {
      return a.intermediateStopCount - b.intermediateStopCount;
    }
    return a.route.routeNumber - b.route.routeNumber;
  });

  // Assign Recommended Badge to the #1 ranked valid result
  if (results.length > 0 && results[0].recommendationScore >= 70 && !results[0].route.isIncomplete) {
    results[0].isRecommended = true;
  }

  return results;
}
