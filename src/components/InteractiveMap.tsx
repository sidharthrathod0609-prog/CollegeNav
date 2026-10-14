import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import type { CVRRoute, CVRRouteStop } from '../data/cvrRoutes';
import { getRoutePathCoordinates, CVR_CAMPUS_COORDINATE } from '../utils/geoCoordinates';
import { Maximize2 } from 'lucide-react';

interface InteractiveMapProps {
  route: CVRRoute | null;
  allRoutes: CVRRoute[];
  selectedStopId?: string;
  onSelectStop?: (stop: CVRRouteStop) => void;
}

export const InteractiveMap: React.FC<InteractiveMapProps> = ({
  route,
  allRoutes,
  selectedStopId,
  onSelectStop,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const polylineLayerRef = useRef<L.LayerGroup | null>(null);

  // Initialize Map
  useEffect(() => {
    const container = mapContainerRef.current;
    if (!container || mapInstanceRef.current) return;

    // Clear any previous leaflet instance id on re-mount
    (container as any)._leaflet_id = null;

    // Default center on Greater Hyderabad / CVRCE corridor
    const map = L.map(container, {
      center: [17.32, 78.53],
      zoom: 11,
      zoomControl: false,
    });

    // Add TileLayer (OpenStreetMap)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 18,
    }).addTo(map);

    // Zoom control at bottom right
    L.control.zoom({ position: 'bottomright' }).addTo(map);

    markersLayerRef.current = L.layerGroup().addTo(map);
    polylineLayerRef.current = L.layerGroup().addTo(map);
    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
      if (container) {
        (container as any)._leaflet_id = null;
      }
    };
  }, []);

  // Render Routes and Stops whenever route changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !markersLayerRef.current || !polylineLayerRef.current) return;

    markersLayerRef.current.clearLayers();
    polylineLayerRef.current.clearLayers();

    const targetRoute = route || allRoutes.find((r) => !r.isIncomplete) || allRoutes[0];
    if (!targetRoute || targetRoute.isIncomplete || targetRoute.stops.length === 0) {
      // Just pin CVR Campus if no valid route
      const campusMarker = L.marker([CVR_CAMPUS_COORDINATE.lat, CVR_CAMPUS_COORDINATE.lng]);
      campusMarker.bindPopup('<b>CVR College of Engineering</b><br/>Vastunagar, Mangalpally');
      campusMarker.addTo(markersLayerRef.current);
      return;
    }

    const pathData = getRoutePathCoordinates(targetRoute);
    const latLngs: L.LatLngTuple[] = pathData.map((d) => [d.coord.lat, d.coord.lng]);

    // Draw Route Polyline
    const polyline = L.polyline(latLngs, {
      color: '#0F1E36',
      weight: 4.5,
      opacity: 0.9,
    });
    polyline.addTo(polylineLayerRef.current);

    // Render Markers for each stop
    pathData.forEach(({ stop, coord }, idx) => {
      const isFirst = idx === 0;
      const isCampus = idx === pathData.length - 1 || stop.isDestination;
      const isSelected = stop.id === selectedStopId;

      const iconHtml = `
        <div class="relative flex items-center justify-center">
          <div class="${
            isCampus
              ? 'w-7 h-7 bg-emerald-700 ring-3 ring-emerald-200 text-white'
              : isFirst
              ? 'w-6 h-6 bg-amber-600 ring-3 ring-amber-200 text-white'
              : isSelected
              ? 'w-6 h-6 bg-amber-500 ring-2 ring-white text-white'
              : 'w-4 h-4 bg-white border-2 border-[#0F1E36] shadow-xs'
          } rounded-full flex items-center justify-center font-bold text-[10px] transition-transform duration-200 hover:scale-125">
            ${isCampus ? '🎓' : isFirst ? '📍' : isSelected ? '●' : ''}
          </div>
          ${
            isCampus || isFirst || isSelected
              ? `<span class="absolute -bottom-5 whitespace-nowrap px-1.5 py-0.5 rounded bg-[#0F1E36] text-white text-[9px] font-mono shadow-xs">${stop.name.split(' ')[0]}</span>`
              : ''
          }
        </div>
      `;

      const stopIcon = L.divIcon({
        className: 'custom-stop-icon',
        html: iconHtml,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      });

      const marker = L.marker([coord.lat, coord.lng], { icon: stopIcon });

      const popupContent = `
        <div class="p-1 font-sans text-xs">
          <div class="font-bold text-[#0F1E36] text-sm">${stop.name}</div>
          <div class="text-slate-500 text-[11px]">Stop #${idx + 1} of ${pathData.length} • ${targetRoute.routeLabel}</div>
          ${
            isFirst
              ? `<div class="mt-1.5 font-bold text-amber-700">Scheduled Departure: ${targetRoute.departureTime}</div>`
              : isCampus
              ? `<div class="mt-1.5 font-bold text-emerald-700">Destination: CVR College Campus</div>`
              : `<div class="mt-1 text-slate-400 text-[10px] font-mono">Scheduled Corridor Stop</div>`
          }
        </div>
      `;

      marker.bindPopup(popupContent);
      marker.on('click', () => {
        if (onSelectStop) onSelectStop(stop);
      });

      marker.addTo(markersLayerRef.current!);
    });

    // Fit map to show full corridor smoothly
    if (latLngs.length > 0) {
      map.fitBounds(latLngs, {
        padding: [45, 45],
        maxZoom: 14,
      });
    }
  }, [route, allRoutes, selectedStopId, onSelectStop]);

  const handleFitBounds = () => {
    const map = mapInstanceRef.current;
    if (!map) return;
    const targetRoute = route || allRoutes[0];
    if (targetRoute && targetRoute.stops.length > 0) {
      const pathData = getRoutePathCoordinates(targetRoute);
      const bounds: L.LatLngTuple[] = pathData.map((d) => [d.coord.lat, d.coord.lng]);
      map.fitBounds(bounds, { padding: [45, 45] });
    }
  };

  const currentRouteName = route ? route.routeLabel : 'CVR College Transit Network';
  const startingLocationName = route ? route.startingLocation : 'Twin Cities Corridors';

  return (
    <div className="relative w-full h-[400px] lg:h-[480px] rounded-2xl overflow-hidden border border-[#E5E2DC] shadow-[0_1px_4px_rgba(15,30,54,0.03)] bg-[#F4F2EC]">
      {/* Map Canvas */}
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* Floating Header Overlay */}
      <div className="absolute top-3 left-3 z-[400] flex flex-col gap-1.5 max-w-[280px] sm:max-w-none">
        <div className="bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-xl border border-[#DCD8D0] shadow-sm flex items-center gap-2 text-xs">
          <div className="w-2 h-2 rounded-full bg-amber-500"></div>
          <span className="font-bold text-[#0F1E36]">
            {currentRouteName}: {startingLocationName} ➔ Campus
          </span>
        </div>
        <div className="bg-[#FAF9F5]/95 backdrop-blur-md px-2.5 py-1 rounded-lg border border-[#E5E2DC] text-[10px] text-slate-500 font-mono shadow-xs">
          Scheduled Corridor Preview • GPS tracking offline
        </div>
      </div>

      {/* Controls Overlay */}
      <div className="absolute top-3 right-3 z-[400] flex items-center gap-1.5">
        <button
          type="button"
          onClick={handleFitBounds}
          title="Fit full route in view"
          className="px-2.5 py-1.5 bg-white/95 backdrop-blur-md hover:bg-[#FAF9F5] text-[#0F1E36] rounded-xl border border-[#DCD8D0] shadow-sm text-xs font-semibold flex items-center gap-1.5 transition-colors"
        >
          <Maximize2 className="w-3.5 h-3.5 text-slate-500" />
          <span className="hidden sm:inline">Fit Route</span>
        </button>
      </div>

      {/* Bottom Route Legend */}
      <div className="absolute bottom-3 left-3 z-[400] bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-xl border border-[#DCD8D0] shadow-sm text-[11px] text-slate-600 flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-600"></span>
          <span>Origin Terminal</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full border-2 border-[#0F1E36] bg-white"></span>
          <span>Route Stop</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-700"></span>
          <span>CVR Campus</span>
        </div>
      </div>
    </div>
  );
};
