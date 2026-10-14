import type { CVRRoute, CVRRouteStop } from '../data/cvrRoutes';
import type { GeographicCoordinate } from '../types/transit';

export const CVR_CAMPUS_COORDINATE: GeographicCoordinate = {
  lat: 17.1977,
  lng: 78.5972,
};

// Known coordinates for Hyderabad localities and landmarks present in CVR routes
const KNOWN_LANDMARK_COORDINATES: Record<string, GeographicCoordinate> = {
  college: CVR_CAMPUS_COORDINATE,
  'cvr campus': CVR_CAMPUS_COORDINATE,
  'cvr college campus': CVR_CAMPUS_COORDINATE,
  mangalpally: { lat: 17.2050, lng: 78.5940 },
  brahmanpally: { lat: 17.2180, lng: 78.5910 },
  bongloor: { lat: 17.2280, lng: 78.5880 },
  adibatla: { lat: 17.2350, lng: 78.5450 },
  nadergul: { lat: 17.2500, lng: 78.5380 },
  mvsr: { lat: 17.2580, lng: 78.5360 },
  srinilayam: { lat: 17.2650, lng: 78.5320 },
  turkayamjal: { lat: 17.2625, lng: 78.5735 },
  yamjal: { lat: 17.2625, lng: 78.5735 },
  masquati: { lat: 17.2610, lng: 78.5740 },
  ragannaguda: { lat: 17.2680, lng: 78.5710 },
  manneguda: { lat: 17.2720, lng: 78.5680 },
  injapur: { lat: 17.2800, lng: 78.5660 },
  gurramguda: { lat: 17.2855, lng: 78.5620 },
  almasguda: { lat: 17.2920, lng: 78.5580 },
  'nandi hills': { lat: 17.2950, lng: 78.5560 },
  badangpet: { lat: 17.3100, lng: 78.5200 },
  balapur: { lat: 17.3180, lng: 78.5100 },
  meerpet: { lat: 17.3200, lng: 78.5200 },
  jillalaguda: { lat: 17.3280, lng: 78.5250 },
  kuntloor: { lat: 17.3300, lng: 78.6300 },
  hayathnagar: { lat: 17.3250, lng: 78.6050 },
  'pedda amberpet': { lat: 17.3200, lng: 78.6200 },
  'bn reddy': { lat: 17.3050, lng: 78.5530 },
  'area hospital': { lat: 17.3195, lng: 78.5495 },
  vanasthalipuram: { lat: 17.3195, lng: 78.5495 },
  'red tank': { lat: 17.3220, lng: 78.5480 },
  panama: { lat: 17.3250, lng: 78.5470 },
  chintalkunta: { lat: 17.3310, lng: 78.5460 },
  hastinapuram: { lat: 17.3195, lng: 78.5495 },
  karmanghat: { lat: 17.3450, lng: 78.5250 },
  champapet: { lat: 17.3480, lng: 78.5200 },
  saidabad: { lat: 17.3550, lng: 78.5100 },
  'is sadan': { lat: 17.3580, lng: 78.5080 },
  'lb nagar': { lat: 17.3457, lng: 78.5522 },
  'sagar ring road': { lat: 17.3392, lng: 78.5480 },
  bhairamalguda: { lat: 17.3380, lng: 78.5460 },
  kothapet: { lat: 17.3550, lng: 78.5440 },
  chaitanyapuri: { lat: 17.3621, lng: 78.5372 },
  dilsukhnagar: { lat: 17.3688, lng: 78.5247 },
  dsnr: { lat: 17.3688, lng: 78.5247 },
  malakpet: { lat: 17.3753, lng: 78.4984 },
  'nalgonda x road': { lat: 17.3770, lng: 78.4950 },
  chadarghat: { lat: 17.3800, lng: 78.4900 },
  koti: { lat: 17.3850, lng: 78.4867 },
  'afjal gunj': { lat: 17.3720, lng: 78.4740 },
  'city college': { lat: 17.3680, lng: 78.4710 },
  darushifa: { lat: 17.3690, lng: 78.4780 },
  chandrayangutta: { lat: 17.3320, lng: 78.4740 },
  owaisi: { lat: 17.3390, lng: 78.4880 },
  santoshnagar: { lat: 17.3480, lng: 78.5110 },
  aramghar: { lat: 17.3220, lng: 78.4350 },
  attapur: { lat: 17.3650, lng: 78.4280 },
  'langer house': { lat: 17.3780, lng: 78.4250 },
  mehdipatnam: { lat: 17.3916, lng: 78.4385 },
  rathibowli: { lat: 17.3850, lng: 78.4300 },
  gachibowli: { lat: 17.4401, lng: 78.3489 },
  nanakramguda: { lat: 17.4200, lng: 78.3600 },
  kondapur: { lat: 17.4600, lng: 78.3550 },
  kothaguda: { lat: 17.4650, lng: 78.3600 },
  miyapur: { lat: 17.4968, lng: 78.3614 },
  jntu: { lat: 17.4930, lng: 78.3910 },
  kukatpally: { lat: 17.4947, lng: 78.4090 },
  nizampet: { lat: 17.5100, lng: 78.3800 },
  balanagar: { lat: 17.4680, lng: 78.4420 },
  chintal: { lat: 17.5020, lng: 78.4380 },
  shapur: { lat: 17.5100, lng: 78.4360 },
  jeedimetla: { lat: 17.5180, lng: 78.4350 },
  suraram: { lat: 17.5350, lng: 78.4320 },
  erragadda: { lat: 17.4560, lng: 78.4380 },
  'sr nagar': { lat: 17.4430, lng: 78.4450 },
  ameerpet: { lat: 17.4375, lng: 78.4483 },
  panjagutta: { lat: 17.4280, lng: 78.4520 },
  khairatabad: { lat: 17.4110, lng: 78.4600 },
  lakdikapul: { lat: 17.4042, lng: 78.4639 },
  abids: { lat: 17.3920, lng: 78.4760 },
  'film nagar': { lat: 17.4200, lng: 78.4100 },
  'jubilee hills': { lat: 17.4300, lng: 78.4100 },
  secunderabad: { lat: 17.4416, lng: 78.4983 },
  paradise: { lat: 17.4420, lng: 78.4870 },
  bowenpally: { lat: 17.4650, lng: 78.4850 },
  tadbund: { lat: 17.4550, lng: 78.4880 },
  alwal: { lat: 17.5050, lng: 78.5080 },
  bollaram: { lat: 17.5150, lng: 78.5120 },
  lothukunta: { lat: 17.4950, lng: 78.5020 },
  malkajgiri: { lat: 17.4520, lng: 78.5320 },
  safilguda: { lat: 17.4600, lng: 78.5350 },
  anandbagh: { lat: 17.4650, lng: 78.5380 },
  ecil: { lat: 17.4682, lng: 78.5582 },
  kushaiguda: { lat: 17.4750, lng: 78.5620 },
  nagaram: { lat: 17.4850, lng: 78.5750 },
  chakripuram: { lat: 17.4720, lng: 78.5650 },
  yapral: { lat: 17.4920, lng: 78.5480 },
  sainikpuri: { lat: 17.4880, lng: 78.5450 },
  'as rao nagar': { lat: 17.4780, lng: 78.5480 },
  dammaiguda: { lat: 17.5050, lng: 78.5650 },
  saketh: { lat: 17.5020, lng: 78.5620 },
  kapra: { lat: 17.4900, lng: 78.5600 },
  tarnaka: { lat: 17.4285, lng: 78.5312 },
  sitapalmandi: { lat: 17.4320, lng: 78.5200 },
  habsiguda: { lat: 17.4180, lng: 78.5450 },
  uppal: { lat: 17.4018, lng: 78.5602 },
  ramanthapur: { lat: 17.3950, lng: 78.5350 },
  nagole: { lat: 17.3755, lng: 78.5615 },
  boduppal: { lat: 17.4120, lng: 78.5820 },
  medipally: { lat: 17.4100, lng: 78.6000 },
  chengicherla: { lat: 17.4200, lng: 78.6150 },
  peerzadiguda: { lat: 17.4080, lng: 78.5750 },
  narapally: { lat: 17.4150, lng: 78.6250 },
  'indira park': { lat: 17.4100, lng: 78.4850 },
  'ashok nagar': { lat: 17.4080, lng: 78.4890 },
  'rtc x road': { lat: 17.4060, lng: 78.4950 },
  musheerabad: { lat: 17.4180, lng: 78.4980 },
  'bagh lingampally': { lat: 17.3980, lng: 78.5020 },
  nallakunta: { lat: 17.4010, lng: 78.5080 },
  'vidya nagar': { lat: 17.4050, lng: 78.5150 },
  'shivam road': { lat: 17.4020, lng: 78.5180 },
  amberpet: { lat: 17.3960, lng: 78.5220 },
};

/**
 * Normalizes string for landmark matching
 */
function cleanName(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
}

/**
 * Resolves a coordinate for a stop name.
 * Checks for direct or substring match against known Hyderabad landmarks.
 */
export function getStopCoordinate(stopName: string): GeographicCoordinate | null {
  const cleaned = cleanName(stopName);
  
  // Exact match
  if (KNOWN_LANDMARK_COORDINATES[cleaned]) {
    return KNOWN_LANDMARK_COORDINATES[cleaned];
  }

  // Key substring match
  for (const [key, coord] of Object.entries(KNOWN_LANDMARK_COORDINATES)) {
    if (cleaned.includes(key) || key.includes(cleaned)) {
      return coord;
    }
  }

  return null;
}

/**
 * Returns an array of coordinates for an entire CVR route.
 * Guarantees that every stop gets a coordinate, interpolating between known stops.
 */
export function getRoutePathCoordinates(route: CVRRoute): { stop: CVRRouteStop; coord: GeographicCoordinate }[] {
  if (route.stops.length === 0) {
    return [];
  }

  const result: { stop: CVRRouteStop; coord: GeographicCoordinate }[] = [];
  const coords: (GeographicCoordinate | null)[] = route.stops.map((s) => getStopCoordinate(s.name));

  // The last stop is always College (CVR Campus)
  coords[coords.length - 1] = CVR_CAMPUS_COORDINATE;

  // If first stop is missing, assign a sensible default based on Hyderabad bounds
  if (!coords[0]) {
    coords[0] = { lat: 17.4200, lng: 78.4800 };
  }

  // Interpolate missing coordinates between known stops
  for (let i = 0; i < coords.length; i++) {
    if (!coords[i]) {
      // Find previous known coordinate
      let prevIdx = i - 1;
      while (prevIdx >= 0 && !coords[prevIdx]) {
        prevIdx--;
      }
      const prevCoord = prevIdx >= 0 ? coords[prevIdx]! : { lat: 17.4000, lng: 78.4800 };

      // Find next known coordinate
      let nextIdx = i + 1;
      while (nextIdx < coords.length && !coords[nextIdx]) {
        nextIdx++;
      }
      const nextCoord = nextIdx < coords.length ? coords[nextIdx]! : CVR_CAMPUS_COORDINATE;

      // Linear interpolation fraction
      const fraction = (i - prevIdx) / (nextIdx - prevIdx);
      coords[i] = {
        lat: prevCoord.lat + (nextCoord.lat - prevCoord.lat) * fraction,
        lng: prevCoord.lng + (nextCoord.lng - prevCoord.lng) * fraction,
      };
    }

    result.push({
      stop: route.stops[i],
      coord: coords[i]!,
    });
  }

  return result;
}
